// src/types/__tests__/donationStatements.types.test.ts
// Comprehensive test suite for PRP-2C-009 donation statement and receipt TypeScript type definitions
// This file exists to ensure type safety and completeness of statement-related types with tax compliance
// RELEVANT FILES: src/types/donations.ts, src/services/firebase/donation-statements.service.ts, src/components/donations/DonationStatements.tsx
// STATUS: GREEN phase - types successfully implemented and all tests passing

import { describe, it, expect, expectTypeOf } from 'vitest';

// Import the actual types from donations.ts
import {
  DonationStatement,
  DonationReceipt,
  StatementTemplate,
  BulkStatementJob,
  StatementStatus,
  StatementType,
  StatementFormat,
  StatementDeliveryMethod,
} from '../donations';

describe('Donation Statement Types - PRP-2C-009', () => {
  describe('DonationStatement Interface', () => {
    it('should define DonationStatement interface with all required fields', () => {
      // This test now passes with the implemented DonationStatement interface
      expect(() => {
        const statement: DonationStatement = {
          id: 'stmt-2025-001',
          memberId: 'member-456',
          memberName: 'John Smith',
          memberEmail: 'john@example.com',
          memberAddress: {
            line1: '123 Main St',
            line2: 'Apt 4B',
            city: 'Anytown',
            state: 'CA',
            postalCode: '12345',
          },
          statementType: 'annual_tax_statement' as StatementType,
          taxYear: 2025,
          periodStart: '2025-01-01T00:00:00Z',
          periodEnd: '2025-12-31T23:59:59Z',
          donationIds: ['donation-123', 'donation-456', 'donation-789'],
          totalAmount: 12500.0,
          totalDeductibleAmount: 11750.0,
          donationCount: 15,
          includesQuidProQuo: true,
          churchName: 'Grace Community Church',
          churchAddress: '456 Church St, Anytown, CA 12345',
          churchEIN: '12-3456789',
          generatedAt: '2025-01-15T10:00:00Z',
          generatedBy: 'admin-123',
          status: 'generated' as StatementStatus,
          format: 'pdf' as StatementFormat,
          fileSize: 245760,
          downloadUrl:
            'https://storage.googleapis.com/statements/stmt-2025-001.pdf',
          deliveryMethod: 'download' as StatementDeliveryMethod,
          sentAt: '2025-01-15T10:05:00Z',
          downloadedAt: '2025-01-16T14:30:00Z',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:05:00Z',
        };

        expect(statement.id).toBe('stmt-2025-001');
        expect(statement.totalAmount).toBe(12500.0);
        expect(statement.statementType).toBe('annual_tax_statement');
        expect(statement.status).toBe('generated');
        expect(statement.donationCount).toBe(15);
      }).not.toThrow();
    });

    it('should support quarterly statement generation', () => {
      // This test now passes with the implemented StatementType enum
      const statementData: Partial<DonationStatement> = {
        id: 'stmt-q1-2025-001',
        memberId: 'member-789',
        memberName: 'Jane Doe',
        statementType: 'quarterly_summary' as StatementType,
        taxYear: 2025,
        periodStart: '2025-01-01T00:00:00Z',
        periodEnd: '2025-03-31T23:59:59Z',
        donationIds: ['donation-q1-001', 'donation-q1-002'],
        totalAmount: 3000.0,
        donationCount: 3,
        status: 'sent' as StatementStatus,
        deliveryMethod: 'email' as StatementDeliveryMethod,
      };

      expect(statementData.statementType).toBe('quarterly_summary');
      expect(statementData.deliveryMethod).toBe('email');
    });
  });

  describe('DonationReceipt Interface', () => {
    it('should define DonationReceipt interface for individual receipts', () => {
      // This test now passes with the implemented DonationReceipt interface
      const receiptData: DonationReceipt = {
        id: 'receipt-2025-001',
        donationId: 'donation-123',
        memberId: 'member-456',
        memberName: 'John Smith',
        receiptNumber: 'R-2025-001',
        donationAmount: 500.0,
        deductibleAmount: 450.0,
        donationDate: '2025-01-15T10:00:00Z',
        donationMethod: 'credit_card',
        categoryName: 'Building Fund',
        isQuidProQuo: true,
        quidProQuoValue: 50.0,
        quidProQuoDescription: 'Dinner event ticket',
        churchName: 'Grace Community Church',
        churchEIN: '12-3456789',
        generatedAt: '2025-01-15T10:05:00Z',
        status: 'generated' as StatementStatus,
        format: 'pdf' as StatementFormat,
      };

      expect(receiptData.receiptNumber).toBe('R-2025-001');
      expect(receiptData.deductibleAmount).toBe(450.0);
      expect(receiptData.isQuidProQuo).toBe(true);
      expect(receiptData.quidProQuoValue).toBe(50.0);
    });

    it('should support simple receipt without quid pro quo', () => {
      const receiptData: Partial<DonationReceipt> = {
        id: 'receipt-2025-002',
        donationId: 'donation-456',
        receiptNumber: 'R-2025-002',
        donationAmount: 100.0,
        deductibleAmount: 100.0,
        isQuidProQuo: false,
        status: 'generated' as StatementStatus,
      };

      expect(receiptData.isQuidProQuo).toBe(false);
      expect(receiptData.deductibleAmount).toBe(receiptData.donationAmount);
    });
  });

  describe('StatementTemplate Interface', () => {
    it('should define StatementTemplate interface with customization options', () => {
      // This test now passes with the implemented StatementTemplate interface
      const templateData: StatementTemplate = {
        id: 'template-annual-default',
        name: 'Annual Tax Statement Template',
        templateType: 'annual_statement',
        isDefault: true,
        isActive: true,
        headerContent: {
          churchLogo: 'https://storage.googleapis.com/logos/church-logo.png',
          churchName: 'Grace Community Church',
          churchEIN: '12-3456789',
        },
        bodyContent: {
          greeting: 'Dear {memberName},',
          introText: 'Thank you for your faithful giving throughout {taxYear}.',
        },
        styling: {
          primaryColor: '#2563eb',
          fontFamily: 'Inter, sans-serif',
        },
        includeSections: {
          donationSummary: true,
          donationDetails: true,
          quidProQuoDetails: true,
        },
        version: '1.2.0',
      };

      expect(templateData.templateType).toBe('annual_statement');
      expect(templateData.isDefault).toBe(true);
      expect(templateData.includeSections.quidProQuoDetails).toBe(true);
      expect(templateData.version).toBe('1.2.0');
    });
  });

  describe('BulkStatementJob Interface', () => {
    it('should define BulkStatementJob interface for batch processing', () => {
      // This test now passes with the implemented BulkStatementJob interface
      const jobData: BulkStatementJob = {
        id: 'bulk-job-2025-annual',
        jobName: '2025 Annual Tax Statements',
        jobType: 'annual_statements',
        taxYear: 2025,
        templateId: 'template-annual-default',
        memberIds: ['member-456', 'member-789', 'member-012'],
        totalMembers: 3,
        processedMembers: 2,
        successfulStatements: 2,
        failedStatements: 0,
        status: 'processing',
        deliveryMethod: 'email_with_download' as StatementDeliveryMethod,
        sendImmediately: true,
        notifyOnCompletion: true,
      };

      expect(jobData.jobType).toBe('annual_statements');
      expect(jobData.processedMembers).toBe(2);
      expect(jobData.status).toBe('processing');
      expect(jobData.sendImmediately).toBe(true);
    });

    it('should support completed bulk job with results', () => {
      const jobData: Partial<BulkStatementJob> = {
        id: 'bulk-job-2025-q1',
        jobName: 'Q1 2025 Quarterly Statements',
        jobType: 'quarterly_statements',
        status: 'completed',
        totalMembers: 2,
        successfulStatements: 2,
        failedStatements: 0,
        deliveryMethod: 'email_with_download' as StatementDeliveryMethod,
        sendImmediately: false,
      };

      expect(jobData.status).toBe('completed');
      expect(jobData.failedStatements).toBe(0);
    });
  });

  describe('Type Union Validation', () => {
    it('should validate StatementStatus type union', () => {
      const validStatuses: StatementStatus[] = [
        'pending',
        'generating',
        'generated',
        'sent',
        'failed',
        'cancelled',
      ];

      validStatuses.forEach((status) => {
        expect(typeof status).toBe('string');
      });
    });

    it('should validate StatementFormat type union', () => {
      const validFormats: StatementFormat[] = ['pdf', 'html', 'excel'];

      validFormats.forEach((format) => {
        expect(typeof format).toBe('string');
      });
    });
  });
});
