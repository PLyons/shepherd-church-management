// src/components/donations/__tests__/MemberDonationHistory.test.tsx
// Comprehensive test suite for MemberDonationHistory component following TDD RED phase principles
// Tests written BEFORE implementation to define expected behavior and achieve 90%+ component coverage
// RELEVANT FILES: src/components/donations/MemberDonationHistory.tsx, src/services/firebase/donations.service.ts, src/types/donations.ts

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { MemberDonationHistory } from '../MemberDonationHistory';
import { donationsService } from '../../../services/firebase';
import { useAuth } from '../../../contexts/FirebaseAuthContext';
import { useToast } from '../../../contexts/ToastContext';
import {
  Donation,
  DonationMethod,
  DonationStatus,
  Form990LineItem,
} from '../../../types/donations';
import { Member } from '../../../types';

// Mock the services and contexts
vi.mock('../../../services/firebase', () => ({
  donationsService: {
    getDonationsByMember: vi.fn(),
    getMemberDonationSummary: vi.fn(),
    subscribeToDonations: vi.fn(),
    unsubscribeFromDonations: vi.fn(),
  },
}));

vi.mock('../../../contexts/FirebaseAuthContext');
vi.mock('../../../contexts/ToastContext');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ memberId: 'member-1' }),
  };
});

const mockDonationsService = donationsService as unknown as {
  getDonationsByMember: Mock;
  getMemberDonationSummary: Mock;
  subscribeToDonations: Mock;
  unsubscribeFromDonations: Mock;
};

const mockUseAuth = useAuth as Mock;
const mockUseToast = useToast as Mock;

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('MemberDonationHistory', () => {
  const mockUser = {
    uid: 'admin-user-id',
    email: 'admin@test.com',
    displayName: 'Test Admin',
    role: 'admin',
  };

  const mockMember: Member = {
    id: 'member-1',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    email: 'john@test.com',
    phone: '555-1234',
    role: 'member',
    memberStatus: 'active',
  };

  const mockShowToast = vi.fn();

  const mockDonations: Donation[] = [
    {
      id: 'donation-1',
      memberId: 'member-1',
      memberName: 'John Doe',
      amount: 500.0,
      donationDate: '2025-01-15',
      method: 'check' as DonationMethod,
      categoryId: 'category-1',
      categoryName: 'Tithe',
      form990Fields: {
        lineItem: '1a_cash_contributions' as Form990LineItem,
        isQuidProQuo: false,
        isAnonymous: false,
      },
      isReceiptSent: true,
      receiptSentAt: '2025-01-16T10:00:00Z',
      isTaxDeductible: true,
      taxYear: 2025,
      status: 'verified' as DonationStatus,
      createdAt: '2025-01-15T10:00:00Z',
      createdBy: 'admin-user-id',
      updatedAt: '2025-01-15T10:00:00Z',
      receiptNumber: 'REC-2025-001',
    },
    {
      id: 'donation-2',
      memberId: 'member-1',
      memberName: 'John Doe',
      amount: 250.0,
      donationDate: '2025-01-08',
      method: 'cash' as DonationMethod,
      categoryId: 'category-2',
      categoryName: 'Offering',
      form990Fields: {
        lineItem: '1a_cash_contributions' as Form990LineItem,
        isQuidProQuo: false,
        isAnonymous: false,
      },
      isReceiptSent: false,
      isTaxDeductible: true,
      taxYear: 2025,
      status: 'verified' as DonationStatus,
      createdAt: '2025-01-08T10:00:00Z',
      createdBy: 'admin-user-id',
      updatedAt: '2025-01-08T10:00:00Z',
    },
    {
      id: 'donation-3',
      memberId: 'member-1',
      memberName: 'John Doe',
      amount: 1000.0,
      donationDate: '2024-12-25',
      method: 'online' as DonationMethod,
      categoryId: 'category-3',
      categoryName: 'Special Collection',
      form990Fields: {
        lineItem: '1a_cash_contributions' as Form990LineItem,
        isQuidProQuo: false,
        isAnonymous: false,
      },
      isReceiptSent: true,
      receiptSentAt: '2024-12-26T09:00:00Z',
      isTaxDeductible: false,
      taxYear: 2024,
      status: 'verified' as DonationStatus,
      createdAt: '2024-12-25T09:00:00Z',
      createdBy: 'admin-user-id',
      updatedAt: '2024-12-25T09:00:00Z',
      receiptNumber: 'REC-2024-125',
      note: 'Christmas special offering',
    },
  ];

  const mockSummaryData = {
    memberId: 'member-1',
    memberName: 'John Doe',
    totalAmount: 1750.0,
    totalCount: 3,
    averageDonation: 583.33,
    firstDonationDate: '2024-12-25',
    lastDonationDate: '2025-01-15',
    yearToDateTotal: 750.0,
    previousYearTotal: 1000.0,

    // Category breakdown
    byCategory: {
      'category-1': {
        categoryName: 'Tithe',
        amount: 500.0,
        count: 1,
        percentage: 28.57,
      },
      'category-2': {
        categoryName: 'Offering',
        amount: 250.0,
        count: 1,
        percentage: 14.29,
      },
      'category-3': {
        categoryName: 'Special Collection',
        amount: 1000.0,
        count: 1,
        percentage: 57.14,
      },
    },

    // Method breakdown
    byMethod: {
      check: { amount: 500.0, count: 1, percentage: 28.57 },
      cash: { amount: 250.0, count: 1, percentage: 14.29 },
      online: { amount: 1000.0, count: 1, percentage: 57.14 },
      credit_card: { amount: 0, count: 0, percentage: 0 },
      debit_card: { amount: 0, count: 0, percentage: 0 },
      bank_transfer: { amount: 0, count: 0, percentage: 0 },
      stock: { amount: 0, count: 0, percentage: 0 },
      cryptocurrency: { amount: 0, count: 0, percentage: 0 },
      in_kind: { amount: 0, count: 0, percentage: 0 },
      other: { amount: 0, count: 0, percentage: 0 },
    },

    // Tax-deductible breakdown
    taxDeductibleTotal: 750.0,
    nonTaxDeductibleTotal: 1000.0,
    taxDeductiblePercentage: 42.86,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
    });

    mockUseToast.mockReturnValue({
      showToast: mockShowToast,
    });

    mockDonationsService.getDonationsByMember.mockResolvedValue(mockDonations);
    mockDonationsService.getMemberDonationSummary.mockResolvedValue(
      mockSummaryData
    );
  });

  describe('Component Rendering Tests', () => {
    it('should render without crashing', () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      expect(screen.getByTestId('member-donation-history')).toBeInTheDocument();
    });

    it('should render member name and donation summary information', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText('Donation History for John Doe')
        ).toBeInTheDocument();
        expect(screen.getByText('Total Donated:')).toBeInTheDocument();
        expect(screen.getByText('$1,750.00')).toBeInTheDocument();
        expect(screen.getByText('Number of Donations:')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('should render donation table with proper headers', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Method')).toBeInTheDocument();
        expect(screen.getByText('Tax Deductible')).toBeInTheDocument();
        expect(screen.getByText('Receipt')).toBeInTheDocument();
        expect(screen.getByText('Notes')).toBeInTheDocument();
      });
    });

    it('should display year-to-date totals section', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText('2025 Year-to-Date Summary')
        ).toBeInTheDocument();
        expect(screen.getByText('$750.00')).toBeInTheDocument();
        expect(screen.getByText('Previous Year (2024):')).toBeInTheDocument();
        expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      });
    });

    it('should display category breakdown section', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Breakdown by Category')).toBeInTheDocument();
        expect(screen.getByText('Tithe: $500.00 (28.57%)')).toBeInTheDocument();
        expect(
          screen.getByText('Offering: $250.00 (14.29%)')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Special Collection: $1,000.00 (57.14%)')
        ).toBeInTheDocument();
      });
    });

    it('should render with member ID prop when member object not provided', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('member-donation-history')
        ).toBeInTheDocument();
        expect(mockDonationsService.getDonationsByMember).toHaveBeenCalledWith(
          'member-1'
        );
      });
    });
  });

  describe('Data Display Tests', () => {
    it('should format donation amounts correctly as currency', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(within(table).getByText('$500.00')).toBeInTheDocument();
        expect(within(table).getByText('$250.00')).toBeInTheDocument();
        expect(within(table).getByText('$1,000.00')).toBeInTheDocument();
      });
    });

    it('should display dates in readable format', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(within(table).getByText('Jan 15, 2025')).toBeInTheDocument();
        expect(within(table).getByText('Jan 8, 2025')).toBeInTheDocument();
        expect(within(table).getByText('Dec 25, 2024')).toBeInTheDocument();
      });
    });

    it('should show donation categories and methods correctly', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(within(table).getByText('Tithe')).toBeInTheDocument();
        expect(within(table).getByText('Offering')).toBeInTheDocument();
        expect(
          within(table).getByText('Special Collection')
        ).toBeInTheDocument();
        expect(within(table).getByText('Check')).toBeInTheDocument();
        expect(within(table).getByText('Cash')).toBeInTheDocument();
        expect(within(table).getByText('Online')).toBeInTheDocument();
      });
    });

    it('should handle tax-deductible vs non-deductible amounts', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        const taxSummary = screen.getByTestId('tax-summary');
        expect(
          within(taxSummary).getByText('Tax-Deductible Total:')
        ).toBeInTheDocument();
        expect(within(taxSummary).getByText('$750.00')).toBeInTheDocument();
        expect(
          within(taxSummary).getByText('Non-Deductible Total:')
        ).toBeInTheDocument();
        expect(within(taxSummary).getByText('$1,000.00')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');

      // Check tax deductible indicators in table
      expect(within(rows[1]).getByText('Yes')).toBeInTheDocument(); // Tithe - tax deductible
      expect(within(rows[2]).getByText('Yes')).toBeInTheDocument(); // Offering - tax deductible
      expect(within(rows[3]).getByText('No')).toBeInTheDocument(); // Special Collection - not tax deductible
    });

    it('should display receipt status correctly', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        const table = screen.getByRole('table');
        const rows = within(table).getAllByRole('row');

        expect(
          within(rows[1]).getByText('Sent (REC-2025-001)')
        ).toBeInTheDocument();
        expect(within(rows[2]).getByText('Not Sent')).toBeInTheDocument();
        expect(
          within(rows[3]).getByText('Sent (REC-2024-125)')
        ).toBeInTheDocument();
      });
    });

    it('should display notes when available', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(
          within(table).getByText('Christmas special offering')
        ).toBeInTheDocument();
      });
    });

    it('should display running totals and percentages', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText('Average Donation: $583.33')
        ).toBeInTheDocument();
        expect(screen.getByText('Tax-Deductible: 42.86%')).toBeInTheDocument();
      });
    });
  });

  describe('Loading & Error States', () => {
    it('should show loading spinner during data fetch', () => {
      mockDonationsService.getDonationsByMember.mockImplementation(
        () => new Promise(() => {})
      );
      mockDonationsService.getMemberDonationSummary.mockImplementation(
        () => new Promise(() => {})
      );

      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      expect(
        screen.getByTestId('loading-spinner') || screen.getByRole('status')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Loading donation history...')
      ).toBeInTheDocument();
    });

    it('should show error message when data fetch fails', async () => {
      mockDonationsService.getDonationsByMember.mockRejectedValueOnce(
        new Error('Network error')
      );

      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText('Error loading donation history')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Failed to load donation data. Please try again.')
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /retry/i })
        ).toBeInTheDocument();
      });
    });

    it('should show empty state when member has no donations', async () => {
      mockDonationsService.getDonationsByMember.mockResolvedValueOnce([]);
      mockDonationsService.getMemberDonationSummary.mockResolvedValueOnce({
        ...mockSummaryData,
        totalAmount: 0,
        totalCount: 0,
        byCategory: {},
        byMethod: {},
      });

      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText('No donation history found')
        ).toBeInTheDocument();
        expect(
          screen.getByText('John Doe has not made any donations yet.')
        ).toBeInTheDocument();
        expect(screen.getByTestId('empty-donations-state')).toBeInTheDocument();
      });
    });

    it('should handle malformed data gracefully', async () => {
      const malformedDonations = [
        {
          id: 'donation-bad',
          // Missing required fields
          amount: null,
          donationDate: 'invalid-date',
          memberName: null,
        },
      ];

      mockDonationsService.getDonationsByMember.mockResolvedValueOnce(
        malformedDonations as any
      );

      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText('Some donation data may be incomplete')
        ).toBeInTheDocument();
        expect(mockShowToast).toHaveBeenCalledWith(
          'Some donation records contain invalid data',
          'warning'
        );
      });
    });

    it('should retry data fetch when retry button is clicked', async () => {
      const user = userEvent.setup();
      mockDonationsService.getDonationsByMember.mockRejectedValueOnce(
        new Error('Network error')
      );

      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /retry/i })
        ).toBeInTheDocument();
      });

      // Reset mocks for successful retry
      mockDonationsService.getDonationsByMember.mockResolvedValueOnce(
        mockDonations
      );
      mockDonationsService.getMemberDonationSummary.mockResolvedValueOnce(
        mockSummaryData
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(mockDonationsService.getDonationsByMember).toHaveBeenCalledTimes(
          2
        );
        expect(
          screen.getByText('Donation History for John Doe')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Filtering and Sorting', () => {
    it('should render year filter dropdown', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by year/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('All Years')).toBeInTheDocument();
      });
    });

    it('should filter donations by selected year', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by year/i)).toBeInTheDocument();
      });

      const yearFilter = screen.getByLabelText(/filter by year/i);
      await user.selectOptions(yearFilter, '2025');

      await waitFor(() => {
        const table = screen.getByRole('table');
        const rows = within(table).getAllByRole('row');
        // Should show only 2025 donations (2 donations) plus header row
        expect(rows).toHaveLength(3);
        expect(within(table).getByText('Jan 15, 2025')).toBeInTheDocument();
        expect(within(table).getByText('Jan 8, 2025')).toBeInTheDocument();
        expect(
          within(table).queryByText('Dec 25, 2024')
        ).not.toBeInTheDocument();
      });
    });

    it('should sort donations by date descending by default', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        const table = screen.getByRole('table');
        const rows = within(table).getAllByRole('row');

        // First data row should be most recent donation
        expect(within(rows[1]).getByText('Jan 15, 2025')).toBeInTheDocument();
        expect(within(rows[2]).getByText('Jan 8, 2025')).toBeInTheDocument();
        expect(within(rows[3]).getByText('Dec 25, 2024')).toBeInTheDocument();
      });
    });

    it('should allow sorting by amount', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByRole('columnheader', { name: /amount/i })
        ).toBeInTheDocument();
      });

      const amountHeader = screen.getByRole('columnheader', {
        name: /amount/i,
      });
      await user.click(amountHeader);

      await waitFor(() => {
        const table = screen.getByRole('table');
        const rows = within(table).getAllByRole('row');

        // Should be sorted by amount descending
        expect(within(rows[1]).getByText('$1,000.00')).toBeInTheDocument();
        expect(within(rows[2]).getByText('$500.00')).toBeInTheDocument();
        expect(within(rows[3]).getByText('$250.00')).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should render export button for admin/pastor users', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /export to csv/i })
        ).toBeInTheDocument();
      });
    });

    it('should hide export button for member users', async () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: 'member' },
        isLoading: false,
      });

      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: /export to csv/i })
        ).not.toBeInTheDocument();
      });
    });

    it('should trigger CSV export when export button is clicked', async () => {
      const user = userEvent.setup();
      const mockDownload = vi.spyOn(document, 'createElement');

      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /export to csv/i })
        ).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', {
        name: /export to csv/i,
      });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockDownload).toHaveBeenCalledWith('a');
        expect(mockShowToast).toHaveBeenCalledWith(
          'Donation history exported successfully',
          'success'
        );
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should subscribe to donation updates on mount', () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      expect(mockDonationsService.subscribeToDonations).toHaveBeenCalledWith(
        expect.any(Function),
        { memberId: 'member-1' }
      );
    });

    it('should unsubscribe from updates on unmount', () => {
      const { unmount } = render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      unmount();

      expect(mockDonationsService.unsubscribeFromDonations).toHaveBeenCalled();
    });

    it('should update display when new donations are received', async () => {
      const subscriptionCallback = vi.fn();
      mockDonationsService.subscribeToDonations.mockImplementation(
        (callback) => {
          subscriptionCallback.mockImplementation(callback);
          return vi.fn(); // unsubscribe function
        }
      );

      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Initial count
      });

      // Simulate new donation received
      const newDonations = [
        ...mockDonations,
        {
          ...mockDonations[0],
          id: 'donation-4',
          amount: 100.0,
          donationDate: '2025-01-20',
        },
      ];

      subscriptionCallback(newDonations);

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument(); // Updated count
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toHaveAttribute(
          'aria-label',
          'Donation history table'
        );
        expect(
          screen.getByRole('region', { name: /donation summary/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('region', { name: /category breakdown/i })
        ).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /export to csv/i })
        ).toBeInTheDocument();
      });

      // Test tab navigation
      await user.tab();
      expect(screen.getByLabelText(/filter by year/i)).toHaveFocus();

      await user.tab();
      expect(
        screen.getByRole('button', { name: /export to csv/i })
      ).toHaveFocus();
    });

    it('should announce loading and error states to screen readers', () => {
      mockDonationsService.getDonationsByMember.mockImplementation(
        () => new Promise(() => {})
      );

      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
      expect(loadingElement).toHaveTextContent('Loading donation history...');
    });
  });

  describe('Service Integration', () => {
    it('should call getDonationsByMember with correct member ID', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockDonationsService.getDonationsByMember).toHaveBeenCalledWith(
          'member-1'
        );
      });
    });

    it('should call getMemberDonationSummary with correct parameters', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          mockDonationsService.getMemberDonationSummary
        ).toHaveBeenCalledWith('member-1');
      });
    });

    it('should handle service method rejections gracefully', async () => {
      mockDonationsService.getMemberDonationSummary.mockRejectedValueOnce(
        new Error('Summary error')
      );

      render(
        <TestWrapper>
          <MemberDonationHistory member={mockMember} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Error loading donation summary',
          'error'
        );
      });
    });
  });
});
