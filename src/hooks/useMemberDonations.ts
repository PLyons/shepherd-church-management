// src/hooks/useMemberDonations.ts
// Custom hook for managing member donation data with caching and real-time updates
// Provides optimized data fetching and state management for donation history components
// RELEVANT FILES: src/components/donations/MemberDonationHistory.tsx, src/services/firebase/donations.service.ts, src/types/donations.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/FirebaseAuthContext';
import { useToast } from '../contexts/ToastContext';
import { donationsService } from '../services/firebase';
import { Donation } from '../types/donations';

interface UseMemberDonationsOptions {
  memberId?: string;
  autoFetch?: boolean;
  enableRealTime?: boolean;
  cacheTimeout?: number; // in milliseconds
}

interface MemberDonationsState {
  donations: Donation[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  retryCount: number;
}

interface MemberDonationsReturn extends MemberDonationsState {
  fetchDonations: () => Promise<void>;
  refetch: () => Promise<void>;
  clearCache: () => void;
  retry: () => void;
  summary: {
    totalAmount: number;
    totalCount: number;
    ytdAmount: number;
    ytdCount: number;
    taxDeductibleAmount: number;
    averageDonation: number;
  };
}

// Simple in-memory cache for donation data
const donationCache = new Map<
  string,
  {
    data: Donation[];
    timestamp: number;
    expiry: number;
  }
>();

export const useMemberDonations = (
  options: UseMemberDonationsOptions = {}
): MemberDonationsReturn => {
  const {
    memberId: propMemberId,
    autoFetch = true,
    enableRealTime = true,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes default
  } = options;

  const { user, member: currentMember, hasRole } = useAuth();
  const { showToast } = useToast();

  // State management
  const [state, setState] = useState<MemberDonationsState>({
    donations: [],
    loading: true,
    error: null,
    lastFetched: null,
    retryCount: 0,
  });

  // Real-time subscription cleanup
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Determine target member ID
  const targetMemberId = propMemberId || currentMember?.id;

  // Security validation
  const canAccessDonations = useMemo(() => {
    if (!user || !currentMember || !targetMemberId) return false;

    // Admin/pastor can access any member's donations
    if (hasRole('admin') || hasRole('pastor')) return true;

    // Member can only access their own donations
    return targetMemberId === currentMember.id;
  }, [user, currentMember, hasRole, targetMemberId]);

  // Cache key for this member's donations
  const cacheKey = useMemo(
    () => (targetMemberId ? `donations_${targetMemberId}` : null),
    [targetMemberId]
  );

  // Check cache validity
  const getCachedData = useCallback((): Donation[] | null => {
    if (!cacheKey) return null;

    const cached = donationCache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiry) {
      donationCache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }, [cacheKey]);

  // Store data in cache
  const setCachedData = useCallback(
    (data: Donation[]) => {
      if (!cacheKey) return;

      const now = Date.now();
      donationCache.set(cacheKey, {
        data: [...data], // Create a copy to prevent mutations
        timestamp: now,
        expiry: now + cacheTimeout,
      });
    },
    [cacheKey, cacheTimeout]
  );

  // Clear cache for this member
  const clearCache = useCallback(() => {
    if (cacheKey) {
      donationCache.delete(cacheKey);
    }
  }, [cacheKey]);

  // Fetch donations from service or cache
  const fetchDonations = useCallback(
    async (useCache: boolean = true) => {
      if (!targetMemberId || !canAccessDonations) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Unauthorized access or missing member ID',
        }));
        return;
      }

      try {
        // Check cache first if enabled
        if (useCache) {
          const cachedData = getCachedData();
          if (cachedData) {
            setState((prev) => ({
              ...prev,
              donations: cachedData,
              loading: false,
              error: null,
              lastFetched: new Date(
                donationCache.get(cacheKey!)?.timestamp || Date.now()
              ),
              retryCount: 0,
            }));
            return;
          }
        }

        setState((prev) => ({ ...prev, loading: true, error: null }));

        const donationData =
          await donationsService.getDonationsByMember(targetMemberId);

        // Sort by date descending (most recent first)
        const sortedDonations = donationData.sort(
          (a, b) =>
            new Date(b.donationDate).getTime() -
            new Date(a.donationDate).getTime()
        );

        // Update state
        setState((prev) => ({
          ...prev,
          donations: sortedDonations,
          loading: false,
          error: null,
          lastFetched: new Date(),
          retryCount: 0,
        }));

        // Cache the data
        setCachedData(sortedDonations);

        // Audit logging
        console.log(
          `Member donations fetched: ${targetMemberId} (${donationData.length} donations) by user: ${user?.uid}`
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load donations';

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          retryCount: prev.retryCount + 1,
        }));

        showToast(errorMessage, 'error');

        // Security audit log for failures
        console.error(
          `Failed donation access for member: ${targetMemberId} by user: ${user?.uid}`,
          err
        );
      }
    },
    [
      targetMemberId,
      canAccessDonations,
      getCachedData,
      setCachedData,
      cacheKey,
      user?.uid,
      showToast,
    ]
  );

  // Set up real-time subscription
  const setupRealTimeUpdates = useCallback(() => {
    if (!enableRealTime || !targetMemberId || !canAccessDonations) return;

    try {
      const unsubscribeFn = donationsService.subscribeToDonations(
        (updatedDonations) => {
          // Filter for this member's donations only
          const memberDonations = updatedDonations.filter(
            (d) => d.memberId === targetMemberId
          );

          const sortedDonations = memberDonations.sort(
            (a, b) =>
              new Date(b.donationDate).getTime() -
              new Date(a.donationDate).getTime()
          );

          setState((prev) => ({
            ...prev,
            donations: sortedDonations,
            lastFetched: new Date(),
          }));

          // Update cache with new data
          setCachedData(sortedDonations);

          console.log(
            `Real-time donation update for member: ${targetMemberId}`
          );
        },
        (error) => {
          console.error('Real-time donation updates error:', error);
          setState((prev) => ({
            ...prev,
            error: 'Real-time updates failed',
          }));
        }
      );

      setUnsubscribe(() => unsubscribeFn);
    } catch (error) {
      console.error('Failed to setup real-time updates:', error);
    }
  }, [enableRealTime, targetMemberId, canAccessDonations, setCachedData]);

  // Cleanup real-time subscription
  const cleanupRealTime = useCallback(() => {
    if (unsubscribe) {
      unsubscribe();
      setUnsubscribe(null);
    }
  }, [unsubscribe]);

  // Refetch (bypass cache)
  const refetch = useCallback(async () => {
    await fetchDonations(false);
  }, [fetchDonations]);

  // Retry with exponential backoff
  const retry = useCallback(async () => {
    const delay = Math.min(1000 * Math.pow(2, state.retryCount), 30000); // Max 30 seconds
    setTimeout(() => {
      fetchDonations(false);
    }, delay);
  }, [fetchDonations, state.retryCount]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalAmount = state.donations.reduce((sum, d) => sum + d.amount, 0);
    const totalCount = state.donations.length;

    const currentYear = new Date().getFullYear();
    const ytdDonations = state.donations.filter(
      (d) => new Date(d.donationDate).getFullYear() === currentYear
    );
    const ytdAmount = ytdDonations.reduce((sum, d) => sum + d.amount, 0);
    const ytdCount = ytdDonations.length;

    const taxDeductibleAmount = state.donations
      .filter((d) => d.isTaxDeductible)
      .reduce((sum, d) => sum + d.amount, 0);

    const averageDonation = totalCount > 0 ? totalAmount / totalCount : 0;

    return {
      totalAmount,
      totalCount,
      ytdAmount,
      ytdCount,
      taxDeductibleAmount,
      averageDonation,
    };
  }, [state.donations]);

  // Initial fetch and setup
  useEffect(() => {
    if (autoFetch && canAccessDonations) {
      fetchDonations();
    }
  }, [autoFetch, canAccessDonations, fetchDonations]);

  // Setup real-time updates
  useEffect(() => {
    setupRealTimeUpdates();
    return cleanupRealTime;
  }, [setupRealTimeUpdates, cleanupRealTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRealTime();
    };
  }, [cleanupRealTime]);

  return {
    ...state,
    fetchDonations,
    refetch,
    clearCache,
    retry,
    summary,
  };
};

// Global cache cleanup utility
export const clearAllDonationCache = (): void => {
  donationCache.clear();
};

// Get cache statistics for debugging
export const getDonationCacheStats = () => {
  const now = Date.now();
  const entries = Array.from(donationCache.entries());

  return {
    totalCached: entries.length,
    validCached: entries.filter(([, data]) => now < data.expiry).length,
    expiredCached: entries.filter(([, data]) => now >= data.expiry).length,
    oldestEntry:
      entries.length > 0
        ? Math.min(...entries.map(([, data]) => data.timestamp))
        : null,
    newestEntry:
      entries.length > 0
        ? Math.max(...entries.map(([, data]) => data.timestamp))
        : null,
  };
};
