"use client" // 👈 Add this for Next.js App Router

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User, 
  onAuthStateChanged, 
  signInWithCustomToken, // Added for mandatory sign-in
  signInAnonymously,     // Added for mandatory fallback sign-in
} from 'firebase/auth'
// Assuming 'auth' is the initialized Auth instance from @/lib/firebase
import { auth } from '@/lib/firebase' 

// Ensure global variables are correctly typed for TypeScript (if applicable)
declare const __initial_auth_token: string | undefined;

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe = () => {}

    // 1. Define the asynchronous authentication function
    const authenticateUser = async () => {
        try {
            // 2. Perform mandatory sign-in using the global token or anonymously
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token)
                console.log("AuthProvider: Signed in with custom token.")
            } else {
                await signInAnonymously(auth)
                console.log("AuthProvider: Signed in anonymously.")
            }
        } catch (error) {
            console.error("Firebase Auth Error during sign-in:", error)
            // Even if sign-in fails, we proceed to listen for the current state (which will be null)
        }

        // 3. Set up the state listener to capture the user session created above
        unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user)
            setLoading(false) // Authentication process is complete
            console.log("AuthProvider: onAuthStateChanged listener fired. User UID:", user?.uid || "null")
        })
    }

    // Run the authentication flow
    authenticateUser()

    // Clean up the listener on component unmount
    return () => unsubscribe()
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
