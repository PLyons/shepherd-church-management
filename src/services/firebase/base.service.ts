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