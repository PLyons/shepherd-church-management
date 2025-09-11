// src/services/firebase/base/index.ts
// Centralized export aggregator for all base Firestore service modules using composition architecture
// Provides unified access to modular Firestore operations, queries, subscriptions, batch operations, and error handling
// RELEVANT FILES: src/services/firebase/base/base-firestore-service.ts, src/services/firebase/base/firestore-operations.ts, src/services/firebase/base/firestore-queries.ts, src/services/firebase/base/firestore-subscriptions.ts

// Re-export all base service modules for easy access
export * from './firestore-operations';
export * from './firestore-queries';
export * from './firestore-subscriptions';
export * from './firestore-batch';
export * from './firestore-error-handler';

// Main service class
export { BaseFirestoreService } from './base-firestore-service';