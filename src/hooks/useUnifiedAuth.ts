// src/hooks/useUnifiedAuth.ts
// Unified authentication hook providing abstraction layer over Firebase authentication context
// Enables consistent auth interface throughout application while maintaining flexibility for future auth provider changes
// RELEVANT FILES: src/contexts/FirebaseAuthContext.tsx, src/hooks/useAuth.ts, src/components/auth/AuthGuard.tsx, src/components/auth/RoleGuard.tsx

import { useAuth as useFirebaseAuth } from '../contexts/FirebaseAuthContext';

// This hook provides a unified interface for authentication
// Since we've fully migrated to Firebase, this now just returns Firebase auth
export const useAuth = () => {
  return useFirebaseAuth();
};
