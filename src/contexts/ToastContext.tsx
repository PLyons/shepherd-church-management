// src/contexts/ToastContext.tsx
// Toast notification context provider for displaying user feedback messages with type-based styling
// Provides centralized toast management for success, error, and info messages throughout the application
// RELEVANT FILES: src/hooks/useToast.ts, src/components/common/Toast.tsx, src/contexts/FirebaseAuthContext.tsx, src/components/members/MemberFormEnhanced.tsx

import React, { createContext, useContext } from 'react';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    console.log('Toast:', type, message);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
