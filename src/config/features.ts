// Feature flags configuration
export const features = {
  // Firebase is now the only backend
  useFirebase: true,
};

// Helper function to check if Firebase is enabled
export const isFirebaseEnabled = () => true;

// Helper function to check if Supabase is enabled (deprecated)
export const isSupabaseEnabled = () => false;