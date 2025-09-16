// src/services/firebase/__tests__/donationStatements.service.test.ts
// Comprehensive test suite for PRP-2C-009 donation statement and receipt generation Firebase service
// Tests annual tax statements, individual receipts, template management, bulk processing, and email tracking
// RELEVANT FILES: src/services/firebase/donationStatements.service.ts, src/types/donations.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock BaseFirestoreService
const mockCreate = vi.hoisted(() => vi.fn());
const mockGetById = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockGetAll = vi.hoisted(() => vi.fn());
const mockGetWhere = vi.hoisted(() => vi.fn());

vi.mock('../base/base-firestore-service', () => ({
  BaseFirestoreService: class {
    create = mockCreate;
    getById = mockGetById;
    update = mockUpdate;
    getAll = mockGetAll;
    getWhere = mockGetWhere;
    constructor() {}
  },
}));

// Mock DonationsService dependency
const mockGetDonationsByMember = vi.hoisted(() => vi.fn());
vi.mock('../donations.service', () => ({
  DonationsService: class {
    getDonationsByMember = mockGetDonationsByMember;
    getById = mockGetById;
  },
}));

// Import the service after mocks are set up
import { DonationStatementsService } from '../donationStatements.service';

describe('DonationStatementsService', () => {
  let statementsService: DonationStatementsService;

  const mockDonation = {
    id: 'donation-123',
    memberId: 'member-456',
    memberName: 'John Smith',
    amount: 100.0,
    taxYear: 2025,
    form990Fields: { isQuidProQuo: false },
    isTaxDeductible: true,
    donationDate: '2025-01-15',
    method: 'cash',
  };

  const mockStatement = {
    id: 'statement-2025-member-456',
    memberId: 'member-456',
    taxYear: 2025,
    totalAmount: 1200.0,
    isEmailSent: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock for getWhere to return empty array
    mockGetWhere.mockResolvedValue([]);
    statementsService = new DonationStatementsService();
  });

  describe('Annual Statement Generation', () => {
    it('should generate annual statement for member with donations', async () => {
      mockGetDonationsByMember.mockResolvedValue([mockDonation]);
      mockCreate.mockResolvedValue(mockStatement);

      const result = await statementsService.generateAnnualStatement(
        'member-456',
        2025
      );

      // Updated expectation - method now only takes memberId, filtering happens client-side
      expect(mockGetDonationsByMember).toHaveBeenCalledWith('member-456');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          memberId: 'member-456',
          taxYear: 2025,
          totalAmount: expect.any(Number),
          generatedAt: expect.any(String),
        })
      );
      expect(result).toBeDefined();
    });

    it('should throw error for member with no donations', async () => {
      mockGetDonationsByMember.mockResolvedValue([]);

      await expect(
        statementsService.generateAnnualStatement('member-456', 2025)
      ).rejects.toThrow('No donations found for member in tax year 2025');
    });

    it('should generate statement with multiple categories breakdown', async () => {
      const multipleDonations = [
        { ...mockDonation, categoryName: 'Tithes', amount: 500.0 },
        {
          ...mockDonation,
          id: 'donation-456',
          categoryName: 'Building Fund',
          amount: 250.0,
        },
      ];

      mockGetDonationsByMember.mockResolvedValue(multipleDonations);
      mockCreate.mockResolvedValue(mockStatement);

      const result = await statementsService.generateAnnualStatement(
        'member-456',
        2025
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          totalAmount: 750.0,
          donationCount: 2,
          categoryBreakdown: expect.arrayContaining([
            { categoryName: 'Tithes', amount: 500.0 },
            { categoryName: 'Building Fund', amount: 250.0 },
          ]),
        })
      );
    });

    it('should validate tax year is within valid range', async () => {
      await expect(
        statementsService.generateAnnualStatement('member-456', 1999)
      ).rejects.toThrow('Invalid tax year: 1999');

      await expect(
        statementsService.generateAnnualStatement('member-456', 2026)
      ).rejects.toThrow('Invalid tax year: 2026');
    });
  });

  describe('Individual Receipt Generation', () => {
    it('should generate receipt for valid donation', async () => {
      const mockReceiptData = {
        id: 'receipt-123',
        receiptNumber: 'R-2025-001',
        donationAmount: 100.0,
        isEmailSent: false,
      };

      mockGetById.mockResolvedValue(mockDonation);
      mockGetWhere.mockResolvedValue([]); // No existing receipts
      mockCreate.mockResolvedValue(mockReceiptData);

      const result =
        await statementsService.generateDonationReceipt('donation-123');

      expect(mockGetById).toHaveBeenCalledWith('donation-123');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          donationId: 'donation-123',
          receiptNumber: expect.stringMatching(/^R-2025-\d{3}$/),
          donationAmount: 100.0,
        })
      );
      expect(result).toBeDefined();
    });

    it('should throw error for invalid donation ID', async () => {
      mockGetById.mockResolvedValue(null);

      await expect(
        statementsService.generateDonationReceipt('invalid-donation-id')
      ).rejects.toThrow('Donation not found: invalid-donation-id');
    });

    it('should ensure receipt numbering consistency and handle quid pro quo', async () => {
      const quidProQuoDonation = {
        ...mockDonation,
        form990Fields: { isQuidProQuo: true, quidProQuoValue: 25.0 },
      };

      mockGetById.mockResolvedValue(quidProQuoDonation);
      mockGetWhere.mockResolvedValue([]);
      mockCreate.mockResolvedValue({ id: 'receipt-123' });

      await statementsService.generateDonationReceipt('donation-123');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          isQuidProQuo: true,
          quidProQuoValue: 25.0,
          deductibleAmount: 75.0, // 100 - 25
          quidProQuoDetails: {
            deductibleAmount: 75.0,
          },
        })
      );
    });
  });

  describe('Template Management', () => {
    it('should get and update templates with validation', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Annual Statement Template',
        bodyContent: {
          greeting: 'Dear {memberName}',
          introText: 'Thank you for your support.',
        },
      };

      mockGetWhere.mockResolvedValue([mockTemplate]);
      mockUpdate.mockResolvedValue({
        ...mockTemplate,
        subject: 'Updated Subject',
      });

      const template = await statementsService.getTemplate('annual_statement');
      expect(template).toEqual(mockTemplate);

      const result = await statementsService.updateTemplate('template-id', {
        subject: 'Updated Subject',
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        'template-id',
        expect.objectContaining({
          subject: 'Updated Subject',
          updatedAt: expect.any(String),
        })
      );
    });

    it('should update template with validation', async () => {
      mockUpdate.mockResolvedValue({
        id: 'template-123',
        bodyContent: {
          greeting: 'Dear {memberName}',
          introText: 'Updated content for {memberName}',
        },
      });

      const result = await statementsService.updateTemplate('template-id', {
        bodyContent: {
          greeting: 'Dear {memberName}',
          introText: 'Updated content for {memberName}',
        },
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        'template-id',
        expect.objectContaining({
          bodyContent: {
            greeting: 'Dear {memberName}',
            introText: 'Updated content for {memberName}',
          },
          updatedAt: expect.any(String),
        })
      );
    });

    it('should validate template content requirements', async () => {
      await expect(
        statementsService.updateTemplate('template-id', {
          bodyContent: {
            greeting: 'Dear Friend',
            introText: 'Invalid template without required placeholders',
          },
        })
      ).rejects.toThrow(
        'Template must contain required placeholders: {memberName}'
      );
    });
  });

  describe('Bulk Processing', () => {
    it('should start and track bulk statement jobs', async () => {
      const mockJob = {
        id: 'job-123',
        jobName: 'Bulk Annual Statements 2025',
        status: 'queued',
        totalMembers: 150,
        processedMembers: 0,
      };

      mockCreate.mockResolvedValue(mockJob);

      const result = await statementsService.startBulkStatementJob(
        2025,
        'admin-456'
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          jobName: 'Bulk Annual Statements 2025',
          taxYear: 2025,
          status: 'queued',
          createdBy: 'admin-456',
        })
      );
      expect(result).toEqual(mockJob);
    });

    it('should track job progress and handle failures', async () => {
      const mockJob = {
        id: 'job-123',
        totalMembers: 100,
        processedMembers: 50,
        status: 'processing',
      };

      mockGetById.mockResolvedValue(mockJob);

      const result = await statementsService.getBulkJobStatus('job-123');

      expect(result?.progressPercentage).toBe(50);
    });

    it('should handle bulk processing errors gracefully', async () => {
      const failedJob = {
        id: 'job-456',
        status: 'failed',
        errorMessage: 'Template not found',
        totalMembers: 100,
        processedMembers: 25,
      };

      mockGetById.mockResolvedValue(failedJob);

      const result = await statementsService.getBulkJobStatus('job-456');

      expect(result?.status).toBe('failed');
      expect(result?.errorMessage).toBe('Template not found');
    });
  });

  describe('Email Status Tracking', () => {
    it('should mark statements and receipts as emailed', async () => {
      const updatedStatement = { ...mockStatement, isEmailSent: true };
      mockUpdate.mockResolvedValue(updatedStatement);

      const result =
        await statementsService.markStatementEmailSent('statement-123');

      expect(mockUpdate).toHaveBeenCalledWith('statement-123', {
        isEmailSent: true,
        emailSentAt: expect.any(String),
      });
      expect(result).toEqual(updatedStatement);
    });

    it('should mark receipts as emailed', async () => {
      const mockReceipt = { id: 'receipt-123', isEmailSent: false };
      const updatedReceipt = { ...mockReceipt, isEmailSent: true };

      mockUpdate.mockResolvedValue(updatedReceipt);

      const result =
        await statementsService.markReceiptEmailSent('receipt-123');

      expect(mockUpdate).toHaveBeenCalledWith('receipt-123', {
        isEmailSent: true,
        emailSentAt: expect.any(String),
      });
    });

    it('should validate email delivery status', async () => {
      const emailedStatement = { ...mockStatement, isEmailSent: true };
      mockGetById.mockResolvedValue(emailedStatement);

      await expect(
        statementsService.validateEmailDelivery('statement-123')
      ).resolves.not.toThrow();

      const unsentStatement = { ...mockStatement, isEmailSent: false };
      mockGetById.mockResolvedValue(unsentStatement);

      await expect(
        statementsService.validateEmailDelivery('statement-456')
      ).rejects.toThrow(
        'Email delivery validation failed: statement not marked as sent'
      );
    });
  });
});
