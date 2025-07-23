import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleGuard } from '../RoleGuard';

// Mock the unified auth hook
vi.mock('../../../hooks/useUnifiedAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => {
      mockNavigate(to);
      return <div data-testid="navigate" data-to={to} />;
    },
  };
});

// Mock window.history
const mockHistoryBack = vi.fn();
Object.defineProperty(window, 'history', {
  value: { back: mockHistoryBack },
  writable: true,
});

import { useAuth } from '../../../hooks/useUnifiedAuth';

describe('RoleGuard', () => {
  const mockUseAuth = vi.mocked(useAuth);

  const createMockMember = (role: 'admin' | 'pastor' | 'member') => ({
    id: 'member-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role,
    householdId: 'household-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        member: null,
        loading: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
        sendMagicLink: vi.fn(),
        resetPassword: vi.fn(),
      });

      render(
        <RoleGuard allowedRoles={['admin']}>
          <div>Admin Content</div>
        </RoleGuard>
      );

      const spinner = screen.getByTestId('loading-container');
      expect(spinner).toBeInTheDocument();
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  describe('authentication', () => {
    it('redirects to login when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        member: null,
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        sendMagicLink: vi.fn(),
        resetPassword: vi.fn(),
      });

      render(
        <RoleGuard allowedRoles={['admin']}>
          <div>Admin Content</div>
        </RoleGuard>
      );

      const navigate = screen.getByTestId('navigate');
      expect(navigate).toHaveAttribute('data-to', '/login');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  describe('role-based access control', () => {
    it('allows access when user has required role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'admin@example.com' },
        member: createMockMember('admin'),
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        sendMagicLink: vi.fn(),
        resetPassword: vi.fn(),
      });

      render(
        <RoleGuard allowedRoles={['admin']}>
          <div>Admin Content</div>
        </RoleGuard>
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });

    it('allows access when user has one of multiple required roles', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'pastor@example.com' },
        member: createMockMember('pastor'),
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        sendMagicLink: vi.fn(),
        resetPassword: vi.fn(),
      });

      render(
        <RoleGuard allowedRoles={['admin', 'pastor']}>
          <div>Staff Content</div>
        </RoleGuard>
      );

      expect(screen.getByText('Staff Content')).toBeInTheDocument();
    });

    it('denies access when user lacks required role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'member@example.com' },
        member: createMockMember('member'),
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        sendMagicLink: vi.fn(),
        resetPassword: vi.fn(),
      });

      render(
        <RoleGuard allowedRoles={['admin']}>
          <div>Admin Content</div>
        </RoleGuard>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(
        screen.getByText("You don't have permission to access this page.")
      ).toBeInTheDocument();
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  describe('access denied UI', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'member@example.com' },
        member: createMockMember('member'),
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        sendMagicLink: vi.fn(),
        resetPassword: vi.fn(),
      });
    });

    it('shows access denied message with go back button', () => {
      render(
        <RoleGuard allowedRoles={['admin']}>
          <div>Admin Content</div>
        </RoleGuard>
      );

      expect(
        screen.getByRole('heading', { name: 'Access Denied' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Go Back' })
      ).toBeInTheDocument();
    });

    it('calls window.history.back when go back button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <RoleGuard allowedRoles={['admin']}>
          <div>Admin Content</div>
        </RoleGuard>
      );

      const goBackButton = screen.getByRole('button', { name: 'Go Back' });
      await user.click(goBackButton);

      expect(mockHistoryBack).toHaveBeenCalledTimes(1);
    });

    it('applies correct styling to access denied UI', () => {
      render(
        <RoleGuard allowedRoles={['admin']}>
          <div>Admin Content</div>
        </RoleGuard>
      );

      const heading = screen.getByRole('heading', { name: 'Access Denied' });
      const button = screen.getByRole('button', { name: 'Go Back' });

      expect(heading).toHaveClass(
        'text-2xl',
        'font-bold',
        'text-gray-900',
        'mb-4'
      );
      expect(button).toHaveClass(
        'bg-blue-600',
        'text-white',
        'px-4',
        'py-2',
        'rounded-md',
        'hover:bg-blue-700'
      );
    });
  });

  describe('role combinations', () => {
    const roles = ['admin', 'pastor', 'member'] as const;

    it.each([
      { userRole: 'admin', allowedRoles: ['admin'], shouldAllow: true },
      { userRole: 'admin', allowedRoles: ['pastor'], shouldAllow: false },
      {
        userRole: 'admin',
        allowedRoles: ['admin', 'pastor'],
        shouldAllow: true,
      },
      { userRole: 'pastor', allowedRoles: ['admin'], shouldAllow: false },
      { userRole: 'pastor', allowedRoles: ['pastor'], shouldAllow: true },
      {
        userRole: 'pastor',
        allowedRoles: ['admin', 'pastor'],
        shouldAllow: true,
      },
      { userRole: 'member', allowedRoles: ['admin'], shouldAllow: false },
      { userRole: 'member', allowedRoles: ['member'], shouldAllow: true },
      {
        userRole: 'member',
        allowedRoles: ['admin', 'pastor', 'member'],
        shouldAllow: true,
      },
    ])(
      '$userRole user with $allowedRoles roles should allow: $shouldAllow',
      ({ userRole, allowedRoles, shouldAllow }) => {
        mockUseAuth.mockReturnValue({
          user: { id: 'user-1', email: `${userRole}@example.com` },
          member: createMockMember(userRole as any),
          loading: false,
          signIn: vi.fn(),
          signOut: vi.fn(),
          sendMagicLink: vi.fn(),
          resetPassword: vi.fn(),
        });

        render(
          <RoleGuard allowedRoles={allowedRoles as any}>
            <div>Protected Content</div>
          </RoleGuard>
        );

        if (shouldAllow) {
          expect(screen.getByText('Protected Content')).toBeInTheDocument();
          expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
        } else {
          expect(
            screen.queryByText('Protected Content')
          ).not.toBeInTheDocument();
          expect(screen.getByText('Access Denied')).toBeInTheDocument();
        }
      }
    );
  });

  describe('fallback URL handling', () => {
    it('uses default fallback URL when not specified', () => {
      // This test is more about documentation since the fallbackUrl isn't used in current implementation
      // The component shows access denied UI instead of redirecting
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'member@example.com' },
        member: createMockMember('member'),
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        sendMagicLink: vi.fn(),
        resetPassword: vi.fn(),
      });

      render(
        <RoleGuard allowedRoles={['admin']}>
          <div>Admin Content</div>
        </RoleGuard>
      );

      // Component shows access denied instead of redirecting
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });
});
