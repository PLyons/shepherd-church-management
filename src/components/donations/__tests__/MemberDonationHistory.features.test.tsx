// src/components/donations/__tests__/MemberDonationHistory.features.test.tsx
// Comprehensive feature tests for MemberDonationHistory component filtering and search functionality
// These tests define expected behavior for filtering, search, sorting, and pagination features

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { MemberDonationHistory } from '../MemberDonationHistory';
import { DonationsService } from '../../../services/firebase/donations.service';
import { DonationCategoriesService } from '../../../services/firebase/donation-categories.service';
import { AuthContext } from '../../../contexts/FirebaseAuthContext';
import { ToastContext } from '../../../contexts/ToastContext';

import type {
  Donation,
  DonationCategory,
  DonationMethod,
  DonationStatus,
} from '../../../types/donations';
import type { Member } from '../../../types';

// Mock the Firebase services
vi.mock('../../../services/firebase/donations.service');
vi.mock('../../../services/firebase/donation-categories.service');

const MockedDonationsService = DonationsService as unknown as Mock;
const MockedDonationCategoriesService =
  DonationCategoriesService as unknown as Mock;

// Test data generators
const createMockDonation = (overrides: Partial<Donation> = {}): Donation => ({
  id: `donation-${Date.now()}-${Math.random()}`,
  memberId: 'member-123',
  memberName: 'John Doe',
  amount: 100.0,
  donationDate: '2024-01-15T00:00:00.000Z',
  method: 'check' as DonationMethod,
  sourceLabel: 'Offering',
  note: 'Regular monthly donation',
  categoryId: 'category-1',
  categoryName: 'General Fund',
  form990Fields: {
    lineItem: '1a_cash_contributions',
    isQuidProQuo: false,
    isAnonymous: false,
    restrictionType: 'unrestricted',
  },
  receiptNumber: 'R-2024-001',
  isReceiptSent: false,
  isTaxDeductible: true,
  taxYear: 2024,
  createdAt: '2024-01-15T10:00:00.000Z',
  createdBy: 'admin-123',
  updatedAt: '2024-01-15T10:00:00.000Z',
  status: 'verified' as DonationStatus,
  ...overrides,
});

const createMockCategory = (
  overrides: Partial<DonationCategory> = {}
): DonationCategory => ({
  id: `category-${Date.now()}`,
  name: 'General Fund',
  description: 'General church operations',
  isActive: true,
  defaultForm990LineItem: '1a_cash_contributions',
  isTaxDeductible: true,
  currentYearTotal: 5000,
  lastYearTotal: 4500,
  totalAmount: 10000,
  donationCount: 50,
  averageDonation: 200,
  includeInReports: true,
  displayOrder: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  createdBy: 'admin-123',
  ...overrides,
});

// Generate large dataset for pagination testing
const generateLargeDonationDataset = (count: number): Donation[] => {
  const donations: Donation[] = [];
  const categories = [
    'General Fund',
    'Building Fund',
    'Missions',
    'Youth Ministry',
    'Music Ministry',
  ];
  const methods: DonationMethod[] = [
    'cash',
    'check',
    'credit_card',
    'bank_transfer',
    'online',
  ];

  for (let i = 0; i < count; i++) {
    const date = new Date(2024, 0, 1);
    date.setDate(date.getDate() + (i % 365)); // Spread across year

    donations.push(
      createMockDonation({
        id: `donation-${i}`,
        memberName: `Member ${i % 20}`, // 20 different members
        amount: Math.round((Math.random() * 500 + 25) * 100) / 100, // $25-$525
        donationDate: date.toISOString(),
        method: methods[i % methods.length],
        categoryName: categories[i % categories.length],
        categoryId: `category-${i % categories.length}`,
        note: `Donation ${i} - ${categories[i % categories.length]}`,
        receiptNumber: `R-2024-${String(i + 1).padStart(3, '0')}`,
      })
    );
  }

  return donations.sort(
    (a, b) =>
      new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime()
  );
};

// Mock context providers
const mockAuthContext = {
  user: { uid: 'test-user', role: 'member' } as Member,
  userRole: 'member' as const,
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
};

const mockToastContext = {
  showToast: vi.fn(),
  toasts: [],
  removeToast: vi.fn(),
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={mockAuthContext}>
    <ToastContext.Provider value={mockToastContext}>
      {children}
    </ToastContext.Provider>
  </AuthContext.Provider>
);

describe('MemberDonationHistory - Feature Tests', () => {
  let mockDonationsService: {
    getDonationsByMember: Mock;
    searchDonations: Mock;
  };

  let mockCategoriesService: {
    getActiveCategories: Mock;
  };

  const largeDonationDataset = generateLargeDonationDataset(75); // > 50 for pagination
  const mockCategories = [
    createMockCategory({ id: 'category-1', name: 'General Fund' }),
    createMockCategory({ id: 'category-2', name: 'Building Fund' }),
    createMockCategory({ id: 'category-3', name: 'Missions' }),
    createMockCategory({ id: 'category-4', name: 'Youth Ministry' }),
    createMockCategory({ id: 'category-5', name: 'Music Ministry' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup service mocks
    mockDonationsService = {
      getDonationsByMember: vi.fn(),
      searchDonations: vi.fn(),
    };

    mockCategoriesService = {
      getActiveCategories: vi.fn().mockResolvedValue(mockCategories),
    };

    MockedDonationsService.mockImplementation(() => mockDonationsService);
    MockedDonationCategoriesService.mockImplementation(
      () => mockCategoriesService
    );

    // Default service responses
    mockDonationsService.getDonationsByMember.mockResolvedValue(
      largeDonationDataset
    );
    mockDonationsService.searchDonations.mockResolvedValue(
      largeDonationDataset
    );
  });

  describe('Date Range Filtering Tests', () => {
    it('should filter by custom date range (start and end dates)', async () => {
      const user = userEvent.setup();
      const startDate = '2024-03-01';
      const endDate = '2024-03-31';

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // Open date range filter
      const dateFilterButton = screen.getByRole('button', {
        name: /date range/i,
      });
      await user.click(dateFilterButton);

      // Set custom date range
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);

      await user.clear(startDateInput);
      await user.type(startDateInput, startDate);

      await user.clear(endDateInput);
      await user.type(endDateInput, endDate);

      // Apply filter
      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);

      await waitFor(() => {
        expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: expect.stringContaining('2024-03-01'),
            endDate: expect.stringContaining('2024-03-31'),
          })
        );
      });
    });

    it('should handle preset date filters (YTD, last year, last 6 months)', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // Test YTD preset
      const dateFilterButton = screen.getByRole('button', {
        name: /date range/i,
      });
      await user.click(dateFilterButton);

      const ytdButton = screen.getByRole('button', { name: /year to date/i });
      await user.click(ytdButton);

      await waitFor(() => {
        expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: expect.stringContaining('2024-01-01'),
          })
        );
      });

      // Test Last 6 months preset
      await user.click(dateFilterButton);
      const last6MonthsButton = screen.getByRole('button', {
        name: /last 6 months/i,
      });
      await user.click(last6MonthsButton);

      await waitFor(() => {
        expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: expect.stringMatching(/2023-07/), // 6 months ago
          })
        );
      });
    });

    it('should validate date inputs and show error messages', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      const dateFilterButton = screen.getByRole('button', {
        name: /date range/i,
      });
      await user.click(dateFilterButton);

      // Test invalid date range (end before start)
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);

      await user.clear(startDateInput);
      await user.type(startDateInput, '2024-06-01');

      await user.clear(endDateInput);
      await user.type(endDateInput, '2024-05-01');

      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);

      await waitFor(() => {
        expect(
          screen.getByText(/end date must be after start date/i)
        ).toBeInTheDocument();
      });
    });

    it('should clear date filters and reset to show all donations', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // Apply a date filter first
      const dateFilterButton = screen.getByRole('button', {
        name: /date range/i,
      });
      await user.click(dateFilterButton);

      const ytdButton = screen.getByRole('button', { name: /year to date/i });
      await user.click(ytdButton);

      // Clear filter
      const clearButton = screen.getByRole('button', {
        name: /clear filters/i,
      });
      await user.click(clearButton);

      await waitFor(() => {
        expect(mockDonationsService.getDonationsByMember).toHaveBeenCalledWith(
          'member-123'
        );
      });
    });
  });

  describe('Category Filtering Tests', () => {
    it('should filter by single donation category', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // Open category filter
      const categoryFilterButton = screen.getByRole('button', {
        name: /category/i,
      });
      await user.click(categoryFilterButton);

      // Select General Fund
      const generalFundOption = screen.getByRole('option', {
        name: /general fund/i,
      });
      await user.click(generalFundOption);

      await waitFor(() => {
        expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            categoryIds: ['category-1'],
          })
        );
      });
    });

    it('should handle multiple category selection', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // Open category filter
      const categoryFilterButton = screen.getByRole('button', {
        name: /category/i,
      });
      await user.click(categoryFilterButton);

      // Select multiple categories
      const generalFundOption = screen.getByRole('option', {
        name: /general fund/i,
      });
      const buildingFundOption = screen.getByRole('option', {
        name: /building fund/i,
      });

      await user.click(generalFundOption);
      await user.click(buildingFundOption);

      await waitFor(() => {
        expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            categoryIds: expect.arrayContaining(['category-1', 'category-2']),
          })
        );
      });
    });

    it('should handle "All Categories" option to clear category filters', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // First select a specific category
      const categoryFilterButton = screen.getByRole('button', {
        name: /category/i,
      });
      await user.click(categoryFilterButton);

      const generalFundOption = screen.getByRole('option', {
        name: /general fund/i,
      });
      await user.click(generalFundOption);

      // Then select "All Categories"
      await user.click(categoryFilterButton);
      const allCategoriesOption = screen.getByRole('option', {
        name: /all categories/i,
      });
      await user.click(allCategoriesOption);

      await waitFor(() => {
        expect(mockDonationsService.getDonationsByMember).toHaveBeenCalledWith(
          'member-123'
        );
      });
    });

    it('should show empty state when category filter returns no results', async () => {
      const user = userEvent.setup();

      // Mock empty result for specific category
      mockDonationsService.searchDonations.mockResolvedValueOnce([]);

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      const categoryFilterButton = screen.getByRole('button', {
        name: /category/i,
      });
      await user.click(categoryFilterButton);

      const missionsOption = screen.getByRole('option', { name: /missions/i });
      await user.click(missionsOption);

      await waitFor(() => {
        expect(screen.getByText(/no donations found/i)).toBeInTheDocument();
        expect(
          screen.getByText(/try adjusting your filters/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Payment Method Filtering Tests', () => {
    it('should filter by single payment method', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // Open payment method filter
      const methodFilterButton = screen.getByRole('button', {
        name: /payment method/i,
      });
      await user.click(methodFilterButton);

      // Select check method
      const checkOption = screen.getByRole('option', { name: /check/i });
      await user.click(checkOption);

      await waitFor(() => {
        expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            methods: ['check'],
          })
        );
      });
    });

    it('should handle multiple payment method selection', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      const methodFilterButton = screen.getByRole('button', {
        name: /payment method/i,
      });
      await user.click(methodFilterButton);

      // Select multiple methods
      const checkOption = screen.getByRole('option', { name: /check/i });
      const cashOption = screen.getByRole('option', { name: /cash/i });
      const creditCardOption = screen.getByRole('option', {
        name: /credit card/i,
      });

      await user.click(checkOption);
      await user.click(cashOption);
      await user.click(creditCardOption);

      await waitFor(() => {
        expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            methods: expect.arrayContaining(['check', 'cash', 'credit_card']),
          })
        );
      });
    });

    it('should combine category and payment method filters', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // Select category
      const categoryFilterButton = screen.getByRole('button', {
        name: /category/i,
      });
      await user.click(categoryFilterButton);

      const generalFundOption = screen.getByRole('option', {
        name: /general fund/i,
      });
      await user.click(generalFundOption);

      // Select payment method
      const methodFilterButton = screen.getByRole('button', {
        name: /payment method/i,
      });
      await user.click(methodFilterButton);

      const checkOption = screen.getByRole('option', { name: /check/i });
      await user.click(checkOption);

      await waitFor(() => {
        expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            categoryIds: ['category-1'],
            methods: ['check'],
          })
        );
      });
    });

    it('should persist filter state across component updates', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // Apply filters
      const categoryFilterButton = screen.getByRole('button', {
        name: /category/i,
      });
      await user.click(categoryFilterButton);

      const generalFundOption = screen.getByRole('option', {
        name: /general fund/i,
      });
      await user.click(generalFundOption);

      // Rerender component
      rerender(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      // Filters should be maintained
      await waitFor(() => {
        expect(screen.getByDisplayValue(/general fund/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality Tests', () => {
    it('should search by donation description/note', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search donations/i);
      await user.type(searchInput, 'monthly donation');

      // Debounced search should trigger
      await waitFor(
        () => {
          expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
            expect.objectContaining({
              searchTerm: 'monthly donation',
            })
          );
        },
        { timeout: 1000 }
      );
    });

    it('should search by receipt number', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search donations/i);
      await user.type(searchInput, 'R-2024-001');

      await waitFor(
        () => {
          expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
            expect.objectContaining({
              searchTerm: 'R-2024-001',
            })
          );
        },
        { timeout: 1000 }
      );
    });

    it('should handle partial text matching with case-insensitive search', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search donations/i);
      await user.type(searchInput, 'GENERAL'); // Uppercase

      await waitFor(
        () => {
          expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
            expect.objectContaining({
              searchTerm: 'GENERAL',
            })
          );
        },
        { timeout: 1000 }
      );
    });

    it('should handle search with special characters', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search donations/i);
      await user.type(searchInput, '$100 & special');

      await waitFor(
        () => {
          expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
            expect.objectContaining({
              searchTerm: '$100 & special',
            })
          );
        },
        { timeout: 1000 }
      );
    });

    it('should clear search when input is emptied', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search donations/i);

      // Type search term
      await user.type(searchInput, 'test search');

      // Clear search
      await user.clear(searchInput);

      await waitFor(
        () => {
          expect(
            mockDonationsService.getDonationsByMember
          ).toHaveBeenCalledWith('member-123');
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Sorting Tests', () => {
    it('should sort by date (newest first by default)', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // Verify default sort order (newest first)
      const donationRows = screen.getAllByRole('row');
      expect(donationRows.length).toBeGreaterThan(1);

      // First donation should be most recent
      const firstDonationDate = within(donationRows[1]).getByText(/2024/);
      expect(firstDonationDate).toBeInTheDocument();
    });

    it('should sort by date (oldest first when clicked)', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // Click on date column header
      const dateHeader = screen.getByRole('columnheader', { name: /date/i });
      await user.click(dateHeader);

      // Should trigger resort with oldest first
      await waitFor(() => {
        expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'donationDate',
            sortDirection: 'asc',
          })
        );
      });
    });

    it('should sort by amount (highest first, then lowest)', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // Click on amount column header
      const amountHeader = screen.getByRole('columnheader', {
        name: /amount/i,
      });
      await user.click(amountHeader);

      await waitFor(() => {
        expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'amount',
            sortDirection: 'desc',
          })
        );
      });

      // Click again for ascending
      await user.click(amountHeader);

      await waitFor(() => {
        expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'amount',
            sortDirection: 'asc',
          })
        );
      });
    });

    it('should sort by category alphabetically', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      const categoryHeader = screen.getByRole('columnheader', {
        name: /category/i,
      });
      await user.click(categoryHeader);

      await waitFor(() => {
        expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'categoryName',
            sortDirection: 'asc',
          })
        );
      });
    });

    it('should persist sort state across filter changes', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // Set sort order
      const amountHeader = screen.getByRole('columnheader', {
        name: /amount/i,
      });
      await user.click(amountHeader);

      // Apply a filter
      const categoryFilterButton = screen.getByRole('button', {
        name: /category/i,
      });
      await user.click(categoryFilterButton);

      const generalFundOption = screen.getByRole('option', {
        name: /general fund/i,
      });
      await user.click(generalFundOption);

      // Sort should be maintained with filter
      await waitFor(() => {
        expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            categoryIds: ['category-1'],
            sortBy: 'amount',
            sortDirection: 'desc',
          })
        );
      });
    });
  });

  describe('Pagination Tests', () => {
    it('should paginate large datasets (>50 records)', async () => {
      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // Should show pagination controls
      expect(screen.getByText(/page 1 of/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /next page/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /previous page/i })
      ).toBeDisabled();
    });

    it('should navigate to next/previous pages', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // Click next page
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/page 2 of/i)).toBeInTheDocument();
      });

      // Previous button should now be enabled
      const prevButton = screen.getByRole('button', { name: /previous page/i });
      expect(prevButton).not.toBeDisabled();
    });

    it('should handle page size options', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // Change page size
      const pageSizeSelect = screen.getByLabelText(/items per page/i);
      await user.selectOptions(pageSizeSelect, '25');

      await waitFor(() => {
        expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 25,
            offset: 0,
          })
        );
      });
    });

    it('should reset to page 1 when filters are applied', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // Navigate to page 2
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/page 2 of/i)).toBeInTheDocument();
      });

      // Apply a filter
      const categoryFilterButton = screen.getByRole('button', {
        name: /category/i,
      });
      await user.click(categoryFilterButton);

      const generalFundOption = screen.getByRole('option', {
        name: /general fund/i,
      });
      await user.click(generalFundOption);

      // Should reset to page 1
      await waitFor(() => {
        expect(screen.getByText(/page 1 of/i)).toBeInTheDocument();
      });
    });

    it('should maintain filters when navigating between pages', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      // Apply filter
      const categoryFilterButton = screen.getByRole('button', {
        name: /category/i,
      });
      await user.click(categoryFilterButton);

      const generalFundOption = screen.getByRole('option', {
        name: /general fund/i,
      });
      await user.click(generalFundOption);

      // Navigate to page 2
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      // Filter should be maintained
      await waitFor(() => {
        expect(mockDonationsService.searchDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            categoryIds: ['category-1'],
            limit: expect.any(Number),
            offset: expect.any(Number),
          })
        );
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should debounce search input to prevent excessive API calls', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/donation history/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search donations/i);

      // Type rapidly
      await user.type(searchInput, 'test');

      // Should only call search once after debounce period
      await waitFor(
        () => {
          expect(mockDonationsService.searchDonations).toHaveBeenCalledTimes(1);
        },
        { timeout: 1000 }
      );
    });

    it('should handle empty dataset gracefully', async () => {
      mockDonationsService.getDonationsByMember.mockResolvedValueOnce([]);

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/no donations found/i)).toBeInTheDocument();
        expect(
          screen.getByText(/you haven't made any donations yet/i)
        ).toBeInTheDocument();
      });
    });

    it('should show loading state during data fetch', async () => {
      // Mock delayed response
      mockDonationsService.getDonationsByMember.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 1000))
      );

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/loading donations/i)).toBeInTheDocument();
    });

    it('should handle service errors gracefully', async () => {
      mockDonationsService.getDonationsByMember.mockRejectedValueOnce(
        new Error('Service unavailable')
      );

      render(
        <TestWrapper>
          <MemberDonationHistory memberId="member-123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/error loading donations/i)
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /try again/i })
        ).toBeInTheDocument();
      });
    });
  });
});
