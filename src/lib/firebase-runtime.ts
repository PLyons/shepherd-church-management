// Runtime-aware Firebase configuration
// Uses Node.js config for migration scripts, browser config for app

// Check if we're running in Node.js
const isNode = typeof window === 'undefined' && typeof global !== 'undefined';

if (isNode) {
  // In Node.js - use environment variables
  const { db, auth } = await import('./firebase-node');
  export { db, auth };
} else {
  // In browser - use regular Firebase config
  const { db, auth, storage } = await import('./firebase');
  export { db, auth, storage };
}