"use client";

import { createContext, useContext, useState } from 'react';
import { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // MOCK USER FOR OFFLINE/DEMO MODE
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

  // Initialize with mock user immediately
  const [user] = useState<User | null>(mockUser);
  const [loading] = useState(false);

  // Original Firebase auth logic (disabled for mock mode)
  /*
  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  */

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
} 