import React from 'react';
import { AuthProvider as SupabaseAuthProvider } from './AuthContext';
import { FirebaseAuthProvider } from './FirebaseAuthContext';
import { isFirebaseEnabled } from '../config/features';

interface AuthProviderWrapperProps {
  children: React.ReactNode;
}

export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  if (isFirebaseEnabled()) {
    return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
  }
  
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
}