// src/components/dashboard/dashboard-utils.ts
// Shared formatting and filtering helpers for dashboard components
// Centralizes date/currency formatting and feature-flag quick-action filtering
// RELEVANT FILES: src/components/dashboard/AdminDashboard.tsx, src/config/features.ts, src/components/dashboard/QuickActions.tsx

import { isFeatureEnabled } from '../../config/features';
import type { QuickAction } from '../../services/firebase/dashboard.service';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatEventDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function filterQuickActionsByFeature(
  actions: QuickAction[]
): QuickAction[] {
  const showEvents = isFeatureEnabled('events');
  const showDonations = isFeatureEnabled('donations');

  return actions.filter((action) => {
    const route = action.route || '';
    if (route.startsWith('/events') || route.startsWith('/calendar')) {
      return showEvents;
    }
    if (route.startsWith('/donations') || route.includes('giving')) {
      return showDonations;
    }
    return true;
  });
}
