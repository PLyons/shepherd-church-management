// Feature flags configuration
export const features = {
  // Set to true to use Firebase instead of Supabase
  useFirebase: import.meta.env.VITE_USE_FIREBASE === 'true' || false,
};

// Helper function to check if Firebase is enabled
export const isFirebaseEnabled = () => features.useFirebase;

// Helper function to check if Supabase is enabled
export const isSupabaseEnabled = () => !features.useFirebase;