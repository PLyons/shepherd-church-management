import { useAuth as useSupabaseAuth } from '../contexts/AuthContext';
import { useAuth as useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import { isFirebaseEnabled } from '../config/features';

// This hook provides a unified interface for authentication
// regardless of whether we're using Supabase or Firebase
export const useAuth = () => {
  if (isFirebaseEnabled()) {
    return useFirebaseAuth();
  }
  return useSupabaseAuth();
};