// src/utils/firestore-converters.ts
// Canonical public entry for Firestore ↔ TypeScript converters (Phase 2.3)
// Import from HERE in services — implementation lives in src/utils/converters/
// RELEVANT FILES: src/utils/converters/index.ts, src/utils/_quarantine/README.md, src/services/firebase/members/members-service.ts

/**
 * Single active converter path.
 * Do not use src/utils/_quarantine/* (field-mapper, legacy events, content, volunteer).
 */
export * from './converters';
