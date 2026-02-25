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
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUserProfile = async (userId: string) => {
    if (!db) return null;
    try {
      const docRef = doc(db as Firestore, 'user_profiles', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        setProfile(profileData);
        return profileData;
      } else {
        // Create default profile if it doesn't exist
        const defaultProfile: UserProfile = {
          username: '',
          bio: '',
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
        await setDoc(docRef, defaultProfile);
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
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth as Auth, async (user) => {
      if (user) {
        // Get the Firebase ID token
        const token = await user.getIdToken();
        // Set the token in a cookie
        setCookie('__firebase_auth_token', token, {
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        setUser(user);
        // Load user profile when user signs in
        await loadUserProfile(user.uid);
      } else {
        // Remove the token cookie when user is not authenticated
        deleteCookie('__firebase_auth_token');
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    if (!auth) return;

    try {
      await firebaseSignOut(auth as Auth);
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
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 