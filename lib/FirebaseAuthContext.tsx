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
import { auth, db } from './firebase';
import { setCookie, deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';

export interface UserProfile {
  username: string;
  bio: string;
  birthdate: string;
  avatarUrl: string;
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => { },
  refreshProfile: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // MOCK USER DATA
  const mockUser = {
    uid: 'mock-user-demo-12345',
    email: 'demo@mindmechanism.com',
    emailVerified: true,
    isAnonymous: false,
    tenantId: null,
    providerData: [],
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString()
    },
    displayName: 'Demo User',
    photoURL: null,
    phoneNumber: null,
    getIdToken: async () => 'mock-token',
    getIdTokenResult: async () => ({
      token: 'mock-token',
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      signInProvider: 'custom',
      claims: {}
    }),
    delete: async () => { },
    reload: async () => { },
    toJSON: () => ({})
  } as unknown as User;

  // Initialize with MOCK_USER directly to avoid race conditions
  const [user, setUser] = useState<User | null>(mockUser);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadUserProfile = async (userId: string) => {
    if (!db) return null;
    try {
      // Dynamic import to avoid SSR issues if needed
      const { doc, getDoc, setDoc } = await import('firebase/firestore');

      const docRef = doc(db as Firestore, 'user_profiles', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        setProfile(profileData);
        return profileData;
      } else {
        // Create default profile if it doesn't exist
        const defaultProfile: UserProfile = {
          username: 'Demo User',
          bio: 'This is a mock account.',
          birthdate: '',
          avatarUrl: '',
          preferences: {
            emailNotifications: true,
            allowLocationData: false,
          },
          security: {
            sessionTimeout: 30,
          },
        };
        // Attempt to write, but catch if permission denied (since we are mocking)
        try {
          await setDoc(docRef, defaultProfile);
        } catch (e) {
          console.warn("Could not write default profile to Firestore (expected if rules require real auth)", e);
        }
        setProfile(defaultProfile);
        return defaultProfile;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback profile
      const fallbackProfile: UserProfile = {
        username: 'Demo User (Offline)',
        bio: 'This is a fallback mock profile.',
        birthdate: '',
        avatarUrl: '',
        preferences: { emailNotifications: false, allowLocationData: false },
        security: { sessionTimeout: 30 }
      };
      setProfile(fallbackProfile);
      return fallbackProfile;
    }
  };

  const refreshProfile = async () => {
    if (user?.uid) {
      await loadUserProfile(user.uid);
    }
  };

  useEffect(() => {
    // Load profile side-effect
    loadUserProfile(mockUser.uid);
  }, []);

  const signOut = async () => {
    // Mock sign out - just redirect
    router.push('/home');
    /*
    if (!auth) return;
    try {
      await firebaseSignOut(auth as Auth);
      deleteCookie('__firebase_auth_token');
      setUser(null);
      setProfile(null);
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/home');
    } catch (error) {
      console.error('Error signing out:', error);
    }
    */
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 