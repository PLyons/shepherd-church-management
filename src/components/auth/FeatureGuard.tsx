// src/components/auth/FeatureGuard.tsx
// Route guard that blocks access when a module feature flag is off
// Exists so events/donations (etc.) can stay in the codebase but be unreachable when disabled
// RELEVANT FILES: src/config/features.ts, src/router/index.tsx, src/components/auth/RoleGuard.tsx

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import {
  FeatureModule,
  isFeatureEnabled,
} from '../../config/features';

interface FeatureGuardProps {
  module: FeatureModule;
  children: ReactNode;
  /** Where to send users when the module is off (default: dashboard) */
  fallbackUrl?: string;
}

export function FeatureGuard({
  module,
  children,
  fallbackUrl = '/dashboard',
}: FeatureGuardProps) {
  if (!isFeatureEnabled(module)) {
    return (
      <Navigate
        to={fallbackUrl}
        replace
        state={{ featureDisabled: module }}
      />
    );
  }

  return <>{children}</>;
}
