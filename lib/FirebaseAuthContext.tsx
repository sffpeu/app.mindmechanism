'use client'

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  Auth
} from 'firebase/auth';
import { auth, db, waitForFirebaseAuth } from './firebase';
import { deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import { syncFirebaseAuthCookie } from '@/lib/syncFirebaseAuthCookie';
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { normalizeWheelFaceOverlays, emptyWheelFaceOverlays, type WheelFaceMedia } from '@/lib/wheelFaceOverlays';
import type { Portal } from '@/lib/portalConfig';

/** Prefer non-empty `users/{uid}.bannerUrl`; if missing or empty, use `user_profiles` (avoids empty string masking a valid profile URL). */
function mergeBannerUrl(
  usersData: Record<string, unknown> | undefined,
  profileBannerRaw: unknown
): string {
  const fromProfile = typeof profileBannerRaw === 'string' ? profileBannerRaw.trim() : ''
  if (!usersData) return fromProfile
  if ('bannerUrl' in usersData && typeof usersData.bannerUrl === 'string') {
    const fromUsers = usersData.bannerUrl.trim()
    if (fromUsers.length > 0) return fromUsers
  }
  return fromProfile
}

export interface UserProfile {
  username: string;
  bio: string;
  birthdate: string;
  avatarUrl: string;
  /** Custom wide image for the dashboard profile card. URL in Storage; Firestore field on `users/{uid}` (rules allow owner writes). */
  bannerUrl: string;
  /** Optional media (image or video) layered on single-clock faces (index 0 = clock 1 … index 8 = clock 9). `users/{uid}`. */
  wheelFaceOverlays: WheelFaceMedia[];
  /**
   * Membership tier. Populated via Firebase custom auth token claim (`request.auth.token.tier`)
   * or directly from the user's Firestore profile document.
   * Defaults to 'open' when absent.
   */
  tier?: 'open' | 'standard' | 'sovereign' | 'academic_pro';
  preferences: {
    emailNotifications: boolean;
    allowLocationData: boolean;
  };
  security: {
    sessionTimeout: number;
  };
  researchConsent?: {
    categoryB?: ResearchConsent;
    categoryC?: ResearchConsent;
    neverAsk?: boolean;
    lastPromptedAt?: string;
  };
  /** Portal the user registered through (consumer / academic / corporate). */
  portal?: Portal;
}

export interface ResearchConsent {
  granted: boolean;
  timestamp: string;
  protocolVersion: string;
  /** Polygon transaction hash when on-chain anchor succeeded */
  txHash?: string;
  /** 137 = Polygon PoS */
  chainId?: number;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Merge fields into `profile` (e.g. banner URL right after upload when Firestore cache can lag). */
  mergeProfilePatch: (partial: Partial<UserProfile>) => void;
}

const emptyProfileShell = (): UserProfile => ({
  username: '',
  bio: '',
  birthdate: '',
  avatarUrl: '',
  bannerUrl: '',
  wheelFaceOverlays: emptyWheelFaceOverlays(),
  preferences: {
    emailNotifications: true,
    allowLocationData: false,
  },
  security: {
    sessionTimeout: 30,
  },
  researchConsent: undefined,
})

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  mergeProfilePatch: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const mergeProfilePatch = (partial: Partial<UserProfile>) => {
    setProfile((prev) => {
      const base = prev ?? emptyProfileShell()
      return { ...base, ...partial }
    })
  }

  const loadUserProfile = async (userId: string) => {
    if (!db) return null;
    try {
      const profileRef = doc(db as Firestore, 'user_profiles', userId);
      const userSettingsRef = doc(db as Firestore, 'users', userId);

      const profileSnap = await getDoc(profileRef)

      let usersDocData: Record<string, unknown> | undefined
      let usersWheelOverlays: WheelFaceMedia[] | undefined
      try {
        const userSettingsSnap = await getDoc(userSettingsRef)
        if (userSettingsSnap.exists()) {
          usersDocData = userSettingsSnap.data() as Record<string, unknown>
          if ('wheelFaceOverlays' in usersDocData) {
            usersWheelOverlays = normalizeWheelFaceOverlays(usersDocData.wheelFaceOverlays)
          }
        }
      } catch (usersDocErr) {
        console.warn(`Could not load users/${userId} document (banner/overlays may be missing until retry):`, usersDocErr)
      }

      if (profileSnap.exists()) {
        const raw = profileSnap.data() as Partial<UserProfile>;
        const profileData: UserProfile = {
          username: raw.username ?? '',
          bio: raw.bio ?? '',
          birthdate: raw.birthdate ?? '',
          avatarUrl: raw.avatarUrl ?? '',
          bannerUrl: mergeBannerUrl(usersDocData, raw.bannerUrl),
          wheelFaceOverlays:
            usersWheelOverlays !== undefined
              ? usersWheelOverlays
              : normalizeWheelFaceOverlays((raw as { wheelFaceOverlays?: unknown }).wheelFaceOverlays),
          preferences: {
            emailNotifications: raw.preferences?.emailNotifications ?? true,
            allowLocationData: raw.preferences?.allowLocationData ?? false,
          },
          security: {
            sessionTimeout: raw.security?.sessionTimeout ?? 30,
          },
          researchConsent:
            usersDocData &&
            typeof usersDocData.researchConsent === 'object' &&
            usersDocData.researchConsent !== null
              ? (usersDocData.researchConsent as UserProfile['researchConsent'])
              : undefined,
          portal:
            raw.portal === 'consumer' || raw.portal === 'academic' || raw.portal === 'corporate'
              ? raw.portal
              : undefined,
        };
        setProfile(profileData);
        return profileData;
      } else {
        // Create default profile if it doesn't exist
        const defaultProfile: UserProfile = {
          username: '',
          bio: '',
          birthdate: '',
          avatarUrl: '',
          bannerUrl: mergeBannerUrl(usersDocData, undefined),
          wheelFaceOverlays: usersWheelOverlays !== undefined ? usersWheelOverlays : emptyWheelFaceOverlays(),
          preferences: {
            emailNotifications: true,
            allowLocationData: false,
          },
          security: {
            sessionTimeout: 30,
          },
          researchConsent:
            usersDocData &&
            typeof usersDocData.researchConsent === 'object' &&
            usersDocData.researchConsent !== null
              ? (usersDocData.researchConsent as UserProfile['researchConsent'])
              : undefined,
        };
        await setDoc(profileRef, defaultProfile);
        setProfile(defaultProfile);
        return defaultProfile;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.uid) {
      await loadUserProfile(user.uid);
    }
  };

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | undefined

    waitForFirebaseAuth()
      .then((authInstance) => {
        if (cancelled) return
        unsubscribe = onAuthStateChanged(authInstance, async (user) => {
          if (user) {
            await syncFirebaseAuthCookie(user)
            setUser(user)
            await loadUserProfile(user.uid)
          } else {
            deleteCookie('__firebase_auth_token')
            setUser(null)
            setProfile(null)
          }
          setLoading(false)
        })
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  const signOut = async () => {
    const authInstance = auth ?? (await waitForFirebaseAuth().catch(() => null))
    if (!authInstance) return

    try {
      await firebaseSignOut(authInstance);
      // Remove the token cookie on sign out
      deleteCookie('__firebase_auth_token');
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.removeItem('mindmechanism-welcome-completed')
          window.sessionStorage.removeItem('mindmechanism-welcome-choice')
        } catch {
          /* ignore */
        }
      }
      setUser(null);
      setProfile(null);
      // Add a small delay to ensure state is cleared before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/home');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile, mergeProfilePatch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 