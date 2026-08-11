// src/components/dashboard/__tests__/Dashboard.featureFlags.test.tsx
// Tests dashboard widgets/sections hide when events/donations feature flags are off
// RELEVANT FILES: src/components/dashboard/AdminDashboard.tsx, src/config/features.ts

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminDashboard } from '../AdminDashboard';
import { useAuth } from '../../../hooks/useUnifiedAuth';
import { dashboardService } from '../../../services/firebase/dashboard.service';
import { isFeatureEnabled } from '../../../config/features';
import { Member } from '../../../types';

vi.mock('../../../services/firebase', () => ({
  donationsService: {
    getDonationSummary: vi.fn(),
    getRecentDonations: vi.fn(),
    getMemberDonations: vi.fn(),
    getGivingTrends: vi.fn(),
  },
}));

vi.mock('../../../services/firebase/dashboard.service', () => ({
  dashboardService: {
    getDashboardData: vi.fn(),
  },
}));

vi.mock('../../../hooks/useUnifiedAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../config/features', () => ({
  isFeatureEnabled: vi.fn(),
}));

const mockDashboardService = dashboardService as unknown as {
  getDashboardData: Mock;
};

const mockUseAuth = useAuth as Mock;
const mockIsFeatureEnabled = vi.mocked(isFeatureEnabled);

const adminMember: Member = {
  id: 'admin-id',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@test.com',
  role: 'admin',
  memberStatus: 'active',
  joinDate: '2023-01-01',
  birthDate: '1980-01-01',
  phones: [],
  address: {
    street: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
  },
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Dashboard feature flags (Phase 1.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { uid: 'admin-uid', email: 'admin@test.com' },
      member: adminMember,
      loading: false,
    });

    mockDashboardService.getDashboardData.mockResolvedValue({
      stats: {
        totalMembers: 100,
        activeMembers: 95,
        totalHouseholds: 45,
        totalDonations: 50000,
        monthlyDonations: 12000,
        upcomingEvents: 5,
      },
      recentActivity: [],
      upcomingEvents: [
        {
          id: 'event-1',
          title: 'Sunday Service',
          startTime: '2026-08-15T10:00:00Z',
          location: 'Main Sanctuary',
          isPublic: true,
        },
      ],
      quickActions: [
        {
          id: 'create-event',
          title: 'Create Event',
          description: 'Schedule new event',
          route: '/events/new',
          icon: 'calendar',
          color: 'blue',
        },
        {
          id: 'record-donation',
          title: 'Quick Donation',
          description: 'Record giving',
          route: '/donations/record',
          icon: 'dollar-sign',
          color: 'green',
        },
      ],
    });
  });

  it('hides events and donations UI when both flags are off', async () => {
    mockIsFeatureEnabled.mockImplementation(
      (module) => module !== 'events' && module !== 'donations'
    );

    render(
      <TestWrapper>
        <AdminDashboard member={adminMember} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    expect(screen.queryByText('Monthly Donations')).not.toBeInTheDocument();
    expect(screen.queryByText('Upcoming Events')).not.toBeInTheDocument();
    expect(screen.queryByText('Record Donation')).not.toBeInTheDocument();
    expect(screen.queryByText('Financial Reports')).not.toBeInTheDocument();
    expect(screen.queryByText('Donations Hub')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('donation-insights-widget')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('All Upcoming Events')).not.toBeInTheDocument();
    expect(screen.queryByText('Create Event')).not.toBeInTheDocument();
    expect(screen.queryByText('Quick Donation')).not.toBeInTheDocument();

    // Core dashboard content still visible
    expect(screen.getByText('Total Members')).toBeInTheDocument();
    expect(screen.getByText('Quick Stats')).toBeInTheDocument();
    expect(screen.getByText('Recent System Activity')).toBeInTheDocument();
  });

  it('shows events UI when events flag is on', async () => {
    mockIsFeatureEnabled.mockImplementation(
      (module) => module === 'events'
    );

    render(
      <TestWrapper>
        <AdminDashboard member={adminMember} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('All Upcoming Events')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Upcoming Events').length).toBeGreaterThan(0);
    expect(screen.getByText('Create Event')).toBeInTheDocument();
    expect(screen.queryByText('Monthly Donations')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('donation-insights-widget')
    ).not.toBeInTheDocument();
  });

  it('shows donations UI when donations flag is on', async () => {
    mockIsFeatureEnabled.mockImplementation(
      (module) => module === 'donations'
    );

    render(
      <TestWrapper>
        <AdminDashboard member={adminMember} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('donation-insights-widget')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Monthly Donations')).toBeInTheDocument();
    expect(screen.getAllByText('Record Donation').length).toBeGreaterThan(0);
    expect(screen.queryByText('All Upcoming Events')).not.toBeInTheDocument();
  });
});
