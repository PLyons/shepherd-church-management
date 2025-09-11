// src/components/auth/RoleGuard.tsx
// Role-based access control component that restricts routes based on user roles (admin/pastor/member)
// Implements principle of least privilege by checking member roles before allowing access to protected routes
// RELEVANT FILES: src/hooks/useUnifiedAuth.tsx, src/components/auth/AuthGuard.tsx, src/types/index.ts, src/components/common/LoadingSpinner.tsx

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useUnifiedAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';

type UserRole = 'admin' | 'pastor' | 'member';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallbackUrl?: string;
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { member, loading } = useAuth();

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

  if (!member) {
    return <Navigate to="/login" replace />;
  }

  if (!member.role || !allowedRoles.includes(member.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
