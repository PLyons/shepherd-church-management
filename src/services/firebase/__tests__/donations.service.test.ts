import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { DonationsService } from '../donations.service';
import { 
  Donation, 
  DonationDocument, 
  DonationMethod, 
  DonationStatus,
  Form990LineItem,
  RestrictionType,
  DonationReportFilters,
  FinancialSummary,
} from '../../../types/donations';

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
  db: {},
}));

// Mock BaseFirestoreService methods
const mockCreate = vi.fn();
const mockGetById = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockGetAll = vi.fn();
const mockGetWhere = vi.fn();
const mockSearch = vi.fn();
const mockCount = vi.fn();
const mockSubscribeToCollection = vi.fn();
const mockUnsubscribe = vi.fn();

// Mock the BaseFirestoreService class
vi.mock('../base/base-firestore-service', () => ({
  BaseFirestoreService: class {
    create = mockCreate;
    getById = mockGetById;
    update = mockUpdate;
    delete = mockDelete;
    getAll = mockGetAll;
    getWhere = mockGetWhere;
    search = mockSearch;
    count = mockCount;
    subscribeToCollection = mockSubscribeToCollection;
    unsubscribe = mockUnsubscribe;
    
    constructor(db: any, collectionName: string, docToClient: any, clientToDoc: any) {
      // Store for verification
    }
  }
}));

describe('DonationsService', () => {
  let donationsService: DonationsService;

  const mockDonation: Donation = {
    id: 'donation-123',
    memberId: 'member-456',
    memberName: 'John Smith',
    amount: 100.00,
    donationDate: '2025-01-15T10:00:00Z',
    method: 'credit_card',
    sourceLabel: 'Online Portal',
    note: 'Monthly tithe',
    categoryId: 'category-789',
    categoryName: 'Tithes',
    form990Fields: {
      lineItem: '1a_cash_contributions',
      isQuidProQuo: false,
      isAnonymous: false,
      restrictionType: 'unrestricted',
    },
    receiptNumber: 'R-2025-001',
    isReceiptSent: true,
    receiptSentAt: '2025-01-15T10:05:00Z',
    isTaxDeductible: true,
    taxYear: 2025,
    createdAt: '2025-01-15T10:00:00Z',
    createdBy: 'admin-123',
    updatedAt: '2025-01-15T10:00:00Z',
    status: 'verified',
    verifiedBy: 'admin-123',
    verifiedAt: '2025-01-15T10:01:00Z',
  };

  const mockAnonymousDonation: Donation = {
    id: 'donation-anonymous-456',
    amount: 50.00,
    donationDate: '2025-01-15T10:00:00Z',
    method: 'cash',
    categoryId: 'category-general',
    categoryName: 'General Fund',
    form990Fields: {
      lineItem: '1a_cash_contributions',
      isQuidProQuo: false,
      isAnonymous: true,
      restrictionType: 'unrestricted',
    },
    receiptNumber: 'R-2025-002',
    isReceiptSent: false,
    isTaxDeductible: true,
    taxYear: 2025,
    createdAt: '2025-01-15T10:00:00Z',
    createdBy: 'admin-123',
    updatedAt: '2025-01-15T10:00:00Z',
    status: 'pending',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    donationsService = new DonationsService();
  });

  describe('Basic CRUD Operations', () => {
    describe('createDonation', () => {
      it('should create a new donation with proper timestamps and defaults', async () => {
        const newDonationData = {
          memberId: 'member-789',
          memberName: 'Jane Doe',
          amount: 250.00,
          donationDate: '2025-01-20T14:00:00Z',
          method: 'check' as DonationMethod,
          categoryId: 'category-123',
          categoryName: 'Building Fund',
          form990Fields: {
            lineItem: '1a_cash_contributions' as Form990LineItem,
            isQuidProQuo: false,
            isAnonymous: false,
            restrictionType: 'temporarily_restricted' as RestrictionType,
          },
          isTaxDeductible: true,
        };

        mockCreate.mockResolvedValue({ ...mockDonation, ...newDonationData });

        const result = await donationsService.createDonation(newDonationData);

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            ...newDonationData,
            taxYear: 2025,
            status: 'pending',
            isReceiptSent: false,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          })
        );
        expect(result).toBeDefined();
        expect(result.amount).toBe(250.00);
        expect(result.status).toBe('pending');
      });

      it('should create anonymous donation without member information', async () => {
        const anonymousData = {
          amount: 100.00,
          donationDate: '2025-01-20T14:00:00Z',
          method: 'cash' as DonationMethod,
          categoryId: 'category-456',
          categoryName: 'Missions',
          form990Fields: {
            lineItem: '1a_cash_contributions' as Form990LineItem,
            isQuidProQuo: false,
            isAnonymous: true,
            restrictionType: 'unrestricted' as RestrictionType,
          },
          isTaxDeductible: true,
        };

        mockCreate.mockResolvedValue({ ...mockAnonymousDonation, ...anonymousData });

        const result = await donationsService.createDonation(anonymousData);

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            ...anonymousData,
            memberId: undefined,
            memberName: undefined,
          })
        );
        expect(result.form990Fields.isAnonymous).toBe(true);
      });

      it('should handle quid pro quo donations correctly', async () => {
        const quidProQuoData = {
          memberId: 'member-123',
          memberName: 'Bob Johnson',
          amount: 500.00,
          donationDate: '2025-01-20T14:00:00Z',
          method: 'credit_card' as DonationMethod,
          categoryId: 'category-789',
          categoryName: 'Charity Auction',
          form990Fields: {
            lineItem: '1a_cash_contributions' as Form990LineItem,
            isQuidProQuo: true,
            quidProQuoValue: 100.00,
            isAnonymous: false,
            restrictionType: 'unrestricted' as RestrictionType,
          },
          isTaxDeductible: true,
        };

        mockCreate.mockResolvedValue({ ...mockDonation, ...quidProQuoData });

        const result = await donationsService.createDonation(quidProQuoData);

        expect(result.form990Fields.isQuidProQuo).toBe(true);
        expect(result.form990Fields.quidProQuoValue).toBe(100.00);
      });

      it('should validate donation amount is positive', async () => {
        const invalidData = {
          amount: -50.00,
          donationDate: '2025-01-20T14:00:00Z',
          method: 'cash' as DonationMethod,
          categoryId: 'category-123',
          categoryName: 'General',
          form990Fields: {
            lineItem: '1a_cash_contributions' as Form990LineItem,
            isQuidProQuo: false,
            isAnonymous: false,
            restrictionType: 'unrestricted' as RestrictionType,
          },
          isTaxDeductible: true,
        };

        await expect(donationsService.createDonation(invalidData))
          .rejects.toThrow('Donation amount must be greater than 0');
      });

      it('should validate future donation dates', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);

        const futureData = {
          amount: 100.00,
          donationDate: futureDate.toISOString(),
          method: 'cash' as DonationMethod,
          categoryId: 'category-123',
          categoryName: 'General',
          form990Fields: {
            lineItem: '1a_cash_contributions' as Form990LineItem,
            isQuidProQuo: false,
            isAnonymous: false,
            restrictionType: 'unrestricted' as RestrictionType,
          },
          isTaxDeductible: true,
        };

        await expect(donationsService.createDonation(futureData))
          .rejects.toThrow('Donation date cannot be in the future');
      });
    });

    describe('updateDonation', () => {
      it('should update donation with automatic updatedAt timestamp', async () => {
        const updateData = {
          amount: 150.00,
          note: 'Updated note',
          status: 'verified' as DonationStatus,
          verifiedBy: 'admin-456',
        };

        mockUpdate.mockResolvedValue({ ...mockDonation, ...updateData });

        const result = await donationsService.updateDonation('donation-123', updateData);

        expect(mockUpdate).toHaveBeenCalledWith('donation-123', 
          expect.objectContaining({
            ...updateData,
            updatedAt: expect.any(Date),
            verifiedAt: expect.any(Date), // Should be set when status changes to verified
          })
        );
        expect(result.amount).toBe(150.00);
        expect(result.status).toBe('verified');
      });

      it('should set verifiedAt when status changes to verified', async () => {
        const updateData = {
          status: 'verified' as DonationStatus,
          verifiedBy: 'admin-123',
        };

        mockUpdate.mockResolvedValue({ ...mockDonation, ...updateData });

        await donationsService.updateDonation('donation-123', updateData);

        expect(mockUpdate).toHaveBeenCalledWith('donation-123',
          expect.objectContaining({
            status: 'verified',
            verifiedBy: 'admin-123',
            verifiedAt: expect.any(Date),
          })
        );
      });

      it('should set receiptSentAt when isReceiptSent changes to true', async () => {
        const updateData = {
          isReceiptSent: true,
          receiptNumber: 'R-2025-003',
        };

        mockUpdate.mockResolvedValue({ ...mockDonation, ...updateData });

        await donationsService.updateDonation('donation-123', updateData);

        expect(mockUpdate).toHaveBeenCalledWith('donation-123',
          expect.objectContaining({
            isReceiptSent: true,
            receiptSentAt: expect.any(Date),
          })
        );
      });
    });

    describe('getDonationById', () => {
      it('should get donation by ID', async () => {
        mockGetById.mockResolvedValue(mockDonation);

        const result = await donationsService.getDonationById('donation-123');

        expect(mockGetById).toHaveBeenCalledWith('donation-123');
        expect(result).toEqual(mockDonation);
      });

      it('should return null for non-existent donation', async () => {
        mockGetById.mockResolvedValue(null);

        const result = await donationsService.getDonationById('non-existent');

        expect(result).toBeNull();
      });
    });

    describe('deleteDonation', () => {
      it('should delete donation by ID', async () => {
        mockDelete.mockResolvedValue(undefined);

        await donationsService.deleteDonation('donation-123');

        expect(mockDelete).toHaveBeenCalledWith('donation-123');
      });
    });
  });

  describe('Role-Based Access Control', () => {
    describe('getDonationsByMember', () => {
      it('should get donations for specific member', async () => {
        const memberDonations = [mockDonation];
        mockGetWhere.mockResolvedValue(memberDonations);

        const result = await donationsService.getDonationsByMember('member-456');

        expect(mockGetWhere).toHaveBeenCalledWith('memberId', '==', 'member-456');
        expect(result).toEqual(memberDonations);
      });

      it('should return empty array for member with no donations', async () => {
        mockGetWhere.mockResolvedValue([]);

        const result = await donationsService.getDonationsByMember('member-new');

        expect(result).toEqual([]);
      });
    });

    describe('getDonationsForRole', () => {
      it('should return all donations for admin role', async () => {
        const allDonations = [mockDonation, mockAnonymousDonation];
        mockGetAll.mockResolvedValue(allDonations);

        const result = await donationsService.getDonationsForRole('admin');

        expect(mockGetAll).toHaveBeenCalled();
        expect(result).toEqual(allDonations);
      });

      it('should return aggregate view for pastor role', async () => {
        const donations = [mockDonation, mockAnonymousDonation];
        mockGetAll.mockResolvedValue(donations);

        const result = await donationsService.getDonationsForRole('pastor');

        expect(result).toHaveLength(2);
        // Verify sensitive member data is sanitized for pastor role
        result.forEach(donation => {
          if (donation.form990Fields.isAnonymous) {
            expect(donation.memberId).toBeUndefined();
            expect(donation.memberName).toBeUndefined();
          }
        });
      });

      it('should throw error for member role accessing all donations', async () => {
        await expect(donationsService.getDonationsForRole('member'))
          .rejects.toThrow('Members can only access their own donation data');
      });
    });

    describe('getMemberDonationSummary', () => {
      it('should calculate donation summary for member', async () => {
        const memberDonations = [
          { ...mockDonation, amount: 100.00 },
          { ...mockDonation, id: 'donation-456', amount: 150.00 },
        ];
        mockGetWhere.mockResolvedValue(memberDonations);

        const result = await donationsService.getMemberDonationSummary('member-456', 2025);

        expect(result.totalAmount).toBe(250.00);
        expect(result.donationCount).toBe(2);
        expect(result.averageDonation).toBe(125.00);
        expect(result.taxYear).toBe(2025);
      });

      it('should return empty summary for member with no donations', async () => {
        mockGetWhere.mockResolvedValue([]);

        const result = await donationsService.getMemberDonationSummary('member-new', 2025);

        expect(result.totalAmount).toBe(0);
        expect(result.donationCount).toBe(0);
        expect(result.averageDonation).toBe(0);
      });
    });
  });

  describe('Date Range Queries', () => {
    describe('getDonationsInDateRange', () => {
      it('should get donations within date range', async () => {
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-31');
        const rangeDonations = [mockDonation];

        mockSearch.mockResolvedValue({ items: rangeDonations });

        const result = await donationsService.getDonationsInDateRange(startDate, endDate);

        expect(mockSearch).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.arrayContaining([
              expect.objectContaining({ field: 'donationDate' }),
            ]),
          })
        );
        expect(result).toEqual(rangeDonations);
      });

      it('should handle same-day date range', async () => {
        const sameDay = new Date('2025-01-15');
        mockSearch.mockResolvedValue({ items: [mockDonation] });

        const result = await donationsService.getDonationsInDateRange(sameDay, sameDay);

        expect(result).toHaveLength(1);
      });
    });

    describe('getDonationsByTaxYear', () => {
      it('should get donations for specific tax year', async () => {
        const taxYearDonations = [mockDonation];
        mockGetWhere.mockResolvedValue(taxYearDonations);

        const result = await donationsService.getDonationsByTaxYear(2025);

        expect(mockGetWhere).toHaveBeenCalledWith('taxYear', '==', 2025);
        expect(result).toEqual(taxYearDonations);
      });
    });
  });

  describe('Category and Method Filtering', () => {
    describe('getDonationsByCategory', () => {
      it('should get donations for specific category', async () => {
        const categoryDonations = [mockDonation];
        mockGetWhere.mockResolvedValue(categoryDonations);

        const result = await donationsService.getDonationsByCategory('category-789');

        expect(mockGetWhere).toHaveBeenCalledWith('categoryId', '==', 'category-789');
        expect(result).toEqual(categoryDonations);
      });
    });

    describe('getDonationsByMethod', () => {
      it('should get donations by payment method', async () => {
        const methodDonations = [mockDonation];
        mockGetWhere.mockResolvedValue(methodDonations);

        const result = await donationsService.getDonationsByMethod('credit_card');

        expect(mockGetWhere).toHaveBeenCalledWith('method', '==', 'credit_card');
        expect(result).toEqual(methodDonations);
      });
    });

    describe('getDonationsByStatus', () => {
      it('should get donations by status', async () => {
        const statusDonations = [mockDonation];
        mockGetWhere.mockResolvedValue(statusDonations);

        const result = await donationsService.getDonationsByStatus('verified');

        expect(mockGetWhere).toHaveBeenCalledWith('status', '==', 'verified');
        expect(result).toEqual(statusDonations);
      });
    });
  });

  describe('Advanced Queries', () => {
    describe('searchDonations', () => {
      it('should search donations with multiple filters', async () => {
        const filters: DonationReportFilters = {
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2025-01-31T23:59:59Z',
          categoryIds: ['category-789'],
          methods: ['credit_card'],
          status: ['verified'],
          minAmount: 50.00,
          maxAmount: 500.00,
        };

        const searchResults = [mockDonation];
        mockSearch.mockResolvedValue({ items: searchResults });

        const result = await donationsService.searchDonations(filters);

        expect(mockSearch).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.arrayContaining([
              expect.objectContaining({ field: 'donationDate' }),
              expect.objectContaining({ field: 'categoryId' }),
              expect.objectContaining({ field: 'method' }),
              expect.objectContaining({ field: 'status' }),
              expect.objectContaining({ field: 'amount' }),
            ]),
          })
        );
        expect(result).toEqual(searchResults);
      });

      it('should handle empty search filters', async () => {
        mockSearch.mockResolvedValue({ items: [] });

        const result = await donationsService.searchDonations({});

        expect(result).toEqual([]);
      });
    });

    describe('getRecentDonations', () => {
      it('should get recent donations with default limit', async () => {
        const recentDonations = [mockDonation];
        mockSearch.mockResolvedValue({ items: recentDonations });

        const result = await donationsService.getRecentDonations();

        expect(mockSearch).toHaveBeenCalledWith(
          expect.objectContaining({
            orderByField: 'createdAt',
            orderDirection: 'desc',
          }),
          expect.objectContaining({ limit: 20 })
        );
        expect(result).toEqual(recentDonations);
      });

      it('should respect custom limit', async () => {
        mockSearch.mockResolvedValue({ items: [] });

        await donationsService.getRecentDonations(50);

        expect(mockSearch).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ limit: 50 })
        );
      });
    });

    describe('getLargeDonations', () => {
      it('should get donations above threshold amount', async () => {
        const largeDonations = [{ ...mockDonation, amount: 1000.00 }];
        mockSearch.mockResolvedValue({ items: largeDonations });

        const result = await donationsService.getLargeDonations(500.00);

        expect(mockSearch).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.arrayContaining([
              expect.objectContaining({ 
                field: 'amount',
                operator: '>=',
                value: 500.00
              }),
            ]),
          })
        );
        expect(result).toEqual(largeDonations);
      });
    });
  });

  describe('Financial Reporting', () => {
    describe('generateFinancialSummary', () => {
      it('should generate comprehensive financial summary', async () => {
        const donations = [
          { ...mockDonation, amount: 100.00, method: 'credit_card' as DonationMethod },
          { ...mockAnonymousDonation, amount: 50.00, method: 'cash' as DonationMethod },
        ];
        mockSearch.mockResolvedValue({ items: donations });

        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-31');

        const result = await donationsService.generateFinancialSummary(startDate, endDate);

        expect(result.totalDonations).toBe(150.00);
        expect(result.donationCount).toBe(2);
        expect(result.averageDonation).toBe(75.00);
        expect(result.byMethod).toHaveProperty('credit_card');
        expect(result.byMethod).toHaveProperty('cash');
        expect(result.byCategory).toHaveProperty('category-789');
        expect(result.form990Breakdown).toHaveProperty('1a_cash_contributions');
      });

      it('should handle empty date range', async () => {
        mockSearch.mockResolvedValue({ items: [] });

        const startDate = new Date('2025-02-01');
        const endDate = new Date('2025-02-28');

        const result = await donationsService.generateFinancialSummary(startDate, endDate);

        expect(result.totalDonations).toBe(0);
        expect(result.donationCount).toBe(0);
        expect(result.averageDonation).toBe(0);
      });
    });

    describe('getDonationStatistics', () => {
      it('should get comprehensive donation statistics', async () => {
        const allDonations = [mockDonation, mockAnonymousDonation];
        mockGetAll.mockResolvedValue(allDonations);

        const result = await donationsService.getDonationStatistics();

        expect(result.totalDonations).toBe(2);
        expect(result.totalAmount).toBe(150.00);
        expect(result.averageDonation).toBe(75.00);
        expect(result.donationsByStatus.verified).toBe(1);
        expect(result.donationsByStatus.pending).toBe(1);
        expect(result.donationsByMethod.credit_card).toBe(1);
        expect(result.donationsByMethod.cash).toBe(1);
      });
    });
  });

  describe('Real-time Subscriptions', () => {
    describe('subscribeToDonations', () => {
      it('should set up subscription with callback', () => {
        const callback = vi.fn();
        const subscriptionId = 'sub-123';
        mockSubscribeToCollection.mockReturnValue(subscriptionId);

        const result = donationsService.subscribeToDonations(callback);

        expect(mockSubscribeToCollection).toHaveBeenCalledWith(
          callback,
          expect.any(Array),
          undefined
        );
        expect(result).toBe(subscriptionId);
      });

      it('should set up subscription with role-based constraints', () => {
        const callback = vi.fn();
        mockSubscribeToCollection.mockReturnValue('sub-456');

        donationsService.subscribeToDonations(callback, 'member', 'member-123');

        expect(mockSubscribeToCollection).toHaveBeenCalledWith(
          callback,
          expect.arrayContaining([
            expect.objectContaining({ 
              type: 'where',
              fieldPath: 'memberId',
              opStr: '==',
              value: 'member-123'
            })
          ])
        );
      });
    });

    describe('unsubscribeFromDonations', () => {
      it('should unsubscribe from donation updates', () => {
        mockUnsubscribe.mockReturnValue(true);

        const result = donationsService.unsubscribeFromDonations('sub-123');

        expect(mockUnsubscribe).toHaveBeenCalledWith('sub-123');
        expect(result).toBe(true);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid donation amounts', async () => {
      await expect(donationsService.createDonation({
        amount: 0,
        donationDate: '2025-01-15T10:00:00Z',
        method: 'cash',
        categoryId: 'cat-123',
        categoryName: 'General',
        form990Fields: {
          lineItem: '1a_cash_contributions',
          isQuidProQuo: false,
          isAnonymous: false,
        },
        isTaxDeductible: true,
      })).rejects.toThrow('Donation amount must be greater than 0');
    });

    it('should handle very large donation amounts', async () => {
      const largeAmount = 1000000.00;
      mockCreate.mockResolvedValue({ ...mockDonation, amount: largeAmount });

      const result = await donationsService.createDonation({
        amount: largeAmount,
        donationDate: '2025-01-15T10:00:00Z',
        method: 'bank_transfer',
        categoryId: 'cat-building',
        categoryName: 'Building Fund',
        form990Fields: {
          lineItem: '1a_cash_contributions',
          isQuidProQuo: false,
          isAnonymous: false,
        },
        isTaxDeductible: true,
      });

      expect(result.amount).toBe(largeAmount);
    });

    it('should handle missing form990Fields', async () => {
      await expect(donationsService.createDonation({
        amount: 100,
        donationDate: '2025-01-15T10:00:00Z',
        method: 'cash',
        categoryId: 'cat-123',
        categoryName: 'General',
        form990Fields: null as any,
        isTaxDeductible: true,
      })).rejects.toThrow('Form 990 fields are required');
    });

    it('should handle donations with decimal precision', async () => {
      const preciseAmount = 123.45;
      mockCreate.mockResolvedValue({ ...mockDonation, amount: preciseAmount });

      const result = await donationsService.createDonation({
        amount: preciseAmount,
        donationDate: '2025-01-15T10:00:00Z',
        method: 'credit_card',
        categoryId: 'cat-123',
        categoryName: 'General',
        form990Fields: {
          lineItem: '1a_cash_contributions',
          isQuidProQuo: false,
          isAnonymous: false,
        },
        isTaxDeductible: true,
      });

      expect(result.amount).toBe(preciseAmount);
    });
  });

  describe('Bulk Operations', () => {
    describe('createMultipleDonations', () => {
      it('should create multiple donations in batch', async () => {
        const donationsData = [
          {
            memberId: 'member-1',
            memberName: 'Member One',
            amount: 100,
            donationDate: '2025-01-15T10:00:00Z',
            method: 'cash' as DonationMethod,
            categoryId: 'cat-1',
            categoryName: 'General',
            form990Fields: {
              lineItem: '1a_cash_contributions' as Form990LineItem,
              isQuidProQuo: false,
              isAnonymous: false,
            },
            isTaxDeductible: true,
          },
          {
            memberId: 'member-2',
            memberName: 'Member Two',
            amount: 150,
            donationDate: '2025-01-15T11:00:00Z',
            method: 'check' as DonationMethod,
            categoryId: 'cat-2',
            categoryName: 'Missions',
            form990Fields: {
              lineItem: '1a_cash_contributions' as Form990LineItem,
              isQuidProQuo: false,
              isAnonymous: false,
            },
            isTaxDeductible: true,
          },
        ];

        // Mock the createMultiple method from BaseFirestoreService
        const mockCreateMultiple = vi.fn().mockResolvedValue({
          successful: 2,
          failed: 0,
          errors: [],
        });
        donationsService.createMultiple = mockCreateMultiple;

        const result = await donationsService.createMultipleDonations(donationsData);

        expect(mockCreateMultiple).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ 
              data: expect.objectContaining({ amount: 100 }) 
            }),
            expect.objectContaining({ 
              data: expect.objectContaining({ amount: 150 }) 
            }),
          ])
        );
        expect(result.successful).toBe(2);
        expect(result.failed).toBe(0);
      });
    });
  });
});