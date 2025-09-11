// src/config/features.ts
// Feature flags configuration for toggling Firebase/Supabase backend support
// This file exists to centralize feature flag management and backend service selection
// RELEVANT FILES: src/lib/firebase.ts, src/services/firebase/*, src/contexts/FirebaseAuthContext.tsx, src/main.tsx

// Feature flags configuration
export const features = {
  // Firebase is now the only backend
  useFirebase: true,
};

// Helper function to check if Firebase is enabled
export const isFirebaseEnabled = () => true;

// Helper function to check if Supabase is enabled (deprecated)
export const isSupabaseEnabled = () => false;
