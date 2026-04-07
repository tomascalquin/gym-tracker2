import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

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

/**
 * initializeFirestore con persistentLocalCache activa el cache IndexedDB de
 * Firestore. Esto permite:
 *  - Leer datos offline (desde cache local) sin lanzar errores de red.
 *  - Escribir offline: las escrituras quedan en cola y se sincronizan
 *    automáticamente cuando vuelve la conexión.
 *  - persistentMultipleTabManager: comparte el cache entre tabs/ventanas.
 *
 * NOTA: esto reemplaza enableIndexedDbPersistence() que está deprecated
 * desde Firebase 9.x modular SDK.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
googleProvider.addScope("email");
googleProvider.addScope("profile");
