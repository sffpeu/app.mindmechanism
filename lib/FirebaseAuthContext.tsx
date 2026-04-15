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

export interface UserProfile {
  username: string;
  bio: string;
  birthdate: string;
  avatarUrl: string;
  /** Custom wide image for the dashboard profile card. URL in Storage; Firestore field on `users/{uid}` (rules allow owner writes). */
  bannerUrl: string;
  preferences: {
    emailNotifications: boolean;
    allowLocationData: boolean;
  };
  security: {
    sessionTimeout: number;
  };
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
  preferences: {
    emailNotifications: true,
    allowLocationData: false,
  },
  security: {
    sessionTimeout: 30,
  },
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

      let usersBanner: string | undefined
      try {
        const userSettingsSnap = await getDoc(userSettingsRef)
        if (userSettingsSnap.exists()) {
          const d = userSettingsSnap.data() as Record<string, unknown>
          if ('bannerUrl' in d && typeof d.bannerUrl === 'string') {
            usersBanner = d.bannerUrl
          }
        }
      } catch (usersDocErr) {
        console.warn(`Could not load users/${userId} document (banner may be missing until retry):`, usersDocErr)
      }

      if (profileSnap.exists()) {
        const raw = profileSnap.data() as Partial<UserProfile>;
        const profileData: UserProfile = {
          username: raw.username ?? '',
          bio: raw.bio ?? '',
          birthdate: raw.birthdate ?? '',
          avatarUrl: raw.avatarUrl ?? '',
          bannerUrl: usersBanner !== undefined ? usersBanner : (raw.bannerUrl ?? ''),
          preferences: {
            emailNotifications: raw.preferences?.emailNotifications ?? true,
            allowLocationData: raw.preferences?.allowLocationData ?? false,
          },
          security: {
            sessionTimeout: raw.security?.sessionTimeout ?? 30,
          },
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
          bannerUrl: usersBanner !== undefined ? usersBanner : '',
          preferences: {
            emailNotifications: true,
            allowLocationData: false,
          },
          security: {
            sessionTimeout: 30,
          },
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