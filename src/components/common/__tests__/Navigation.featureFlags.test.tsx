/**
 * Phase 1.3 — Navigation feature-flag gating
 *
 * PURPOSE: Disabled modules must not appear in the nav
 * SCOPE: Events/Calendar (events flag), Donations/Giving (donations flag)
 * RELEVANT FILES: Navigation.tsx, src/config/features.ts
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Navigation } from '../Navigation';
import { useAuth } from '../../../hooks/useUnifiedAuth';
import { Member } from '../../../types';
import type { FeatureModule } from '../../../config/features';

vi.mock('../../../hooks/useUnifiedAuth');

// vi.mock is hoisted — keep mutable state in vi.hoisted
const { flagState } = vi.hoisted(() => ({
  flagState: {
    members: true,
    households: true,
    events: false,
    donations: false,
    registration: true,
  } as Record<FeatureModule, boolean>,
}));

vi.mock('../../../config/features', () => ({
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

function renderAdminNav() {
  mockUseAuth.mockReturnValue({
    member: adminMember,
    signOut: vi.fn(),
    loading: false,
    isAuthenticated: true,
  });

  return render(
    <BrowserRouter>
      <Navigation onMobileMenuToggle={vi.fn()} userRole="admin" />
    </BrowserRouter>
  );
}

describe('Navigation feature flags (Phase 1.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flagState.members = true;
    flagState.households = true;
    flagState.events = false;
    flagState.donations = false;
    flagState.registration = true;
  });

  it('hides Events and Calendar when events flag is off', () => {
    renderAdminNav();
    expect(screen.queryByText('Events')).not.toBeInTheDocument();
    expect(screen.queryByText('Calendar')).not.toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Households')).toBeInTheDocument();
  });

  it('hides Donations when donations flag is off', () => {
    renderAdminNav();
    expect(screen.queryByText('Donations')).not.toBeInTheDocument();
  });

  it('shows Events and Donations when those flags are on', () => {
    flagState.events = true;
    flagState.donations = true;
    renderAdminNav();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Donations')).toBeInTheDocument();
  });
});
