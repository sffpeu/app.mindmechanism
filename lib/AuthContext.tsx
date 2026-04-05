'use client'

import { createContext, useContext } from 'react'

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider 
      value={{
        user: null,
        profile: null,
        loading: false,
        signInWithGoogle: async () => {},
        signOut: async () => {},
        refreshProfile: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  )
} 