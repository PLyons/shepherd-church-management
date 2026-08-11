/**
 * Phase 1.5 — Member profile Giving tab feature-flag gating
 *
 * PURPOSE: Giving History tab hidden when donations module is off
 * RELEVANT FILES: MemberProfileTabs.tsx, src/config/features.ts
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MemberProfileTabs from '../MemberProfileTabs';
import { useAuth } from '../../../../hooks/useUnifiedAuth';
import type { FeatureModule } from '../../../../config/features';
import { Member } from '../../../../types';

vi.mock('../../../../hooks/useUnifiedAuth');

const { flagState } = vi.hoisted(() => ({
  flagState: {
    members: true,
    households: true,
    events: false,
    donations: false,
    registration: true,
  } as Record<FeatureModule, boolean>,
}));

vi.mock('../../../../config/features', () => ({
  isFeatureEnabled: (module: FeatureModule) => flagState[module] === true,
  moduleFlags: flagState,
}));

const adminMember: Member = {
  id: 'admin-1',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@test.com',
  role: 'admin',
  memberStatus: 'active',
  fullName: 'Admin User',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockUseAuth = useAuth as Mock;

function renderTabs(memberId = 'member-99') {
  mockUseAuth.mockReturnValue({
    member: adminMember,
    loading: false,
    isAuthenticated: true,
  });

  return render(
    <MemoryRouter initialEntries={[`/members/${memberId}/overview`]}>
      <MemberProfileTabs memberId={memberId} />
    </MemoryRouter>
  );
}

describe('MemberProfileTabs feature flags (Phase 1.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flagState.donations = false;
  });

  it('hides Giving History when donations flag is off', () => {
    renderTabs();
    expect(
      screen.queryByRole('tab', { name: /giving history/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
  });

  it('shows Giving History for admin when donations flag is on', () => {
    flagState.donations = true;
    renderTabs();
    expect(
      screen.getByRole('tab', { name: /giving history/i })
    ).toBeInTheDocument();
  });
});
