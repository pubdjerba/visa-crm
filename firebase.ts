import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration using environment variables
// In Vite, environment variables must be prefixed with VITE_
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-key",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy-auth",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-project",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy-bucket",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "dummy-sender",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "dummy-app"
};

// Initialize Firebase only if we have minimum requirements, otherwise export a dummy/null db or log error
let app;
let db: any;

try {
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
        console.warn("⚠️ Firebase API Key missing. Running in offline/dummy mode.");
    }
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.error("❌ Firebase initialization failed:", error);
}

export { db };
