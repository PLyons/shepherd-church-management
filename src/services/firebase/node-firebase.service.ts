// ============================================================================
// NODE.JS FIREBASE SERVICE
// ============================================================================
// Firebase services specifically for Node.js environments (seed scripts)

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Firebase configuration with fallbacks
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDuWQ35Fwb-ljb1Jq-GH5dzIHhTLDpgJxc",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "shepherd-cms-ba981.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "shepherd-cms-ba981",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "shepherd-cms-ba981.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "280357223841",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:280357223841:web:73c9fb5edf2c0471b45fe0",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-L4YXRH7NJJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Import service classes and create instances
import { collection, getDocs, getCountFromServer } from 'firebase/firestore';

// Simple service for seeding operations
export class NodeFirebaseService {
  async getCollectionCounts() {
    const [membersCount, householdsCount, eventsCount] = await Promise.all([
      getCountFromServer(collection(db, 'members')),
      getCountFromServer(collection(db, 'households')),
      getCountFromServer(collection(db, 'events'))
    ]);

    return {
      members: membersCount.data().count,
      households: householdsCount.data().count,
      events: eventsCount.data().count
    };
  }

  async testConnection() {
    try {
      const testCollection = collection(db, 'members');
      await getDocs(testCollection);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export const nodeFirebaseService = new NodeFirebaseService();