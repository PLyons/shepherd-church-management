// Runtime-aware Firebase configuration
// Uses Node.js config for migration scripts, browser config for app

// Check if we're running in Node.js
const isNode = typeof window === 'undefined' && typeof global !== 'undefined';

async function getFirebaseInstances() {
  if (isNode) {
    // In Node.js - use environment variables
    const { db, auth } = await import('./firebase-node');
    return { db, auth };
  } else {
    // In browser - use regular Firebase config
    const { db, auth, storage } = await import('./firebase');
    return { db, auth, storage };
  }
}

// Export a promise that resolves to the Firebase instances
export const firebaseInstances = getFirebaseInstances();

// For backward compatibility, also export individual instances
export const { db, auth } = await getFirebaseInstances();

export default firebaseInstances;