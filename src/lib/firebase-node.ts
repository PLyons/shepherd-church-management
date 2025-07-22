// Node.js compatible Firebase configuration for migration scripts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Get Firebase config from environment variables with fallbacks
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDuWQ35Fwb-ljb1Jq-GH5dzIHhTLDpgJxc",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "shepherd-cms-ba981.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "shepherd-cms-ba981",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "shepherd-cms-ba981.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "280357223841",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:280357223841:web:73c9fb5edf2c0471b45fe0",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-L4YXRH7NJJ"
};

// Validate required config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.authDomain) {
  throw new Error('Missing Firebase environment variables. Check your .env.local file.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services (no persistence in Node.js)
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;