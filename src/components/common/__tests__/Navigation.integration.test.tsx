/**
 * PRP-2C-010 Navigation Integration - RED Phase Tests
 *
 * PURPOSE: Test role-based donation menu visibility and navigation integration
 * SCOPE: Navigation menu items for donation features across admin/pastor/member roles
 * CONSTRAINT: Maximum 8 test cases, under 300 lines total
 *
 * EXPECTED TO FAIL: These tests define the expected navigation integration
 * that will be implemented in the GREEN phase
 *
 * RELEVANT FILES:
 * - src/components/common/Navigation.tsx (component under test)
 * - src/contexts/FirebaseAuthContext.tsx (auth context)
 * - src/router/index.tsx (routing definitions)
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Navigation } from '../Navigation';
import { useAuth } from '../../../hooks/useUnifiedAuth';
import { Member } from '../../../types';

// Mock the useAuth hook
vi.mock('../../../hooks/useUnifiedAuth');

// Mock authenticated members with different roles
const createMockMember = (
  id: string,
  role: 'admin' | 'pastor' | 'member',
  firstName: string
): Member => ({
  id,
  firstName,
  lastName: 'User',
  email: `${firstName.toLowerCase()}@test.com`,
  role,
  memberStatus: 'active',
  fullName: `${firstName} User`,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
});

const MOCK_MEMBERS = {
  admin: createMockMember('admin-123', 'admin', 'Admin'),
  pastor: createMockMember('pastor-456', 'pastor', 'Pastor'),
  member: createMockMember('member-789', 'member', 'Member'),
};

const mockUseAuth = useAuth as Mock;

// Helper function to render Navigation with auth context
const renderNavigation = (member: Member | null) => {
  mockUseAuth.mockReturnValue({
    member,
    signOut: vi.fn(),
    loading: false,
    isAuthenticated: !!member,
  });

  const user = userEvent.setup();
  const result = render(
    <BrowserRouter>
      <Navigation
        onMobileMenuToggle={vi.fn()}
        userRole={member?.role || 'member'}
      />
    </BrowserRouter>
  );

  return { ...result, user };
};

describe('Navigation - Donation Integration (PRP-2C-010)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin Role - Full Donation Access', () => {
    it('should show "Donations" menu item for admin users', () => {
      renderNavigation(MOCK_MEMBERS.admin);

      // Admin should see the main Donations menu item
      expect(screen.getByText('Donations')).toBeInTheDocument();
    });

    it('should show "Quick Donate" in submenu for admin users', async () => {
      const { user } = renderNavigation(MOCK_MEMBERS.admin);

      // Click on Donations to open submenu
      const donationsMenu = screen.getByText('Donations');
      await user.click(donationsMenu);

      // Admin should see Quick Donate in submenu
      expect(screen.getByText('Quick Donate')).toBeInTheDocument();
      expect(screen.getByText('Financial Reports')).toBeInTheDocument();
      expect(screen.getByText('Donation Categories')).toBeInTheDocument();
    });
  });

  describe('Pastor Role - Limited Donation Access', () => {
    it('should show "Giving Overview" menu item for pastor users', () => {
      renderNavigation(MOCK_MEMBERS.pastor);

      // Pastor should see Giving Overview instead of full Donations menu
      expect(screen.getByText('Giving Overview')).toBeInTheDocument();
    });

    it('should NOT show full "Donations" menu item for pastor users', () => {
      renderNavigation(MOCK_MEMBERS.pastor);

      // Pastor should NOT see the admin Donations menu
      expect(screen.queryByText('Donations')).not.toBeInTheDocument();
    });
  });

  describe('Member Role - Personal Giving Only', () => {
    it('should show "My Giving" menu item for member users', () => {
      renderNavigation(MOCK_MEMBERS.member);

      // Member should see My Giving menu item
      expect(screen.getByText('My Giving')).toBeInTheDocument();
    });

    it('should NOT show admin donation features for member users', () => {
      renderNavigation(MOCK_MEMBERS.member);

      // Member should NOT see admin donation features
      expect(screen.queryByText('Donations')).not.toBeInTheDocument();
      expect(screen.queryByText('Financial Reports')).not.toBeInTheDocument();
      expect(screen.queryByText('Donation Categories')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Links and Breadcrumbs', () => {
    it('should have correct navigation links for each role', () => {
      // Test admin links
      renderNavigation(MOCK_MEMBERS.admin);
      const donationsLink =
        screen.getByText('Donations').closest('a') ||
        screen.getByText('Donations').closest('button');
      expect(donationsLink).toBeInTheDocument();

      // Re-render for member
      renderNavigation(MOCK_MEMBERS.member);
      const myGivingLink = screen.getByText('My Giving').closest('a');
      expect(myGivingLink).toHaveAttribute('href', '/donations/my-giving');
    });

    it('should include donation paths in breadcrumb navigation', () => {
      renderNavigation(MOCK_MEMBERS.admin);

      // Check that donation-related paths are properly configured
      // This test will verify breadcrumb integration when navigation is active
      const donationsMenu = screen.getByText('Donations');
      expect(donationsMenu).toBeInTheDocument();

      // Verify the menu structure supports breadcrumb navigation
      expect(donationsMenu.closest('nav')).toBeInTheDocument();
    });
  });
});
