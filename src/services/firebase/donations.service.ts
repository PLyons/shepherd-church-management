import { BaseFirestoreService } from './base.service';
import { auditService } from './audit.service';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// ============================================================================
// SECURE DONATIONS SERVICE WITH ROLE-BASED ACCESS CONTROL
// ============================================================================
// CRITICAL: This service enforces strict access controls on financial data

export interface Donation {
  id: string;
  donorId: string;
  donorName: string; // Only visible to admin/pastor
  householdId?: string;
  amount: number;
  date: string;
  method: 'cash' | 'check' | 'online' | 'other';
  category: string;
  notes?: string;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DonationStats {
  totalAmount: number;
  donationCount: number;
  averageDonation: number;
  monthlyTotal: number;
  yearToDateTotal: number;
}

export interface DonorStats {
  donorCount: number;
  regularDonors: number; // Those who gave in last 3 months
  newDonors: number; // First-time donors in last 60 days
}

export class DonationsService extends BaseFirestoreService<Donation, Donation> {
  constructor() {
    super('donations');
  }

  // Required abstract method implementations
  protected documentToClient(id: string, document: Donation): Donation {
    return { ...document, id };
  }

  protected clientToDocument(client: Partial<Donation>): Partial<Donation> {
    const { id, ...document } = client;
    return document;
  }

  // ============================================================================
  // ROLE-BASED DATA ACCESS - CRITICAL SECURITY
  // ============================================================================

  /**
   * Get donations filtered by user role
   * SECURITY: Members can ONLY see their own donations
   */
  async getDonationsByRole(
    requestingUserId: string,
    userRole: 'admin' | 'pastor' | 'member',
    targetUserId?: string
  ): Promise<Donation[]> {
    await this.logSecurityAccess(requestingUserId, userRole, 'donations_list');

    // Members can ONLY access their own donations
    if (userRole === 'member') {
      if (targetUserId && targetUserId !== requestingUserId) {
        throw new Error('Access denied: Members can only view their own donations');
      }
      return this.getDonationsByDonor(requestingUserId);
    }

    // Pastors can see aggregate data but not individual donor details
    if (userRole === 'pastor') {
      const donations = await this.getAll();
      return this.sanitizeDonationsForPastor(donations);
    }

    // Admins can see all donations
    if (userRole === 'admin') {
      return targetUserId ? 
        await this.getDonationsByDonor(targetUserId) : 
        await this.getAll();
    }

    throw new Error('Invalid user role');
  }

  /**
   * Get donation statistics by role
   */
  async getDonationStats(
    requestingUserId: string,
    userRole: 'admin' | 'pastor' | 'member'
  ): Promise<DonationStats> {
    await this.logSecurityAccess(requestingUserId, userRole, 'donation_stats');

    if (userRole === 'member') {
      // Members only see their own stats
      return this.getPersonalDonationStats(requestingUserId);
    }

    if (userRole === 'pastor' || userRole === 'admin') {
      // Pastors and admins see aggregate stats
      return this.getAggregateDonationStats();
    }

    throw new Error('Invalid user role');
  }

  // ============================================================================
  // MEMBER-ONLY ACCESS (PERSONAL DATA)
  // ============================================================================

  /**
   * Get donations for a specific donor (SECURITY: ID must match requesting user for members)
   */
  async getDonationsByDonor(donorId: string): Promise<Donation[]> {
    const donationsQuery = query(
      collection(this.db, this.collectionName),
      where('donorId', '==', donorId),
      orderBy('date', 'desc'),
      limit(50) // Limit to recent donations for performance
    );

    const snapshot = await getDocs(donationsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation));
  }

  /**
   * Get personal donation statistics for a member
   */
  async getPersonalDonationStats(donorId: string): Promise<DonationStats> {
    const donations = await this.getDonationsByDonor(donorId);
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    const yearToDate = donations.filter(d => 
      new Date(d.date).getFullYear() === currentYear
    );
    
    const thisMonth = donations.filter(d => {
      const donationDate = new Date(d.date);
      return donationDate.getFullYear() === currentYear && 
             donationDate.getMonth() === currentMonth;
    });

    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const monthlyTotal = thisMonth.reduce((sum, d) => sum + d.amount, 0);
    const yearToDateTotal = yearToDate.reduce((sum, d) => sum + d.amount, 0);

    return {
      totalAmount,
      donationCount: donations.length,
      averageDonation: donations.length > 0 ? totalAmount / donations.length : 0,
      monthlyTotal,
      yearToDateTotal
    };
  }

  // ============================================================================
  // ADMIN/PASTOR ACCESS (AGGREGATE DATA)
  // ============================================================================

  /**
   * Get aggregate donation statistics (admin/pastor only)
   */
  async getAggregateDonationStats(): Promise<DonationStats> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Use targeted queries for better performance
    const yearStart = new Date(currentYear, 0, 1).toISOString();
    const monthStart = new Date(currentYear, currentMonth, 1).toISOString();
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

    // Get donations for different time periods in parallel
    const [allDonations, yearToDateDonations, thisMonthDonations, donationCount] = await Promise.all([
      this.getAll({ limit: 1000, orderBy: { field: 'date', direction: 'desc' } }), // Recent donations for averages
      this.getWhere('date', '>=', yearStart),
      this.getAll({
        where: [
          { field: 'date', operator: '>=', value: monthStart },
          { field: 'date', operator: '<=', value: monthEnd }
        ]
      }),
      this.count()
    ]);

    // Calculate totals
    const totalAmount = allDonations.reduce((sum, d) => sum + d.amount, 0);
    const monthlyTotal = thisMonthDonations.reduce((sum, d) => sum + d.amount, 0);
    const yearToDateTotal = yearToDateDonations.reduce((sum, d) => sum + d.amount, 0);

    return {
      totalAmount,
      donationCount,
      averageDonation: allDonations.length > 0 ? totalAmount / allDonations.length : 0,
      monthlyTotal,
      yearToDateTotal
    };
  }

  /**
   * Get donor statistics (admin/pastor only)
   */
  async getDonorStats(): Promise<DonorStats> {
    const donations = await this.getAll();
    
    // Get unique donors
    const uniqueDonorIds = new Set(donations.map(d => d.donorId));
    const donorCount = uniqueDonorIds.size;
    
    // Regular donors (donated in last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentDonorIds = new Set(
      donations
        .filter(d => new Date(d.date) >= threeMonthsAgo)
        .map(d => d.donorId)
    );
    const regularDonors = recentDonorIds.size;
    
    // New donors (first donation in last 60 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const donorFirstDonations = new Map<string, Date>();
    donations.forEach(donation => {
      const donorId = donation.donorId;
      const donationDate = new Date(donation.date);
      
      if (!donorFirstDonations.has(donorId) || 
          donationDate < donorFirstDonations.get(donorId)!) {
        donorFirstDonations.set(donorId, donationDate);
      }
    });
    
    const newDonors = Array.from(donorFirstDonations.values())
      .filter(firstDonation => firstDonation >= sixtyDaysAgo).length;

    return {
      donorCount,
      regularDonors,
      newDonors
    };
  }

  // ============================================================================
  // DATA SANITIZATION FOR ROLES
  // ============================================================================

  /**
   * Remove sensitive information for pastor role
   * Pastors see donation amounts and patterns but not individual donor names
   */
  private sanitizeDonationsForPastor(donations: Donation[]): Donation[] {
    return donations.map(donation => ({
      ...donation,
      donorName: donation.isAnonymous ? 'Anonymous' : 'Church Member',
      donorId: 'REDACTED', // Hide actual donor ID
      notes: donation.notes ? '[Notes available to admin only]' : undefined
    }));
  }

  /**
   * Create anonymous donation record for reporting
   */
  private createAnonymousDonation(donation: Donation): Omit<Donation, 'donorId' | 'donorName'> {
    const { donorId, donorName, ...anonymousDonation } = donation;
    return anonymousDonation;
  }

  // ============================================================================
  // SECURE DONATION MANAGEMENT
  // ============================================================================

  /**
   * Record a new donation (admin only)
   */
  async recordDonation(
    donationData: Omit<Donation, 'id' | 'createdAt' | 'updatedAt'>,
    requestingUserId: string,
    userRole: 'admin' | 'pastor' | 'member'
  ): Promise<string> {
    // Only admins can record donations
    if (userRole !== 'admin') {
      throw new Error('Access denied: Only administrators can record donations');
    }

    await this.logSecurityAccess(requestingUserId, userRole, 'record_donation');

    const now = new Date().toISOString();
    const donation: Omit<Donation, 'id'> = {
      ...donationData,
      createdAt: now,
      updatedAt: now
    };

    return await this.create(donation);
  }

  /**
   * Update donation (admin only)
   */
  async updateDonation(
    donationId: string,
    updates: Partial<Donation>,
    requestingUserId: string,
    userRole: 'admin' | 'pastor' | 'member'
  ): Promise<void> {
    // Only admins can update donations
    if (userRole !== 'admin') {
      throw new Error('Access denied: Only administrators can update donations');
    }

    await this.logSecurityAccess(requestingUserId, userRole, 'update_donation');

    const sanitizedUpdates = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.update(donationId, sanitizedUpdates);
  }

  /**
   * Delete donation (admin only)
   */
  async deleteDonation(
    donationId: string,
    requestingUserId: string,
    userRole: 'admin' | 'pastor' | 'member'
  ): Promise<void> {
    // Only admins can delete donations
    if (userRole !== 'admin') {
      throw new Error('Access denied: Only administrators can delete donations');
    }

    await this.logSecurityAccess(requestingUserId, userRole, 'delete_donation');
    await this.delete(donationId);
  }

  // ============================================================================
  // SECURITY AUDIT LOGGING
  // ============================================================================

  /**
   * Log all financial data access for security auditing
   */
  private async logSecurityAccess(
    userId: string,
    userRole: string,
    action: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      let auditAction: 'donation_viewed' | 'donation_created' | 'donation_updated' | 'donation_deleted' | 'financial_report_accessed' = 'financial_report_accessed';
      
      if (action.includes('view') || action.includes('get')) {
        auditAction = 'donation_viewed';
      } else if (action.includes('create') || action.includes('record')) {
        auditAction = 'donation_created';
      } else if (action.includes('update')) {
        auditAction = 'donation_updated';
      } else if (action.includes('delete')) {
        auditAction = 'donation_deleted';
      }

      await auditService.logFinancialAccess(
        userId,
        'User', // TODO: Get actual user email and name
        'User',
        userRole,
        auditAction,
        {
          accessType: userRole === 'member' ? 'personal' : 'aggregate',
          ...(details || {})
        }
      );
    } catch (error) {
      console.error('Failed to log financial data access:', error);
    }

    // Backup console logging
    console.log('[SECURITY AUDIT]', {
      timestamp: new Date().toISOString(),
      userId,
      userRole,
      action,
      service: 'donations',
      sensitiveData: true
    });
  }

  // ============================================================================
  // DATA VALIDATION
  // ============================================================================

  /**
   * Validate donation data before storage
   */
  private validateDonationData(donation: Partial<Donation>): void {
    if (!donation.donorId) {
      throw new Error('Donor ID is required');
    }
    
    if (!donation.amount || donation.amount <= 0) {
      throw new Error('Valid donation amount is required');
    }
    
    if (!donation.date) {
      throw new Error('Donation date is required');
    }
    
    if (!donation.method) {
      throw new Error('Donation method is required');
    }
    
    if (!donation.category) {
      throw new Error('Donation category is required');
    }
  }
}

// Create and export singleton instance
export const donationsService = new DonationsService();