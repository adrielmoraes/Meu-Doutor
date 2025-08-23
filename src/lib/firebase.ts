
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
    projectId: "mediai-7m1xp",
    appId: "1:1068012973194:web:1d5854f79f3faa2bb39173",
    storageBucket: "mediai-7m1xp.firebasestorage.app",
    apiKey: "AIzaSyClttQxfPJkK7SsmKyzljKrLvbu-KYwrSg",
    authDomain: "mediai-7m1xp.firebaseapp.com",
    messagingSenderId: "1068012973194",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Enable offline persistence
if (typeof window !== 'undefined') {
    try {
        enableIndexedDbPersistence(db);
    } catch (err: any) {
        if (err.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time.
            // Silently fail.
        } else if (err.code === 'unimplemented') {
            // The current browser does not support all of the
            // features required to enable persistence
            console.warn("Firebase persistence is not supported in this browser.");
        }
    }
}


export { app, db };
