import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useUnifiedAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-testid="loading-container"
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (requireAuth && !user) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!requireAuth && user) {
    // User is logged in but trying to access auth pages (login/register)
    // Redirect to dashboard
    // Exception: Don't redirect from auth/callback as it needs to process tokens
    if (location.pathname !== '/auth/callback') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
