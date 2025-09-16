// src/components/donations/__tests__/DashboardWidgets.integration.test.tsx
// RED PHASE TESTS: Dashboard Widget Integration (PRP-2C-010)
//
// PURPOSE: Test role-specific donation widgets on admin, pastor, and member dashboards
// SCOPE: Widget integration, role-based display, navigation, and error handling
// SECURITY LEVEL: HIGH - Role-based widget access and data privacy protection
//
// RELEVANT FILES:
// - src/components/dashboard/AdminDashboard.tsx (admin dashboard integration)
// - src/components/dashboard/PastorDashboard.tsx (pastor dashboard integration)
// - src/components/dashboard/MemberDashboard.tsx (member dashboard integration)
// - src/components/donations/widgets/ (donation widgets - to be created)
// - src/services/firebase/donations.service.ts (data service)

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminDashboard } from '../../dashboard/AdminDashboard';
import { PastorDashboard } from '../../dashboard/PastorDashboard';
import { MemberDashboard } from '../../dashboard/MemberDashboard';
import { useAuth } from '../../../hooks/useUnifiedAuth';
import { useToast } from '../../../contexts/ToastContext';
import { donationsService } from '../../../services/firebase';
import { dashboardService } from '../../../services/firebase/dashboard.service';
import { Member } from '../../../types';

// Mock the services and contexts
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

vi.mock('../../../contexts/ToastContext');
vi.mock('../../../hooks/useUnifiedAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock router hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

const mockDonationsService = donationsService as unknown as {
  getDonationSummary: Mock;
  getRecentDonations: Mock;
  getMemberDonations: Mock;
  getGivingTrends: Mock;
};

const mockDashboardService = dashboardService as unknown as {
  getDashboardData: Mock;
};

const mockUseAuth = useAuth as Mock;
const mockUseToast = useToast as Mock;

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Dashboard Widget Integration (PRP-2C-010)', () => {
  const mockShowToast = vi.fn();

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
    addresses: [],
    emergencyContacts: [],
    notes: [],
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  const pastorMember: Member = {
    ...adminMember,
    id: 'pastor-id',
    firstName: 'Pastor',
    lastName: 'User',
    email: 'pastor@test.com',
    role: 'pastor',
  };

  const regularMember: Member = {
    ...adminMember,
    id: 'member-id',
    firstName: 'Regular',
    lastName: 'Member',
    email: 'member@test.com',
    role: 'member',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseToast.mockReturnValue({
      showToast: mockShowToast,
    });

    // Mock successful dashboard data
    mockDashboardService.getDashboardData.mockResolvedValue({
      stats: {
        totalMembers: 100,
        activeMembers: 95,
        totalHouseholds: 45,
        totalDonations: 50000,
        upcomingEvents: 5,
      },
      recentActivity: [],
      upcomingEvents: [],
    });

    // Mock donation service responses
    mockDonationsService.getDonationSummary.mockResolvedValue({
      totalAmount: 50000,
      donationCount: 200,
      averageDonation: 250,
      topCategory: 'General Fund',
    });

    mockDonationsService.getRecentDonations.mockResolvedValue([]);
    mockDonationsService.getMemberDonations.mockResolvedValue([]);
    mockDonationsService.getGivingTrends.mockResolvedValue({
      monthlyTrends: [],
      categoryBreakdown: [],
    });
  });

  describe('Admin Dashboard Widgets', () => {
    it('should show DonationInsightsWidget on admin dashboard', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-uid', email: 'admin@test.com' },
        member: adminMember,
        loading: false,
      });

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

      // Should show financial summary data
      expect(screen.getByText('Total Donations')).toBeInTheDocument();
      expect(screen.getByText('$50,000')).toBeInTheDocument();
      expect(screen.getByText('200 donations')).toBeInTheDocument();
    });

    it('should show QuickActionsWidget with donation actions on admin dashboard', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-uid', email: 'admin@test.com' },
        member: adminMember,
        loading: false,
      });

      render(
        <TestWrapper>
          <AdminDashboard member={adminMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('quick-actions-widget')).toBeInTheDocument();
      });

      // Should show donation-related quick actions
      expect(screen.getByText('Record Donation')).toBeInTheDocument();
      expect(screen.getByText('Financial Reports')).toBeInTheDocument();
      expect(screen.getByText('Generate Statements')).toBeInTheDocument();
    });
  });

  describe('Pastor Dashboard Widgets', () => {
    it('should show GivingOverviewWidget on pastor dashboard', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'pastor-uid', email: 'pastor@test.com' },
        member: pastorMember,
        loading: false,
      });

      render(
        <TestWrapper>
          <PastorDashboard member={pastorMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('giving-overview-widget')
        ).toBeInTheDocument();
      });

      // Should show aggregate giving information
      expect(screen.getByText('Giving Overview')).toBeInTheDocument();
      expect(screen.getByText('Total Gifts')).toBeInTheDocument();
      // Should NOT show individual donor details
      expect(screen.queryByText('Recent Donors')).not.toBeInTheDocument();
    });

    it('should NOT show sensitive donation details on pastor dashboard', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'pastor-uid', email: 'pastor@test.com' },
        member: pastorMember,
        loading: false,
      });

      render(
        <TestWrapper>
          <PastorDashboard member={pastorMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('giving-overview-widget')
        ).toBeInTheDocument();
      });

      // Should NOT show individual donation amounts or donor names
      expect(
        screen.queryByText('Individual Donations')
      ).not.toBeInTheDocument();
      expect(screen.queryByText('Top Donors')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('donation-insights-widget')
      ).not.toBeInTheDocument();
    });
  });

  describe('Member Dashboard Widgets', () => {
    it('should show MyGivingWidget on member dashboard', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'member-uid', email: 'member@test.com' },
        member: regularMember,
        loading: false,
      });

      render(
        <TestWrapper>
          <MemberDashboard member={regularMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('my-giving-widget')).toBeInTheDocument();
      });

      // Should show personal giving information
      expect(screen.getByText('My Giving')).toBeInTheDocument();
      expect(screen.getByText('View Full History')).toBeInTheDocument();
    });

    it('should only show own donation data on member dashboard', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'member-uid', email: 'member@test.com' },
        member: regularMember,
        loading: false,
      });

      render(
        <TestWrapper>
          <MemberDashboard member={regularMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('my-giving-widget')).toBeInTheDocument();
      });

      // Should only call service with member's own ID
      expect(mockDonationsService.getMemberDonations).toHaveBeenCalledWith(
        'member-id'
      );

      // Should NOT show church-wide statistics
      expect(
        screen.queryByText('Total Church Donations')
      ).not.toBeInTheDocument();
      expect(screen.queryByText('All Members')).not.toBeInTheDocument();
    });
  });

  describe('Widget Navigation', () => {
    it('should navigate correctly when widget links are clicked', async () => {
      const mockNavigate = vi.fn();

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-uid', email: 'admin@test.com' },
        member: adminMember,
        loading: false,
      });

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

      // Click on "View Reports" link (this will fail - widget doesn't exist yet)
      const viewReportsLink = screen.getByText('View Reports');
      fireEvent.click(viewReportsLink);
    });
  });

  describe('Widget Error Handling', () => {
    it('should handle loading and error states gracefully', async () => {
      // Mock service error
      mockDonationsService.getDonationSummary.mockRejectedValue(
        new Error('Service unavailable')
      );

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-uid', email: 'admin@test.com' },
        member: adminMember,
        loading: false,
      });

      render(
        <TestWrapper>
          <AdminDashboard member={adminMember} />
        </TestWrapper>
      );

      // Should show loading state initially
      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();

      await waitFor(() => {
        // Should show error state when service fails
        expect(screen.getByTestId('donation-widget-error')).toBeInTheDocument();
        expect(
          screen.getByText('Unable to load donation data')
        ).toBeInTheDocument();
      });

      // Should still show other dashboard content
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });
});
