import {
  where,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BaseFirestoreService } from './base/base-firestore-service';
import { 
  Donation, 
  DonationDocument, 
  DonationMethod, 
  DonationStatus,
  Form990LineItem,
  DonationReportFilters,
  FinancialSummary,
} from '../../types/donations';
import { Role } from '../../types/events';
import {
  donationDocumentToDonation,
  donationToDonationDocument,
} from '../../utils/converters/donation-converters';
import { DonationCategoriesService } from './donation-categories.service';

// Helper type for member donation summary
interface MemberDonationSummary {
  memberId: string;
  totalAmount: number;
  donationCount: number;
  averageDonation: number;
  taxYear: number;
}

// Helper type for donation statistics
interface DonationStatistics {
  totalDonations: number;
  totalAmount: number;
  averageDonation: number;
  donationsByStatus: Record<DonationStatus, number>;
  donationsByMethod: Record<DonationMethod, number>;
}

export class DonationsService extends BaseFirestoreService<DonationDocument, Donation> {
  private categoriesService: DonationCategoriesService;

  constructor() {
    super(
      db,
      'donations',
      (id: string, document: DonationDocument) => donationDocumentToDonation(id, document),
      (client: Partial<Donation>) => donationToDonationDocument(client)
    );
    this.categoriesService = new DonationCategoriesService();
  }

  // ============================================================================
  // BASIC CRUD OPERATIONS WITH VALIDATION
  // ============================================================================

  /**
   * Create a new donation with proper validation and timestamps
   */
  async createDonation(donationData: Omit<Donation, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Donation> {
    // Validation
    await this.validateDonationData(donationData);

    const now = new Date();
    const currentYear = now.getFullYear();

    const donation: Partial<Donation> = {
      ...donationData,
      status: 'pending',
      isReceiptSent: false,
      taxYear: donationData.taxYear || currentYear,
      createdAt: now,
      updatedAt: now,
    };

    return this.create(donation);
  }

  /**
   * Update donation with automatic timestamps and status handling
   */
  async updateDonation(id: string, donationData: Partial<Donation>): Promise<Donation> {
    const updateData: Partial<Donation> = {
      ...donationData,
      updatedAt: new Date(),
    };

    // Set verifiedAt when status changes to verified
    if (donationData.status === 'verified' && donationData.verifiedBy) {
      updateData.verifiedAt = new Date();
    }

    // Set receiptSentAt when isReceiptSent changes to true
    if (donationData.isReceiptSent === true) {
      updateData.receiptSentAt = new Date();
    }

    return this.update(id, updateData);
  }

  /**
   * Get donation by ID
   */
  async getDonationById(id: string): Promise<Donation | null> {
    return this.getById(id);
  }

  /**
   * Delete donation by ID
   */
  async deleteDonation(id: string): Promise<void> {
    return this.delete(id);
  }

  // ============================================================================
  // ROLE-BASED ACCESS CONTROL
  // ============================================================================

  /**
   * Get donations for a specific member (member role access)
   */
  async getDonationsByMember(memberId: string): Promise<Donation[]> {
    return this.getWhere('memberId', '==', memberId);
  }

  /**
   * Get donations based on user role with appropriate filtering
   */
  async getDonationsForRole(role: Role, memberId?: string): Promise<Donation[]> {
    if (role === 'member') {
      if (!memberId) {
        throw new Error('Members can only access their own donation data');
      }
      return this.getDonationsByMember(memberId);
    }

    // Admin gets all donations
    if (role === 'admin') {
      return this.getAll();
    }

    // Pastor gets sanitized view of donations (anonymous donations have sensitive data removed)
    if (role === 'pastor') {
      const allDonations = await this.getAll();
      return allDonations.map(donation => {
        if (donation.form990Fields.isAnonymous) {
          return {
            ...donation,
            memberId: undefined,
            memberName: undefined,
          };
        }
        return donation;
      });
    }

    return [];
  }

  /**
   * Get donation summary for a specific member
   */
  async getMemberDonationSummary(memberId: string, taxYear: number): Promise<MemberDonationSummary> {
    const donations = await this.getWhere('memberId', '==', memberId);
    const yearDonations = donations.filter(d => d.taxYear === taxYear);

    const totalAmount = yearDonations.reduce((sum, d) => sum + d.amount, 0);
    const donationCount = yearDonations.length;
    const averageDonation = donationCount > 0 ? totalAmount / donationCount : 0;

    return {
      memberId,
      totalAmount,
      donationCount,
      averageDonation,
      taxYear,
    };
  }

  // ============================================================================
  // DATE RANGE QUERIES
  // ============================================================================

  /**
   * Get donations within a specific date range
   */
  async getDonationsInDateRange(startDate: Date, endDate: Date): Promise<Donation[]> {
    const result = await this.search({
      filters: [
        { field: 'donationDate', operator: '>=', value: startDate.toISOString() },
        { field: 'donationDate', operator: '<=', value: endDate.toISOString() }
      ]
    });
    return result.items;
  }

  /**
   * Get donations for a specific tax year
   */
  async getDonationsByTaxYear(taxYear: number): Promise<Donation[]> {
    return this.getWhere('taxYear', '==', taxYear);
  }

  // ============================================================================
  // CATEGORY AND METHOD FILTERING
  // ============================================================================

  /**
   * Get donations by category
   */
  async getDonationsByCategory(categoryId: string): Promise<Donation[]> {
    return this.getWhere('categoryId', '==', categoryId);
  }

  /**
   * Get donations by payment method
   */
  async getDonationsByMethod(method: DonationMethod): Promise<Donation[]> {
    return this.getWhere('method', '==', method);
  }

  /**
   * Get donations by status
   */
  async getDonationsByStatus(status: DonationStatus): Promise<Donation[]> {
    return this.getWhere('status', '==', status);
  }

  // ============================================================================
  // ADVANCED QUERIES
  // ============================================================================

  /**
   * Search donations with multiple filters
   */
  async searchDonations(filters: DonationReportFilters): Promise<Donation[]> {
    const searchFilters: Array<{ field: string; operator: string; value: unknown }> = [];

    if (filters.startDate) {
      searchFilters.push({ field: 'donationDate', operator: '>=', value: filters.startDate });
    }

    if (filters.endDate) {
      searchFilters.push({ field: 'donationDate', operator: '<=', value: filters.endDate });
    }

    if (filters.categoryIds && filters.categoryIds.length > 0) {
      searchFilters.push({ field: 'categoryId', operator: 'in', value: filters.categoryIds });
    }

    if (filters.methods && filters.methods.length > 0) {
      searchFilters.push({ field: 'method', operator: 'in', value: filters.methods });
    }

    if (filters.status && filters.status.length > 0) {
      searchFilters.push({ field: 'status', operator: 'in', value: filters.status });
    }

    if (filters.minAmount !== undefined) {
      searchFilters.push({ field: 'amount', operator: '>=', value: filters.minAmount });
    }

    if (filters.maxAmount !== undefined) {
      searchFilters.push({ field: 'amount', operator: '<=', value: filters.maxAmount });
    }

    if (filters.memberId) {
      searchFilters.push({ field: 'memberId', operator: '==', value: filters.memberId });
    }

    const result = await this.search({ filters: searchFilters });
    return result.items;
  }

  /**
   * Get recent donations with pagination
   */
  async getRecentDonations(limitCount = 20): Promise<Donation[]> {
    const result = await this.search({
      orderByField: 'createdAt',
      orderDirection: 'desc',
    }, { limit: limitCount });
    return result.items;
  }

  /**
   * Get large donations above a threshold
   */
  async getLargeDonations(thresholdAmount: number): Promise<Donation[]> {
    const result = await this.search({
      filters: [
        { field: 'amount', operator: '>=', value: thresholdAmount }
      ]
    });
    return result.items;
  }

  // ============================================================================
  // FINANCIAL REPORTING
  // ============================================================================

  /**
   * Generate comprehensive financial summary for a date range
   */
  async generateFinancialSummary(startDate: Date, endDate: Date): Promise<FinancialSummary> {
    const donations = await this.getDonationsInDateRange(startDate, endDate);

    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    const donationCount = donations.length;
    const averageDonation = donationCount > 0 ? totalDonations / donationCount : 0;

    // Group by method
    const byMethod = donations.reduce((acc, donation) => {
      if (!acc[donation.method]) {
        acc[donation.method] = { amount: 0, count: 0, percentage: 0 };
      }
      acc[donation.method].amount += donation.amount;
      acc[donation.method].count += 1;
      return acc;
    }, {} as Record<DonationMethod, { amount: number; count: number; percentage: number }>);

    // Calculate method percentages
    Object.values(byMethod).forEach(method => {
      method.percentage = totalDonations > 0 ? (method.amount / totalDonations) * 100 : 0;
    });

    // Group by category
    const byCategory = donations.reduce((acc, donation) => {
      if (!acc[donation.categoryId]) {
        acc[donation.categoryId] = { 
          categoryName: donation.categoryName, 
          amount: 0, 
          count: 0, 
          percentage: 0 
        };
      }
      acc[donation.categoryId].amount += donation.amount;
      acc[donation.categoryId].count += 1;
      return acc;
    }, {} as Record<string, { categoryName: string; amount: number; count: number; percentage: number }>);

    // Calculate category percentages
    Object.values(byCategory).forEach(category => {
      category.percentage = totalDonations > 0 ? (category.amount / totalDonations) * 100 : 0;
    });

    // Group by Form 990 line items
    const form990Breakdown = donations.reduce((acc, donation) => {
      const lineItem = donation.form990Fields.lineItem;
      if (!acc[lineItem]) {
        acc[lineItem] = { amount: 0, count: 0, percentage: 0 };
      }
      acc[lineItem].amount += donation.amount;
      acc[lineItem].count += 1;
      return acc;
    }, {} as Record<Form990LineItem, { amount: number; count: number; percentage: number }>);

    // Calculate form990 percentages
    Object.values(form990Breakdown).forEach(lineItem => {
      lineItem.percentage = totalDonations > 0 ? (lineItem.amount / totalDonations) * 100 : 0;
    });

    // Generate anonymized donor ranges for privacy
    const donorAmounts = donations.reduce((acc, donation) => {
      if (donation.memberId) {
        acc[donation.memberId] = (acc[donation.memberId] || 0) + donation.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    const topDonorRanges = [
      { range: '$0-$99', count: 0, totalAmount: 0 },
      { range: '$100-$499', count: 0, totalAmount: 0 },
      { range: '$500-$999', count: 0, totalAmount: 0 },
      { range: '$1000-$2499', count: 0, totalAmount: 0 },
      { range: '$2500+', count: 0, totalAmount: 0 },
    ];

    Object.values(donorAmounts).forEach(amount => {
      if (amount < 100) {
        topDonorRanges[0].count++;
        topDonorRanges[0].totalAmount += amount;
      } else if (amount < 500) {
        topDonorRanges[1].count++;
        topDonorRanges[1].totalAmount += amount;
      } else if (amount < 1000) {
        topDonorRanges[2].count++;
        topDonorRanges[2].totalAmount += amount;
      } else if (amount < 2500) {
        topDonorRanges[3].count++;
        topDonorRanges[3].totalAmount += amount;
      } else {
        topDonorRanges[4].count++;
        topDonorRanges[4].totalAmount += amount;
      }
    });

    return {
      totalDonations,
      donationCount,
      averageDonation,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      byMethod,
      byCategory,
      form990Breakdown,
      topDonorRanges,
    };
  }

  /**
   * Get comprehensive donation statistics
   */
  async getDonationStatistics(): Promise<DonationStatistics> {
    const allDonations = await this.getAll();

    const totalDonations = allDonations.length;
    const totalAmount = allDonations.reduce((sum, d) => sum + d.amount, 0);
    const averageDonation = totalDonations > 0 ? totalAmount / totalDonations : 0;

    const donationsByStatus = allDonations.reduce((acc, donation) => {
      acc[donation.status] = (acc[donation.status] || 0) + 1;
      return acc;
    }, {} as Record<DonationStatus, number>);

    const donationsByMethod = allDonations.reduce((acc, donation) => {
      acc[donation.method] = (acc[donation.method] || 0) + 1;
      return acc;
    }, {} as Record<DonationMethod, number>);

    return {
      totalDonations,
      totalAmount,
      averageDonation,
      donationsByStatus,
      donationsByMethod,
    };
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to donations with optional role-based filtering
   */
  subscribeToDonations(
    callback: (donations: Donation[]) => void,
    role?: Role,
    memberId?: string
  ): string {
    const constraints: QueryConstraint[] = [];

    if (role === 'member' && memberId) {
      constraints.push(where('memberId', '==', memberId));
    }

    return this.subscribeToCollection(callback, constraints, undefined);
  }

  /**
   * Unsubscribe from donation updates
   */
  unsubscribeFromDonations(subscriptionId: string): boolean {
    return this.unsubscribe(subscriptionId);
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Create multiple donations in batch
   */
  async createMultipleDonations(
    donationsData: Array<Omit<Donation, 'id' | 'createdAt' | 'updatedAt' | 'status'>>
  ): Promise<{ successful: number; failed: number; errors: string[] }> {
    // Validate all donations first
    const validationPromises = donationsData.map(async (donationData, index) => {
      try {
        await this.validateDonationData(donationData);
        return { index, valid: true, error: null };
      } catch (error) {
        return { 
          index, 
          valid: false, 
          error: `Validation failed for donation ${index}: ${error instanceof Error ? error.message : 'Unknown error'}` 
        };
      }
    });

    const validationResults = await Promise.all(validationPromises);
    const failedValidations = validationResults.filter(result => !result.valid);
    
    if (failedValidations.length > 0) {
      return {
        successful: 0,
        failed: failedValidations.length,
        errors: failedValidations.map(result => result.error!),
      };
    }

    const items = donationsData.map((donationData) => {
      const now = new Date();
      const currentYear = now.getFullYear();

      return {
        data: {
          ...donationData,
          status: 'pending' as DonationStatus,
          isReceiptSent: false,
          taxYear: donationData.taxYear || currentYear,
          createdAt: now,
          updatedAt: now,
        }
      };
    });

    return this.createMultiple(items);
  }

  // ============================================================================
  // CATEGORY STATISTICS METHODS
  // ============================================================================

  /**
   * Update category statistics after donation changes
   */
  private async updateCategoryStatistics(categoryId: string): Promise<void> {
    try {
      const categoryDonations = await this.getDonationsByCategory(categoryId);
      
      if (categoryDonations.length === 0) {
        // Reset statistics for category with no donations
        await this.categoriesService.updateCategoryStatistics(categoryId, {
          totalAmount: 0,
          donationCount: 0,
          averageDonation: 0,
          currentYearTotal: 0,
        });
        return;
      }

      const totalAmount = categoryDonations.reduce((sum, donation) => sum + donation.amount, 0);
      const donationCount = categoryDonations.length;
      const averageDonation = totalAmount / donationCount;
      
      const currentYear = new Date().getFullYear();
      const currentYearTotal = categoryDonations
        .filter(donation => donation.taxYear === currentYear)
        .reduce((sum, donation) => sum + donation.amount, 0);

      const latestDonation = categoryDonations
        .sort((a, b) => new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime())[0];

      await this.categoriesService.updateCategoryStatistics(categoryId, {
        totalAmount,
        donationCount,
        averageDonation,
        lastDonationDate: latestDonation?.donationDate,
        currentYearTotal,
      });
    } catch (error) {
      console.error(`Failed to update category statistics for ${categoryId}:`, error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Override create to update category statistics
   */
  async create(data: Partial<Donation>): Promise<Donation> {
    const result = await super.create(data);
    
    if (result.categoryId) {
      await this.updateCategoryStatistics(result.categoryId);
    }
    
    return result;
  }

  /**
   * Override update to update category statistics
   */
  async update(id: string, data: Partial<Donation>): Promise<Donation> {
    const oldDonation = await this.getById(id);
    const result = await super.update(id, data);
    
    // Update statistics for both old and new categories if they changed
    if (oldDonation.categoryId && oldDonation.categoryId !== result.categoryId) {
      await this.updateCategoryStatistics(oldDonation.categoryId);
    }
    
    if (result.categoryId) {
      await this.updateCategoryStatistics(result.categoryId);
    }
    
    return result;
  }

  /**
   * Override delete to update category statistics
   */
  async delete(id: string): Promise<void> {
    const donation = await this.getById(id);
    await super.delete(id);
    
    if (donation.categoryId) {
      await this.updateCategoryStatistics(donation.categoryId);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Validate donation data before creation/update
   */
  private async validateDonationData(donationData: Partial<Donation>): Promise<void> {
    if (donationData.amount !== undefined && donationData.amount <= 0) {
      throw new Error('Donation amount must be greater than 0');
    }

    if (donationData.donationDate) {
      const donationDate = new Date(donationData.donationDate);
      const now = new Date();
      if (donationDate > now) {
        throw new Error('Donation date cannot be in the future');
      }
    }

    if (!donationData.form990Fields) {
      throw new Error('Form 990 fields are required');
    }

    // Validate category exists and is active
    if (donationData.categoryId) {
      try {
        const category = await this.categoriesService.getById(donationData.categoryId);
        if (!category.isActive) {
          throw new Error(`Donation category '${category.name}' is not active`);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          throw new Error(`Invalid donation category ID: ${donationData.categoryId}`);
        }
        throw error;
      }
    }
  }
}

// Create singleton instance
export const donationsService = new DonationsService();