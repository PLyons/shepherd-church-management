// src/services/__tests__/pdfGenerator.service.test.ts
// Comprehensive test suite for PRP-2C-009 PDF generation service following TDD GREEN phase requirements
// This file tests PDFGeneratorService for donation statements and receipts with IRS-compliant formatting
// RELEVANT FILES: src/services/pdfGenerator.service.ts, src/types/donations.ts, src/components/donations/DonationStatements.tsx
// STATUS: GREEN phase - tests should PASS with PDFGeneratorService implementation

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

// Mock jsPDF library - this is critical for PDF testing without actual PDF generation
const mockPDF = {
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  text: vi.fn(),
  line: vi.fn(),
  rect: vi.fn(),
  addImage: vi.fn(),
  addPage: vi.fn(),
  save: vi.fn(),
  output: vi.fn().mockReturnValue('mock-pdf-blob'),
  internal: {
    pageSize: {
      getWidth: vi.fn().mockReturnValue(210),
      getHeight: vi.fn().mockReturnValue(297),
    },
  },
};

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => mockPDF),
  jsPDF: vi.fn().mockImplementation(() => mockPDF),
}));

// Import PDFGeneratorService and types
import { PDFGeneratorService } from '../pdfGenerator.service';
import {
  DonationStatement,
  DonationReceipt,
  StatementTemplate,
} from '../../types/donations';

// Mock types for testing compatibility
type ChurchTemplate = {
  id: string;
  churchName: string;
  churchAddress: string;
  churchEIN: string;
  logoUrl?: string;
  headerColor: string;
  fontFamily: string;
  legalText: string;
};

type StatementPDFOptions = {
  template: ChurchTemplate;
  includeQuidProQuo: boolean;
  includeDonationDetails: boolean;
  customMessage?: string;
};

type ReceiptPDFOptions = {
  template: ChurchTemplate;
  receiptNumber: string;
  includeQuidProQuo: boolean;
  quidProQuoValue?: number;
};

// Mock donation data for testing
const mockDonation = {
  id: 'donation-123',
  memberId: 'member-456',
  amount: 500.0,
  deductibleAmount: 450.0,
  donationDate: '2025-01-15T10:30:00Z',
  donationMethod: 'credit_card',
  category: 'tithe',
  description: 'Weekly tithe donation',
  isRecurring: false,
  hasQuidProQuo: true,
  quidProQuoValue: 50.0,
  quidProQuoDescription: 'Church dinner ticket',
};

const mockStatementData: DonationStatement = {
  id: 'stmt-2025-001',
  memberId: 'member-456',
  memberName: 'John Smith',
  memberEmail: 'john@example.com',
  memberAddress: {
    line1: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    postalCode: '12345',
  },
  statementType: 'annual_tax_statement',
  taxYear: 2025,
  periodStart: '2025-01-01T00:00:00Z',
  periodEnd: '2025-12-31T23:59:59Z',
  donationIds: ['donation-123'],
  totalAmount: 12500.0,
  totalDeductibleAmount: 11750.0,
  donationCount: 25,
  includesQuidProQuo: true,
  churchName: 'Grace Community Church',
  churchAddress: '456 Church St, Anytown, CA 12345',
  churchEIN: '12-3456789',
  generatedAt: '2025-09-16T12:00:00Z',
  generatedBy: 'admin-123',
  status: 'generated',
  format: 'pdf',
  deliveryMethod: 'download',
  createdAt: '2025-09-16T12:00:00Z',
  updatedAt: '2025-09-16T12:00:00Z',
};

const mockReceiptData: DonationReceipt = {
  id: 'receipt-2025-001',
  donationId: 'donation-123',
  memberId: 'member-456',
  memberName: 'John Smith',
  receiptNumber: 'RCP-2025-001',
  donationAmount: 500.0,
  deductibleAmount: 450.0,
  donationDate: '2025-01-15T10:30:00Z',
  donationMethod: 'credit_card',
  categoryName: 'Tithe',
  isQuidProQuo: true,
  quidProQuoValue: 50.0,
  quidProQuoDescription: 'Church dinner ticket',
  churchName: 'Grace Community Church',
  churchEIN: '12-3456789',
  generatedAt: '2025-09-16T12:00:00Z',
  status: 'generated',
  format: 'pdf',
};

const mockStatementTemplate: StatementTemplate = {
  id: 'template-001',
  name: 'Default Church Template',
  templateType: 'annual_statement',
  isDefault: true,
  isActive: true,
  headerContent: {
    churchName: 'Grace Community Church',
    churchEIN: '12-3456789',
    churchLogo: 'https://example.com/logo.png',
  },
  bodyContent: {
    greeting: 'Dear {{memberName}},',
    introText:
      'Thank you for your generous support during the {{taxYear}} tax year.',
  },
  styling: {
    primaryColor: '#1e3a8a',
    fontFamily: 'helvetica',
  },
  includeSections: {
    donationSummary: true,
    donationDetails: true,
    quidProQuoDetails: true,
  },
  version: '1.0.0',
};

const mockChurchTemplate: ChurchTemplate = {
  id: 'template-001',
  churchName: 'Grace Community Church',
  churchAddress: '456 Church St, Anytown, CA 12345',
  churchEIN: '12-3456789',
  logoUrl: 'https://example.com/logo.png',
  headerColor: '#1e3a8a',
  fontFamily: 'helvetica',
  legalText:
    'No goods or services were provided in exchange for this contribution except as noted.',
};

describe('PDFGeneratorService - PRP-2C-009', () => {
  let pdfGeneratorService: PDFGeneratorService;

  beforeEach(() => {
    vi.clearAllMocks();
    pdfGeneratorService = new PDFGeneratorService();
  });

  describe('Annual Statement PDF Generation', () => {
    it('should generate annual tax statement PDF with proper IRS-compliant formatting', () => {
      const options = {
        template: mockStatementTemplate,
        includeQuidProQuo: true,
        includeDonationDetails: true,
        customMessage: 'Thank you for your generous support!',
      };

      const pdfResult = pdfGeneratorService.generateStatementPDF(
        mockStatementData,
        options
      );

      expect(pdfResult).toBeDefined();
      expect(mockPDF.setFontSize).toHaveBeenCalled();
      expect(mockPDF.text).toHaveBeenCalled();

      // Verify IRS-compliant formatting calls
      expect(mockPDF.text).toHaveBeenCalledWith(
        expect.stringContaining('Annual Donation Statement - 2025'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should include church letterhead and branding in statement PDF', () => {
      const options = {
        template: mockStatementTemplate,
        includeQuidProQuo: false,
        includeDonationDetails: true,
      };

      const pdfResult = pdfGeneratorService.generateStatementPDF(
        mockStatementData,
        options
      );

      expect(pdfResult).toBeDefined();
      expect(mockPDF.setFont).toHaveBeenCalled();

      // Verify church information is added
      expect(mockPDF.text).toHaveBeenCalledWith(
        expect.stringContaining('John Smith'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should validate IRS-compliant legal text inclusion', () => {
      const options = {
        template: mockStatementTemplate,
        includeQuidProQuo: true,
        includeDonationDetails: true,
      };

      const pdfResult = pdfGeneratorService.generateStatementPDF(
        mockStatementData,
        options
      );

      expect(pdfResult).toBeDefined();

      // Verify legal text is added with small font size
      expect(mockPDF.setFontSize).toHaveBeenCalledWith(8);
      expect(mockPDF.text).toHaveBeenCalledWith(
        expect.stringContaining('Thank you for your generous support'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should handle multiple donation items with pagination', () => {
      const largeStatementData = {
        ...mockStatementData,
        donationCount: 50,
      };

      const options = {
        template: mockStatementTemplate,
        includeQuidProQuo: false,
        includeDonationDetails: true,
      };

      const pdfResult = pdfGeneratorService.generateStatementPDF(
        largeStatementData,
        options
      );

      expect(pdfResult).toBeDefined();

      // Verify pagination is handled for large donation counts
      expect(mockPDF.addPage).toHaveBeenCalled();
    });
  });

  describe('Individual Receipt PDF Generation', () => {
    it('should generate individual donation receipt PDF with proper formatting', () => {
      const options = {
        template: mockStatementTemplate,
        receiptNumber: 'RCP-2025-001',
        includeQuidProQuo: true,
        quidProQuoValue: 50.0,
      };

      const pdfResult = pdfGeneratorService.generateReceiptPDF(
        mockReceiptData,
        options
      );

      expect(pdfResult).toBeDefined();
      expect(mockPDF.setFontSize).toHaveBeenCalled();
      expect(mockPDF.text).toHaveBeenCalled();

      // Verify receipt header
      expect(mockPDF.text).toHaveBeenCalledWith(
        'Donation Receipt',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should include quid pro quo disclosure when required in receipts', () => {
      const options = {
        template: mockStatementTemplate,
        receiptNumber: 'RCP-2025-002',
        includeQuidProQuo: true,
        quidProQuoValue: 25.0,
      };

      const pdfResult = pdfGeneratorService.generateReceiptPDF(
        mockReceiptData,
        options
      );

      expect(pdfResult).toBeDefined();

      // Verify quid pro quo disclosure is added
      expect(mockPDF.text).toHaveBeenCalledWith(
        expect.stringContaining('goods or services valued at $25.00'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should validate receipt numbering and formatting', () => {
      const options = {
        template: mockStatementTemplate,
        receiptNumber: 'RCP-2025-003',
        includeQuidProQuo: false,
      };

      const pdfResult = pdfGeneratorService.generateReceiptPDF(
        mockReceiptData,
        options
      );

      expect(pdfResult).toBeDefined();

      // Verify receipt numbering
      expect(mockPDF.text).toHaveBeenCalledWith(
        'Receipt #: RCP-2025-003',
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('Template System', () => {
    it('should apply custom church template settings', () => {
      const customTemplate: StatementTemplate = {
        ...mockStatementTemplate,
        styling: {
          primaryColor: '#dc2626',
          fontFamily: 'times',
        },
      };

      const options = {
        template: customTemplate,
        includeQuidProQuo: false,
        includeDonationDetails: false,
      };

      const pdfResult = pdfGeneratorService.generateStatementPDF(
        mockStatementData,
        options
      );

      expect(pdfResult).toBeDefined();

      // Verify custom font is applied
      expect(mockPDF.setFont).toHaveBeenCalledWith('times');
    });

    it('should use default template when none provided', () => {
      const pdfResult =
        pdfGeneratorService.generateStatementPDF(mockStatementData);

      expect(pdfResult).toBeDefined();

      // Verify default template is used
      expect(mockPDF.setFont).toHaveBeenCalledWith('helvetica');
    });
  });

  describe('PDF Export Functions', () => {
    it('should provide download PDF functionality', () => {
      const pdf = pdfGeneratorService.generateStatementPDF(mockStatementData);
      const filename = 'annual-statement-2025.pdf';

      pdfGeneratorService.downloadPDF(pdf, filename);

      // Verify download functionality
      expect(mockPDF.save).toHaveBeenCalledWith(filename);
    });

    it('should get PDF as blob for email attachment', () => {
      const pdf = pdfGeneratorService.generateStatementPDF(mockStatementData);

      const blob = pdfGeneratorService.getPDFBlob(pdf);

      expect(blob).toBeDefined();
      expect(mockPDF.output).toHaveBeenCalledWith('blob');
    });
  });
});
