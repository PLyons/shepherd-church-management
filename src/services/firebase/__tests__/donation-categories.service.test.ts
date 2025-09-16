import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { DonationCategoriesService } from '../donation-categories.service';
import {
  DonationCategory,
  DonationCategoryDocument,
  Form990LineItem,
} from '../../../types/donations';

// Mock Firebase
vi.mock('../../../lib/firebase', () => ({
  db: {},
}));

// Mock functions hoisted to ensure proper initialization
const mockCreate = vi.hoisted(() => vi.fn());
const mockGetById = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());
const mockGetAll = vi.hoisted(() => vi.fn());
const mockGetWhere = vi.hoisted(() => vi.fn());
const mockSearch = vi.hoisted(() => vi.fn());
const mockCount = vi.hoisted(() => vi.fn());
const mockSubscribeToCollection = vi.hoisted(() => vi.fn());
const mockUnsubscribe = vi.hoisted(() => vi.fn());
const mockCreateMultiple = vi.hoisted(() => vi.fn());
const mockUpdateMultiple = vi.hoisted(() => vi.fn());

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
    createMultiple = mockCreateMultiple;
    updateMultiple = mockUpdateMultiple;

    constructor(
      db: any,
      collectionName: string,
      docToClient: any,
      clientToDoc: any
    ) {
      // Store for verification
    }
  },
}));

describe('DonationCategoriesService', () => {
  let categoriesService: DonationCategoriesService;

  const mockTithesCategory: DonationCategory = {
    id: 'category-tithes-123',
    name: 'Tithes',
    description: 'Regular tithe contributions',
    isActive: true,
    defaultForm990LineItem: '1a_cash_contributions',
    isTaxDeductible: true,
    annualGoal: 120000.0,
    currentYearTotal: 45000.0,
    lastYearTotal: 110000.0,
    totalAmount: 250000.0,
    donationCount: 850,
    lastDonationDate: '2025-01-15T10:00:00Z',
    averageDonation: 294.12,
    includeInReports: true,
    reportingCategory: 'General Operating',
    displayOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    createdBy: 'admin-123',
  };

  const mockOfferingsCategory: DonationCategory = {
    id: 'category-offerings-456',
    name: 'Offerings',
    description: 'Special offering donations',
    isActive: true,
    defaultForm990LineItem: '1a_cash_contributions',
    isTaxDeductible: true,
    annualGoal: 60000.0,
    currentYearTotal: 18500.0,
    lastYearTotal: 55000.0,
    totalAmount: 125000.0,
    donationCount: 420,
    lastDonationDate: '2025-01-14T14:30:00Z',
    averageDonation: 297.62,
    includeInReports: true,
    reportingCategory: 'General Operating',
    displayOrder: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2025-01-14T14:30:00Z',
    createdBy: 'admin-123',
  };

  const mockBuildingFundCategory: DonationCategory = {
    id: 'category-building-789',
    name: 'Building Fund',
    description: 'Capital campaign for new church building',
    isActive: true,
    defaultForm990LineItem: '1a_cash_contributions',
    isTaxDeductible: true,
    annualGoal: 500000.0,
    currentYearTotal: 75000.0,
    lastYearTotal: 125000.0,
    totalAmount: 350000.0,
    donationCount: 180,
    lastDonationDate: '2025-01-12T09:15:00Z',
    averageDonation: 1944.44,
    includeInReports: true,
    reportingCategory: 'Capital Campaign',
    displayOrder: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2025-01-12T09:15:00Z',
    createdBy: 'admin-123',
  };

  const mockMissionsCategory: DonationCategory = {
    id: 'category-missions-101',
    name: 'Missions',
    description: 'Support for missionary work and global outreach',
    isActive: true,
    defaultForm990LineItem: '1a_cash_contributions',
    isTaxDeductible: true,
    annualGoal: 40000.0,
    currentYearTotal: 12000.0,
    lastYearTotal: 38000.0,
    totalAmount: 95000.0,
    donationCount: 320,
    lastDonationDate: '2025-01-10T16:45:00Z',
    averageDonation: 296.88,
    includeInReports: true,
    reportingCategory: 'Ministry Programs',
    displayOrder: 4,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2025-01-10T16:45:00Z',
    createdBy: 'pastor-456',
  };

  const mockInactiveCategory: DonationCategory = {
    id: 'category-inactive-999',
    name: 'Old Fund',
    description: 'Discontinued donation category',
    isActive: false,
    defaultForm990LineItem: '1a_cash_contributions',
    isTaxDeductible: true,
    currentYearTotal: 0.0,
    lastYearTotal: 5000.0,
    totalAmount: 15000.0,
    donationCount: 45,
    lastDonationDate: '2024-12-15T12:00:00Z',
    averageDonation: 333.33,
    includeInReports: false,
    displayOrder: 99,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-12-31T23:59:59Z',
    createdBy: 'admin-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    categoriesService = new DonationCategoriesService();
  });

  describe('Basic CRUD Operations', () => {
    describe('createCategory', () => {
      it('should create a new donation category with proper defaults', async () => {
        const newCategoryData = {
          name: 'Youth Ministry',
          description: 'Support for youth programs and activities',
          defaultForm990LineItem: '1a_cash_contributions' as Form990LineItem,
          isTaxDeductible: true,
          annualGoal: 25000.0,
        };

        const expectedCategory = {
          ...newCategoryData,
          id: 'category-youth-123',
          isActive: true,
          currentYearTotal: 0.0,
          lastYearTotal: 0.0,
          totalAmount: 0.0,
          donationCount: 0,
          averageDonation: 0.0,
          includeInReports: true,
          displayOrder: 5,
          createdBy: 'admin-123',
        };

        mockCreate.mockResolvedValue(expectedCategory);

        const result = await categoriesService.createCategory(
          newCategoryData,
          'admin-123'
        );

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            ...newCategoryData,
            isActive: true,
            currentYearTotal: 0.0,
            lastYearTotal: 0.0,
            totalAmount: 0.0,
            donationCount: 0,
            averageDonation: 0.0,
            includeInReports: true,
            displayOrder: expect.any(Number),
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            createdBy: 'admin-123',
          })
        );
        expect(result).toBeDefined();
        expect(result.name).toBe('Youth Ministry');
        expect(result.isActive).toBe(true);
      });

      it('should validate category name uniqueness', async () => {
        const duplicateData = {
          name: 'Tithes',
          defaultForm990LineItem: '1a_cash_contributions' as Form990LineItem,
          isTaxDeductible: true,
        };

        mockGetWhere.mockResolvedValue([mockTithesCategory]);

        await expect(
          categoriesService.createCategory(duplicateData, 'admin-123')
        ).rejects.toThrow('Category name "Tithes" already exists');
      });

      it('should validate required fields', async () => {
        const invalidData = {
          name: '',
          defaultForm990LineItem: '1a_cash_contributions' as Form990LineItem,
          isTaxDeductible: true,
        };

        await expect(
          categoriesService.createCategory(invalidData, 'admin-123')
        ).rejects.toThrow('Category name is required');
      });

      it('should validate annual goal is positive when provided', async () => {
        const invalidGoalData = {
          name: 'Invalid Goal',
          defaultForm990LineItem: '1a_cash_contributions' as Form990LineItem,
          isTaxDeductible: true,
          annualGoal: -1000.0,
        };

        await expect(
          categoriesService.createCategory(invalidGoalData, 'admin-123')
        ).rejects.toThrow('Annual goal must be greater than 0');
      });
    });

    describe('getCategoryById', () => {
      it('should get category by ID', async () => {
        mockGetById.mockResolvedValue(mockTithesCategory);

        const result = await categoriesService.getCategoryById(
          'category-tithes-123'
        );

        expect(mockGetById).toHaveBeenCalledWith('category-tithes-123');
        expect(result).toEqual(mockTithesCategory);
      });

      it('should return null for non-existent category', async () => {
        mockGetById.mockResolvedValue(null);

        const result = await categoriesService.getCategoryById('non-existent');

        expect(result).toBeNull();
      });
    });

    describe('updateCategory', () => {
      it('should update category with automatic updatedAt timestamp', async () => {
        const updateData = {
          description: 'Updated description for tithes',
          annualGoal: 130000.0,
        };

        mockUpdate.mockResolvedValue({ ...mockTithesCategory, ...updateData });

        const result = await categoriesService.updateCategory(
          'category-tithes-123',
          updateData
        );

        expect(mockUpdate).toHaveBeenCalledWith(
          'category-tithes-123',
          expect.objectContaining({
            ...updateData,
            updatedAt: expect.any(Date),
          })
        );
        expect(result.description).toBe('Updated description for tithes');
        expect(result.annualGoal).toBe(130000.0);
      });

      it('should validate name uniqueness on update', async () => {
        mockGetWhere.mockResolvedValue([mockOfferingsCategory]);

        await expect(
          categoriesService.updateCategory('category-tithes-123', {
            name: 'Offerings',
          })
        ).rejects.toThrow('Category name "Offerings" already exists');
      });

      it('should allow updating with same name (no change)', async () => {
        mockGetById.mockResolvedValue(mockTithesCategory);
        mockGetWhere.mockResolvedValue([mockTithesCategory]);
        mockUpdate.mockResolvedValue(mockTithesCategory);

        const result = await categoriesService.updateCategory(
          'category-tithes-123',
          { name: 'Tithes' }
        );

        expect(result).toBeDefined();
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    describe('deleteCategory', () => {
      it('should delete category by ID', async () => {
        mockDelete.mockResolvedValue(undefined);

        await categoriesService.deleteCategory('category-inactive-999');

        expect(mockDelete).toHaveBeenCalledWith('category-inactive-999');
      });

      it('should prevent deletion of active categories with donations', async () => {
        // Mock that this category has donations
        const mockDonationsService = {
          getDonationsByCategory: vi
            .fn()
            .mockResolvedValue([{ id: 'donation-1' }]),
        };

        await expect(
          categoriesService.deleteCategory('category-tithes-123')
        ).rejects.toThrow('Cannot delete category with existing donations');
      });
    });
  });

  describe('Active Categories Management', () => {
    describe('getActiveCategories', () => {
      it('should get only active categories sorted by display order', async () => {
        const activeCategories = [
          mockTithesCategory,
          mockOfferingsCategory,
          mockBuildingFundCategory,
          mockMissionsCategory,
        ];
        mockGetWhere.mockResolvedValue(activeCategories);

        const result = await categoriesService.getActiveCategories();

        expect(mockGetWhere).toHaveBeenCalledWith('isActive', '==', true);
        expect(result).toEqual(activeCategories);
      });

      it('should return empty array when no active categories exist', async () => {
        mockGetWhere.mockResolvedValue([]);

        const result = await categoriesService.getActiveCategories();

        expect(result).toEqual([]);
      });
    });

    describe('getAllCategories', () => {
      it('should get all categories including inactive ones', async () => {
        const allCategories = [
          mockTithesCategory,
          mockOfferingsCategory,
          mockBuildingFundCategory,
          mockMissionsCategory,
          mockInactiveCategory,
        ];
        mockGetAll.mockResolvedValue(allCategories);

        const result = await categoriesService.getAllCategories();

        expect(mockGetAll).toHaveBeenCalled();
        expect(result).toEqual(allCategories);
        expect(result).toHaveLength(5);
      });
    });

    describe('activateCategory', () => {
      it('should activate an inactive category', async () => {
        const activatedCategory = { ...mockInactiveCategory, isActive: true };
        mockUpdate.mockResolvedValue(activatedCategory);

        const result = await categoriesService.activateCategory(
          'category-inactive-999'
        );

        expect(mockUpdate).toHaveBeenCalledWith(
          'category-inactive-999',
          expect.objectContaining({
            isActive: true,
            updatedAt: expect.any(Date),
          })
        );
        expect(result.isActive).toBe(true);
      });
    });

    describe('deactivateCategory', () => {
      it('should deactivate an active category', async () => {
        const deactivatedCategory = { ...mockTithesCategory, isActive: false };
        mockUpdate.mockResolvedValue(deactivatedCategory);

        const result = await categoriesService.deactivateCategory(
          'category-tithes-123'
        );

        expect(mockUpdate).toHaveBeenCalledWith(
          'category-tithes-123',
          expect.objectContaining({
            isActive: false,
            updatedAt: expect.any(Date),
          })
        );
        expect(result.isActive).toBe(false);
      });

      it('should validate before deactivating category with active donations', async () => {
        // This would need integration with donations service to check for active donations
        const activeCategory = mockTithesCategory;

        // Mock the update to throw validation error
        mockUpdate.mockRejectedValue(
          new Error(
            'Cannot deactivate category with donations in the current tax year'
          )
        );

        await expect(
          categoriesService.deactivateCategory('category-tithes-123')
        ).rejects.toThrow(
          'Cannot deactivate category with donations in the current tax year'
        );
      });
    });
  });

  describe('Statistics Management', () => {
    describe('updateCategoryStatistics', () => {
      it('should update category statistics with donation data', async () => {
        const statisticsUpdate = {
          totalAmount: 300000.0,
          donationCount: 900,
          currentYearTotal: 50000.0,
          averageDonation: 333.33,
          lastDonationDate: '2025-01-16T12:00:00Z',
        };

        const updatedCategory = { ...mockTithesCategory, ...statisticsUpdate };
        mockUpdate.mockResolvedValue(updatedCategory);

        const result = await categoriesService.updateCategoryStatistics(
          'category-tithes-123',
          statisticsUpdate
        );

        expect(mockUpdate).toHaveBeenCalledWith(
          'category-tithes-123',
          expect.objectContaining({
            ...statisticsUpdate,
            updatedAt: expect.any(Date),
          })
        );
        expect(result.totalAmount).toBe(300000.0);
        expect(result.donationCount).toBe(900);
      });

      it('should handle zero statistics gracefully', async () => {
        const zeroStats = {
          totalAmount: 0.0,
          donationCount: 0,
          currentYearTotal: 0.0,
          averageDonation: 0.0,
        };

        const updatedCategory = { ...mockTithesCategory, ...zeroStats };
        mockUpdate.mockResolvedValue(updatedCategory);

        const result = await categoriesService.updateCategoryStatistics(
          'category-tithes-123',
          zeroStats
        );

        expect(result.totalAmount).toBe(0.0);
        expect(result.donationCount).toBe(0);
        expect(result.averageDonation).toBe(0.0);
      });
    });

    describe('recalculateCategoryStatistics', () => {
      it('should recalculate statistics from donations service', async () => {
        // This would integrate with donations service to recalculate
        const recalculatedCategory = {
          ...mockTithesCategory,
          totalAmount: 275000.0,
          donationCount: 875,
          averageDonation: 314.29,
        };

        mockUpdate.mockResolvedValue(recalculatedCategory);

        const result = await categoriesService.recalculateCategoryStatistics(
          'category-tithes-123'
        );

        expect(result.totalAmount).toBeGreaterThan(0);
        expect(result.donationCount).toBeGreaterThan(0);
      });
    });
  });

  describe('Default Categories Management', () => {
    describe('initializeDefaultCategories', () => {
      it('should create default church categories', async () => {
        const defaultCategories = [
          { name: 'Tithes', displayOrder: 1 },
          { name: 'Offerings', displayOrder: 2 },
          { name: 'Building Fund', displayOrder: 3 },
          { name: 'Missions', displayOrder: 4 },
          { name: 'Benevolence', displayOrder: 5 },
        ];

        mockCreateMultiple.mockResolvedValue({
          successful: 5,
          failed: 0,
          errors: [],
        });

        const result =
          await categoriesService.initializeDefaultCategories('admin-123');

        expect(mockCreateMultiple).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              data: expect.objectContaining({ name: 'Tithes' }),
            }),
            expect.objectContaining({
              data: expect.objectContaining({ name: 'Offerings' }),
            }),
            expect.objectContaining({
              data: expect.objectContaining({ name: 'Building Fund' }),
            }),
            expect.objectContaining({
              data: expect.objectContaining({ name: 'Missions' }),
            }),
            expect.objectContaining({
              data: expect.objectContaining({ name: 'Benevolence' }),
            }),
          ])
        );
        expect(result.successful).toBe(5);
        expect(result.failed).toBe(0);
      });

      it('should skip creating categories that already exist', async () => {
        mockGetWhere.mockResolvedValue([
          mockTithesCategory,
          mockOfferingsCategory,
        ]);

        mockCreateMultiple.mockResolvedValue({
          successful: 3,
          failed: 0,
          errors: [],
        });

        const result =
          await categoriesService.initializeDefaultCategories('admin-123');

        // Should only create 3 new categories (Building Fund, Missions, Benevolence)
        expect(result.successful).toBe(3);
      });
    });

    describe('getDefaultCategoryStructure', () => {
      it('should return standard church category structure', () => {
        const structure = categoriesService.getDefaultCategoryStructure();

        expect(structure).toHaveLength(5);
        expect(structure[0].name).toBe('Tithes');
        expect(structure[1].name).toBe('Offerings');
        expect(structure[2].name).toBe('Building Fund');
        expect(structure[3].name).toBe('Missions');
        expect(structure[4].name).toBe('Benevolence');

        structure.forEach((category) => {
          expect(category.defaultForm990LineItem).toBe('1a_cash_contributions');
          expect(category.isTaxDeductible).toBe(true);
        });
      });
    });
  });

  describe('Category Ordering Management', () => {
    describe('reorderCategories', () => {
      it('should update display order for multiple categories', async () => {
        const orderUpdates = [
          { categoryId: 'category-missions-101', newOrder: 1 },
          { categoryId: 'category-tithes-123', newOrder: 2 },
          { categoryId: 'category-offerings-456', newOrder: 3 },
          { categoryId: 'category-building-789', newOrder: 4 },
        ];

        const updatePromises = orderUpdates.map((update) =>
          Promise.resolve({
            ...mockTithesCategory,
            displayOrder: update.newOrder,
          })
        );
        mockUpdate.mockImplementation(() => Promise.resolve(updatePromises[0]));

        const result = await categoriesService.reorderCategories(orderUpdates);

        expect(mockUpdate).toHaveBeenCalledTimes(4);
        orderUpdates.forEach((update) => {
          expect(mockUpdate).toHaveBeenCalledWith(
            update.categoryId,
            expect.objectContaining({
              displayOrder: update.newOrder,
              updatedAt: expect.any(Date),
            })
          );
        });
        expect(result).toHaveLength(4);
      });

      it('should validate unique display orders', async () => {
        const duplicateOrderUpdates = [
          { categoryId: 'category-tithes-123', newOrder: 1 },
          { categoryId: 'category-offerings-456', newOrder: 1 }, // Duplicate order
        ];

        await expect(
          categoriesService.reorderCategories(duplicateOrderUpdates)
        ).rejects.toThrow('Duplicate display order found');
      });

      it('should validate positive display orders', async () => {
        const invalidOrderUpdates = [
          { categoryId: 'category-tithes-123', newOrder: -1 },
        ];

        await expect(
          categoriesService.reorderCategories(invalidOrderUpdates)
        ).rejects.toThrow('Display order must be greater than 0');
      });
    });

    describe('getNextDisplayOrder', () => {
      it('should return next available display order', async () => {
        const activeCategories = [
          mockTithesCategory,
          mockOfferingsCategory,
          mockBuildingFundCategory,
          mockMissionsCategory,
        ];
        mockGetWhere.mockResolvedValue(activeCategories);

        const nextOrder = await categoriesService.getNextDisplayOrder();

        expect(nextOrder).toBe(5); // Next after the highest (4)
      });

      it('should return 1 when no categories exist', async () => {
        mockGetWhere.mockResolvedValue([]);

        const nextOrder = await categoriesService.getNextDisplayOrder();

        expect(nextOrder).toBe(1);
      });
    });
  });

  describe('Role-based Access Control', () => {
    describe('getCategoriesForRole', () => {
      it('should return all categories for admin role', async () => {
        const allCategories = [
          mockTithesCategory,
          mockOfferingsCategory,
          mockBuildingFundCategory,
          mockInactiveCategory,
        ];
        mockGetAll.mockResolvedValue(allCategories);

        const result = await categoriesService.getCategoriesForRole('admin');

        expect(mockGetAll).toHaveBeenCalled();
        expect(result).toEqual(allCategories);
      });

      it('should return all categories for pastor role', async () => {
        const allCategories = [
          mockTithesCategory,
          mockOfferingsCategory,
          mockBuildingFundCategory,
          mockInactiveCategory,
        ];
        mockGetAll.mockResolvedValue(allCategories);

        const result = await categoriesService.getCategoriesForRole('pastor');

        expect(mockGetAll).toHaveBeenCalled();
        expect(result).toEqual(allCategories);
      });

      it('should return only active categories for member role', async () => {
        const activeCategories = [
          mockTithesCategory,
          mockOfferingsCategory,
          mockBuildingFundCategory,
          mockMissionsCategory,
        ];
        mockGetWhere.mockResolvedValue(activeCategories);

        const result = await categoriesService.getCategoriesForRole('member');

        expect(mockGetWhere).toHaveBeenCalledWith('isActive', '==', true);
        expect(result).toEqual(activeCategories);
        result.forEach((category) => {
          expect(category.isActive).toBe(true);
        });
      });
    });

    describe('canUserManageCategories', () => {
      it('should allow admin to manage categories', () => {
        const canManage = categoriesService.canUserManageCategories('admin');
        expect(canManage).toBe(true);
      });

      it('should allow pastor to manage categories', () => {
        const canManage = categoriesService.canUserManageCategories('pastor');
        expect(canManage).toBe(true);
      });

      it('should not allow member to manage categories', () => {
        const canManage = categoriesService.canUserManageCategories('member');
        expect(canManage).toBe(false);
      });
    });
  });

  describe('Data Validation and Integrity', () => {
    describe('validateCategoryData', () => {
      it('should validate required fields', () => {
        const invalidData = {
          name: '',
          defaultForm990LineItem: '1a_cash_contributions' as Form990LineItem,
          isTaxDeductible: true,
        };

        expect(() =>
          categoriesService.validateCategoryData(invalidData)
        ).toThrow('Category name is required');
      });

      it('should validate name length limits', () => {
        const longNameData = {
          name: 'A'.repeat(101), // Assuming 100 char limit
          defaultForm990LineItem: '1a_cash_contributions' as Form990LineItem,
          isTaxDeductible: true,
        };

        expect(() =>
          categoriesService.validateCategoryData(longNameData)
        ).toThrow('Category name must be 100 characters or less');
      });

      it('should validate Form 990 line item', () => {
        const invalidForm990Data = {
          name: 'Valid Name',
          defaultForm990LineItem: 'invalid_line_item' as Form990LineItem,
          isTaxDeductible: true,
        };

        expect(() =>
          categoriesService.validateCategoryData(invalidForm990Data)
        ).toThrow('Invalid Form 990 line item');
      });
    });

    describe('ensureDataIntegrity', () => {
      it('should fix missing display orders', async () => {
        const categoriesWithMissingOrders = [
          { ...mockTithesCategory, displayOrder: 0 },
          { ...mockOfferingsCategory, displayOrder: 0 },
        ];
        mockGetAll.mockResolvedValue(categoriesWithMissingOrders);
        mockUpdateMultiple.mockResolvedValue({
          successful: 2,
          failed: 0,
          errors: [],
        });

        await categoriesService.ensureDataIntegrity();

        expect(mockUpdateMultiple).toHaveBeenCalledTimes(1);
        expect(mockUpdateMultiple).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: categoriesWithMissingOrders[0].id,
              data: expect.objectContaining({ displayOrder: 1 }),
            }),
            expect.objectContaining({
              id: categoriesWithMissingOrders[1].id,
              data: expect.objectContaining({ displayOrder: 2 }),
            }),
          ])
        );
      });

      it('should fix duplicate display orders', async () => {
        const categoriesWithDuplicates = [
          { ...mockTithesCategory, displayOrder: 1 },
          { ...mockOfferingsCategory, displayOrder: 1 }, // Duplicate
          { ...mockBuildingFundCategory, displayOrder: 3 },
        ];
        mockGetAll.mockResolvedValue(categoriesWithDuplicates);
        mockUpdateMultiple.mockResolvedValue({
          successful: 1,
          failed: 0,
          errors: [],
        });

        await categoriesService.ensureDataIntegrity();

        expect(mockUpdateMultiple).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: categoriesWithDuplicates[1].id,
              data: expect.objectContaining({ displayOrder: 4 }),
            }),
          ])
        );
      });
    });
  });

  describe('Integration with Donations', () => {
    describe('getCategoryWithDonationStats', () => {
      it('should return category enriched with real-time donation statistics', async () => {
        mockGetById.mockResolvedValue(mockTithesCategory);

        // Mock integration with donations service to get real-time stats
        const enrichedCategory = {
          ...mockTithesCategory,
          recentDonationCount: 15,
          thisMonthTotal: 8500.0,
          goalProgress: 37.5, // (45000 / 120000) * 100
        };

        const result = await categoriesService.getCategoryWithDonationStats(
          'category-tithes-123'
        );

        expect(result.goalProgress).toBeCloseTo(37.5);
        expect(result.thisMonthTotal).toBeGreaterThan(0);
      });
    });

    describe('updateCategoryFromDonation', () => {
      it('should update category statistics when donation is added', async () => {
        const donationAmount = 150.0;
        const currentCategory = mockTithesCategory;

        const expectedUpdates = {
          totalAmount: currentCategory.totalAmount + donationAmount,
          donationCount: currentCategory.donationCount + 1,
          currentYearTotal: currentCategory.currentYearTotal + donationAmount,
          averageDonation:
            Math.round(
              ((currentCategory.totalAmount + donationAmount) /
                (currentCategory.donationCount + 1)) *
                100
            ) / 100,
          lastDonationDate: expect.any(String),
        };

        mockGetById.mockResolvedValue(currentCategory);
        mockUpdate.mockResolvedValue({
          ...currentCategory,
          ...expectedUpdates,
        });

        const result = await categoriesService.updateCategoryFromDonation(
          'category-tithes-123',
          donationAmount,
          '2025-01-16T10:00:00Z'
        );

        expect(mockUpdate).toHaveBeenCalledWith(
          'category-tithes-123',
          expect.objectContaining(expectedUpdates)
        );
        expect(result.totalAmount).toBe(
          currentCategory.totalAmount + donationAmount
        );
        expect(result.donationCount).toBe(currentCategory.donationCount + 1);
      });

      it('should handle first donation to empty category', async () => {
        const emptyCategory = {
          ...mockTithesCategory,
          totalAmount: 0,
          donationCount: 0,
          currentYearTotal: 0,
          averageDonation: 0,
        };

        const firstDonationAmount = 100.0;
        mockGetById.mockResolvedValue(emptyCategory);
        mockUpdate.mockResolvedValue({
          ...emptyCategory,
          totalAmount: firstDonationAmount,
          donationCount: 1,
          currentYearTotal: firstDonationAmount,
          averageDonation: firstDonationAmount,
        });

        const result = await categoriesService.updateCategoryFromDonation(
          'category-tithes-123',
          firstDonationAmount,
          '2025-01-16T10:00:00Z'
        );

        expect(result.totalAmount).toBe(firstDonationAmount);
        expect(result.donationCount).toBe(1);
        expect(result.averageDonation).toBe(firstDonationAmount);
      });
    });
  });

  describe('Real-time Subscriptions', () => {
    describe('subscribeToCategories', () => {
      it('should set up subscription with callback', () => {
        const callback = vi.fn();
        const subscriptionId = 'sub-categories-123';
        mockSubscribeToCollection.mockReturnValue(subscriptionId);

        const result = categoriesService.subscribeToCategories(callback);

        expect(mockSubscribeToCollection).toHaveBeenCalledWith(
          callback,
          expect.any(Array),
          undefined
        );
        expect(result).toBe(subscriptionId);
      });

      it('should set up subscription with role-based filtering', () => {
        const callback = vi.fn();
        mockSubscribeToCollection.mockReturnValue('sub-456');

        categoriesService.subscribeToCategories(callback, 'member');

        expect(mockSubscribeToCollection).toHaveBeenCalledWith(
          callback,
          expect.arrayContaining([
            expect.objectContaining({ _op: '==', _value: true, type: 'where' }),
            expect.objectContaining({ _direction: 'asc', type: 'orderBy' }),
          ]),
          undefined
        );
      });
    });

    describe('unsubscribeFromCategories', () => {
      it('should unsubscribe from category updates', () => {
        mockUnsubscribe.mockReturnValue(true);

        const result =
          categoriesService.unsubscribeFromCategories('sub-categories-123');

        expect(mockUnsubscribe).toHaveBeenCalledWith('sub-categories-123');
        expect(result).toBe(true);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle categories with zero statistics', async () => {
      const zeroStatsCategory = {
        ...mockTithesCategory,
        totalAmount: 0,
        donationCount: 0,
        averageDonation: 0,
        currentYearTotal: 0,
      };

      mockGetById.mockResolvedValue(zeroStatsCategory);

      const result =
        await categoriesService.getCategoryById('category-empty-123');

      expect(result.totalAmount).toBe(0);
      expect(result.donationCount).toBe(0);
      expect(result.averageDonation).toBe(0);
    });

    it('should handle very large donation amounts in statistics', async () => {
      const largeAmount = 1000000.0;
      const categoryWithLargeAmounts = {
        ...mockTithesCategory,
        totalAmount: largeAmount,
        currentYearTotal: largeAmount / 2,
        averageDonation: largeAmount / 10,
      };

      mockGetById.mockResolvedValue(categoryWithLargeAmounts);

      const result =
        await categoriesService.getCategoryById('category-large-123');

      expect(result.totalAmount).toBe(largeAmount);
      expect(result.averageDonation).toBe(largeAmount / 10);
    });

    it('should handle missing or corrupted category data gracefully', async () => {
      const corruptedCategory = {
        id: 'category-corrupt-123',
        name: 'Corrupted Category',
        // Missing required fields
      };

      mockGetById.mockResolvedValue(corruptedCategory);

      await expect(
        categoriesService.getCategoryById('category-corrupt-123')
      ).rejects.toThrow('Invalid category data structure');
    });

    it('should validate decimal precision in financial amounts', async () => {
      const preciseAmounts = {
        totalAmount: 123.456, // More than 2 decimal places
        currentYearTotal: 456.789,
        averageDonation: 78.901,
      };

      await expect(
        categoriesService.updateCategoryStatistics(
          'category-123',
          preciseAmounts
        )
      ).rejects.toThrow('Financial amounts must have at most 2 decimal places');
    });

    it('should handle concurrent category updates gracefully', async () => {
      // Mock getWhere to return empty array (no existing category with name)
      mockGetWhere.mockResolvedValue([]);
      mockUpdate.mockResolvedValueOnce(mockTithesCategory);
      mockUpdate.mockResolvedValueOnce(mockTithesCategory);

      const concurrentUpdate1 = categoriesService.updateCategory(
        'category-123',
        { name: 'Updated Name 1' }
      );
      const concurrentUpdate2 = categoriesService.updateCategory(
        'category-123',
        { description: 'Updated Description' }
      );

      const results = await Promise.all([concurrentUpdate1, concurrentUpdate2]);

      expect(results).toHaveLength(2);
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Form 990 Compliance', () => {
    describe('getCategoriesByForm990LineItem', () => {
      it('should get categories by Form 990 line item', async () => {
        const cashContributionCategories = [
          mockTithesCategory,
          mockOfferingsCategory,
        ];
        mockGetWhere.mockResolvedValue(cashContributionCategories);

        const result = await categoriesService.getCategoriesByForm990LineItem(
          '1a_cash_contributions'
        );

        expect(mockGetWhere).toHaveBeenCalledWith(
          'defaultForm990LineItem',
          '==',
          '1a_cash_contributions'
        );
        expect(result).toEqual(cashContributionCategories);
      });
    });

    describe('validateForm990Compliance', () => {
      it('should validate tax-deductible categories have appropriate line items', () => {
        const validCategory = {
          name: 'Tithes',
          isTaxDeductible: true,
          defaultForm990LineItem: '1a_cash_contributions' as Form990LineItem,
        };

        expect(() =>
          categoriesService.validateForm990Compliance(validCategory)
        ).not.toThrow();
      });

      it('should allow non-tax-deductible categories with any line item', () => {
        const nonDeductibleCategory = {
          name: 'Political Fund',
          isTaxDeductible: false,
          defaultForm990LineItem: 'not_applicable' as Form990LineItem,
        };

        expect(() =>
          categoriesService.validateForm990Compliance(nonDeductibleCategory)
        ).not.toThrow();
      });
    });
  });
});
