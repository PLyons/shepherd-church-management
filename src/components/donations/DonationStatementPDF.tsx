// src/components/donations/DonationStatementPDF.tsx  
// PDF generation component for tax-compliant donation statements with church letterhead
// Creates IRS-compliant annual giving statements with proper formatting and verification
// RELEVANT FILES: src/components/donations/MemberDonationHistory.tsx, src/types/donations.ts, src/utils/currency.ts

import { Donation } from '../../types/donations';
import { formatCurrency, formatDate } from '../../utils/currency-utils';
import jsPDF from 'jspdf';

export interface DonationStatementData {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  donations: Donation[];
  taxYear: number;
  churchInfo: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    ein: string;
    phone?: string;
    email?: string;
  };
  statementNumber: string;
  generatedDate: string;
}

export interface PDFGenerationOptions {
  includeLogo?: boolean;
  includeNonDeductible?: boolean;
  format?: 'letter' | 'a4';
  orientation?: 'portrait' | 'landscape';
}

export class DonationStatementPDF {
  private pdf: jsPDF;
  private currentY: number = 0;
  private pageHeight: number;
  private pageWidth: number;
  private margins = { top: 40, bottom: 40, left: 40, right: 40 };

  constructor(options: PDFGenerationOptions = {}) {
    this.pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'pt',
      format: options.format || 'letter'
    });
    
    this.pageHeight = this.pdf.internal.pageSize.height;
    this.pageWidth = this.pdf.internal.pageSize.width;
    this.currentY = this.margins.top;
  }

  /**
   * Generate a complete donation statement PDF
   */
  public generateStatement(data: DonationStatementData, options: PDFGenerationOptions = {}): Blob {
    try {
      this.currentY = this.margins.top;
      
      // Header with church information
      this.addHeader(data.churchInfo, data.statementNumber, data.generatedDate);
      
      // Member information
      this.addMemberInfo(data.member);
      
      // Statement period and tax year
      this.addStatementPeriod(data.taxYear);
      
      // Tax compliance statement
      this.addTaxComplianceStatement(data.churchInfo.ein);
      
      // Donation summary
      this.addDonationSummary(data.donations, options.includeNonDeductible);
      
      // Detailed donation listing
      this.addDonationDetails(data.donations);
      
      // Footer with verification and contact info
      this.addFooter(data.churchInfo, data.statementNumber);
      
      // Return PDF as blob
      return new Blob([this.pdf.output('blob')], { type: 'application/pdf' });
      
    } catch (error) {
      console.error('Error generating donation statement PDF:', error);
      throw new Error('Failed to generate donation statement');
    }
  }

  /**
   * Add header with church information and letterhead
   */
  private addHeader(churchInfo: DonationStatementData['churchInfo'], statementNumber: string, generatedDate: string): void {
    // Church name - large, bold
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(churchInfo.name, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 25;
    
    // Church address
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(churchInfo.address, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 12;
    
    this.pdf.text(`${churchInfo.city}, ${churchInfo.state} ${churchInfo.zip}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 12;
    
    if (churchInfo.phone) {
      this.pdf.text(`Phone: ${churchInfo.phone}`, this.pageWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 12;
    }
    
    if (churchInfo.email) {
      this.pdf.text(`Email: ${churchInfo.email}`, this.pageWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 12;
    }
    
    // EIN
    this.pdf.text(`Federal Tax ID: ${churchInfo.ein}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 20;
    
    // Horizontal line
    this.pdf.setLineWidth(1);
    this.pdf.line(this.margins.left, this.currentY, this.pageWidth - this.margins.right, this.currentY);
    this.currentY += 20;
    
    // Document title
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('ANNUAL CONTRIBUTION STATEMENT', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 20;
    
    // Statement metadata
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`Statement #: ${statementNumber}`, this.margins.left, this.currentY);
    this.pdf.text(`Generated: ${formatDate(generatedDate)}`, this.pageWidth - this.margins.right, this.currentY, { align: 'right' });
    this.currentY += 20;
  }

  /**
   * Add member information section
   */
  private addMemberInfo(member: DonationStatementData['member']): void {
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Prepared for:', this.margins.left, this.currentY);
    this.currentY += 15;
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`${member.firstName} ${member.lastName}`, this.margins.left, this.currentY);
    this.currentY += 12;
    
    if (member.address) {
      this.pdf.text(member.address.street, this.margins.left, this.currentY);
      this.currentY += 12;
      this.pdf.text(`${member.address.city}, ${member.address.state} ${member.address.zip}`, this.margins.left, this.currentY);
      this.currentY += 12;
    }
    
    if (member.email) {
      this.pdf.text(`Email: ${member.email}`, this.margins.left, this.currentY);
      this.currentY += 12;
    }
    
    this.currentY += 10;
  }

  /**
   * Add statement period and tax year information
   */
  private addStatementPeriod(taxYear: number): void {
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(`Tax Year: ${taxYear}`, this.margins.left, this.currentY);
    this.pdf.text(`Statement Period: January 1, ${taxYear} - December 31, ${taxYear}`, this.margins.left, this.currentY + 12);
    this.currentY += 30;
  }

  /**
   * Add IRS tax compliance statement
   */
  private addTaxComplianceStatement(ein: string): void {
    this.currentY += 5;
    
    // Box around compliance statement
    const boxHeight = 45;
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(this.margins.left, this.currentY - 5, this.pageWidth - this.margins.left - this.margins.right, boxHeight);
    
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('IRS TAX COMPLIANCE STATEMENT:', this.margins.left + 10, this.currentY + 8);
    
    this.pdf.setFont('helvetica', 'normal');
    const complianceText = [
      'This organization is exempt from federal income tax under section 501(c)(3) of the Internal',
      'Revenue Code. Contributions are deductible under section 170 of the Code.',
      'No goods or services were provided in return for your contribution unless noted below.'
    ];
    
    complianceText.forEach((line, index) => {
      this.pdf.text(line, this.margins.left + 10, this.currentY + 20 + (index * 10));
    });
    
    this.currentY += boxHeight + 15;
  }

  /**
   * Add donation summary section
   */
  private addDonationSummary(donations: Donation[], includeNonDeductible: boolean = false): void {
    const deductibleDonations = donations.filter(d => d.isTaxDeductible);
    const nonDeductibleDonations = donations.filter(d => !d.isTaxDeductible);
    
    const totalDeductible = deductibleDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalNonDeductible = nonDeductibleDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalAmount = totalDeductible + totalNonDeductible;
    
    // Summary box
    const summaryHeight = includeNonDeductible && totalNonDeductible > 0 ? 80 : 60;
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('CONTRIBUTION SUMMARY', this.margins.left, this.currentY);
    this.currentY += 5;
    
    // Summary table
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(this.margins.left, this.currentY, this.pageWidth - this.margins.left - this.margins.right, summaryHeight);
    
    this.pdf.setFontSize(10);
    this.currentY += 15;
    
    // Tax deductible amount
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Tax Deductible Contributions:', this.margins.left + 10, this.currentY);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(formatCurrency(totalDeductible), this.pageWidth - this.margins.right - 10, this.currentY, { align: 'right' });
    this.currentY += 15;
    
    // Non-deductible amount (if applicable)
    if (includeNonDeductible && totalNonDeductible > 0) {
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text('Non-Deductible Contributions:', this.margins.left + 10, this.currentY);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(formatCurrency(totalNonDeductible), this.pageWidth - this.margins.right - 10, this.currentY, { align: 'right' });
      this.currentY += 15;
    }
    
    // Line separator
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margins.left + 10, this.currentY, this.pageWidth - this.margins.right - 10, this.currentY);
    this.currentY += 10;
    
    // Total amount
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('TOTAL CONTRIBUTIONS:', this.margins.left + 10, this.currentY);
    this.pdf.text(formatCurrency(totalAmount), this.pageWidth - this.margins.right - 10, this.currentY, { align: 'right' });
    
    this.currentY += 25;
  }

  /**
   * Add detailed donation listing
   */
  private addDonationDetails(donations: Donation[]): void {
    if (donations.length === 0) {
      return;
    }
    
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('DETAILED CONTRIBUTION RECORD', this.margins.left, this.currentY);
    this.currentY += 20;
    
    // Table header
    const colWidths = [80, 100, 120, 80, 80];
    const headers = ['Date', 'Amount', 'Category', 'Method', 'Receipt #'];
    
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    
    let currentX = this.margins.left;
    headers.forEach((header, index) => {
      this.pdf.text(header, currentX, this.currentY);
      currentX += colWidths[index];
    });
    
    this.currentY += 5;
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margins.left, this.currentY, this.pageWidth - this.margins.right, this.currentY);
    this.currentY += 10;
    
    // Table rows
    this.pdf.setFont('helvetica', 'normal');
    
    donations.forEach((donation) => {
      // Check if we need a new page
      if (this.currentY > this.pageHeight - this.margins.bottom - 30) {
        this.pdf.addPage();
        this.currentY = this.margins.top;
      }
      
      currentX = this.margins.left;
      const rowData = [
        formatDate(donation.donationDate),
        formatCurrency(donation.amount),
        donation.categoryName,
        donation.method,
        donation.receiptNumber || 'N/A'
      ];
      
      rowData.forEach((data, index) => {
        this.pdf.text(data, currentX, this.currentY, { maxWidth: colWidths[index] - 5 });
        currentX += colWidths[index];
      });
      
      this.currentY += 12;
    });
    
    this.currentY += 10;
  }

  /**
   * Add footer with verification and contact information
   */
  private addFooter(churchInfo: DonationStatementData['churchInfo'], statementNumber: string): void {
    // Verification statement
    this.currentY += 10;
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'italic');
    
    const verificationText = [
      'This statement has been prepared from our financial records and represents a complete',
      'and accurate summary of your contributions for the stated period.',
      `Statement verification code: ${statementNumber}-${new Date().getFullYear()}`
    ];
    
    verificationText.forEach((line, index) => {
      this.pdf.text(line, this.pageWidth / 2, this.currentY + (index * 10), { align: 'center' });
    });
    
    this.currentY += 40;
    
    // Contact information
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Questions about this statement? Contact us:', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 12;
    
    if (churchInfo.phone) {
      this.pdf.text(`Phone: ${churchInfo.phone}`, this.pageWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 10;
    }
    
    if (churchInfo.email) {
      this.pdf.text(`Email: ${churchInfo.email}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    }
  }

  /**
   * Generate filename for the PDF
   */
  public static generateFilename(memberName: string, taxYear: number): string {
    const sanitizedName = memberName.replace(/[^a-zA-Z0-9]/g, '_');
    return `${sanitizedName}_Donation_Statement_${taxYear}.pdf`;
  }

  /**
   * Download the generated PDF
   */
  public static downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Utility function to generate and download a donation statement
 */
export const generateDonationStatement = async (
  data: DonationStatementData,
  options: PDFGenerationOptions = {}
): Promise<void> => {
  try {
    const pdfGenerator = new DonationStatementPDF(options);
    const pdfBlob = pdfGenerator.generateStatement(data, options);
    
    const filename = DonationStatementPDF.generateFilename(
      `${data.member.firstName} ${data.member.lastName}`,
      data.taxYear
    );
    
    DonationStatementPDF.downloadPDF(pdfBlob, filename);
  } catch (error) {
    console.error('Error generating donation statement:', error);
    throw new Error('Failed to generate donation statement');
  }
};

/**
 * Generate CSV export of donations
 */
export const generateDonationCSV = (
  donations: Donation[],
  memberName: string,
  taxYear?: number
): void => {
  try {
    const headers = [
      'Date',
      'Amount',
      'Category',
      'Method',
      'Tax Deductible',
      'Receipt Number',
      'Description'
    ];
    
    const csvContent = [
      headers.join(','),
      ...donations.map(donation => [
        formatDate(donation.donationDate),
        donation.amount.toString(),
        `"${donation.categoryName}"`,
        donation.method,
        donation.isTaxDeductible ? 'Yes' : 'No',
        donation.receiptNumber || '',
        `"${donation.note || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const sanitizedName = memberName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = taxYear 
      ? `${sanitizedName}_Donations_${taxYear}.csv`
      : `${sanitizedName}_Donations.csv`;
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating CSV export:', error);
    throw new Error('Failed to generate CSV export');
  }
};