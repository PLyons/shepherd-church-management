// src/services/firebase/base.service.ts
// Export aggregator for the refactored BaseFirestoreService architecture split into modular components
// Provides backward compatibility while delegating to the new composition-based service architecture in base/ directory
// RELEVANT FILES: src/services/firebase/base/index.ts, src/services/firebase/base/base-firestore-service.ts, src/services/firebase/members.service.ts, src/services/firebase/events.service.ts

// REFACTORED: This file has been restructured using composition pattern
// Original 680-line monolithic service split into focused modules in src/services/firebase/base/

// The new architecture provides better maintainability, testability, and separation of concerns:
// - FirestoreOperations: Basic CRUD operations (139 lines)
// - FirestoreQueries: Query and pagination operations (124 lines)
// - FirestoreSubscriptions: Real-time subscription operations (185 lines)
// - FirestoreBatch: Batch operations (144 lines)
// - FirestoreErrorHandler: Error handling utilities (175 lines)
// - BaseFirestoreService: Main orchestrating class using composition (168 lines)

// For backward compatibility, all existing services continue to work unchanged
export * from './base/index';
