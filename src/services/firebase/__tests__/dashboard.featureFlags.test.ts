// src/services/firebase/__tests__/dashboard.featureFlags.test.ts
// Tests dashboard.service skips events when feature flag is off
// RELEVANT FILES: src/services/firebase/dashboard.service.ts, src/config/features.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardService } from '../dashboard.service';
import { isFeatureEnabled } from '../../../config/features';

const mockGetEventsInRange = vi.fn();
const mockGetEventsByRoleSimple = vi.fn();
const mockGetStatistics = vi.fn();

vi.mock('../../../config/features', () => ({
  isFeatureEnabled: vi.fn(),
}));

vi.mock('../events.service', () => ({
  eventsService: {
    getEventsInRange: (...args: unknown[]) => mockGetEventsInRange(...args),
    getEventsByRoleSimple: (...args: unknown[]) =>
      mockGetEventsByRoleSimple(...args),
  },
}));

vi.mock('../members.service', () => ({
  MembersService: vi.fn().mockImplementation(() => ({
    getStatistics: () => mockGetStatistics(),
    getById: vi.fn().mockResolvedValue({ id: 'member-1', firstName: 'Test' }),
  })),
}));

const mockIsFeatureEnabled = vi.mocked(isFeatureEnabled);

describe('DashboardService feature flags (Phase 2.2)', () => {
  let service: DashboardService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DashboardService();
    mockGetStatistics.mockResolvedValue({
      total: 50,
      active: 45,
      inactive: 3,
      visitors: 2,
    });
    mockGetEventsInRange.mockResolvedValue([
      { id: 'e1', title: 'Service', startTime: '2026-08-15T10:00:00Z' },
    ]);
    mockGetEventsByRoleSimple.mockResolvedValue([
      { id: 'e2', title: 'Bible Study', startTime: '2026-08-16T18:00:00Z' },
    ]);
  });

  it('returns empty upcomingEvents when events flag is off (admin)', async () => {
    mockIsFeatureEnabled.mockReturnValue(false);

    const data = await service.getDashboardData('admin-1', 'admin');

    expect(mockGetEventsInRange).not.toHaveBeenCalled();
    expect(data.upcomingEvents).toEqual([]);
    expect(data.stats.upcomingEvents).toBe(0);
  });

  it('loads events when events flag is on (admin)', async () => {
    mockIsFeatureEnabled.mockImplementation((module) => module === 'events');

    const data = await service.getDashboardData('admin-1', 'admin');

    expect(mockGetEventsInRange).toHaveBeenCalled();
    expect(data.upcomingEvents).toHaveLength(1);
    expect(data.stats.upcomingEvents).toBe(1);
  });

  it('filters event/rsvp activity when events flag is off (pastor)', async () => {
    mockIsFeatureEnabled.mockReturnValue(false);

    const data = await service.getDashboardData('pastor-1', 'pastor');

    expect(mockGetEventsByRoleSimple).not.toHaveBeenCalled();
    expect(data.upcomingEvents).toEqual([]);
    expect(data.recentActivity.every((a) => a.type !== 'event')).toBe(true);
  });

  it('filters donation activity when donations flag is off', async () => {
    mockIsFeatureEnabled.mockImplementation((module) => module === 'events');

    const adminData = await service.getDashboardData('admin-1', 'admin');
    expect(
      adminData.recentActivity.every((a) => a.type !== 'donation')
    ).toBe(true);
  });
});
