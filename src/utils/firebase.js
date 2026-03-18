import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBd9TyjQzpspnXvjAcGdTFJtVwuGYGDhks",
  authDomain: "gym-tracker-cb14b.firebaseapp.com",
  projectId: "gym-tracker-cb14b",
  storageBucket: "gym-tracker-cb14b.firebasestorage.app",
  messagingSenderId: "630903762974",
  appId: "1:630903762974:web:111c158f99dfefa983be0f",
  measurementId: "G-R7XGFWJ6Y9",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const authInstance = getAuth(app);
setPersistence(authInstance, browserLocalPersistence).catch(console.error);

export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
