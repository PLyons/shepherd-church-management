// src/contexts/AuthProviderWrapper.tsx
// Simple wrapper component that provides Firebase authentication context to the entire application
// This file exists to encapsulate the Firebase auth provider and simplify authentication setup in the app root
// RELEVANT FILES: src/contexts/FirebaseAuthContext.tsx, src/App.tsx, src/main.tsx, src/hooks/useAuth.ts

import React from 'react';
import { FirebaseAuthProvider } from './FirebaseAuthContext';

interface AuthProviderWrapperProps {
  children: React.ReactNode;
}

export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
}
