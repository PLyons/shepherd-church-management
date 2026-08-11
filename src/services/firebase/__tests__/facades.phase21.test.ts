/**
 * Phase 2.1 — Firebase module facades
 *
 * PURPOSE: Member facade must not re-export events/donations services
 * RELEVANT FILES: facades/members-facade.ts, unified-firebase.service.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { membersFacade } from '../facades/members-facade';
import { eventsFacade } from '../facades/events-facade';
import { donationsFacade } from '../facades/donations-facade';
import {
  FirebaseService,
  getFirebaseService,
} from '../unified-firebase.service';
import { isFeatureEnabled } from '../../../config/features';

vi.mock('../../../config/features', () => ({
  isFeatureEnabled: vi.fn(),
}));

const mockIsFeatureEnabled = vi.mocked(isFeatureEnabled);

describe('Firebase module facades (Phase 2.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFeatureEnabled.mockImplementation((module) => {
      if (module === 'members' || module === 'households') return true;
      return false;
    });
  });

  it('membersFacade exposes core services only', () => {
    expect(membersFacade.members).toBeDefined();
    expect(membersFacade.households).toBeDefined();
    expect(membersFacade.roles).toBeDefined();
    expect(
      Object.keys(membersFacade).sort()
    ).toEqual(
      ['activity', 'households', 'members', 'membershipHistory', 'notes', 'roles'].sort()
    );
  });

  it('eventsFacade and donationsFacade are separate entry points', () => {
    expect(eventsFacade.events).toBeDefined();
    expect(eventsFacade.eventRSVPs).toBeDefined();
    expect(donationsFacade.donations).toBeDefined();
    expect(donationsFacade.categories).toBeDefined();
    expect(donationsFacade.statements).toBeDefined();
  });

  it('FirebaseService skips event queries when events flag is off', async () => {
    const service = new FirebaseService();
    const getUpcoming = vi.fn();
    // Replace lazy events getter target after first access would create real service —
    // spy via prototype path: call getDashboardStats with mocked members.getStatistics
    service.members.getStatistics = vi.fn().mockResolvedValue({
      total: 3,
      active: 2,
      inactive: 1,
      visitors: 0,
      admins: 1,
      pastors: 0,
      members: 2,
    });

    // Ensure events module is not touched when flag is off
    Object.defineProperty(service, 'events', {
      get: () => {
        throw new Error('events should not be accessed when flag is off');
      },
    });

    const stats = await service.getDashboardStats();
    expect(stats.members.total).toBe(3);
    expect(stats.events.upcoming).toBe(0);
    expect(getUpcoming).not.toHaveBeenCalled();
  });

  it('getFirebaseService returns a singleton instance', () => {
    const a = getFirebaseService();
    const b = getFirebaseService();
    expect(a).toBe(b);
  });
});
