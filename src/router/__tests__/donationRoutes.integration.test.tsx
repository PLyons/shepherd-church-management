// src/router/__tests__/donationRoutes.integration.test.tsx
// RED PHASE: Integration tests for donation-related routing and role-based access control
// These tests will FAIL initially as donation routes don't exist yet in the router
// RELEVANT FILES: src/router/index.tsx, src/components/auth/AuthGuard.tsx, src/components/auth/RoleGuard.tsx

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import {
  BrowserRouter,
  createMemoryRouter,
  RouterProvider,
} from 'react-router-dom';
import { routes } from '../index';
import { useAuth } from '../../hooks/useUnifiedAuth';
import type { Member } from '../../types';

// Mock authentication hook
vi.mock('../../hooks/useUnifiedAuth');

// Mock Firebase services to prevent initialization errors
vi.mock('../../services/firebase/event-rsvp.service', () => ({
  EventRSVPService: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../services/firebase/events.service', () => ({
  EventsService: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../services/firebase/members.service', () => ({
  MembersService: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../services/firebase/donations.service', () => ({
  DonationsService: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../services/firebase/donation-categories.service', () => ({
  DonationCategoriesService: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../services/firebase/households.service', () => ({
  HouseholdsService: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../services/firebase/roles.service', () => ({
  RolesService: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../services/firebase/dashboard.service', () => ({
  DashboardService: vi.fn().mockImplementation(() => ({})),
}));

// Mock Firebase service index
vi.mock('../../services/firebase', () => ({
  firebaseService: {
    members: {},
    events: {},
    eventRSVPs: {},
    donations: {},
    donationCategories: {},
    households: {},
    roles: {},
    dashboard: {},
  },
}));

// Mock Layout component to avoid loading all dependencies
vi.mock('../../components/common/Layout', () => ({
  Layout: () => {
    const { Outlet } = require('react-router-dom');
    return (
      <div data-testid="layout">
        <Outlet />
      </div>
    );
  },
}));

// Mock all page components to avoid dependency issues
vi.mock('../../pages/Dashboard', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard</div>,
}));

vi.mock('../../pages/Members', () => ({
  default: () => <div data-testid="members-page">Members</div>,
}));

vi.mock('../../pages/MemberProfile', () => ({
  default: () => <div data-testid="member-profile-page">Member Profile</div>,
}));

vi.mock('../../pages/Households', () => ({
  default: () => <div data-testid="households-page">Households</div>,
}));

vi.mock('../../pages/Events', () => ({
  default: () => <div data-testid="events-page">Events</div>,
}));

vi.mock('../../pages/Calendar', () => ({
  Calendar: () => <div data-testid="calendar-page">Calendar</div>,
}));

vi.mock('../../pages/Settings', () => ({
  default: () => <div data-testid="settings-page">Settings</div>,
}));

vi.mock('../../pages/Login', () => ({
  default: () => <div data-testid="login-page">Login</div>,
}));

vi.mock('../../pages/Register', () => ({
  default: () => <div data-testid="register-page">Register</div>,
}));

// Mock donation-related page components (these don't exist yet - RED phase)
vi.mock('../../pages/Donations', () => ({
  default: () => <div data-testid="donations-page">Donations Management</div>,
}));

vi.mock('../../pages/CreateDonation', () => ({
  default: () => <div data-testid="create-donation-page">Create Donation</div>,
}));

vi.mock('../../pages/MyGiving', () => ({
  default: () => <div data-testid="my-giving-page">My Giving History</div>,
}));

vi.mock('../../pages/GivingOverview', () => ({
  default: () => <div data-testid="giving-overview-page">Giving Overview</div>,
}));

vi.mock('../../pages/DonationDetail', () => ({
  default: () => <div data-testid="donation-detail-page">Donation Details</div>,
}));

// Mock AuthGuard and RoleGuard components
vi.mock('../../components/auth/AuthGuard', () => ({
  AuthGuard: ({
    children,
    requireAuth = true,
  }: {
    children: React.ReactNode;
    requireAuth?: boolean;
  }) => {
    const { user, loading } = vi.mocked(useAuth)();

    if (loading) return <div data-testid="auth-loading">Loading...</div>;

    if (requireAuth && !user) {
      return <div data-testid="auth-redirect">Redirecting to login...</div>;
    }

    if (!requireAuth && user) {
      return <div data-testid="auth-redirect">Redirecting to dashboard...</div>;
    }

    return <>{children}</>;
  },
}));

vi.mock('../../components/auth/RoleGuard', () => ({
  RoleGuard: ({
    children,
    allowedRoles,
  }: {
    children: React.ReactNode;
    allowedRoles: string[];
  }) => {
    const { member } = vi.mocked(useAuth)();

    if (!member || !allowedRoles.includes(member.role)) {
      return <div data-testid="role-access-denied">Access denied</div>;
    }

    return <>{children}</>;
  },
}));

// Helper to create mock members with different roles
const createMockMember = (
  id: string,
  role: 'admin' | 'pastor' | 'member'
): Member => ({
  id,
  firstName: 'Test',
  lastName: `User ${id}`,
  email: `${role}@test.com`,
  role,
  memberStatus: 'active',
  dateJoined: '2023-01-01T00:00:00Z',
  contactInfo: {
    email: `${role}@test.com`,
    phoneNumbers: [],
    addresses: [],
  },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
});

const MOCK_MEMBERS = {
  admin: createMockMember('admin-123', 'admin'),
  pastor: createMockMember('pastor-456', 'pastor'),
  member: createMockMember('member-789', 'member'),
};

// Helper to render router with specific route
const renderWithRouter = (initialEntries: string[] = ['/']) => {
  const testRouter = createMemoryRouter(routes, {
    initialEntries,
  });

  return render(<RouterProvider router={testRouter} />);
};

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('Donation Routes Integration - RED PHASE', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default to admin user for most tests
    mockUseAuth.mockReturnValue({
      user: { uid: 'admin-123' },
      member: MOCK_MEMBERS.admin,
      loading: false,
      signOut: vi.fn(),
      hasRole: vi.fn().mockReturnValue(true),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin Role Access Control', () => {
    it('should allow admin access to /donations route', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        signOut: vi.fn(),
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(['/donations']);

      await waitFor(() => {
        expect(screen.getByTestId('donations-page')).toBeInTheDocument();
        expect(screen.getByText('Donations Management')).toBeInTheDocument();
      });
    });

    it('should allow admin access to /donations/create route', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        signOut: vi.fn(),
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(['/donations/create']);

      await waitFor(() => {
        expect(screen.getByTestId('create-donation-page')).toBeInTheDocument();
        expect(screen.getByText('Create Donation')).toBeInTheDocument();
      });
    });
  });

  describe('Member Role Access Control', () => {
    it('should allow members access to /my-giving route', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'member-789' },
        member: MOCK_MEMBERS.member,
        loading: false,
        signOut: vi.fn(),
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(['/my-giving']);

      await waitFor(() => {
        expect(screen.getByTestId('my-giving-page')).toBeInTheDocument();
        expect(screen.getByText('My Giving History')).toBeInTheDocument();
      });
    });

    it('should deny member access to admin donation routes', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'member-789' },
        member: MOCK_MEMBERS.member,
        loading: false,
        signOut: vi.fn(),
        hasRole: vi.fn().mockReturnValue(false),
      });

      renderWithRouter(['/donations']);

      await waitFor(() => {
        expect(screen.getByTestId('role-access-denied')).toBeInTheDocument();
        expect(screen.getByText('Access denied')).toBeInTheDocument();
      });
    });
  });

  describe('Pastor Role Access Control', () => {
    it('should allow pastor access to /giving-overview route', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'pastor-456' },
        member: MOCK_MEMBERS.pastor,
        loading: false,
        signOut: vi.fn(),
        hasRole: vi.fn().mockImplementation((role) => role === 'pastor'),
      });

      renderWithRouter(['/giving-overview']);

      await waitFor(() => {
        expect(screen.getByTestId('giving-overview-page')).toBeInTheDocument();
        expect(screen.getByText('Giving Overview')).toBeInTheDocument();
      });
    });
  });

  describe('Unauthorized User Redirects', () => {
    it('should redirect unauthenticated users from protected routes', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        member: null,
        loading: false,
        signOut: vi.fn(),
        hasRole: vi.fn().mockReturnValue(false),
      });

      renderWithRouter(['/donations']);

      await waitFor(() => {
        expect(screen.getByTestId('auth-redirect')).toBeInTheDocument();
        expect(screen.getByText('Redirecting to login...')).toBeInTheDocument();
      });
    });
  });

  describe('Route Parameters', () => {
    it('should handle donation detail routes with parameters', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        signOut: vi.fn(),
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(['/donations/don-123']);

      await waitFor(() => {
        expect(screen.getByTestId('donation-detail-page')).toBeInTheDocument();
        expect(screen.getByText('Donation Details')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should handle different donation routes independently', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        signOut: vi.fn(),
        hasRole: vi.fn().mockReturnValue(true),
      });

      // Test donations list route
      const donationsRender = renderWithRouter(['/donations']);
      await waitFor(() => {
        expect(screen.getByTestId('donations-page')).toBeInTheDocument();
      });
      donationsRender.unmount();

      // Test create donation route
      const createRender = renderWithRouter(['/donations/create']);
      await waitFor(() => {
        expect(screen.getByTestId('create-donation-page')).toBeInTheDocument();
      });
      createRender.unmount();
    });
  });
});
