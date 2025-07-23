import React from 'react';
import { FirebaseAuthProvider } from './FirebaseAuthContext';

interface AuthProviderWrapperProps {
  children: React.ReactNode;
}

export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
}
