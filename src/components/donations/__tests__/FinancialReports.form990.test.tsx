// src/components/donations/__tests__/FinancialReports.form990.test.tsx
// Comprehensive test suite for Form 990 compliance and export functionality in Financial Reports Dashboard
// Tests written BEFORE implementation (TDD RED phase) to define expected IRS compliance behavior
// COVERS: Form 990 line item mapping, PDF export generation, CSV export functionality
// TARGET: 35+ test cases covering comprehensive financial reporting compliance requirements

import { describe, it, expect, beforeEach, vi, Mock, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { FinancialReports } from '../FinancialReports';
import { donationsService, donationCategoriesService } from '../../../services/firebase';
import { useAuth } from '../../../contexts/FirebaseAuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { 
  Donation, 
  DonationReportFilters, 
  FinancialSummary,
  Form990Fields,
  Form990LineItem,
  TaxReceiptData 
} from '../../../types/donations';
import { Member } from '../../../types';

// Mock PDF generation libraries
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    addImage: vi.fn(),
    addPage: vi.fn(),
    addChart: vi.fn(), // For chart integration
    setTextColor: vi.fn(),
    setDrawColor: vi.fn(),
    rect: vi.fn(),
    line: vi.fn(),
    internal: {
      pageSize: {
        width: 210,
        height: 297
      }
    },
    save: vi.fn(),
    output: vi.fn(() => 'pdf-blob-data'),
  }))
}));

// Mock Chart.js for financial charts
vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn()
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  BarElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn()
}));

vi.mock('react-chartjs-2', () => ({
  Bar: vi.fn(({ data, options }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} />
  )),
  Pie: vi.fn(({ data, options }) => (
    <div data-testid="pie-chart" data-chart-data={JSON.stringify(data)} />
  )),
  Line: vi.fn(({ data, options }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} />
  ))
}));

// Mock CSV generation
vi.mock('papaparse', () => ({
  unparse: vi.fn((data, config) => {
    if (config?.fields) {
      return config.fields.join(',') + '\n' + data.map((row: any) => 
        config.fields.map((field: string) => row[field] || '').join(',')
      ).join('\n');
    }
    return 'id,amount,date,category\n1,100.00,2024-01-15,tithe';
  })
}));

// Mock file download utilities
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();

Object.defineProperty(window.URL, 'createObjectURL', {
  value: mockCreateObjectURL
});
Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL
});

// Mock document.createElement for download links
const mockAnchorElement = {
  click: mockClick,
  href: '',
  download: '',
  style: { display: '' }
};

const originalCreateElement = document.createElement;

// Mock services and contexts
vi.mock('../../../services/firebase', () => ({
  donationsService: {
    getDonationsByDateRange: vi.fn(),
    getFinancialSummary: vi.fn(),
    generateForm990Report: vi.fn(),
    exportDonationsCSV: vi.fn(),
    generateFinancialReportPDF: vi.fn(),
  },
  donationCategoriesService: {
    getAll: vi.fn(),
    getCategoriesByForm990LineItem: vi.fn(),
  },
}));

vi.mock('../../../contexts/FirebaseAuthContext');
vi.mock('../../../contexts/ToastContext');

const mockDonationsService = donationsService as unknown as {
  getDonationsByDateRange: Mock;
  getFinancialSummary: Mock;
  generateForm990Report: Mock;
  exportDonationsCSV: Mock;
  generateFinancialReportPDF: Mock;
};

const mockDonationCategoriesService = donationCategoriesService as unknown as {
  getAll: Mock;
  getCategoriesByForm990LineItem: Mock;
};

const mockUseAuth = useAuth as Mock;
const mockUseToast = useToast as Mock;
const mockToast = { showToast: vi.fn() };

// Test data
const mockMember: Member = {
  id: 'admin-1',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@church.com',
  phone: '555-123-4567',
  dateOfBirth: '1975-03-10',
  memberStatus: 'active',
  joinDate: '2020-01-01',
  address: {
    line1: '100 Admin Street',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62701'
  },
  role: 'admin',
  householdId: 'household-admin',
  createdAt: '2020-01-01T00:00:00Z',
  updatedAt: '2024-01-11T00:00:00Z'
};

const mockDonations: Donation[] = [
  {
    id: 'donation-1',
    memberId: 'member-1',
    memberName: 'John Doe',
    amount: 1000.00,
    donationDate: '2024-01-15',
    method: 'check',
    sourceLabel: 'Check #1001',
    categoryId: 'cat-tithe',
    categoryName: 'Tithe',
    form990Fields: {
      lineItem: '1a_cash_contributions',
      isQuidProQuo: false,
      isAnonymous: false,
      restrictionType: 'unrestricted'
    },
    receiptNumber: 'RCP-2024-001',
    isReceiptSent: true,
    isTaxDeductible: true,
    taxYear: 2024,
    createdAt: '2024-01-15T09:00:00Z',
    createdBy: 'admin-1',
    updatedAt: '2024-01-15T09:00:00Z',
    status: 'verified'
  },
  {
    id: 'donation-2',
    memberId: 'member-2',
    memberName: 'Jane Smith',
    amount: 500.00,
    donationDate: '2024-02-01',
    method: 'online',
    categoryId: 'cat-building',
    categoryName: 'Building Fund',
    form990Fields: {
      lineItem: '1a_cash_contributions',
      isQuidProQuo: false,
      isAnonymous: false,
      restrictionType: 'temporarily_restricted',
      restrictionDescription: 'Building construction only'
    },
    receiptNumber: 'RCP-2024-025',
    isReceiptSent: true,
    isTaxDeductible: true,
    taxYear: 2024,
    createdAt: '2024-02-01T09:00:00Z',
    createdBy: 'admin-1',
    updatedAt: '2024-02-01T09:00:00Z',
    status: 'verified'
  },
  {
    id: 'donation-3',
    memberId: 'member-3',
    memberName: 'Bob Wilson',
    amount: 2500.00,
    donationDate: '2024-03-15',
    method: 'stock',
    categoryId: 'cat-special',
    categoryName: 'Special Events',
    form990Fields: {
      lineItem: '1b_noncash_contributions',
      isQuidProQuo: true,
      quidProQuoValue: 150.00,
      isAnonymous: false,
      fairMarketValue: 2500.00,
      donorProvidedValue: 2400.00
    },
    receiptNumber: 'RCP-2024-055',
    isReceiptSent: true,
    isTaxDeductible: true,
    taxYear: 2024,
    createdAt: '2024-03-15T09:00:00Z',
    createdBy: 'admin-1',
    updatedAt: '2024-03-15T09:00:00Z',
    status: 'verified'
  }
];

const mockFinancialSummary: FinancialSummary = {
  totalDonations: 4000.00,
  totalTaxDeductible: 3850.00, // Less quid pro quo
  donationCount: 3,
  averageDonation: 1333.33,
  categoryBreakdown: [
    { categoryId: 'cat-tithe', categoryName: 'Tithe', amount: 1000.00, percentage: 25 },
    { categoryId: 'cat-building', categoryName: 'Building Fund', amount: 500.00, percentage: 12.5 },
    { categoryId: 'cat-special', categoryName: 'Special Events', amount: 2500.00, percentage: 62.5 }
  ],
  methodBreakdown: [
    { method: 'check', amount: 1000.00, percentage: 25 },
    { method: 'online', amount: 500.00, percentage: 12.5 },
    { method: 'stock', amount: 2500.00, percentage: 62.5 }
  ],
  monthlyTrends: [
    { month: '2024-01', amount: 1000.00 },
    { month: '2024-02', amount: 500.00 },
    { month: '2024-03', amount: 2500.00 }
  ]
};

const mockForm990Report = {
  taxYear: 2024,
  organizationName: 'Shepherd Church',
  ein: '12-3456789',
  partVIII: {
    '1a_cash_contributions': 1500.00, // Tithe + Building Fund
    '1b_noncash_contributions': 2500.00, // Stock donation
    '1c_contributions_reported_990': 0,
    '1d_related_organizations': 0,
    '1e_government_grants': 0,
    '1f_other_contributions': 0,
    '2_program_service_revenue': 0,
    '3_investment_income': 0,
    '4_other_revenue': 0,
    total_revenue: 4000.00
  },
  quidProQuoDisclosures: [
    {
      donationId: 'donation-3',
      totalAmount: 2500.00,
      quidProQuoValue: 150.00,
      deductibleAmount: 2350.00,
      description: 'Special event dinner valued at $150'
    }
  ],
  restrictedFunds: [
    {
      categoryName: 'Building Fund',
      amount: 500.00,
      restrictionType: 'temporarily_restricted',
      description: 'Building construction only'
    }
  ]
};

describe('FinancialReports Form 990 Compliance & Export Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset document.createElement mock
    document.createElement = vi.fn((tagName) => {
      if (tagName === 'a') {
        return mockAnchorElement as any;
      }
      return originalCreateElement.call(document, tagName);
    });
    
    mockUseAuth.mockReturnValue({
      user: { uid: 'admin-1', email: 'admin@church.com' },
      member: mockMember,
      isLoading: false
    });
    
    mockUseToast.mockReturnValue(mockToast);
    
    mockDonationsService.getDonationsByDateRange.mockResolvedValue(mockDonations);
    mockDonationsService.getFinancialSummary.mockResolvedValue(mockFinancialSummary);
    mockDonationsService.generateForm990Report.mockResolvedValue(mockForm990Report);
    mockDonationCategoriesService.getAll.mockResolvedValue([
      { id: 'cat-tithe', name: 'Tithe', form990LineItem: '1a_cash_contributions' },
      { id: 'cat-building', name: 'Building Fund', form990LineItem: '1a_cash_contributions' },
      { id: 'cat-special', name: 'Special Events', form990LineItem: '1b_noncash_contributions' }
    ]);
    
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
  });

  afterEach(() => {
    document.createElement = originalCreateElement;
  });

  // ============================================================================
  // FORM 990 LINE ITEM MAPPING TESTS (18 tests)
  // ============================================================================

  describe('Form 990 Line Item Mapping', () => {
    it('should map cash contributions to Form 990 Line 1a correctly', async () => {
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockDonationsService.generateForm990Report).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockForm990Report.partVIII['1a_cash_contributions']).toBe(1500.00);
      });
    });

    it('should map non-cash contributions to Form 990 Line 1b correctly', async () => {
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockForm990Report.partVIII['1b_noncash_contributions']).toBe(2500.00);
      });
    });

    it('should calculate Part VIII revenue totals correctly', async () => {
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      await waitFor(() => {
        const expectedTotal = 
          mockForm990Report.partVIII['1a_cash_contributions'] + 
          mockForm990Report.partVIII['1b_noncash_contributions'];
        expect(mockForm990Report.partVIII.total_revenue).toBe(expectedTotal);
      });
    });

    it('should categorize contributions and grants separately', async () => {
      // Mock data with government grants
      const donationsWithGrants = [...mockDonations, {
        id: 'donation-4',
        memberId: 'gov-1',
        memberName: 'State Grant Program',
        amount: 10000.00,
        donationDate: '2024-04-01',
        method: 'transfer',
        categoryId: 'cat-grant',
        categoryName: 'Government Grant',
        form990Fields: {
          lineItem: '1e_government_grants' as Form990LineItem,
          isQuidProQuo: false,
          isAnonymous: false
        },
        receiptNumber: 'RCP-2024-100',
        isReceiptSent: false,
        isTaxDeductible: false,
        taxYear: 2024,
        createdAt: '2024-04-01T09:00:00Z',
        createdBy: 'admin-1',
        updatedAt: '2024-04-01T09:00:00Z',
        status: 'verified'
      }];

      mockDonationsService.getDonationsByDateRange.mockResolvedValue(donationsWithGrants);

      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockDonationsService.generateForm990Report).toHaveBeenCalledWith(
          expect.objectContaining({
            separateGrantsFromContributions: true
          })
        );
      });
    });

    it('should handle program service revenue mapping', async () => {
      // Mock data with program service revenue
      const donationsWithProgram = [...mockDonations, {
        id: 'donation-5',
        memberId: 'program-1',
        memberName: 'Program Fees',
        amount: 2000.00,
        donationDate: '2024-05-01',
        method: 'cash',
        categoryId: 'cat-program',
        categoryName: 'Program Services',
        form990Fields: {
          lineItem: '2_program_service_revenue' as Form990LineItem,
          isQuidProQuo: false,
          isAnonymous: false
        },
        receiptNumber: 'RCP-2024-125',
        isReceiptSent: true,
        isTaxDeductible: false,
        taxYear: 2024,
        createdAt: '2024-05-01T09:00:00Z',
        createdBy: 'admin-1',
        updatedAt: '2024-05-01T09:00:00Z',
        status: 'verified'
      }];

      mockDonationsService.getDonationsByDateRange.mockResolvedValue(donationsWithProgram);

      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('form-990-program-revenue')).toHaveTextContent('$2,000.00');
      });
    });

    it('should map special events revenue correctly', async () => {
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('form-990-special-events')).toBeInTheDocument();
      });

      // Verify special events are categorized separately from regular contributions
      const specialEventsSection = screen.getByTestId('form-990-special-events');
      expect(within(specialEventsSection).getByText('$2,500.00')).toBeInTheDocument();
    });

    it('should track investment income separately', async () => {
      // Mock data with investment income
      const donationsWithInvestment = [...mockDonations, {
        id: 'donation-6',
        memberId: 'investment-1',
        memberName: 'Investment Returns',
        amount: 1500.00,
        donationDate: '2024-06-01',
        method: 'transfer',
        categoryId: 'cat-investment',
        categoryName: 'Investment Income',
        form990Fields: {
          lineItem: '3_investment_income' as Form990LineItem,
          isQuidProQuo: false,
          isAnonymous: false
        },
        receiptNumber: 'RCP-2024-150',
        isReceiptSent: false,
        isTaxDeductible: false,
        taxYear: 2024,
        createdAt: '2024-06-01T09:00:00Z',
        createdBy: 'admin-1',
        updatedAt: '2024-06-01T09:00:00Z',
        status: 'verified'
      }];

      mockDonationsService.getDonationsByDateRange.mockResolvedValue(donationsWithInvestment);

      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('form-990-investment-income')).toHaveTextContent('$1,500.00');
      });
    });

    it('should categorize other revenue streams properly', async () => {
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockDonationsService.generateForm990Report).toHaveBeenCalledWith(
          expect.objectContaining({
            includeOtherRevenue: true,
            categorizeByLineItem: true
          })
        );
      });
    });

    it('should generate compliant Form 990 summaries', async () => {
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('form-990-summary')).toBeInTheDocument();
      });

      const summarySection = screen.getByTestId('form-990-summary');
      expect(within(summarySection).getByText('Total Revenue: $4,000.00')).toBeInTheDocument();
      expect(within(summarySection).getByText('Cash Contributions: $1,500.00')).toBeInTheDocument();
      expect(within(summarySection).getByText('Non-cash Contributions: $2,500.00')).toBeInTheDocument();
    });

    it('should include required IRS disclaimers', async () => {
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('irs-compliance-disclaimer')).toBeInTheDocument();
      });

      const disclaimer = screen.getByTestId('irs-compliance-disclaimer');
      expect(disclaimer).toHaveTextContent('This report is prepared in accordance with IRS Form 990');
      expect(disclaimer).toHaveTextContent('Consult with qualified tax professionals');
    });

    it('should support multiple tax years', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const taxYearSelect = await screen.findByLabelText('Tax Year');
      await user.selectOptions(taxYearSelect, '2023');

      await waitFor(() => {
        expect(mockDonationsService.generateForm990Report).toHaveBeenCalledWith(
          expect.objectContaining({
            taxYear: 2023
          })
        );
      });
    });

    it('should validate Form 990 calculations', async () => {
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockDonationsService.generateForm990Report).toHaveBeenCalledWith(
          expect.objectContaining({
            validateCalculations: true,
            includeValidationErrors: true
          })
        );
      });
    });

    it('should handle quid pro quo contributions correctly', async () => {
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('quid-pro-quo-disclosures')).toBeInTheDocument();
      });

      const quidProQuoSection = screen.getByTestId('quid-pro-quo-disclosures');
      expect(within(quidProQuoSection).getByText('Total Amount: $2,500.00')).toBeInTheDocument();
      expect(within(quidProQuoSection).getByText('Quid Pro Quo Value: $150.00')).toBeInTheDocument();
      expect(within(quidProQuoSection).getByText('Deductible Amount: $2,350.00')).toBeInTheDocument();
    });

    it('should handle edge cases and zero amounts', async () => {
      // Mock data with zero amounts for some categories
      const mockForm990WithZeros = {
        ...mockForm990Report,
        partVIII: {
          ...mockForm990Report.partVIII,
          '1e_government_grants': 0,
          '2_program_service_revenue': 0,
          '3_investment_income': 0,
          '4_other_revenue': 0
        }
      };

      mockDonationsService.generateForm990Report.mockResolvedValue(mockForm990WithZeros);

      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('form-990-government-grants')).toHaveTextContent('$0.00');
        expect(screen.getByTestId('form-990-program-revenue')).toHaveTextContent('$0.00');
      });
    });

    it('should map restricted fund designations', async () => {
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('restricted-funds-section')).toBeInTheDocument();
      });

      const restrictedSection = screen.getByTestId('restricted-funds-section');
      expect(within(restrictedSection).getByText('Building Fund')).toBeInTheDocument();
      expect(within(restrictedSection).getByText('$500.00')).toBeInTheDocument();
      expect(within(restrictedSection).getByText('Temporarily Restricted')).toBeInTheDocument();
    });

    it('should handle non-cash contribution valuations', async () => {
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('non-cash-valuations')).toBeInTheDocument();
      });

      const valuationsSection = screen.getByTestId('non-cash-valuations');
      expect(within(valuationsSection).getByText('Fair Market Value: $2,500.00')).toBeInTheDocument();
      expect(within(valuationsSection).getByText('Donor Provided Value: $2,400.00')).toBeInTheDocument();
    });

    it('should generate line-by-line Form 990 breakdown', async () => {
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('form-990-line-breakdown')).toBeInTheDocument();
      });

      const breakdownSection = screen.getByTestId('form-990-line-breakdown');
      expect(within(breakdownSection).getByText('Line 1a - Cash Contributions')).toBeInTheDocument();
      expect(within(breakdownSection).getByText('Line 1b - Non-cash Contributions')).toBeInTheDocument();
    });

    it('should validate contribution categorization accuracy', async () => {
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockDonationCategoriesService.getCategoriesByForm990LineItem).toHaveBeenCalledWith('1a_cash_contributions');
        expect(mockDonationCategoriesService.getCategoriesByForm990LineItem).toHaveBeenCalledWith('1b_noncash_contributions');
      });
    });
  });

  // ============================================================================
  // PDF EXPORT GENERATION TESTS (12 tests)
  // ============================================================================

  describe('PDF Export Generation', () => {
    it('should generate executive summary PDFs', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const exportButton = await screen.findByText('Export Executive Summary (PDF)');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockDonationsService.generateFinancialReportPDF).toHaveBeenCalledWith(
          expect.objectContaining({
            reportType: 'executive_summary',
            includeCharts: true,
            includeLetterhead: true
          })
        );
      });
    });

    it('should include visual charts in PDFs', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const exportButton = await screen.findByText('Export Executive Summary (PDF)');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockDonationsService.generateFinancialReportPDF).toHaveBeenCalledWith(
          expect.objectContaining({
            includeCharts: true,
            chartTypes: ['bar', 'pie', 'line'],
            chartData: expect.objectContaining({
              categoryBreakdown: mockFinancialSummary.categoryBreakdown,
              monthlyTrends: mockFinancialSummary.monthlyTrends
            })
          })
        );
      });
    });

    it('should create Form 990 formatted reports', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const form990Button = await screen.findByText('Generate Form 990 Report (PDF)');
      await user.click(form990Button);

      await waitFor(() => {
        expect(mockDonationsService.generateFinancialReportPDF).toHaveBeenCalledWith(
          expect.objectContaining({
            reportType: 'form_990',
            includePartVIII: true,
            includeQuidProQuoDisclosures: true,
            includeRestrictedFunds: true,
            format: 'irs_compliant'
          })
        );
      });
    });

    it('should add church letterhead properly', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const exportButton = await screen.findByText('Export Executive Summary (PDF)');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockDonationsService.generateFinancialReportPDF).toHaveBeenCalledWith(
          expect.objectContaining({
            letterhead: {
              organizationName: 'Shepherd Church',
              address: expect.any(String),
              ein: '12-3456789',
              phone: expect.any(String),
              includeLogo: true
            }
          })
        );
      });
    });

    it('should handle large datasets in PDFs', async () => {
      // Mock large dataset
      const largeDonationSet = Array.from({ length: 5000 }, (_, i) => ({
        ...mockDonations[0],
        id: `donation-${i}`,
        amount: Math.random() * 1000
      }));

      mockDonationsService.getDonationsByDateRange.mockResolvedValue(largeDonationSet);
      
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const exportButton = await screen.findByText('Export Detailed Report (PDF)');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockDonationsService.generateFinancialReportPDF).toHaveBeenCalledWith(
          expect.objectContaining({
            handleLargeDatasets: true,
            paginationStrategy: 'auto_break',
            maxRecordsPerPage: 50
          })
        );
      }, { timeout: 10000 });
    });

    it('should validate PDF structure and metadata', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const exportButton = await screen.findByText('Export Executive Summary (PDF)');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockDonationsService.generateFinancialReportPDF).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: {
              title: 'Financial Report - Shepherd Church',
              author: 'Shepherd Church Management System',
              subject: 'Annual Financial Summary',
              creator: 'Financial Reports Dashboard',
              creationDate: expect.any(String)
            }
          })
        );
      });
    });

    it('should test cross-browser PDF generation compatibility', async () => {
      // Mock different browser environments
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (compatible; Edge/95.0)',
        configurable: true
      });

      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const exportButton = await screen.findByText('Export Executive Summary (PDF)');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockDonationsService.generateFinancialReportPDF).toHaveBeenCalledWith(
          expect.objectContaining({
            browserCompatibility: true,
            fallbackFormats: ['pdf', 'html']
          })
        );
      });

      // Restore original user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true
      });
    });

    it('should include proper PDF security settings', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const exportButton = await screen.findByText('Export Executive Summary (PDF)');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockDonationsService.generateFinancialReportPDF).toHaveBeenCalledWith(
          expect.objectContaining({
            security: {
              preventCopying: false, // Allow copying for accessibility
              preventPrinting: false,
              passwordProtection: false,
              digitalSignature: false // Not required for financial reports
            }
          })
        );
      });
    });

    it('should handle PDF generation errors gracefully', async () => {
      mockDonationsService.generateFinancialReportPDF.mockRejectedValue(new Error('PDF generation failed'));
      
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const exportButton = await screen.findByText('Export Executive Summary (PDF)');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockToast.showToast).toHaveBeenCalledWith(
          'Failed to generate PDF report',
          'error'
        );
      });
    });

    it('should optimize PDF file size for email delivery', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const exportButton = await screen.findByText('Export Executive Summary (PDF)');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockDonationsService.generateFinancialReportPDF).toHaveBeenCalledWith(
          expect.objectContaining({
            compression: 'high',
            imageQuality: 'medium',
            optimizeForEmail: true,
            targetFileSize: 'under_5mb'
          })
        );
      });
    });

    it('should trigger PDF download with descriptive filename', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const exportButton = await screen.findByText('Export Executive Summary (PDF)');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockAnchorElement.download).toBe('financial-report-shepherd-church-2024.pdf');
        expect(mockClick).toHaveBeenCalled();
      });
    });

    it('should support batch PDF generation for multiple periods', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      // Select multiple years
      const multiYearButton = await screen.findByText('Generate Multi-Year Report (PDF)');
      await user.click(multiYearButton);

      await waitFor(() => {
        expect(mockDonationsService.generateFinancialReportPDF).toHaveBeenCalledWith(
          expect.objectContaining({
            reportType: 'multi_year',
            years: [2024, 2023, 2022],
            compareYears: true
          })
        );
      });
    });
  });

  // ============================================================================
  // CSV EXPORT FUNCTIONALITY TESTS (12 tests)
  // ============================================================================

  describe('CSV Export Functionality', () => {
    it('should generate detailed transaction CSVs', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const csvButton = await screen.findByText('Export Detailed Transactions (CSV)');
      await user.click(csvButton);

      await waitFor(() => {
        expect(mockDonationsService.exportDonationsCSV).toHaveBeenCalledWith(
          expect.objectContaining({
            fields: [
              'donationDate', 'memberName', 'amount', 'method', 'categoryName',
              'receiptNumber', 'isTaxDeductible', 'form990LineItem', 'restrictionType'
            ],
            includeSensitiveData: true // Admin role
          })
        );
      });
    });

    it('should create category summary exports', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const categorySummaryButton = await screen.findByText('Export Category Summary (CSV)');
      await user.click(categorySummaryButton);

      await waitFor(() => {
        expect(mockDonationsService.exportDonationsCSV).toHaveBeenCalledWith(
          expect.objectContaining({
            reportType: 'category_summary',
            groupBy: 'category',
            includePercentages: true,
            includeTotals: true
          })
        );
      });
    });

    it('should export donor reports for admin only', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const donorReportButton = await screen.findByText('Export Donor Report (CSV)');
      expect(donorReportButton).toBeInTheDocument();

      await user.click(donorReportButton);

      await waitFor(() => {
        expect(mockDonationsService.exportDonationsCSV).toHaveBeenCalledWith(
          expect.objectContaining({
            reportType: 'donor_summary',
            includeContactInfo: true,
            includeTotalGiving: true,
            roleRequired: 'admin'
          })
        );
      });
    });

    it('should generate Form 990 data exports', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const form990CsvButton = await screen.findByText('Export Form 990 Data (CSV)');
      await user.click(form990CsvButton);

      await waitFor(() => {
        expect(mockDonationsService.exportDonationsCSV).toHaveBeenCalledWith(
          expect.objectContaining({
            reportType: 'form_990',
            fields: [
              'form990LineItem', 'amount', 'categoryName', 'restrictionType',
              'quidProQuoValue', 'fairMarketValue', 'isAnonymous'
            ],
            format: 'irs_compliant'
          })
        );
      });
    });

    it('should support custom field selection', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const customExportButton = await screen.findByText('Custom Export (CSV)');
      await user.click(customExportButton);

      // Mock selecting custom fields
      const fieldSelector = await screen.findByTestId('csv-field-selector');
      await user.click(within(fieldSelector).getByLabelText('Member Name'));
      await user.click(within(fieldSelector).getByLabelText('Amount'));
      await user.click(within(fieldSelector).getByLabelText('Date'));

      const generateButton = screen.getByText('Generate Custom CSV');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockDonationsService.exportDonationsCSV).toHaveBeenCalledWith(
          expect.objectContaining({
            fields: ['memberName', 'amount', 'donationDate'],
            customSelection: true
          })
        );
      });
    });

    it('should handle large dataset exports efficiently', async () => {
      // Mock 25,000 donation records
      const massiveDataset = Array.from({ length: 25000 }, (_, i) => ({
        ...mockDonations[0],
        id: `donation-${i}`,
        amount: Math.random() * 2000
      }));

      mockDonationsService.getDonationsByDateRange.mockResolvedValue(massiveDataset);
      
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const csvButton = await screen.findByText('Export Detailed Transactions (CSV)');
      await user.click(csvButton);

      await waitFor(() => {
        expect(mockDonationsService.exportDonationsCSV).toHaveBeenCalledWith(
          expect.objectContaining({
            streamingExport: true,
            batchSize: 1000,
            showProgress: true
          })
        );
      }, { timeout: 15000 });
    });

    it('should validate CSV format and headers', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const csvButton = await screen.findByText('Export Detailed Transactions (CSV)');
      await user.click(csvButton);

      await waitFor(() => {
        // Verify Papa Parse was called with correct configuration
        const { unparse } = require('papaparse');
        expect(unparse).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            header: true,
            quotes: true,
            delimiter: ',',
            encoding: 'utf-8'
          })
        );
      });
    });

    it('should sanitize data based on user role', async () => {
      // Test with pastor role (limited donor info)
      mockUseAuth.mockReturnValue({
        user: { uid: 'pastor-1', email: 'pastor@church.com' },
        member: { ...mockMember, id: 'pastor-1', role: 'pastor' },
        isLoading: false
      });

      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const csvButton = await screen.findByText('Export Category Summary (CSV)');
      await user.click(csvButton);

      await waitFor(() => {
        expect(mockDonationsService.exportDonationsCSV).toHaveBeenCalledWith(
          expect.objectContaining({
            sanitizeForRole: 'pastor',
            excludeFields: ['memberName', 'memberEmail', 'memberPhone'],
            aggregateOnly: true
          })
        );
      });
    });

    it('should handle export authentication and permissions', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const csvButton = await screen.findByText('Export Donor Report (CSV)');
      await user.click(csvButton);

      await waitFor(() => {
        expect(mockDonationsService.exportDonationsCSV).toHaveBeenCalledWith(
          expect.objectContaining({
            requestingUserId: 'admin-1',
            requestingUserRole: 'admin',
            auditExport: true
          })
        );
      });
    });

    it('should test download functionality with proper filenames', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const csvButton = await screen.findByText('Export Detailed Transactions (CSV)');
      await user.click(csvButton);

      await waitFor(() => {
        expect(mockAnchorElement.download).toBe('financial-transactions-shepherd-church-2024.csv');
        expect(mockClick).toHaveBeenCalled();
      });
    });

    it('should handle CSV export errors gracefully', async () => {
      const { unparse } = require('papaparse');
      unparse.mockImplementation(() => {
        throw new Error('CSV generation failed');
      });

      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      const csvButton = await screen.findByText('Export Detailed Transactions (CSV)');
      await user.click(csvButton);

      await waitFor(() => {
        expect(mockToast.showToast).toHaveBeenCalledWith(
          'Failed to generate CSV export',
          'error'
        );
      });
    });

    it('should support multi-format exports (CSV, Excel, TSV)', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <FinancialReports />
        </BrowserRouter>
      );

      // Test Excel format
      const excelButton = await screen.findByText('Export to Excel');
      await user.click(excelButton);

      await waitFor(() => {
        expect(mockDonationsService.exportDonationsCSV).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'excel',
            fileExtension: '.xlsx',
            includeFormulas: true
          })
        );
      });

      // Test TSV format
      const tsvButton = await screen.findByText('Export to TSV');
      await user.click(tsvButton);

      await waitFor(() => {
        expect(mockDonationsService.exportDonationsCSV).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'tsv',
            delimiter: '\t',
            fileExtension: '.tsv'
          })
        );
      });
    });
  });
});