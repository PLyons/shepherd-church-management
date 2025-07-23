import { useAuth as useFirebaseAuth } from '../contexts/FirebaseAuthContext';

// This hook provides a unified interface for authentication
// Since we've fully migrated to Firebase, this now just returns Firebase auth
export const useAuth = () => {
  return useFirebaseAuth();
};