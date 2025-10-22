import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyDajvxgCERWJxNJEnp8QU_E3uVDZEvMMbA",
  authDomain: "zareaapp-6de16.firebaseapp.com",
  projectId: "zareaapp-6de16",
  storageBucket: "zareaapp-6de16.firebasestorage.app",
  messagingSenderId: "445437477278",
  appId: "1:445437477278:web:ce49ec5b08baf534d3168f"
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

export const auth = getAuth(app)
export const db = getFirestore(app)