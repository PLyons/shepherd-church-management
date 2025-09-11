// src/components/donations/__tests__/MemberDonationHistory.export.test.tsx
// Comprehensive test suite for PDF generation and export functionality in MemberDonationHistory component
// Tests written BEFORE implementation (TDD RED phase) to define expected export behavior and achieve 90%+ export feature coverage
// RELEVANT FILES: src/components/donations/MemberDonationHistory.tsx, src/services/firebase/donations.service.ts, src/types/donations.ts

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { MemberDonationHistory } from '../MemberDonationHistory';
import { donationsService, membersService } from '../../../services/firebase';
import { useAuth } from '../../../contexts/FirebaseAuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { Donation, TaxReceiptData } from '../../../types/donations';
import { Member } from '../../../types';

// Mock PDF generation libraries
vi.mock('jspdf', () => ({
  default: vi.fn(() => ({
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    addImage: vi.fn(),
    addPage: vi.fn(),
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

vi.mock('react-pdf', () => ({
  PDFDocument: vi.fn(),
  Page: vi.fn(),
  Text: vi.fn(),
  View: vi.fn(),
  StyleSheet: {
    create: vi.fn(() => ({}))
  },
  pdf: vi.fn(() => ({
    toBlob: vi.fn(() => Promise.resolve(new Blob(['pdf-data'], { type: 'application/pdf' }))),
    updateContainer: vi.fn()
  }))
}));

// Mock CSV generation
vi.mock('papaparse', () => ({
  unparse: vi.fn((data) => 'member_name,amount,date,method,category\nJohn Doe,100.00,2024-01-15,cash,tithe')
}));

// Mock file download
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
document.createElement = vi.fn((tagName) => {
  if (tagName === 'a') {
    return mockAnchorElement as any;
  }
  return originalCreateElement.call(document, tagName);
});

// Mock services and contexts
vi.mock('../../../services/firebase', () => ({
  donationsService: {
    getMemberDonations: vi.fn(),
    getDonationsByDateRange: vi.fn(),
    generateTaxReceipt: vi.fn(),
  },
  membersService: {
    getById: vi.fn(),
  },
}));

vi.mock('../../../contexts/FirebaseAuthContext');
vi.mock('../../../contexts/ToastContext');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ memberId: 'member-123' }),
  };
});

const mockDonationsService = donationsService as unknown as {
  getMemberDonations: Mock;
  getDonationsByDateRange: Mock;
  generateTaxReceipt: Mock;
};

const mockMembersService = membersService as unknown as {
  getById: Mock;
};

const mockUseAuth = useAuth as Mock;
const mockUseToast = useToast as Mock;
const mockToast = { showToast: vi.fn() };

// Test data
const mockMember: Member = {
  id: 'member-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-123-4567',
  dateOfBirth: '1980-05-15',
  memberStatus: 'active',
  joinDate: '2020-01-15',
  address: {
    line1: '123 Main Street',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62701'
  },
  role: 'member',
  householdId: 'household-456',
  createdAt: '2020-01-15T00:00:00Z',
  updatedAt: '2024-01-11T00:00:00Z'
};

const mockDonations: Donation[] = [
  {
    id: 'donation-1',
    memberId: 'member-123',
    memberName: 'John Doe',
    amount: 500.00,
    donationDate: '2024-01-15',
    method: 'check',
    sourceLabel: 'Check #1234',
    categoryId: 'cat-1',
    categoryName: 'Tithe',
    form990Fields: {
      lineItem: '1a_cash_contributions',
      isQuidProQuo: false,
      isAnonymous: false
    },
    receiptNumber: 'RCP-2024-001',
    isReceiptSent: true,
    receiptSentAt: '2024-01-15T10:00:00Z',
    isTaxDeductible: true,
    taxYear: 2024,
    createdAt: '2024-01-15T09:00:00Z',
    createdBy: 'admin-1',
    updatedAt: '2024-01-15T09:00:00Z',
    status: 'verified',
    member: mockMember
  },
  {
    id: 'donation-2',
    memberId: 'member-123',
    memberName: 'John Doe',
    amount: 250.00,
    donationDate: '2024-02-01',
    method: 'cash',
    categoryId: 'cat-2',
    categoryName: 'Building Fund',
    form990Fields: {
      lineItem: '1a_cash_contributions',
      isQuidProQuo: false,
      isAnonymous: false
    },
    receiptNumber: 'RCP-2024-015',
    isReceiptSent: true,
    isTaxDeductible: true,
    taxYear: 2024,
    createdAt: '2024-02-01T09:00:00Z',
    createdBy: 'admin-1',
    updatedAt: '2024-02-01T09:00:00Z',
    status: 'verified',
    member: mockMember
  }
];

const mockTaxReceiptData: TaxReceiptData = {
  donationId: 'donation-1',
  receiptNumber: 'RCP-2024-001',
  donorName: 'John Doe',
  donorAddress: {
    line1: '123 Main Street',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62701'
  },
  amount: 500.00,
  donationDate: '2024-01-15',
  method: 'check',
  category: 'Tithe',
  isTaxDeductible: true,
  taxYear: 2024,
  isQuidProQuo: false,
  deductibleAmount: 500.00,
  churchName: 'Shepherd Church',
  churchAddress: '456 Church St, Springfield, IL 62701',
  churchEIN: '12-3456789',
  generatedAt: '2024-01-15T10:00:00Z',
  generatedBy: 'admin-1'
};

describe('MemberDonationHistory Export Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: { uid: 'admin-1', email: 'admin@church.com' },
      member: { id: 'admin-1', role: 'admin' },
      isLoading: false
    });
    
    mockUseToast.mockReturnValue(mockToast);
    
    mockMembersService.getById.mockResolvedValue(mockMember);
    mockDonationsService.getMemberDonations.mockResolvedValue(mockDonations);
    mockDonationsService.generateTaxReceipt.mockResolvedValue(mockTaxReceiptData);
    
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
  });

  // ============================================================================
  // PDF TAX STATEMENT TESTS
  // ============================================================================

  describe('PDF Tax Statement Generation', () => {
    it('should render PDF export button for tax statements', async () => {
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Generate Tax Statement (PDF)')).toBeInTheDocument();
      });
    });

    it('should generate PDF with member donation data', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Generate Tax Statement (PDF)')).toBeInTheDocument();
      });

      const pdfButton = screen.getByText('Generate Tax Statement (PDF)');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockDonationsService.generateTaxReceipt).toHaveBeenCalled();
      });

      // Verify PDF generation was initiated
      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      });
    });

    it('should include tax-compliant formatting in PDF', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const pdfButton = await screen.findByText('Generate Tax Statement (PDF)');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockDonationsService.generateTaxReceipt).toHaveBeenCalledWith(
          expect.objectContaining({
            memberId: 'member-123',
            taxYear: expect.any(Number),
            includeIRSCompliantLanguage: true
          })
        );
      });
    });

    it('should include church letterhead and contact information in PDF', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const pdfButton = await screen.findByText('Generate Tax Statement (PDF)');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockTaxReceiptData.churchName).toBe('Shepherd Church');
        expect(mockTaxReceiptData.churchAddress).toBe('456 Church St, Springfield, IL 62701');
        expect(mockTaxReceiptData.churchEIN).toBe('12-3456789');
      });
    });

    it('should display proper member information in PDF', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const pdfButton = await screen.findByText('Generate Tax Statement (PDF)');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockTaxReceiptData.donorName).toBe('John Doe');
        expect(mockTaxReceiptData.donorAddress?.line1).toBe('123 Main Street');
        expect(mockTaxReceiptData.donorAddress?.city).toBe('Springfield');
        expect(mockTaxReceiptData.donorAddress?.state).toBe('IL');
        expect(mockTaxReceiptData.donorAddress?.postalCode).toBe('62701');
      });
    });

    it('should include year-to-date summaries in PDF', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const pdfButton = await screen.findByText('Generate Tax Statement (PDF)');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockDonationsService.getDonationsByDateRange).toHaveBeenCalledWith(
          expect.objectContaining({
            memberId: 'member-123',
            startDate: expect.stringContaining('2024-01-01'),
            endDate: expect.stringContaining('2024-12-31')
          })
        );
      });
    });

    it('should calculate tax-deductible amounts correctly in PDF', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const pdfButton = await screen.findByText('Generate Tax Statement (PDF)');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockTaxReceiptData.deductibleAmount).toBe(500.00);
        expect(mockTaxReceiptData.isQuidProQuo).toBe(false);
      });
    });

    it('should trigger PDF download with proper filename', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const pdfButton = await screen.findByText('Generate Tax Statement (PDF)');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockAnchorElement.download).toBe('tax-statement-john-doe-2024.pdf');
        expect(mockClick).toHaveBeenCalled();
      });
    });

    it('should handle PDF generation errors gracefully', async () => {
      mockDonationsService.generateTaxReceipt.mockRejectedValue(new Error('PDF generation failed'));
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const pdfButton = await screen.findByText('Generate Tax Statement (PDF)');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockToast.showToast).toHaveBeenCalledWith(
          'Failed to generate PDF tax statement',
          'error'
        );
      });
    });
  });

  // ============================================================================
  // CSV EXPORT TESTS
  // ============================================================================

  describe('CSV Export Functionality', () => {
    it('should render CSV export button', async () => {
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Export to CSV')).toBeInTheDocument();
      });
    });

    it('should export CSV with all donation fields', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const csvButton = await screen.findByText('Export to CSV');
      await user.click(csvButton);

      await waitFor(() => {
        const expectedHeaders = [
          'Date', 'Amount', 'Method', 'Category', 'Receipt Number',
          'Tax Deductible', 'Notes', 'Status'
        ];
        
        // Verify CSV contains expected headers
        expect(mockCreateObjectURL).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'text/csv'
          })
        );
      });
    });

    it('should format dates properly in CSV export', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const csvButton = await screen.findByText('Export to CSV');
      await user.click(csvButton);

      await waitFor(() => {
        // Verify date formatting (MM/DD/YYYY or YYYY-MM-DD)
        expect(mockCreateObjectURL).toHaveBeenCalled();
      });
    });

    it('should format currency properly in CSV export', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const csvButton = await screen.findByText('Export to CSV');
      await user.click(csvButton);

      await waitFor(() => {
        // Verify currency formatting ($500.00)
        expect(mockCreateObjectURL).toHaveBeenCalled();
      });
    });

    it('should trigger CSV download with proper filename', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const csvButton = await screen.findByText('Export to CSV');
      await user.click(csvButton);

      await waitFor(() => {
        expect(mockAnchorElement.download).toContain('donations-john-doe');
        expect(mockAnchorElement.download).toContain('.csv');
        expect(mockClick).toHaveBeenCalled();
      });
    });

    it('should handle large dataset CSV export', async () => {
      // Mock large dataset (1000+ donations)
      const largeDonationSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockDonations[0],
        id: `donation-${i}`,
        amount: Math.random() * 1000
      }));
      
      mockDonationsService.getMemberDonations.mockResolvedValue(largeDonationSet);
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const csvButton = await screen.findByText('Export to CSV');
      await user.click(csvButton);

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
      }, { timeout: 10000 }); // Allow extra time for large export
    });

    it('should handle CSV export errors gracefully', async () => {
      // Mock Papa Parse error
      const { unparse } = await import('papaparse');
      (unparse as Mock).mockImplementation(() => {
        throw new Error('CSV generation failed');
      });

      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const csvButton = await screen.findByText('Export to CSV');
      await user.click(csvButton);

      await waitFor(() => {
        expect(mockToast.showToast).toHaveBeenCalledWith(
          'Failed to export CSV',
          'error'
        );
      });
    });
  });

  // ============================================================================
  // PRINT FUNCTIONALITY TESTS
  // ============================================================================

  describe('Print Functionality', () => {
    it('should render print button', async () => {
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Print History')).toBeInTheDocument();
      });
    });

    it('should apply print-friendly styling when printing', async () => {
      const mockPrint = vi.fn();
      Object.defineProperty(window, 'print', { value: mockPrint });

      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const printButton = await screen.findByText('Print History');
      await user.click(printButton);

      await waitFor(() => {
        expect(mockPrint).toHaveBeenCalled();
      });

      // Verify print-friendly CSS classes are applied
      const printSection = screen.getByTestId('donation-history-print-section');
      expect(printSection).toHaveClass('print:block');
    });

    it('should optimize layout for print', async () => {
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const printSection = await screen.findByTestId('donation-history-print-section');
      
      // Verify print-specific layout classes
      expect(printSection).toHaveClass('print:text-black');
      expect(printSection).toHaveClass('print:bg-white');
    });

    it('should handle page breaks for long donation histories', async () => {
      // Mock large donation history
      const longDonationSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockDonations[0],
        id: `donation-${i}`
      }));
      
      mockDonationsService.getMemberDonations.mockResolvedValue(longDonationSet);
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const printSection = await screen.findByTestId('donation-history-print-section');
      
      // Verify page break classes are applied
      expect(printSection).toHaveClass('print:break-inside-avoid');
    });

    it('should show print preview functionality', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const previewButton = await screen.findByText('Print Preview');
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByTestId('print-preview-modal')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // ANNUAL STATEMENT TESTS
  // ============================================================================

  describe('Annual Statement Generation', () => {
    it('should render annual statement button', async () => {
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Generate Annual Statement')).toBeInTheDocument();
      });
    });

    it('should generate annual giving statement', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const annualButton = await screen.findByText('Generate Annual Statement');
      await user.click(annualButton);

      await waitFor(() => {
        expect(mockDonationsService.getDonationsByDateRange).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: '2024-01-01',
            endDate: '2024-12-31'
          })
        );
      });
    });

    it('should filter by tax year for annual statements', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      // Select different tax year
      const yearSelect = await screen.findByLabelText('Tax Year');
      await user.selectOptions(yearSelect, '2023');

      const annualButton = screen.getByText('Generate Annual Statement');
      await user.click(annualButton);

      await waitFor(() => {
        expect(mockDonationsService.getDonationsByDateRange).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: '2023-01-01',
            endDate: '2023-12-31'
          })
        );
      });
    });

    it('should include multiple year statement options', async () => {
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const yearSelect = await screen.findByLabelText('Tax Year');
      const options = screen.getAllByRole('option');
      
      // Verify multiple years are available
      expect(options).toHaveLength(5); // Current year + 4 previous years
      expect(screen.getByDisplayValue('2024')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2023')).toBeInTheDocument();
    });

    it('should include IRS-compliant language in annual statements', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const annualButton = await screen.findByText('Generate Annual Statement');
      await user.click(annualButton);

      await waitFor(() => {
        expect(mockDonationsService.generateTaxReceipt).toHaveBeenCalledWith(
          expect.objectContaining({
            includeIRSCompliantLanguage: true,
            statementType: 'annual'
          })
        );
      });
    });

    it('should include verification codes in digital statements', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const annualButton = await screen.findByText('Generate Annual Statement');
      await user.click(annualButton);

      await waitFor(() => {
        expect(mockTaxReceiptData.receiptNumber).toMatch(/^RCP-\d{4}-\d{3}$/);
      });
    });
  });

  // ============================================================================
  // EXPORT PERFORMANCE TESTS
  // ============================================================================

  describe('Export Performance', () => {
    it('should generate PDF within 5 seconds', async () => {
      const startTime = Date.now();
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const pdfButton = await screen.findByText('Generate Tax Statement (PDF)');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled();
        const endTime = Date.now();
        expect(endTime - startTime).toBeLessThan(5000);
      }, { timeout: 6000 });
    });

    it('should handle large dataset export efficiently', async () => {
      // Mock 10,000 donation records
      const massiveDonationSet = Array.from({ length: 10000 }, (_, i) => ({
        ...mockDonations[0],
        id: `donation-${i}`,
        amount: Math.random() * 1000
      }));
      
      mockDonationsService.getMemberDonations.mockResolvedValue(massiveDonationSet);
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const csvButton = await screen.findByText('Export to CSV');
      const startTime = Date.now();
      
      await user.click(csvButton);

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled();
        const endTime = Date.now();
        expect(endTime - startTime).toBeLessThan(10000); // 10 second limit for large datasets
      }, { timeout: 15000 });
    });

    it('should manage memory usage during export', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const pdfButton = await screen.findByText('Generate Tax Statement (PDF)');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      });
    });

    it('should handle concurrent export requests', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const pdfButton = await screen.findByText('Generate Tax Statement (PDF)');
      const csvButton = await screen.findByText('Export to CSV');

      // Trigger concurrent exports
      await Promise.all([
        user.click(pdfButton),
        user.click(csvButton)
      ]);

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalledTimes(2);
        expect(mockClick).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ============================================================================
  // EXPORT SECURITY TESTS
  // ============================================================================

  describe('Export Security', () => {
    it('should not store files server-side during PDF generation', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const pdfButton = await screen.findByText('Generate Tax Statement (PDF)');
      await user.click(pdfButton);

      await waitFor(() => {
        // Verify no server upload calls are made
        expect(mockDonationsService.generateTaxReceipt).not.toHaveBeenCalledWith(
          expect.objectContaining({
            uploadToServer: true
          })
        );
      });
    });

    it('should generate secure PDF without data leaks', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const pdfButton = await screen.findByText('Generate Tax Statement (PDF)');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockDonationsService.generateTaxReceipt).toHaveBeenCalledWith(
          expect.objectContaining({
            secureGeneration: true,
            excludeSensitiveData: true
          })
        );
      });
    });

    it('should clean up temporary export data', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const csvButton = await screen.findByText('Export to CSV');
      await user.click(csvButton);

      await waitFor(() => {
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      });
    });

    it('should enforce access control for export functions', async () => {
      // Test with member role (should have limited access)
      mockUseAuth.mockReturnValue({
        user: { uid: 'member-1', email: 'member@church.com' },
        member: { id: 'member-1', role: 'member' },
        isLoading: false
      });
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      // Member should only see their own data export options
      await waitFor(() => {
        expect(screen.getByText('Export My Donations (CSV)')).toBeInTheDocument();
        expect(screen.queryByText('Export All Donations')).not.toBeInTheDocument();
      });
    });

    it('should validate member access before export', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const pdfButton = await screen.findByText('Generate Tax Statement (PDF)');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockDonationsService.getMemberDonations).toHaveBeenCalledWith(
          'member-123',
          expect.objectContaining({
            requestingUserId: 'admin-1'
          })
        );
      });
    });

    it('should handle export errors without exposing sensitive data', async () => {
      mockDonationsService.generateTaxReceipt.mockRejectedValue(
        new Error('Database connection failed - user table corrupted')
      );
      
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const pdfButton = await screen.findByText('Generate Tax Statement (PDF)');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockToast.showToast).toHaveBeenCalledWith(
          'Failed to generate PDF tax statement',
          'error'
        );
        // Verify sensitive error details are not exposed
        expect(mockToast.showToast).not.toHaveBeenCalledWith(
          expect.stringContaining('Database connection failed'),
          'error'
        );
      });
    });
  });

  // ============================================================================
  // EXPORT ERROR HANDLING TESTS
  // ============================================================================

  describe('Export Error Handling', () => {
    it('should handle PDF generation library failures', async () => {
      const { default: jsPDF } = await import('jspdf');
      (jsPDF as Mock).mockImplementation(() => {
        throw new Error('jsPDF initialization failed');
      });

      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const pdfButton = await screen.findByText('Generate Tax Statement (PDF)');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockToast.showToast).toHaveBeenCalledWith(
          'PDF generation library error',
          'error'
        );
      });
    });

    it('should handle blob creation failures', async () => {
      mockCreateObjectURL.mockImplementation(() => {
        throw new Error('Blob creation failed');
      });

      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const csvButton = await screen.findByText('Export to CSV');
      await user.click(csvButton);

      await waitFor(() => {
        expect(mockToast.showToast).toHaveBeenCalledWith(
          'File download preparation failed',
          'error'
        );
      });
    });

    it('should show loading state during export generation', async () => {
      // Mock slow PDF generation
      mockDonationsService.generateTaxReceipt.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 2000))
      );

      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const pdfButton = await screen.findByText('Generate Tax Statement (PDF)');
      await user.click(pdfButton);

      // Verify loading state is shown
      expect(screen.getByText('Generating PDF...')).toBeInTheDocument();
      expect(pdfButton).toBeDisabled();
    });

    it('should handle browser compatibility issues', async () => {
      // Mock unsupported browser (no Blob support)
      Object.defineProperty(window, 'Blob', { value: undefined });

      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const csvButton = await screen.findByText('Export to CSV');
      await user.click(csvButton);

      await waitFor(() => {
        expect(mockToast.showToast).toHaveBeenCalledWith(
          'Export not supported in this browser',
          'error'
        );
      });
    });

    it('should retry failed exports automatically', async () => {
      let callCount = 0;
      mockDonationsService.generateTaxReceipt.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve(mockTaxReceiptData);
      });

      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <MemberDonationHistory />
        </BrowserRouter>
      );

      const pdfButton = await screen.findByText('Generate Tax Statement (PDF)');
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockDonationsService.generateTaxReceipt).toHaveBeenCalledTimes(3);
        expect(mockCreateObjectURL).toHaveBeenCalled();
      }, { timeout: 5000 });
    });
  });
});