// src/components/donations/__tests__/FinancialReports.security.test.tsx
// CRITICAL SECURITY TESTS: FinancialReports Dashboard - Role-Based Access & Data Privacy
//
// PURPOSE: Comprehensive security testing for Financial Reports Dashboard (PRP-2C-007)
// SCOPE: Tests role-based access control, data privacy protection, financial data security, audit logging
// SECURITY LEVEL: CRITICAL - Financial reporting with strict role-based access and data anonymization
//
// RELEVANT FILES:
// - src/components/donations/FinancialReports.tsx (component under test - TDD RED phase)
// - src/services/firebase/donations.service.ts (service layer security)
// - firestore.rules (Firebase security rules)
// - src/contexts/FirebaseAuthContext.tsx (authentication context)

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FinancialReports } from '../FinancialReports';
import { useAuth } from '../../../contexts/FirebaseAuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { donationsService } from '../../../services/firebase';
import {
  Donation,
  DonationMethod,
  DonationStatus,
  DonationReport,
} from '../../../types/donations';
import { Member } from '../../../types';

// Mock the services and contexts
vi.mock('../../../services/firebase', () => ({
  donationsService: {
    getFinancialReports: vi.fn(),
    getAggregateReports: vi.fn(),
    getAnonymizedReports: vi.fn(),
    getDonationsByDateRange: vi.fn(),
    exportFinancialData: vi.fn(),
    auditDataAccess: vi.fn(),
  },
}));

vi.mock('../../../contexts/FirebaseAuthContext');
vi.mock('../../../contexts/ToastContext');
vi.mock('../../../components/common/RoleGuard', () => ({
  RoleGuard: ({ children, roles, fallback }: any) => {
    const { member } = vi.mocked(useAuth)();
    if (member && roles.includes(member.role)) {
      return children;
    }
    return fallback || <div>Access denied</div>;
  },
}));

// Mock Firebase Firestore errors
const mockFirebaseError = (code: string, message: string) => {
  const error = new Error(message);
  (error as any).code = code;
  return error;
};

// Mock authenticated members with different roles
const createMockMember = (
  id: string,
  role: 'admin' | 'pastor' | 'member',
  email: string
): Member => ({
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
  member: createMockMember('member-789', 'member', 'member@test.com'),
};

// Mock financial report data
const createMockDonation = (
  id: string,
  memberId: string,
  memberName: string,
  amount: number
): Donation => ({
  id,
  memberId,
  memberName,
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
  donation1: createMockDonation('don-001', 'member-123', 'John Doe', 100.0),
  donation2: createMockDonation('don-002', 'member-456', 'Jane Smith', 250.0),
  donation3: createMockDonation('don-003', 'member-789', 'Bob Johnson', 500.0),
  donation4: createMockDonation('don-004', 'member-101', 'Alice Brown', 75.0),
  anonymousDonation: {
    ...createMockDonation('don-005', 'member-202', '', 1000.0),
    memberName: undefined,
    form990Fields: {
      lineItem: '1a_cash_contributions',
      isQuidProQuo: false,
      isAnonymous: true,
      restrictionType: 'unrestricted',
    },
  },
};

const MOCK_ADMIN_REPORT: DonationReport = {
  totalAmount: 1925.0,
  totalDonations: 5,
  averageDonation: 385.0,
  periodStart: '2025-01-01T00:00:00Z',
  periodEnd: '2025-01-31T23:59:59Z',
  byCategory: [
    {
      categoryId: 'tithe-001',
      categoryName: 'Tithes',
      amount: 1500.0,
      count: 4,
    },
    {
      categoryId: 'offering-002',
      categoryName: 'Special Offering',
      amount: 425.0,
      count: 1,
    },
  ],
  byMethod: [
    { method: 'credit_card', amount: 1200.0, count: 3 },
    { method: 'bank_transfer', amount: 725.0, count: 2 },
  ],
  topDonors: [
    {
      memberId: 'member-789',
      memberName: 'Bob Johnson',
      amount: 500.0,
      donationCount: 1,
    },
    {
      memberId: 'member-456',
      memberName: 'Jane Smith',
      amount: 250.0,
      donationCount: 1,
    },
  ],
  donations: Object.values(MOCK_DONATIONS),
};

const MOCK_PASTOR_REPORT: DonationReport = {
  totalAmount: 1925.0,
  totalDonations: 5,
  averageDonation: 385.0,
  periodStart: '2025-01-01T00:00:00Z',
  periodEnd: '2025-01-31T23:59:59Z',
  byCategory: [
    {
      categoryId: 'tithe-001',
      categoryName: 'Tithes',
      amount: 1500.0,
      count: 4,
    },
    {
      categoryId: 'offering-002',
      categoryName: 'Special Offering',
      amount: 425.0,
      count: 1,
    },
  ],
  byMethod: [
    { method: 'credit_card', amount: 1200.0, count: 3 },
    { method: 'bank_transfer', amount: 725.0, count: 2 },
  ],
  // Pastor view: no individual donor information
  topDonors: [],
  donations: Object.values(MOCK_DONATIONS).map((d) => ({
    ...d,
    memberId: 'ANONYMIZED',
    memberName: 'Anonymous Donor',
  })),
};

// Test suite wrapper with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Mock service implementations
const mockDonationsService = donationsService as unknown as {
  getFinancialReports: Mock;
  getAggregateReports: Mock;
  getAnonymizedReports: Mock;
  getDonationsByDateRange: Mock;
  exportFinancialData: Mock;
  auditDataAccess: Mock;
};

const mockUseAuth = useAuth as Mock;
const mockUseToast = useToast as Mock;

describe('FinancialReports - CRITICAL Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default admin auth context mock
    mockUseAuth.mockReturnValue({
      user: { uid: 'admin-123' },
      member: MOCK_MEMBERS.admin,
      loading: false,
      signOut: vi.fn(),
      hasRole: vi.fn().mockReturnValue(true),
    });

    // Default toast context mock
    mockUseToast.mockReturnValue({
      addToast: vi.fn(),
    });

    // Default successful service responses
    mockDonationsService.getFinancialReports.mockResolvedValue(
      MOCK_ADMIN_REPORT
    );
    mockDonationsService.getAggregateReports.mockResolvedValue(
      MOCK_PASTOR_REPORT
    );
    mockDonationsService.getAnonymizedReports.mockResolvedValue(
      MOCK_PASTOR_REPORT
    );
    mockDonationsService.auditDataAccess.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // ROLE-BASED ACCESS CONTROL TESTS (15 tests)
  // ============================================================================

  describe('Role-Based Access Control', () => {
    it('should allow admin full access to all financial data', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(mockDonationsService.getFinancialReports).toHaveBeenCalledWith({
          includeIndividualData: true,
          includeSensitiveData: true,
          roleContext: 'admin',
        });
      });

      // Admin should see individual donor information
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    it('should limit pastor access to anonymized aggregate data only', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'pastor-456' },
        member: MOCK_MEMBERS.pastor,
        loading: false,
        hasRole: vi.fn().mockImplementation((role) => role === 'pastor'),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(mockDonationsService.getAnonymizedReports).toHaveBeenCalledWith({
          includeIndividualData: false,
          anonymizeData: true,
          roleContext: 'pastor',
        });
      });

      // Pastor should see aggregate data but not individual donors
      expect(screen.getByText('$1,925.00')).toBeInTheDocument(); // Total amount
      expect(screen.getByText('5')).toBeInTheDocument(); // Total donations
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('should completely block member access and redirect', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'member-789' },
        member: MOCK_MEMBERS.member,
        loading: false,
        hasRole: vi.fn().mockReturnValue(false),
      });

      renderWithRouter(<FinancialReports />);

      // Should display access denied message
      expect(screen.getByText('Access denied')).toBeInTheDocument();

      // Should not make any service calls
      expect(mockDonationsService.getFinancialReports).not.toHaveBeenCalled();
      expect(mockDonationsService.getAnonymizedReports).not.toHaveBeenCalled();
    });

    it('should validate user authentication before rendering any data', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        member: null,
        loading: false,
        hasRole: vi.fn().mockReturnValue(false),
      });

      renderWithRouter(<FinancialReports />);

      expect(screen.getByText(/please log in/i)).toBeInTheDocument();
      expect(mockDonationsService.getFinancialReports).not.toHaveBeenCalled();
    });

    it('should hide sensitive financial data based on role permissions', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'pastor-456' },
        member: MOCK_MEMBERS.pastor,
        loading: false,
        hasRole: vi.fn().mockImplementation((role) => role === 'pastor'),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        // Should not display admin-only financial details
        expect(
          screen.queryByText(/individual donor details/i)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText(/tax deduction summary/i)
        ).not.toBeInTheDocument();
        expect(screen.queryByText(/member-123/)).not.toBeInTheDocument(); // Member IDs should be hidden
      });
    });

    it('should show different export options based on role', async () => {
      // Test admin export options
      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByText('Export Detailed Report')).toBeInTheDocument();
        expect(screen.getByText('Export Tax Summary')).toBeInTheDocument();
        expect(screen.getByText('Export Donor List')).toBeInTheDocument();
      });

      // Test pastor export options (limited)
      mockUseAuth.mockReturnValue({
        user: { uid: 'pastor-456' },
        member: MOCK_MEMBERS.pastor,
        loading: false,
        hasRole: vi.fn().mockImplementation((role) => role === 'pastor'),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByText('Export Summary Report')).toBeInTheDocument();
        expect(
          screen.queryByText('Export Detailed Report')
        ).not.toBeInTheDocument();
        expect(screen.queryByText('Export Donor List')).not.toBeInTheDocument();
      });
    });

    it('should enforce permission checks on all data fetching operations', async () => {
      const mockHasRole = vi
        .fn()
        .mockReturnValueOnce(true) // Initial render permission check
        .mockReturnValueOnce(false); // Secondary data fetch should fail

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: mockHasRole,
      });

      renderWithRouter(<FinancialReports />);

      // Click on detailed view button (should trigger permission check)
      const detailedButton = await waitFor(() =>
        screen.getByText('View Details')
      );
      fireEvent.click(detailedButton);

      await waitFor(() => {
        expect(mockHasRole).toHaveBeenCalledTimes(2);
        expect(screen.getByText(/permission denied/i)).toBeInTheDocument();
      });
    });

    it('should audit log all financial data access attempts', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(mockDonationsService.auditDataAccess).toHaveBeenCalledWith({
          userId: 'admin-123',
          action: 'financial_report_access',
          dataType: 'financial_reports',
          roleContext: 'admin',
          timestamp: expect.any(String),
          ipAddress: expect.any(String),
        });
      });
    });

    it('should handle role changes during active session', async () => {
      const mockHasRole = vi.fn().mockReturnValue(true);

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: mockHasRole,
      });

      const { rerender } = renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(mockDonationsService.getFinancialReports).toHaveBeenCalled();
      });

      // Simulate role change to pastor during session
      mockHasRole.mockReturnValue(false);
      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: { ...MOCK_MEMBERS.admin, role: 'pastor' },
        loading: false,
        hasRole: mockHasRole,
      });

      rerender(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByText('Access denied')).toBeInTheDocument();
      });
    });

    it('should validate session integrity and detect privilege escalation attempts', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      // Simulate mismatched user context (potential privilege escalation)
      mockUseAuth.mockReturnValue({
        user: { uid: 'member-789' }, // Member user ID
        member: MOCK_MEMBERS.admin, // Admin member data (suspicious)
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Security Warning: User ID mismatch detected',
          expect.objectContaining({
            userUid: 'member-789',
            memberData: expect.objectContaining({ role: 'admin' }),
          })
        );
      });

      consoleWarnSpy.mockRestore();
    });

    it('should implement secure fallback when role verification fails', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockImplementation(() => {
          throw new Error('Role verification service unavailable');
        }),
      });

      const mockAddToast = vi.fn();
      mockUseToast.mockReturnValue({ addToast: mockAddToast });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'error',
          message: 'Unable to verify permissions. Access denied for security.',
        });
        expect(screen.getByText('Access denied')).toBeInTheDocument();
      });
    });

    it('should prevent unauthorized role assignment through client manipulation', async () => {
      // Simulate client-side role manipulation attempt
      const manipulatedMember = {
        ...MOCK_MEMBERS.member,
        role: 'admin' as const, // Client attempts to set admin role
      };

      mockUseAuth.mockReturnValue({
        user: { uid: 'member-789' },
        member: manipulatedMember,
        loading: false,
        hasRole: vi.fn().mockReturnValue(false), // Server-side verification returns false
      });

      renderWithRouter(<FinancialReports />);

      // Should rely on server-side hasRole check, not client-side member.role
      expect(screen.getByText('Access denied')).toBeInTheDocument();
      expect(mockDonationsService.getFinancialReports).not.toHaveBeenCalled();
    });

    it('should enforce strict role hierarchy and prevent lateral privilege access', async () => {
      // Pastor should not be able to access admin-specific features
      mockUseAuth.mockReturnValue({
        user: { uid: 'pastor-456' },
        member: MOCK_MEMBERS.pastor,
        loading: false,
        hasRole: vi.fn().mockImplementation((role) => role === 'pastor'),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        // Pastor should not see admin-only controls
        expect(screen.queryByText('User Management')).not.toBeInTheDocument();
        expect(screen.queryByText('System Settings')).not.toBeInTheDocument();
        expect(screen.queryByText('Audit Logs')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete Records')).not.toBeInTheDocument();
      });
    });

    it('should audit and alert on repeated access denials (potential attack)', async () => {
      const auditSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockUseAuth.mockReturnValue({
        user: { uid: 'member-789' },
        member: MOCK_MEMBERS.member,
        loading: false,
        hasRole: vi.fn().mockReturnValue(false),
      });

      // Multiple access attempts
      for (let i = 0; i < 5; i++) {
        renderWithRouter(<FinancialReports />);
      }

      await waitFor(() => {
        expect(auditSpy).toHaveBeenCalledWith(
          'Security Alert: Multiple access denied attempts detected',
          expect.objectContaining({
            userId: 'member-789',
            attempts: 5,
            component: 'FinancialReports',
          })
        );
      });

      auditSpy.mockRestore();
    });

    it('should enforce time-based session validation for sensitive operations', async () => {
      const oldTimestamp = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago

      mockUseAuth.mockReturnValue({
        user: {
          uid: 'admin-123',
          metadata: { lastSignInTime: new Date(oldTimestamp).toISOString() },
        },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        // Should require re-authentication for stale sessions accessing financial data
        expect(screen.getByText(/session expired/i)).toBeInTheDocument();
        expect(mockDonationsService.getFinancialReports).not.toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // DATA PRIVACY PROTECTION TESTS (12 tests)
  // ============================================================================

  describe('Data Privacy Protection', () => {
    it('should anonymize donor information for pastor role', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'pastor-456' },
        member: MOCK_MEMBERS.pastor,
        loading: false,
        hasRole: vi.fn().mockImplementation((role) => role === 'pastor'),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(mockDonationsService.getAnonymizedReports).toHaveBeenCalledWith({
          anonymizeData: true,
          includeIndividualData: false,
          roleContext: 'pastor',
        });
      });

      // Should display anonymized donor information
      expect(screen.getByText('Anonymous Donor')).toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('should hide individual donation details from pastors', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'pastor-456' },
        member: MOCK_MEMBERS.pastor,
        loading: false,
        hasRole: vi.fn().mockImplementation((role) => role === 'pastor'),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        // Should show aggregate amounts but not individual donation amounts
        expect(screen.getByText('$1,925.00')).toBeInTheDocument(); // Total
        expect(screen.queryByText('$500.00')).not.toBeInTheDocument(); // Individual
        expect(screen.queryByText('$250.00')).not.toBeInTheDocument(); // Individual
      });
    });

    it('should aggregate small donations to prevent donor identification', async () => {
      const reportWithSmallDonations = {
        ...MOCK_PASTOR_REPORT,
        byAmount: [
          { range: '$1-$99', count: 15, totalAmount: 750.0 }, // Aggregated small donations
          { range: '$100-$499', count: 3, totalAmount: 900.0 },
          { range: '$500+', count: 2, totalAmount: 1200.0 },
        ],
      };

      mockDonationsService.getAnonymizedReports.mockResolvedValue(
        reportWithSmallDonations
      );

      mockUseAuth.mockReturnValue({
        user: { uid: 'pastor-456' },
        member: MOCK_MEMBERS.pastor,
        loading: false,
        hasRole: vi.fn().mockImplementation((role) => role === 'pastor'),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByText('$1-$99: 15 donations')).toBeInTheDocument();
        expect(screen.queryByText('$75.00')).not.toBeInTheDocument(); // Specific small amount hidden
      });
    });

    it('should mask member names in aggregate reports for pastor view', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'pastor-456' },
        member: MOCK_MEMBERS.pastor,
        loading: false,
        hasRole: vi.fn().mockImplementation((role) => role === 'pastor'),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        // Names should be masked with generic identifiers
        expect(screen.getByText('Donor A')).toBeInTheDocument();
        expect(screen.getByText('Donor B')).toBeInTheDocument();
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('should not expose member IDs in pastor view', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'pastor-456' },
        member: MOCK_MEMBERS.pastor,
        loading: false,
        hasRole: vi.fn().mockImplementation((role) => role === 'pastor'),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        // Member IDs should not be visible in DOM or data attributes
        const reportElements = screen.queryAllByTestId(/donor-row/);
        reportElements.forEach((element) => {
          expect(element).not.toHaveAttribute('data-member-id');
          expect(element.textContent).not.toMatch(/member-\d+/);
        });
      });
    });

    it('should protect anonymous donations completely', async () => {
      const reportWithAnonymous = {
        ...MOCK_ADMIN_REPORT,
        donations: [MOCK_DONATIONS.anonymousDonation],
      };

      mockDonationsService.getFinancialReports.mockResolvedValue(
        reportWithAnonymous
      );

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByText('Anonymous Donation')).toBeInTheDocument();
        expect(screen.getByText('$1,000.00')).toBeInTheDocument();
        // Even admins should not see identity of anonymous donations
        expect(screen.queryByText('member-202')).not.toBeInTheDocument();
      });
    });

    it('should sanitize exported data based on role permissions', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'pastor-456' },
        member: MOCK_MEMBERS.pastor,
        loading: false,
        hasRole: vi.fn().mockImplementation((role) => role === 'pastor'),
      });

      mockDonationsService.exportFinancialData.mockResolvedValue({
        filename: 'financial_report_anonymized.csv',
        data: 'Date,Amount,Category\n2025-01-15,$100.00,Tithe',
        sanitized: true,
      });

      renderWithRouter(<FinancialReports />);

      const exportButton = await waitFor(() =>
        screen.getByText('Export Report')
      );
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockDonationsService.exportFinancialData).toHaveBeenCalledWith({
          format: 'csv',
          anonymize: true,
          includePersonalData: false,
          roleContext: 'pastor',
        });
      });
    });

    it('should prevent data exposure through browser developer tools', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'pastor-456' },
        member: MOCK_MEMBERS.pastor,
        loading: false,
        hasRole: vi.fn().mockImplementation((role) => role === 'pastor'),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        // Check that sensitive data is not present in DOM attributes or hidden elements
        const sensitiveData = [
          'member-123',
          'member-456',
          'Bob Johnson',
          'Jane Smith',
        ];
        const allElements = document.querySelectorAll('*');

        sensitiveData.forEach((data) => {
          allElements.forEach((element) => {
            expect(element.getAttribute('data-member-id')).not.toBe(data);
            expect(element.getAttribute('data-donor-name')).not.toBe(data);
            expect(element.className).not.toContain(data);
          });
        });
      });
    });

    it('should implement data minimization principles', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'pastor-456' },
        member: MOCK_MEMBERS.pastor,
        loading: false,
        hasRole: vi.fn().mockImplementation((role) => role === 'pastor'),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(mockDonationsService.getAnonymizedReports).toHaveBeenCalledWith({
          fields: ['amount', 'date', 'category'], // Only necessary fields
          excludeFields: [
            'memberName',
            'memberId',
            'email',
            'phone',
            'address',
          ],
          anonymizeData: true,
          roleContext: 'pastor',
        });
      });
    });

    it('should handle mixed anonymous and identified donations securely', async () => {
      const mixedReport = {
        ...MOCK_ADMIN_REPORT,
        donations: [
          MOCK_DONATIONS.donation1,
          MOCK_DONATIONS.anonymousDonation,
          MOCK_DONATIONS.donation2,
        ],
      };

      mockDonationsService.getFinancialReports.mockResolvedValue(mixedReport);

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        // Should show identified donors for admin
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();

        // Should still protect anonymous donation identity
        expect(screen.getByText('Anonymous Donation')).toBeInTheDocument();
        expect(screen.queryByText('member-202')).not.toBeInTheDocument();
      });
    });

    it('should validate data encryption in transit and at rest', async () => {
      const cryptoSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => MOCK_ADMIN_REPORT,
        headers: new Headers({
          'content-type': 'application/json',
          'strict-transport-security': 'max-age=31536000; includeSubDomains',
        }),
      } as Response);

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        // Verify HTTPS is enforced for financial data requests
        expect(cryptoSpy).toHaveBeenCalledWith(
          expect.stringMatching(/^https:\/\//),
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-Requested-With': 'XMLHttpRequest',
              'Content-Security-Policy': expect.stringContaining('https:'),
            }),
          })
        );
      });

      cryptoSpy.mockRestore();
    });

    it('should implement secure data retention and automatic purging', async () => {
      const retentionReport = {
        ...MOCK_ADMIN_REPORT,
        dataRetention: {
          oldestRecord: '2018-01-01T00:00:00Z',
          retentionPeriod: '7 years',
          nextPurgeDate: '2025-12-31T23:59:59Z',
          recordsToBeePurged: 45,
        },
      };

      mockDonationsService.getFinancialReports.mockResolvedValue(
        retentionReport
      );

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByText('Data Retention: 7 years')).toBeInTheDocument();
        expect(
          screen.getByText('Next Purge: Dec 31, 2025')
        ).toBeInTheDocument();
        expect(
          screen.getByText('45 records scheduled for purging')
        ).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // FINANCIAL DATA SECURITY TESTS (10 tests)
  // ============================================================================

  describe('Financial Data Security', () => {
    it('should encrypt sensitive financial data in memory', async () => {
      const encryptionSpy = vi.spyOn(window, 'crypto', 'get').mockReturnValue({
        subtle: {
          encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
          decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
        },
      } as any);

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(encryptionSpy).toHaveBeenCalled();
      });

      encryptionSpy.mockRestore();
    });

    it('should validate all financial calculations for accuracy', async () => {
      const reportWithCalculations = {
        ...MOCK_ADMIN_REPORT,
        calculations: {
          totalAmount: 1925.0,
          calculatedTotal: 1925.0, // Should match
          variance: 0.0,
          isValid: true,
        },
      };

      mockDonationsService.getFinancialReports.mockResolvedValue(
        reportWithCalculations
      );

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByText('✓ Calculations Verified')).toBeInTheDocument();
        expect(screen.getByText('Variance: $0.00')).toBeInTheDocument();
      });
    });

    it('should detect and prevent financial data tampering', async () => {
      const tamperedReport = {
        ...MOCK_ADMIN_REPORT,
        totalAmount: 1925.0,
        checksum: 'invalid_checksum', // Simulated tampering
      };

      mockDonationsService.getFinancialReports.mockResolvedValue(
        tamperedReport
      );

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Data integrity violation detected',
          expect.objectContaining({
            expectedChecksum: expect.any(String),
            receivedChecksum: 'invalid_checksum',
          })
        );
        expect(screen.getByText(/data integrity error/i)).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should secure export generation with digital signatures', async () => {
      mockDonationsService.exportFinancialData.mockResolvedValue({
        filename: 'financial_report_2025.pdf',
        data: 'encrypted_data_blob',
        signature: 'digital_signature_hash',
        timestamp: '2025-01-15T10:00:00Z',
        exportedBy: 'admin-123',
      });

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      const exportButton = await waitFor(() =>
        screen.getByText('Export Detailed Report')
      );
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockDonationsService.exportFinancialData).toHaveBeenCalledWith({
          format: 'pdf',
          includeSignature: true,
          encryptOutput: true,
          auditTrail: true,
          exportedBy: 'admin-123',
        });
      });
    });

    it('should audit all financial data access operations', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(mockDonationsService.auditDataAccess).toHaveBeenCalledWith({
          userId: 'admin-123',
          action: 'financial_report_view',
          dataAccessed: 'financial_reports',
          timestamp: expect.any(String),
          ipAddress: expect.any(String),
          userAgent: expect.any(String),
          sessionId: expect.any(String),
        });
      });

      // Test filter operation audit
      const filterButton = await waitFor(() =>
        screen.getByText('Filter by Date')
      );
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(mockDonationsService.auditDataAccess).toHaveBeenCalledWith({
          userId: 'admin-123',
          action: 'financial_report_filter',
          dataAccessed: 'filtered_reports',
          filterCriteria: expect.any(Object),
          timestamp: expect.any(String),
        });
      });
    });

    it('should handle network security and prevent man-in-the-middle attacks', async () => {
      const securityHeaders = {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => MOCK_ADMIN_REPORT,
        headers: new Headers(securityHeaders),
      } as Response);

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringMatching(/^https:\/\//),
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-Requested-With': 'XMLHttpRequest',
            }),
          })
        );
      });
    });

    it('should validate and sanitize all input parameters', async () => {
      const maliciousInput = {
        dateRange: "'; DROP TABLE donations; --",
        category: "<script>alert('xss')</script>",
        sortBy: "amount'; UNION SELECT * FROM users; --",
      };

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      // Simulate form submission with malicious input
      const dateInput = await waitFor(() =>
        screen.getByLabelText('Date Range')
      );
      fireEvent.change(dateInput, {
        target: { value: maliciousInput.dateRange },
      });

      const categoryInput = screen.getByLabelText('Category');
      fireEvent.change(categoryInput, {
        target: { value: maliciousInput.category },
      });

      const submitButton = screen.getByText('Generate Report');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockDonationsService.getFinancialReports).toHaveBeenCalledWith({
          dateRange: expect.not.stringMatching(/DROP|UNION|script/i),
          category: expect.not.stringMatching(/<script>|alert/i),
          sortBy: expect.not.stringMatching(/UNION|SELECT/i),
        });
      });
    });

    it('should implement secure session management for financial operations', async () => {
      const mockSessionValidation = vi.fn().mockResolvedValue({
        valid: true,
        remainingTime: 1800000, // 30 minutes
        requiresReauth: false,
      });

      mockUseAuth.mockReturnValue({
        user: {
          uid: 'admin-123',
          getIdToken: vi.fn().mockResolvedValue('valid_jwt_token'),
        },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
        validateSession: mockSessionValidation,
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(mockSessionValidation).toHaveBeenCalled();
        expect(mockDonationsService.getFinancialReports).toHaveBeenCalledWith(
          expect.objectContaining({
            sessionToken: 'valid_jwt_token',
          })
        );
      });
    });

    it('should protect against financial fraud detection and alert systems', async () => {
      const suspiciousReport = {
        ...MOCK_ADMIN_REPORT,
        fraudAlerts: [
          {
            type: 'unusual_pattern',
            description: 'Multiple large donations from same IP address',
            severity: 'high',
            affectedDonations: ['don-001', 'don-002'],
          },
          {
            type: 'duplicate_transaction',
            description: 'Potential duplicate donation detected',
            severity: 'medium',
            affectedDonations: ['don-003'],
          },
        ],
      };

      mockDonationsService.getFinancialReports.mockResolvedValue(
        suspiciousReport
      );

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByText('⚠️ Fraud Alerts (2)')).toBeInTheDocument();
        expect(
          screen.getByText('Multiple large donations from same IP address')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Potential duplicate donation detected')
        ).toBeInTheDocument();
      });
    });

    it('should implement backup and recovery security measures', async () => {
      const backupInfo = {
        lastBackup: '2025-01-14T23:00:00Z',
        backupStatus: 'completed',
        encryptionStatus: 'aes-256',
        backupLocation: 'encrypted_cloud_storage',
        recoveryPointObjective: '1 hour',
        recoveryTimeObjective: '4 hours',
      };

      mockDonationsService.getFinancialReports.mockResolvedValue({
        ...MOCK_ADMIN_REPORT,
        systemStatus: { backup: backupInfo },
      });

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        expect(
          screen.getByText('Last Backup: Jan 14, 2025')
        ).toBeInTheDocument();
        expect(screen.getByText('✓ AES-256 Encrypted')).toBeInTheDocument();
        expect(
          screen.getByText('RPO: 1 hour | RTO: 4 hours')
        ).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // EDGE CASES AND ATTACK SCENARIOS
  // ============================================================================

  describe('Security Edge Cases & Attack Scenarios', () => {
    it('should handle concurrent access from multiple admin users', async () => {
      const promises = Array.from({ length: 3 }, (_, i) => {
        mockUseAuth.mockReturnValue({
          user: { uid: `admin-${i}` },
          member: { ...MOCK_MEMBERS.admin, id: `admin-${i}` },
          loading: false,
          hasRole: vi.fn().mockReturnValue(true),
        });
        return renderWithRouter(<FinancialReports />);
      });

      await Promise.all(promises);

      await waitFor(() => {
        expect(mockDonationsService.auditDataAccess).toHaveBeenCalledTimes(3);
        expect(mockDonationsService.getFinancialReports).toHaveBeenCalledTimes(
          3
        );
      });
    });

    it('should prevent data exposure through error messages', async () => {
      mockDonationsService.getFinancialReports.mockRejectedValue(
        new Error(
          'Database connection failed: server db-financial-01 unreachable'
        )
      );

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithRouter(<FinancialReports />);

      await waitFor(() => {
        // Should show generic error to user, not specific database details
        expect(
          screen.getByText('Unable to load financial reports')
        ).toBeInTheDocument();
        expect(screen.queryByText('db-financial-01')).not.toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should implement rate limiting for resource-intensive operations', async () => {
      let requestCount = 0;
      mockDonationsService.getFinancialReports.mockImplementation(() => {
        requestCount++;
        if (requestCount > 10) {
          return Promise.reject(
            mockFirebaseError('resource-exhausted', 'Rate limit exceeded')
          );
        }
        return Promise.resolve(MOCK_ADMIN_REPORT);
      });

      mockUseAuth.mockReturnValue({
        user: { uid: 'admin-123' },
        member: MOCK_MEMBERS.admin,
        loading: false,
        hasRole: vi.fn().mockReturnValue(true),
      });

      // Simulate rapid successive requests
      for (let i = 0; i < 15; i++) {
        renderWithRouter(<FinancialReports />);
      }

      await waitFor(() => {
        expect(requestCount).toBeLessThanOrEqual(10);
      });
    });
  });
});
