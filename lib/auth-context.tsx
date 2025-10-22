"use client" // 👈 Add this for Next.js App Router

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase' // 👈 ADJUST THIS PATH IF NEEDED

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true 
})

export function useAuth() {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true) // Crucial for initial state check

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false) // Set loading to false once the auth state is known
    })

    return unsubscribe
  }, [])

  const value = {
    user,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}