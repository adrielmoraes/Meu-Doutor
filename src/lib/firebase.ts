
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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

export { app, db };
