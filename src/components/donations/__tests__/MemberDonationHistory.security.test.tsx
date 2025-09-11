// src/components/donations/__tests__/MemberDonationHistory.security.test.tsx
// CRITICAL SECURITY TESTS: MemberDonationHistory Component - Member-Only Access Control
// 
// PURPOSE: Comprehensive security testing to ensure strict data privacy and member-only access
// SCOPE: Tests member access control, authorization checks, data privacy, and Firebase security rules integration
// SECURITY LEVEL: CRITICAL - Financial data protection with 100% security coverage required
//
// RELEVANT FILES: 
// - src/components/donations/MemberDonationHistory.tsx (component under test)
// - src/services/firebase/donations.service.ts (service layer security)
// - __tests__/security/firestore-security-rules.test.ts (Firebase rules reference)
// - src/contexts/FirebaseAuthContext.tsx (authentication context)

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MemberDonationHistory } from '../MemberDonationHistory';
import { useAuth } from '../../../contexts/FirebaseAuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { donationsService } from '../../../services/firebase';
import { Donation, DonationMethod, DonationStatus } from '../../../types/donations';
import { Member } from '../../../types';

// Mock the services and contexts
vi.mock('../../../services/firebase', () => ({
  donationsService: {
    getDonationsByMember: vi.fn(),
    getDonationsForRole: vi.fn(),
    getMemberDonationSummary: vi.fn(),
    subscribeToDonations: vi.fn(),
    unsubscribeFromDonations: vi.fn(),
  },
}));

vi.mock('../../../contexts/FirebaseAuthContext');
vi.mock('../../../contexts/ToastContext');

// Mock Firebase Firestore errors
const mockFirebaseError = (code: string, message: string) => {
  const error = new Error(message);
  (error as any).code = code;
  return error;
};

// Mock authenticated members with different roles
const createMockMember = (id: string, role: 'admin' | 'pastor' | 'member', email: string): Member => ({
  id,
  firstName: `Test`,
  lastName: `User ${id}`,
  email,
  role,
  memberStatus: 'active',
  dateJoined: '2023-01-01T00:00:00Z',
  contactInfo: {
    email,
    phoneNumbers: [],
    addresses: [],
  },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
});

const MOCK_MEMBERS = {
  admin: createMockMember('admin-123', 'admin', 'admin@test.com'),
  pastor: createMockMember('pastor-456', 'pastor', 'pastor@test.com'), 
  member1: createMockMember('member-789', 'member', 'member1@test.com'),
  member2: createMockMember('member-abc', 'member', 'member2@test.com'),
};

// Mock donation data for different members
const createMockDonation = (id: string, memberId: string, amount: number): Donation => ({
  id,
  memberId,
  memberName: `${MOCK_MEMBERS.member1.firstName} ${MOCK_MEMBERS.member1.lastName}`,
  amount,
  donationDate: '2025-01-15T10:00:00Z',
  method: 'credit_card' as DonationMethod,
  categoryId: 'tithe-001',
  categoryName: 'Tithes',
  form990Fields: {
    lineItem: '1a_cash_contributions',
    isQuidProQuo: false,
    isAnonymous: false,
    restrictionType: 'unrestricted',
  },
  receiptNumber: `R-2025-${id}`,
  isReceiptSent: true,
  receiptSentAt: '2025-01-15T10:05:00Z',
  isTaxDeductible: true,
  taxYear: 2025,
  createdAt: '2025-01-15T10:00:00Z',
  createdBy: memberId,
  updatedAt: '2025-01-15T10:00:00Z',
  status: 'verified' as DonationStatus,
  verifiedBy: 'admin-123',
  verifiedAt: '2025-01-15T10:01:00Z',
});

const MOCK_DONATIONS = {
  member1Donation1: createMockDonation('don-001', 'member-789', 100.00),
  member1Donation2: createMockDonation('don-002', 'member-789', 250.00),
  member2Donation1: createMockDonation('don-003', 'member-abc', 150.00),
  member2Donation2: createMockDonation('don-004', 'member-abc', 300.00),
};

// Test suite wrapper with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Mock service implementations
const mockDonationsService = donationsService as unknown as {
  getDonationsByMember: Mock;
  getDonationsForRole: Mock;
  getMemberDonationSummary: Mock;
  subscribeToDonations: Mock;
  unsubscribeFromDonations: Mock;
};

const mockUseAuth = useAuth as Mock;
const mockUseToast = useToast as Mock;

describe('MemberDonationHistory - CRITICAL Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default auth context mock
    mockUseAuth.mockReturnValue({
      user: { uid: 'member-789' },
      member: MOCK_MEMBERS.member1,
      loading: false,
      signOut: vi.fn(),
    });

    // Default toast context mock
    mockUseToast.mockReturnValue({
      addToast: vi.fn(),
    });

    // Default successful service response
    mockDonationsService.getDonationsByMember.mockResolvedValue([
      MOCK_DONATIONS.member1Donation1,
      MOCK_DONATIONS.member1Donation2,
    ]);

    mockDonationsService.getMemberDonationSummary.mockResolvedValue({
      totalAmount: 350.00,
      totalDonations: 2,
      currentYearAmount: 350.00,
      currentYearDonations: 2,
      lastDonationDate: '2025-01-15T10:00:00Z',
    });

    mockDonationsService.subscribeToDonations.mockReturnValue(() => {});
    mockDonationsService.unsubscribeFromDonations.mockReturnValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // MEMBER-ONLY ACCESS TESTS
  // ============================================================================

  describe('Member-Only Access Control', () => {
    it('should only fetch current member donations and validate member ID match', async () => {
      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        expect(mockDonationsService.getDonationsByMember).toHaveBeenCalledWith('member-789');
        expect(mockDonationsService.getDonationsByMember).toHaveBeenCalledTimes(1);
      });

      // Should not attempt to fetch other members' data
      expect(mockDonationsService.getDonationsByMember).not.toHaveBeenCalledWith('member-abc');
      expect(mockDonationsService.getDonationsByMember).not.toHaveBeenCalledWith('admin-123');
      expect(mockDonationsService.getDonationsByMember).not.toHaveBeenCalledWith('pastor-456');
    });

    it('should reject attempts to view other members data through service calls', async () => {
      // Simulate malicious attempt to access other member's data
      mockDonationsService.getDonationsByMember.mockImplementation((memberId: string) => {
        if (memberId !== 'member-789') {
          throw mockFirebaseError('permission-denied', 'Insufficient permissions');
        }
        return Promise.resolve([MOCK_DONATIONS.member1Donation1]);
      });

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        expect(mockDonationsService.getDonationsByMember).toHaveBeenCalledWith('member-789');
      });

      // Attempt to manually trigger service call with different member ID should fail
      await expect(
        mockDonationsService.getDonationsByMember('member-abc')
      ).rejects.toThrow('Insufficient permissions');
    });

    it('should validate authenticated user matches component member ID', async () => {
      // Test scenario where Firebase user ID doesn't match component member
      mockUseAuth.mockReturnValue({
        user: { uid: 'different-user-456' },
        member: MOCK_MEMBERS.member2, // Different member
        loading: false,
      });

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        // Should call service with the authenticated member's ID, not a hardcoded one
        expect(mockDonationsService.getDonationsByMember).toHaveBeenCalledWith('member-abc');
      });
    });

    it('should handle unauthorized access gracefully with user-friendly error', async () => {
      mockDonationsService.getDonationsByMember.mockRejectedValue(
        mockFirebaseError('permission-denied', 'Access denied: Members can only view their own donation history')
      );

      const mockAddToast = vi.fn();
      mockUseToast.mockReturnValue({ addToast: mockAddToast });

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('Access denied'),
          })
        );
      });

      // Should display error message to user
      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    });

    it('should prevent cross-member data leakage in component state', async () => {
      // Initially load member1's data
      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
        expect(screen.getByText(/\$250\.00/)).toBeInTheDocument();
      });

      // Switch to member2 (simulating auth change)
      mockUseAuth.mockReturnValue({
        user: { uid: 'member-abc' },
        member: MOCK_MEMBERS.member2,
        loading: false,
      });

      mockDonationsService.getDonationsByMember.mockResolvedValue([
        MOCK_DONATIONS.member2Donation1,
        MOCK_DONATIONS.member2Donation2,
      ]);

      // Re-render with new auth state
      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        expect(mockDonationsService.getDonationsByMember).toHaveBeenCalledWith('member-abc');
      });

      // Should not display member1's data anymore
      expect(screen.queryByText(/member-789/)).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // AUTHORIZATION TESTS
  // ============================================================================

  describe('Authentication & Authorization', () => {
    it('should require authenticated user and redirect when not logged in', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        member: null,
        loading: false,
      });

      renderWithRouter(<MemberDonationHistory />);

      // Should not make service calls for unauthenticated users
      expect(mockDonationsService.getDonationsByMember).not.toHaveBeenCalled();
      
      // Should display login requirement message
      expect(screen.getByText(/please log in/i)).toBeInTheDocument();
    });

    it('should validate member role permissions', async () => {
      // Test with member role (should succeed)
      mockUseAuth.mockReturnValue({
        user: { uid: 'member-789' },
        member: MOCK_MEMBERS.member1,
        loading: false,
      });

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        expect(mockDonationsService.getDonationsByMember).toHaveBeenCalledWith('member-789');
      });

      // Test with admin role accessing member view (should still only show their data)
      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
      });

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        expect(mockDonationsService.getDonationsByMember).toHaveBeenCalledWith('admin-123');
      });
    });

    it('should handle loading state during authentication', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        member: null,
        loading: true,
      });

      renderWithRouter(<MemberDonationHistory />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(mockDonationsService.getDonationsByMember).not.toHaveBeenCalled();
    });

    it('should audit and log unauthorized access attempts', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockDonationsService.getDonationsByMember.mockRejectedValue(
        mockFirebaseError('permission-denied', 'Unauthorized access attempt detected')
      );

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Security violation'),
          expect.objectContaining({
            userId: 'member-789',
            action: 'attempted_unauthorized_access',
          })
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  // ============================================================================
  // DATA PRIVACY TESTS  
  // ============================================================================

  describe('Data Privacy & Isolation', () => {
    it('should ensure no cross-member data leakage in filtered results', async () => {
      // Mock service that accidentally returns mixed data (should not happen with proper security)
      mockDonationsService.getDonationsByMember.mockResolvedValue([
        MOCK_DONATIONS.member1Donation1,
        MOCK_DONATIONS.member2Donation1, // Wrong member data
      ]);

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        // Component should validate and filter out non-matching member data
        expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
        expect(screen.queryByText('member-abc')).not.toBeInTheDocument();
      });
    });

    it('should not expose aggregated church financial data', async () => {
      mockDonationsService.getMemberDonationSummary.mockResolvedValue({
        totalAmount: 350.00,
        totalDonations: 2,
        currentYearAmount: 350.00,
        currentYearDonations: 2,
        lastDonationDate: '2025-01-15T10:00:00Z',
        // Should not include church-wide statistics
        churchTotalAmount: 50000.00, // This should not be exposed
        averageDonation: 1250.00, // This should not be exposed
      });

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        // Should only display member's own statistics
        expect(screen.getByText('$350.00')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });

      // Should not display church-wide statistics
      expect(screen.queryByText('$50,000')).not.toBeInTheDocument();
      expect(screen.queryByText('$1,250')).not.toBeInTheDocument();
    });

    it('should securely handle sensitive donation information', async () => {
      const sensitiveNote = 'Confidential family circumstances - financial hardship';
      const donationWithSensitiveData = {
        ...MOCK_DONATIONS.member1Donation1,
        note: sensitiveNote,
        internalNotes: 'Admin only - payment method declined twice',
      };

      mockDonationsService.getDonationsByMember.mockResolvedValue([donationWithSensitiveData]);

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        // Member should see their own note but not admin internal notes
        expect(screen.getByText(sensitiveNote)).toBeInTheDocument();
        expect(screen.queryByText(/admin only/i)).not.toBeInTheDocument();
      });
    });

    it('should handle anonymous donations correctly', async () => {
      const anonymousDonation = {
        ...MOCK_DONATIONS.member1Donation1,
        form990Fields: {
          ...MOCK_DONATIONS.member1Donation1.form990Fields,
          isAnonymous: true,
        },
        memberName: undefined, // Should be hidden for anonymous donations
      };

      mockDonationsService.getDonationsByMember.mockResolvedValue([anonymousDonation]);

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        expect(screen.getByText('Anonymous Donation')).toBeInTheDocument();
        expect(screen.queryByText('Test User member-789')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // FIREBASE SECURITY RULES INTEGRATION TESTS
  // ============================================================================

  describe('Firebase Security Rules Integration', () => {
    it('should handle Firebase permission denied errors correctly', async () => {
      const permissionError = mockFirebaseError(
        'permission-denied',
        'Missing or insufficient permissions'
      );

      mockDonationsService.getDonationsByMember.mockRejectedValue(permissionError);

      const mockAddToast = vi.fn();
      mockUseToast.mockReturnValue({ addToast: mockAddToast });

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('Permission denied'),
          })
        );
      });
    });

    it('should validate server-side security rule enforcement', async () => {
      // Simulate server-side security rule rejection
      mockDonationsService.getDonationsByMember.mockRejectedValue(
        mockFirebaseError(
          'failed-precondition', 
          'Security rule validation failed: Member can only access own data'
        )
      );

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        expect(screen.getByText(/security validation failed/i)).toBeInTheDocument();
      });
    });

    it('should handle network and authentication token errors', async () => {
      mockDonationsService.getDonationsByMember.mockRejectedValue(
        mockFirebaseError('unauthenticated', 'User authentication token expired')
      );

      const mockSignOut = vi.fn();
      mockUseAuth.mockReturnValue({
        user: { uid: 'member-789' },
        member: MOCK_MEMBERS.member1,
        loading: false,
        signOut: mockSignOut,
      });

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it('should prevent client-side security bypass attempts', async () => {
      // Simulate component receiving data that should be filtered by security rules
      const unauthorizedData = [
        MOCK_DONATIONS.member1Donation1,
        MOCK_DONATIONS.member2Donation1, // Should not be accessible
      ];

      mockDonationsService.getDonationsByMember.mockResolvedValue(unauthorizedData);

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        // Component should implement additional client-side validation
        const displayedDonations = screen.queryAllByTestId('donation-row');
        
        // Should only display donations belonging to authenticated member
        displayedDonations.forEach((row) => {
          expect(row).not.toHaveTextContent('member-abc');
        });
      });
    });
  });

  // ============================================================================
  // EDGE CASES AND ATTACK SCENARIOS
  // ============================================================================

  describe('Security Edge Cases & Attack Scenarios', () => {
    it('should handle SQL injection attempts in member ID', async () => {
      // Simulate malicious member ID
      const maliciousMemberId = "member-789'; DROP TABLE donations; --";
      
      mockUseAuth.mockReturnValue({
        user: { uid: maliciousMemberId },
        member: { ...MOCK_MEMBERS.member1, id: maliciousMemberId },
        loading: false,
      });

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        // Service should sanitize the member ID
        expect(mockDonationsService.getDonationsByMember).toHaveBeenCalledWith(
          maliciousMemberId
        );
        
        // Firestore should handle this safely, but component should log the attempt
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('Suspicious member ID detected')
        );
      });
    });

    it('should prevent timing attacks through consistent response times', async () => {
      const startTime = Date.now();

      // Test with valid member ID
      mockDonationsService.getDonationsByMember.mockResolvedValue([]);
      renderWithRouter(<MemberDonationHistory />);
      await waitFor(() => expect(mockDonationsService.getDonationsByMember).toHaveBeenCalled());
      
      const validIdTime = Date.now() - startTime;

      vi.clearAllMocks();

      // Test with invalid member ID
      mockDonationsService.getDonationsByMember.mockRejectedValue(
        mockFirebaseError('permission-denied', 'Invalid member ID')
      );

      const invalidStartTime = Date.now();
      renderWithRouter(<MemberDonationHistory />);
      
      await waitFor(() => {
        expect(mockDonationsService.getDonationsByMember).toHaveBeenCalled();
      });

      const invalidIdTime = Date.now() - invalidStartTime;

      // Response times should be similar to prevent timing attacks
      expect(Math.abs(validIdTime - invalidIdTime)).toBeLessThan(100);
    });

    it('should handle session hijacking attempts', async () => {
      // Simulate session with mismatched user data
      mockUseAuth.mockReturnValue({
        user: { uid: 'member-789' },
        member: MOCK_MEMBERS.member2, // Different member data (potential hijacking)
        loading: false,
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Session validation failed'),
          expect.objectContaining({
            userUid: 'member-789',
            memberData: expect.objectContaining({ id: 'member-abc' }),
          })
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should rate limit repeated unauthorized access attempts', async () => {
      let attemptCount = 0;
      mockDonationsService.getDonationsByMember.mockImplementation(() => {
        attemptCount++;
        if (attemptCount <= 3) {
          return Promise.reject(mockFirebaseError('permission-denied', 'Unauthorized'));
        }
        return Promise.reject(mockFirebaseError('resource-exhausted', 'Rate limit exceeded'));
      });

      // Make multiple rapid requests
      for (let i = 0; i < 5; i++) {
        renderWithRouter(<MemberDonationHistory />);
        await waitFor(() => {
          expect(mockDonationsService.getDonationsByMember).toHaveBeenCalled();
        });
        vi.clearAllMocks();
      }

      // Should eventually be rate limited
      expect(attemptCount).toBe(4);
    });

    it('should clear sensitive data on component unmount', async () => {
      const { unmount } = renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        expect(mockDonationsService.getDonationsByMember).toHaveBeenCalled();
      });

      // Unmount component
      unmount();

      // Should call cleanup to prevent memory leaks of sensitive data
      expect(mockDonationsService.unsubscribeFromDonations).toHaveBeenCalled();
    });

    it('should handle concurrent access attempts gracefully', async () => {
      // Simulate multiple concurrent component instances
      const promises = Array.from({ length: 5 }, () => {
        return new Promise((resolve) => {
          renderWithRouter(<MemberDonationHistory />);
          setTimeout(resolve, Math.random() * 100);
        });
      });

      await Promise.all(promises);

      // Should handle concurrent access without security violations
      expect(mockDonationsService.getDonationsByMember).toHaveBeenCalledTimes(5);
      expect(mockDonationsService.getDonationsByMember).toHaveBeenCalledWith('member-789');
    });
  });

  // ============================================================================
  // ERROR BOUNDARY AND FALLBACK SECURITY
  // ============================================================================

  describe('Error Boundaries & Security Fallbacks', () => {
    it('should fail securely when data validation fails', async () => {
      // Mock corrupted data response
      const corruptedData = [
        {
          ...MOCK_DONATIONS.member1Donation1,
          memberId: null, // Invalid data
          amount: 'invalid-amount', // Invalid data type
        },
      ];

      mockDonationsService.getDonationsByMember.mockResolvedValue(corruptedData as any);

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        // Should display error message instead of corrupted data
        expect(screen.getByText(/data validation failed/i)).toBeInTheDocument();
        expect(screen.queryByText('invalid-amount')).not.toBeInTheDocument();
      });
    });

    it('should implement secure error boundaries', async () => {
      // Mock component error
      mockDonationsService.getDonationsByMember.mockImplementation(() => {
        throw new Error('Component crash simulation');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        // Should display generic error without exposing system details
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        expect(screen.queryByText(/component crash/i)).not.toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should maintain audit trail even during errors', async () => {
      const auditSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      mockDonationsService.getDonationsByMember.mockRejectedValue(
        mockFirebaseError('permission-denied', 'Test error')
      );

      renderWithRouter(<MemberDonationHistory />);

      await waitFor(() => {
        expect(auditSpy).toHaveBeenCalledWith(
          expect.stringContaining('Donation access attempt'),
          expect.objectContaining({
            memberId: 'member-789',
            success: false,
            error: 'Test error',
          })
        );
      });

      auditSpy.mockRestore();
    });
  });
});