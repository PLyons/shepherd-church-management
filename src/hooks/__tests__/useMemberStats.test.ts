// src/hooks/__tests__/useMemberStats.test.ts
// Tests useMemberStats hook fetches member stats and respects enabled flag
// RELEVANT FILES: src/hooks/useMemberStats.ts, src/services/firebase/members.service.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMemberStats } from '../useMemberStats';
import { membersService } from '../../services/firebase/members.service';
import { householdsService } from '../../services/firebase/households.service';
import { isFeatureEnabled } from '../../config/features';

vi.mock('../../services/firebase/members.service', () => ({
  membersService: {
    getStatistics: vi.fn(),
  },
}));

vi.mock('../../services/firebase/households.service', () => ({
  householdsService: {
    getAll: vi.fn(),
  },
}));

vi.mock('../../config/features', () => ({
  isFeatureEnabled: vi.fn(),
}));

const mockGetStatistics = vi.mocked(membersService.getStatistics);
const mockGetAllHouseholds = vi.mocked(householdsService.getAll);
const mockIsFeatureEnabled = vi.mocked(isFeatureEnabled);

describe('useMemberStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStatistics.mockResolvedValue({
      total: 120,
      active: 100,
      inactive: 15,
      visitors: 5,
      admins: 2,
      pastors: 3,
      members: 115,
    });
    mockGetAllHouseholds.mockResolvedValue([{ id: 'h1' }, { id: 'h2' }] as never);
    mockIsFeatureEnabled.mockImplementation(
      (module) => module === 'households'
    );
  });

  it('fetches member stats when enabled', async () => {
    const { result } = renderHook(() => useMemberStats({ enabled: true }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetStatistics).toHaveBeenCalledTimes(1);
    expect(result.current.stats).toEqual({
      totalMembers: 120,
      activeMembers: 100,
      totalHouseholds: 2,
    });
    expect(result.current.error).toBeNull();
  });

  it('does not fetch when enabled is false', async () => {
    const { result } = renderHook(() => useMemberStats({ enabled: false }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetStatistics).not.toHaveBeenCalled();
    expect(result.current.stats).toBeNull();
  });

  it('refetch reloads statistics', async () => {
    const { result } = renderHook(() => useMemberStats({ enabled: true }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.refetch();

    expect(mockGetStatistics).toHaveBeenCalledTimes(2);
  });
});
