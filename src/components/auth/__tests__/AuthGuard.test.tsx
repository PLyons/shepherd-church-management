import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthGuard } from '../AuthGuard'

// Mock the unified auth hook
vi.mock('../../../hooks/useUnifiedAuth', () => ({
  useAuth: vi.fn()
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to, state }: { to: string, state?: any }) => {
      mockNavigate(to, state)
      return <div data-testid="navigate" data-to={to} />
    },
    useLocation: vi.fn(() => ({ pathname: '/test-path', search: '', hash: '', state: null }))
  }
})

import { useAuth } from '../../../hooks/useUnifiedAuth'
import { useLocation } from 'react-router-dom'

describe('AuthGuard', () => {
  const mockUseAuth = vi.mocked(useAuth)
  const mockUseLocation = vi.mocked(useLocation)

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLocation.mockReturnValue({ 
      pathname: '/test-path', 
      search: '', 
      hash: '', 
      state: null 
    })
  })

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
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      const spinner = screen.getByTestId('loading-container')
      expect(spinner).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('requireAuth = true (default)', () => {
    it('renders children when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com' },
        member: null,
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        sendMagicLink: vi.fn(),
        resetPassword: vi.fn(),
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('redirects to login when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        member: null,
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        sendMagicLink: vi.fn(),
        resetPassword: vi.fn(),
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      const navigate = screen.getByTestId('navigate')
      expect(navigate).toHaveAttribute('data-to', '/login')
      expect(mockNavigate).toHaveBeenCalledWith('/login', { from: { pathname: '/test-path', search: '', hash: '', state: null } })
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('preserves current location for redirect after login', () => {
      mockUseLocation.mockReturnValue({ 
        pathname: '/members', 
        search: '?tab=active', 
        hash: '#section1', 
        state: { someData: 'test' } 
      })

      mockUseAuth.mockReturnValue({
        user: null,
        member: null,
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        sendMagicLink: vi.fn(),
        resetPassword: vi.fn(),
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/login', { 
        from: { 
          pathname: '/members', 
          search: '?tab=active', 
          hash: '#section1', 
          state: { someData: 'test' } 
        } 
      })
    })
  })

  describe('requireAuth = false', () => {
    it('renders children when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        member: null,
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        sendMagicLink: vi.fn(),
        resetPassword: vi.fn(),
      })

      render(
        <AuthGuard requireAuth={false}>
          <div>Public Content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Public Content')).toBeInTheDocument()
    })

    it('redirects authenticated users to dashboard from auth pages', () => {
      mockUseLocation.mockReturnValue({ 
        pathname: '/login', 
        search: '', 
        hash: '', 
        state: null 
      })

      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com' },
        member: null,
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        sendMagicLink: vi.fn(),
        resetPassword: vi.fn(),
      })

      render(
        <AuthGuard requireAuth={false}>
          <div>Login Form</div>
        </AuthGuard>
      )

      const navigate = screen.getByTestId('navigate')
      expect(navigate).toHaveAttribute('data-to', '/dashboard')
      expect(screen.queryByText('Login Form')).not.toBeInTheDocument()
    })

    it('allows authenticated users on auth callback page', () => {
      mockUseLocation.mockReturnValue({ 
        pathname: '/auth/callback', 
        search: '', 
        hash: '', 
        state: null 
      })

      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com' },
        member: null,
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        sendMagicLink: vi.fn(),
        resetPassword: vi.fn(),
      })

      render(
        <AuthGuard requireAuth={false}>
          <div>Auth Callback</div>
        </AuthGuard>
      )

      expect(screen.getByText('Auth Callback')).toBeInTheDocument()
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles missing user and member gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        member: null,
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        sendMagicLink: vi.fn(),
        resetPassword: vi.fn(),
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login')
    })

    it('handles user without member data', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com' },
        member: null,
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        sendMagicLink: vi.fn(),
        resetPassword: vi.fn(),
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })
})