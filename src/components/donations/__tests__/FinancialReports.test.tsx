// src/components/donations/__tests__/FinancialReports.test.tsx
// Comprehensive test suite for FinancialReports component following TDD RED phase principles
// Tests written BEFORE implementation to define expected behavior and achieve 90%+ component coverage
// RELEVANT FILES: src/components/donations/FinancialReports.tsx, src/services/firebase/donations.service.ts, src/types/donations.ts

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { FinancialReports } from '../FinancialReports';
import { donationsService, donationCategoriesService } from '../../../services/firebase';
import { useAuth } from '../../../contexts/FirebaseAuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { 
  Donation, 
  DonationMethod, 
  DonationStatus, 
  Form990LineItem, 
  DonationCategory,
  FinancialSummary 
} from '../../../types/donations';

// Mock the services and contexts
vi.mock('../../../services/firebase', () => ({
  donationsService: {
    getAllDonations: vi.fn(),
    getDonationsByDateRange: vi.fn(),
    getFinancialSummary: vi.fn(),
    exportDonationsToCSV: vi.fn(),
  },
  donationCategoriesService: {
    getCategories: vi.fn(),
  },
}));

vi.mock('../../../contexts/FirebaseAuthContext');
vi.mock('../../../contexts/ToastContext');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock Chart.js components
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Line Chart
    </div>
  ),
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Bar Chart
    </div>
  ),
  Doughnut: ({ data, options }: any) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Doughnut Chart
    </div>
  ),
}));

const mockDonationsService = donationsService as unknown as {
  getAllDonations: Mock;
  getDonationsByDateRange: Mock;
  getFinancialSummary: Mock;
  exportDonationsToCSV: Mock;
};

const mockDonationCategoriesService = donationCategoriesService as unknown as {
  getCategories: Mock;
};

const mockUseAuth = useAuth as Mock;
const mockUseToast = useToast as Mock;

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('FinancialReports', () => {
  const mockAdminUser = {
    uid: 'admin-user-id',
    email: 'admin@test.com',
    displayName: 'Test Admin',
    role: 'admin',
  };

  const mockPastorUser = {
    uid: 'pastor-user-id',
    email: 'pastor@test.com',
    displayName: 'Test Pastor',
    role: 'pastor',
  };

  const mockShowToast = vi.fn();

  const mockCategories: DonationCategory[] = [
    {
      id: 'category-1',
      name: 'Tithe',
      description: 'Regular tithes',
      isActive: true,
      defaultForm990LineItem: '1a_cash_contributions' as Form990LineItem,
      isTaxDeductible: true,
      annualGoal: 50000,
      currentYearTotal: 25000,
      lastYearTotal: 48000,
      totalAmount: 73000,
      donationCount: 150,
      lastDonationDate: '2025-01-15',
      averageDonation: 486.67,
      includeInReports: true,
      reportingCategory: 'Operations',
      displayOrder: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2025-01-15T12:00:00Z',
      createdBy: 'admin-user-id',
    },
    {
      id: 'category-2',
      name: 'Building Fund',
      description: 'Building and facility improvements',
      isActive: true,
      defaultForm990LineItem: '1a_cash_contributions' as Form990LineItem,
      isTaxDeductible: true,
      annualGoal: 20000,
      currentYearTotal: 15000,
      lastYearTotal: 18500,
      totalAmount: 33500,
      donationCount: 45,
      lastDonationDate: '2025-01-10',
      averageDonation: 744.44,
      includeInReports: true,
      reportingCategory: 'Capital',
      displayOrder: 2,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2025-01-10T10:00:00Z',
      createdBy: 'admin-user-id',
    },
    {
      id: 'category-3',
      name: 'Special Missions',
      description: 'Mission trips and outreach',
      isActive: true,
      defaultForm990LineItem: '2_program_service_revenue' as Form990LineItem,
      isTaxDeductible: false,
      currentYearTotal: 8000,
      lastYearTotal: 12000,
      totalAmount: 20000,
      donationCount: 25,
      lastDonationDate: '2025-01-05',
      averageDonation: 800.00,
      includeInReports: true,
      reportingCategory: 'Programs',
      displayOrder: 3,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2025-01-05T15:00:00Z',
      createdBy: 'admin-user-id',
    },
  ];

  const mockDonations: Donation[] = [
    {
      id: 'donation-1',
      memberId: 'member-1',
      memberName: 'John Smith',
      amount: 500.00,
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
      memberId: 'member-2',
      memberName: 'Jane Doe',
      amount: 1000.00,
      donationDate: '2025-01-10',
      method: 'online' as DonationMethod,
      categoryId: 'category-2',
      categoryName: 'Building Fund',
      form990Fields: {
        lineItem: '1a_cash_contributions' as Form990LineItem,
        isQuidProQuo: false,
        isAnonymous: false,
      },
      isReceiptSent: true,
      receiptSentAt: '2025-01-11T09:00:00Z',
      isTaxDeductible: true,
      taxYear: 2025,
      status: 'verified' as DonationStatus,
      createdAt: '2025-01-10T14:00:00Z',
      createdBy: 'admin-user-id',
      updatedAt: '2025-01-10T14:00:00Z',
      receiptNumber: 'REC-2025-002',
    },
    {
      id: 'donation-3',
      memberId: 'member-3',
      memberName: 'Bob Johnson',
      amount: 250.00,
      donationDate: '2025-01-05',
      method: 'cash' as DonationMethod,
      categoryId: 'category-1',
      categoryName: 'Tithe',
      form990Fields: {
        lineItem: '1a_cash_contributions' as Form990LineItem,
        isQuidProQuo: false,
        isAnonymous: false,
      },
      isReceiptSent: false,
      isTaxDeductible: true,
      taxYear: 2025,
      status: 'verified' as DonationStatus,
      createdAt: '2025-01-05T11:00:00Z',
      createdBy: 'admin-user-id',
      updatedAt: '2025-01-05T11:00:00Z',
    },
    {
      id: 'donation-4',
      amount: 750.00,
      donationDate: '2024-12-25',
      method: 'credit_card' as DonationMethod,
      categoryId: 'category-3',
      categoryName: 'Special Missions',
      form990Fields: {
        lineItem: '2_program_service_revenue' as Form990LineItem,
        isQuidProQuo: false,
        isAnonymous: true,
      },
      isReceiptSent: true,
      receiptSentAt: '2024-12-26T10:00:00Z',
      isTaxDeductible: false,
      taxYear: 2024,
      status: 'verified' as DonationStatus,
      createdAt: '2024-12-25T16:00:00Z',
      createdBy: 'admin-user-id',
      updatedAt: '2024-12-25T16:00:00Z',
      receiptNumber: 'REC-2024-150',
    },
  ];

  const mockFinancialSummary: FinancialSummary = {
    totalDonations: 2500.00,
    donationCount: 4,
    averageDonation: 625.00,
    periodStart: '2024-01-01',
    periodEnd: '2025-01-15',
    
    byMethod: {
      check: { amount: 500.00, count: 1, percentage: 20.00 },
      online: { amount: 1000.00, count: 1, percentage: 40.00 },
      cash: { amount: 250.00, count: 1, percentage: 10.00 },
      credit_card: { amount: 750.00, count: 1, percentage: 30.00 },
      debit_card: { amount: 0, count: 0, percentage: 0 },
      bank_transfer: { amount: 0, count: 0, percentage: 0 },
      stock: { amount: 0, count: 0, percentage: 0 },
      cryptocurrency: { amount: 0, count: 0, percentage: 0 },
      in_kind: { amount: 0, count: 0, percentage: 0 },
      other: { amount: 0, count: 0, percentage: 0 },
    },
    
    byCategory: {
      'category-1': {
        categoryName: 'Tithe',
        amount: 750.00,
        count: 2,
        percentage: 30.00,
        goalProgress: 50.00,
      },
      'category-2': {
        categoryName: 'Building Fund',
        amount: 1000.00,
        count: 1,
        percentage: 40.00,
        goalProgress: 75.00,
      },
      'category-3': {
        categoryName: 'Special Missions',
        amount: 750.00,
        count: 1,
        percentage: 30.00,
      },
    },
    
    form990Breakdown: {
      '1a_cash_contributions': { amount: 1750.00, count: 3, percentage: 70.00 },
      '2_program_service_revenue': { amount: 750.00, count: 1, percentage: 30.00 },
      '1b_noncash_contributions': { amount: 0, count: 0, percentage: 0 },
      '1c_contributions_reported_990': { amount: 0, count: 0, percentage: 0 },
      '1d_related_organizations': { amount: 0, count: 0, percentage: 0 },
      '1e_government_grants': { amount: 0, count: 0, percentage: 0 },
      '1f_other_contributions': { amount: 0, count: 0, percentage: 0 },
      '3_investment_income': { amount: 0, count: 0, percentage: 0 },
      '4_other_revenue': { amount: 0, count: 0, percentage: 0 },
      'not_applicable': { amount: 0, count: 0, percentage: 0 },
    },
    
    topDonorRanges: [
      { range: '$1000-$2499', count: 1, totalAmount: 1000.00 },
      { range: '$500-$999', count: 1, totalAmount: 500.00 },
      { range: '$250-$499', count: 1, totalAmount: 250.00 },
      { range: '$100-$249', count: 0, totalAmount: 0 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isLoading: false,
    });
    
    mockUseToast.mockReturnValue({
      showToast: mockShowToast,
    });

    mockDonationsService.getAllDonations.mockResolvedValue(mockDonations);
    mockDonationsService.getDonationsByDateRange.mockResolvedValue(mockDonations);
    mockDonationsService.getFinancialSummary.mockResolvedValue(mockFinancialSummary);
    mockDonationCategoriesService.getCategories.mockResolvedValue(mockCategories);
  });

  describe('Component Rendering Tests', () => {
    it('should render without crashing', () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      expect(screen.getByTestId('financial-reports-dashboard')).toBeInTheDocument();
    });

    it('should show dashboard title and description', () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      expect(screen.getByText('Financial Reports Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive donation tracking and financial analytics')).toBeInTheDocument();
    });

    it('should render KPI cards with correct data', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Total Donations')).toBeInTheDocument();
        expect(screen.getByText('$2,500.00')).toBeInTheDocument();
        expect(screen.getByText('Total Count')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('Average Donation')).toBeInTheDocument();
        expect(screen.getByText('$625.00')).toBeInTheDocument();
      });
    });

    it('should render chart components', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
      });
    });

    it('should show loading states properly', () => {
      mockDonationsService.getFinancialSummary.mockImplementation(() => new Promise(() => {}));
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-spinner') || screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading financial data...')).toBeInTheDocument();
    });

    it('should handle empty data gracefully', async () => {
      mockDonationsService.getFinancialSummary.mockResolvedValueOnce({
        ...mockFinancialSummary,
        totalDonations: 0,
        donationCount: 0,
        byCategory: {},
        byMethod: {},
      });

      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No financial data available')).toBeInTheDocument();
        expect(screen.getByText('No donations found for the selected period.')).toBeInTheDocument();
      });
    });

    it('should display error states appropriately', async () => {
      mockDonationsService.getFinancialSummary.mockRejectedValueOnce(new Error('Network error'));
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Error loading financial data')).toBeInTheDocument();
        expect(screen.getByText('Failed to load financial reports. Please try again.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should render export controls for authorized users', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export report/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument();
      });
    });

    it('should hide sensitive controls for pastor users', async () => {
      mockUseAuth.mockReturnValue({
        user: mockPastorUser,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /export individual donations/i })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /export summary/i })).toBeInTheDocument();
      });
    });

    it('should display year-to-date summary section', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Year-to-Date Summary')).toBeInTheDocument();
        expect(screen.getByText('2025 Total:')).toBeInTheDocument();
        expect(screen.getByText('Growth vs 2024:')).toBeInTheDocument();
      });
    });
  });

  describe('KPI Calculations Tests', () => {
    it('should calculate total donations correctly', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        const totalCard = screen.getByTestId('total-donations-kpi');
        expect(within(totalCard).getByText('$2,500.00')).toBeInTheDocument();
      });
    });

    it('should compute average donation amount', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        const avgCard = screen.getByTestId('average-donation-kpi');
        expect(within(avgCard).getByText('$625.00')).toBeInTheDocument();
      });
    });

    it('should count unique donors accurately', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        const donorsCard = screen.getByTestId('unique-donors-kpi');
        expect(within(donorsCard).getByText('3')).toBeInTheDocument(); // 3 unique members + 1 anonymous
        expect(within(donorsCard).getByText('Unique Donors')).toBeInTheDocument();
      });
    });

    it('should calculate year-to-date totals', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        const ytdSection = screen.getByTestId('ytd-summary');
        expect(within(ytdSection).getByText('$1,750.00')).toBeInTheDocument(); // 2025 donations only
      });
    });

    it('should show month-over-month growth', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        const growthIndicator = screen.getByTestId('growth-indicator');
        expect(within(growthIndicator).getByText(/growth/i)).toBeInTheDocument();
      });
    });

    it('should display donation frequency metrics', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Donation Frequency')).toBeInTheDocument();
        expect(screen.getByText('1.33 per donor')).toBeInTheDocument(); // 4 donations / 3 donors
      });
    });

    it('should handle edge cases (no data, single donation)', async () => {
      mockDonationsService.getFinancialSummary.mockResolvedValueOnce({
        totalDonations: 100.00,
        donationCount: 1,
        averageDonation: 100.00,
        periodStart: '2025-01-01',
        periodEnd: '2025-01-15',
        byCategory: {
          'category-1': {
            categoryName: 'Tithe',
            amount: 100.00,
            count: 1,
            percentage: 100.00,
          },
        },
        byMethod: {
          cash: { amount: 100.00, count: 1, percentage: 100.00 },
          check: { amount: 0, count: 0, percentage: 0 },
          online: { amount: 0, count: 0, percentage: 0 },
          credit_card: { amount: 0, count: 0, percentage: 0 },
          debit_card: { amount: 0, count: 0, percentage: 0 },
          bank_transfer: { amount: 0, count: 0, percentage: 0 },
          stock: { amount: 0, count: 0, percentage: 0 },
          cryptocurrency: { amount: 0, count: 0, percentage: 0 },
          in_kind: { amount: 0, count: 0, percentage: 0 },
          other: { amount: 0, count: 0, percentage: 0 },
        },
        form990Breakdown: {
          '1a_cash_contributions': { amount: 100.00, count: 1, percentage: 100.00 },
          '1b_noncash_contributions': { amount: 0, count: 0, percentage: 0 },
          '1c_contributions_reported_990': { amount: 0, count: 0, percentage: 0 },
          '1d_related_organizations': { amount: 0, count: 0, percentage: 0 },
          '1e_government_grants': { amount: 0, count: 0, percentage: 0 },
          '1f_other_contributions': { amount: 0, count: 0, percentage: 0 },
          '2_program_service_revenue': { amount: 0, count: 0, percentage: 0 },
          '3_investment_income': { amount: 0, count: 0, percentage: 0 },
          '4_other_revenue': { amount: 0, count: 0, percentage: 0 },
          'not_applicable': { amount: 0, count: 0, percentage: 0 },
        },
        topDonorRanges: [
          { range: '$100-$249', count: 1, totalAmount: 100.00 },
        ],
      });

      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('$100.00')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('should format currency values properly', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check that all currency values are formatted correctly
        expect(screen.getByText('$2,500.00')).toBeInTheDocument();
        expect(screen.getByText('$625.00')).toBeInTheDocument();
        expect(screen.getByText('$1,000.00')).toBeInTheDocument();
        expect(screen.getByText('$750.00')).toBeInTheDocument();
      });
    });

    it('should calculate percentages correctly', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        const categoryBreakdown = screen.getByTestId('category-breakdown');
        expect(within(categoryBreakdown).getByText('40.0%')).toBeInTheDocument(); // Building Fund
        expect(within(categoryBreakdown).getByText('30.0%')).toBeInTheDocument(); // Tithe and Special Missions
      });
    });
  });

  describe('Chart Data Processing Tests', () => {
    it('should process donation trends by month', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        const lineChart = screen.getByTestId('line-chart');
        const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '{}');
        
        expect(chartData.labels).toContain('January 2025');
        expect(chartData.labels).toContain('December 2024');
        expect(chartData.datasets[0].data).toHaveLength(chartData.labels.length);
      });
    });

    it('should calculate category breakdowns', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        const doughnutChart = screen.getByTestId('doughnut-chart');
        const chartData = JSON.parse(doughnutChart.getAttribute('data-chart-data') || '{}');
        
        expect(chartData.labels).toContain('Tithe');
        expect(chartData.labels).toContain('Building Fund');
        expect(chartData.labels).toContain('Special Missions');
        expect(chartData.datasets[0].data).toEqual([750, 1000, 750]);
      });
    });

    it('should format data for Recharts components', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        const barChart = screen.getByTestId('bar-chart');
        const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '{}');
        
        expect(chartData).toHaveProperty('labels');
        expect(chartData).toHaveProperty('datasets');
        expect(chartData.datasets[0]).toHaveProperty('data');
        expect(chartData.datasets[0]).toHaveProperty('backgroundColor');
      });
    });

    it('should handle missing data points', async () => {
      const incompleteData = {
        ...mockFinancialSummary,
        byCategory: {
          'category-1': {
            categoryName: 'Tithe',
            amount: 500.00,
            count: 1,
            percentage: 100.00,
          },
        },
      };

      mockDonationsService.getFinancialSummary.mockResolvedValueOnce(incompleteData);

      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        const doughnutChart = screen.getByTestId('doughnut-chart');
        const chartData = JSON.parse(doughnutChart.getAttribute('data-chart-data') || '{}');
        
        expect(chartData.labels).toEqual(['Tithe']);
        expect(chartData.datasets[0].data).toEqual([500]);
      });
    });

    it('should sort categories by amount', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        const categoryList = screen.getByTestId('category-ranking');
        const categoryItems = within(categoryList).getAllByTestId('category-item');
        
        // Should be sorted by amount descending
        expect(within(categoryItems[0]).getByText('Building Fund')).toBeInTheDocument();
        expect(within(categoryItems[1]).getByText('Tithe')).toBeInTheDocument();
        expect(within(categoryItems[2]).getByText('Special Missions')).toBeInTheDocument();
      });
    });

    it('should limit chart data for performance', async () => {
      // Mock large dataset
      const largeCategories = Array.from({ length: 20 }, (_, i) => ({
        [`category-${i}`]: {
          categoryName: `Category ${i}`,
          amount: Math.random() * 1000,
          count: Math.floor(Math.random() * 10) + 1,
          percentage: Math.random() * 100,
        },
      })).reduce((acc, item) => ({ ...acc, ...item }), {});

      mockDonationsService.getFinancialSummary.mockResolvedValueOnce({
        ...mockFinancialSummary,
        byCategory: largeCategories,
      });

      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        const doughnutChart = screen.getByTestId('doughnut-chart');
        const chartData = JSON.parse(doughnutChart.getAttribute('data-chart-data') || '{}');
        
        // Should limit to top 10 categories
        expect(chartData.labels.length).toBeLessThanOrEqual(10);
      });
    });

    it('should calculate year-over-year comparisons', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        const comparisonChart = screen.getByTestId('comparison-chart');
        expect(comparisonChart).toBeInTheDocument();
        
        const chartData = JSON.parse(comparisonChart.getAttribute('data-chart-data') || '{}');
        expect(chartData.datasets).toHaveLength(2); // Current year and previous year
        expect(chartData.datasets[0].label).toContain('2025');
        expect(chartData.datasets[1].label).toContain('2024');
      });
    });

    it('should process donor engagement metrics', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        const engagementSection = screen.getByTestId('donor-engagement');
        expect(within(engagementSection).getByText('Donor Engagement')).toBeInTheDocument();
        expect(within(engagementSection).getByText('Active Donors: 3')).toBeInTheDocument();
        expect(within(engagementSection).getByText('Retention Rate: 75%')).toBeInTheDocument();
      });
    });

    it('should handle date range filtering', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
      });

      const startDate = screen.getByLabelText(/start date/i);
      const endDate = screen.getByLabelText(/end date/i);

      await user.clear(startDate);
      await user.type(startDate, '2025-01-01');
      await user.clear(endDate);
      await user.type(endDate, '2025-01-15');

      await waitFor(() => {
        expect(mockDonationsService.getDonationsByDateRange).toHaveBeenCalledWith('2025-01-01', '2025-01-15');
      });
    });
  });

  describe('Data Filtering Tests', () => {
    it('should filter by date range', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('date-range-filter')).toBeInTheDocument();
      });

      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const applyButton = screen.getByRole('button', { name: /apply filter/i });

      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-01-01');
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-01-31');
      await user.click(applyButton);

      await waitFor(() => {
        expect(mockDonationsService.getDonationsByDateRange).toHaveBeenCalledWith('2025-01-01', '2025-01-31');
      });
    });

    it('should filter by categories', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('category-filter')).toBeInTheDocument();
      });

      const categorySelect = screen.getByLabelText(/select categories/i);
      await user.click(categorySelect);

      const titheOption = screen.getByRole('option', { name: 'Tithe' });
      await user.click(titheOption);

      const applyButton = screen.getByRole('button', { name: /apply filter/i });
      await user.click(applyButton);

      await waitFor(() => {
        const categoryBreakdown = screen.getByTestId('category-breakdown');
        expect(within(categoryBreakdown).getByText('Tithe')).toBeInTheDocument();
        expect(within(categoryBreakdown).queryByText('Building Fund')).not.toBeInTheDocument();
      });
    });

    it('should combine multiple filters', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('filters-section')).toBeInTheDocument();
      });

      // Apply date filter
      const startDate = screen.getByLabelText(/start date/i);
      const endDate = screen.getByLabelText(/end date/i);
      await user.clear(startDate);
      await user.type(startDate, '2025-01-01');
      await user.clear(endDate);
      await user.type(endDate, '2025-01-31');

      // Apply category filter
      const categorySelect = screen.getByLabelText(/select categories/i);
      await user.click(categorySelect);
      const titheOption = screen.getByRole('option', { name: 'Tithe' });
      await user.click(titheOption);

      const applyButton = screen.getByRole('button', { name: /apply filters/i });
      await user.click(applyButton);

      await waitFor(() => {
        expect(mockDonationsService.getDonationsByDateRange).toHaveBeenCalledWith(
          '2025-01-01', 
          '2025-01-31',
          { categoryIds: ['category-1'] }
        );
      });
    });

    it('should reset filters properly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reset filters/i })).toBeInTheDocument();
      });

      const resetButton = screen.getByRole('button', { name: /reset filters/i });
      await user.click(resetButton);

      await waitFor(() => {
        expect(mockDonationsService.getFinancialSummary).toHaveBeenCalledWith();
        expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Date inputs should be cleared
      });
    });

    it('should maintain filter state', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      const startDate = screen.getByLabelText(/start date/i);
      await user.clear(startDate);
      await user.type(startDate, '2025-01-01');

      // Simulate component re-render
      const { rerender } = render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('2025-01-01')).toBeInTheDocument();
      });
    });

    it('should validate filter inputs', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      const startDate = screen.getByLabelText(/start date/i);
      const endDate = screen.getByLabelText(/end date/i);

      // Set end date before start date
      await user.clear(startDate);
      await user.type(startDate, '2025-01-31');
      await user.clear(endDate);
      await user.type(endDate, '2025-01-01');

      const applyButton = screen.getByRole('button', { name: /apply filter/i });
      await user.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
        expect(mockShowToast).toHaveBeenCalledWith(
          'Invalid date range. End date must be after start date.',
          'error'
        );
      });
    });

    it('should handle invalid date ranges', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      const startDate = screen.getByLabelText(/start date/i);
      await user.clear(startDate);
      await user.type(startDate, 'invalid-date');

      const applyButton = screen.getByRole('button', { name: /apply filter/i });
      await user.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid date')).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should render export buttons for admin users', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export report/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument();
      });
    });

    it('should limit export options for pastor users', async () => {
      mockUseAuth.mockReturnValue({
        user: mockPastorUser,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export summary/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /export detailed/i })).not.toBeInTheDocument();
      });
    });

    it('should trigger CSV export with correct data', async () => {
      const user = userEvent.setup();
      mockDonationsService.exportDonationsToCSV.mockResolvedValue('csv,data,here');
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /download csv/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockDonationsService.exportDonationsToCSV).toHaveBeenCalledWith({
          startDate: expect.any(String),
          endDate: expect.any(String),
          includeMemberInfo: true,
        });
        expect(mockShowToast).toHaveBeenCalledWith('Report exported successfully', 'success');
      });
    });

    it('should handle export errors gracefully', async () => {
      const user = userEvent.setup();
      mockDonationsService.exportDonationsToCSV.mockRejectedValueOnce(new Error('Export failed'));
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /download csv/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to export report', 'error');
      });
    });

    it('should show export progress indicator', async () => {
      const user = userEvent.setup();
      mockDonationsService.exportDonationsToCSV.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('csv,data'), 2000))
      );
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      const exportButton = screen.getByRole('button', { name: /download csv/i });
      await user.click(exportButton);

      expect(screen.getByText('Preparing export...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /downloading/i })).toBeDisabled();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should show full dashboard for admin users', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Individual Donations')).toBeInTheDocument();
        expect(screen.getByText('Donor Details')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /export detailed/i })).toBeInTheDocument();
      });
    });

    it('should hide sensitive data for pastor users', async () => {
      mockUseAuth.mockReturnValue({
        user: mockPastorUser,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Aggregate Summary')).toBeInTheDocument();
        expect(screen.queryByText('Individual Donations')).not.toBeInTheDocument();
        expect(screen.queryByText('Donor Details')).not.toBeInTheDocument();
      });
    });

    it('should block unauthorized access for member users', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockAdminUser, role: 'member' },
        isLoading: false,
      });

      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('You do not have permission to view financial reports.')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading spinner during data fetch', () => {
      mockDonationsService.getFinancialSummary.mockImplementation(() => new Promise(() => {}));
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-spinner') || screen.getByRole('status')).toBeInTheDocument();
    });

    it('should retry data fetch when retry button is clicked', async () => {
      const user = userEvent.setup();
      mockDonationsService.getFinancialSummary.mockRejectedValueOnce(new Error('Network error'));
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      // Reset mocks for successful retry
      mockDonationsService.getFinancialSummary.mockResolvedValueOnce(mockFinancialSummary);
      mockDonationCategoriesService.getCategories.mockResolvedValueOnce(mockCategories);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(mockDonationsService.getFinancialSummary).toHaveBeenCalledTimes(2);
        expect(screen.getByText('Financial Reports Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Financial reports dashboard');
        expect(screen.getByRole('region', { name: /kpi summary/i })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: /charts section/i })).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export report/i })).toBeInTheDocument();
      });

      // Test tab navigation
      await user.tab();
      expect(screen.getByLabelText(/start date/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/end date/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /apply filter/i })).toHaveFocus();
    });
  });

  describe('Service Integration', () => {
    it('should call getFinancialSummary with correct parameters', async () => {
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockDonationsService.getFinancialSummary).toHaveBeenCalledWith();
      });
    });

    it('should call getDonationsByDateRange with date filters', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      const startDate = screen.getByLabelText(/start date/i);
      const endDate = screen.getByLabelText(/end date/i);
      
      await user.clear(startDate);
      await user.type(startDate, '2025-01-01');
      await user.clear(endDate);
      await user.type(endDate, '2025-01-31');
      
      const applyButton = screen.getByRole('button', { name: /apply filter/i });
      await user.click(applyButton);

      await waitFor(() => {
        expect(mockDonationsService.getDonationsByDateRange).toHaveBeenCalledWith(
          '2025-01-01', 
          '2025-01-31'
        );
      });
    });

    it('should handle service method rejections gracefully', async () => {
      mockDonationCategoriesService.getCategories.mockRejectedValueOnce(new Error('Categories error'));
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Error loading donation categories',
          'error'
        );
      });
    });
  });
});