"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  deleteUser,
  updatePassword as firebaseUpdatePassword,
  User as FirebaseUser,
  UserCredential,
} from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
interface User extends FirebaseUser {
  id: string
  email: string
  firstName: string
  lastName: string
  companyName: string
  contactNo: string
  trialEndsAt: Date
  isSubscribed: boolean
  businessId?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<UserCredential>
  signUp: (userData: any) => Promise<UserCredential>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  deleteAccount: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ---------------------------------------------------------------------------
// PROVIDER
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("👀 [AuthProvider] Listening to onAuthStateChanged...")
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        console.log("✅ [AuthProvider] Firebase user detected:", firebaseUser.uid)
        try {
          const userRef = doc(db, "users", firebaseUser.uid)
          const userSnap = await getDoc(userRef)

          if (userSnap.exists()) {
            const data: any = userSnap.data()
            console.log("📄 [AuthProvider] Firestore user doc found:", data)

            const loadedUser: User = {
              ...(firebaseUser as any as User),
              id: firebaseUser.uid,
              email: data.email || firebaseUser.email || "",
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              companyName: data.companyName || "",
              contactNo: data.contactNo || "",
              trialEndsAt:
                data.trialEndsAt && typeof data.trialEndsAt.toDate === "function"
                  ? data.trialEndsAt.toDate()
                  : data.trialEndsAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              isSubscribed: !!data.isSubscribed,
              businessId: data.businessId,
            }
            setUser(loadedUser)
            localStorage.setItem("zarea_user", JSON.stringify(loadedUser))
          } else {
            console.warn("⚠️ [AuthProvider] No Firestore doc found for user, creating minimal user")
            const minimalUser: User = {
              ...(firebaseUser as any as User),
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              firstName: "",
              lastName: "",
              companyName: "",
              contactNo: "",
              trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              isSubscribed: false,
              businessId: undefined,
            }
            setUser(minimalUser)
            localStorage.setItem("zarea_user", JSON.stringify(minimalUser))
          }
        } catch (err) {
          console.error("❌ [AuthProvider] Error loading user profile:", err)
        }
      } else {
        console.log("🚪 [AuthProvider] No user logged in, clearing local storage.")
        setUser(null)
        localStorage.removeItem("zarea_user")
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // ---------------------------------------------------------------------------
  // SIGN IN
  // ---------------------------------------------------------------------------
  const signIn = async (email: string, password: string) => {
    console.log("🟢 [signIn] Attempting sign in for:", email)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      console.log("✅ [signIn] Firebase Auth success for:", cred.user.uid)

      const firebaseUser = cred.user
      const userRef = doc(db, "users", firebaseUser.uid)
      const userSnap = await getDoc(userRef)

      let loadedUser: User
      if (userSnap.exists()) {
        const data = userSnap.data()
        console.log("📄 [signIn] Firestore user data found:", data)
        loadedUser = {
          ...(firebaseUser as any as User),
          id: firebaseUser.uid,
          email: data.email || firebaseUser.email || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          companyName: data.companyName || "",
          contactNo: data.contactNo || "",
          trialEndsAt: data.trialEndsAt?.toDate
            ? data.trialEndsAt.toDate()
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isSubscribed: !!data.isSubscribed,
          businessId: data.businessId,
        }
      } else {
        console.warn("⚠️ [signIn] No Firestore doc found — using minimal user")
        loadedUser = {
          ...(firebaseUser as any as User),
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          firstName: "",
          lastName: "",
          companyName: "",
          contactNo: "",
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isSubscribed: false,
          businessId: undefined,
        }
      }

      setUser(loadedUser)
      localStorage.setItem("zarea_user", JSON.stringify(loadedUser))
      console.log("✅ [signIn] User context updated successfully")

      return cred
    } catch (err: any) {
      console.error("❌ [signIn] Error during login:", err)
      throw err
    }
  }

  // ---------------------------------------------------------------------------
  // SIGN UP
  // ---------------------------------------------------------------------------
  const signUp = async (userData: any): Promise<UserCredential> => {
    console.log("🟢 [signUp] Creating new user for:", userData.email)
    const { email, password } = userData
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      console.log("✅ [signUp] Firebase Auth user created:", cred.user.uid)

      try {
        await setDoc(doc(db, "users", cred.user.uid), userData)
        console.log("✅ [signUp] Firestore user doc created successfully")
      } catch (fireErr) {
        console.error("🔥 [signUp] Firestore doc creation failed:", fireErr)
      }

      return cred
    } catch (err: any) {
      console.error("❌ [signUp] Error during signup:", err)
      throw err
    }
  }

  // ---------------------------------------------------------------------------
  // OTHER FUNCTIONS
  // ---------------------------------------------------------------------------
  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return
    const userRef = doc(db, "users", user.id)
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined && v !== null)
    ) as any
    if (Object.keys(safeUpdates).length === 0) return
    await updateDoc(userRef, safeUpdates)
    const updatedUser = { ...user, ...safeUpdates } as User
    setUser(updatedUser)
    localStorage.setItem("zarea_user", JSON.stringify(updatedUser))
    console.log("📝 [updateProfile] User profile updated:", safeUpdates)
  }

  const signOut = async () => {
    console.log("🚪 [signOut] Signing out user...")
    await firebaseSignOut(auth)
    localStorage.removeItem("zarea_user")
    setUser(null)
    if (typeof window !== "undefined") window.location.href = "/"
  }

  const deleteAccount = async () => {
    if (!user) return
    try {
      console.log("⚠️ [deleteAccount] Deleting user account:", user.id)
      await deleteDoc(doc(db, "users", user.id))
      if (auth.currentUser) await deleteUser(auth.currentUser)
      localStorage.removeItem("zarea_user")
      setUser(null)
      if (typeof window !== "undefined") window.location.href = "/"
    } catch (error) {
      console.error("❌ [deleteAccount] Failed to delete account:", error)
      alert("❌ Failed to delete account. Please re-authenticate and try again.")
    }
  }

  const updatePassword = async (newPassword: string) => {
    if (!auth.currentUser) throw new Error("No authenticated user")
    try {
      await firebaseUpdatePassword(auth.currentUser, newPassword)
      alert("✅ Password updated successfully!")
    } catch (error: any) {
      console.error("❌ [updatePassword] Error:", error)
      if (error?.code === "auth/requires-recent-login") {
        alert("⚠️ Please log out and log back in before updating password.")
      } else {
        alert("❌ Failed to update password.")
      }
    }
  }

  // ---------------------------------------------------------------------------
  // RETURN PROVIDER
  // ---------------------------------------------------------------------------
  return (
    <AuthContext.Provider
      value={{ user, isLoading, signIn, signUp, signOut, updateProfile, deleteAccount, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// HOOK
// ---------------------------------------------------------------------------
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
