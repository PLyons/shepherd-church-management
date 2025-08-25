// Re-export all base service modules for easy access
export * from './firestore-operations';
export * from './firestore-queries';
export * from './firestore-subscriptions';
export * from './firestore-batch';
export * from './firestore-error-handler';

// Main service class
export { BaseFirestoreService } from './base-firestore-service';