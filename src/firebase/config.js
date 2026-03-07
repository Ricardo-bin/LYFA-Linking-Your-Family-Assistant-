// ============================================================
//  LYFA – Firebase Configuration
//  Replace the values below with YOUR Firebase project config
//  Get them from: Firebase Console → Project Settings → General
// ============================================================

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

  const firebaseConfig = {
    apiKey: "AIzaSyBryc8hNCyZ8UHB-zmCZN9WoBrZc931zv8",
    authDomain: "lyfa-3a112.firebaseapp.com",
    projectId: "lyfa-3a112",
    storageBucket: "lyfa-3a112.firebasestorage.app",
    messagingSenderId: "107855977279",
    appId: "1:107855977279:web:cde7a104798798ed6ad18a"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore Database
export const db = getFirestore(app);

export default app;
