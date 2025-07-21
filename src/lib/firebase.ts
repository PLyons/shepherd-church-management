import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Check if we're running in Node.js or browser
const isNode = typeof window === 'undefined' && typeof global !== 'undefined';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDuWQ35Fwb-ljb1Jq-GH5dzIHhTLDpgJxc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "shepherd-cms-ba981.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "shepherd-cms-ba981",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "shepherd-cms-ba981.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "280357223841",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:280357223841:web:73c9fb5edf2c0471b45fe0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-L4YXRH7NJJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Temporarily disable offline persistence to troubleshoot connection issues
// Enable offline persistence for Firestore (browser only)
// if (!isNode) {
//   import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
//     enableIndexedDbPersistence(db).catch((err) => {
//       if (err.code === 'failed-precondition') {
//         // Multiple tabs open, persistence can only be enabled in one tab at a time.
//         console.warn('Firebase persistence failed: Multiple tabs open');
//       } else if (err.code === 'unimplemented') {
//         // The current browser doesn't support persistence
//         console.warn('Firebase persistence not supported in this browser');
//       }
//     });
//   });
// }

export default app;