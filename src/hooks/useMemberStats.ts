// src/hooks/useMemberStats.ts
// Hook for fetching member and household statistics without events/donations dependencies
// Exists so dashboards can show core member metrics when events and donations modules are disabled
// RELEVANT FILES: src/services/firebase/members.service.ts, src/services/firebase/households.service.ts, src/config/features.ts

import { useState, useEffect, useCallback } from 'react';
import { membersService } from '../services/firebase/members.service';
import { householdsService } from '../services/firebase/households.service';
import { isFeatureEnabled } from '../config/features';

export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  totalHouseholds?: number;
}

export function useMemberStats(options?: { enabled?: boolean }): {
  stats: MemberStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const enabled = options?.enabled !== false;
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const memberStats = await membersService.getStatistics();
      const result: MemberStats = {
        totalMembers: memberStats.total,
        activeMembers: memberStats.active,
      };

      if (isFeatureEnabled('households')) {
        try {
          const households = await householdsService.getAll();
          result.totalHouseholds = households.length;
        } catch {
          // Household count is optional — skip on failure
        }
      }

      setStats(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load member statistics'
      );
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      void refetch();
    } else {
      setLoading(false);
    }
  }, [enabled, refetch]);

  return { stats, loading, error, refetch };
}
