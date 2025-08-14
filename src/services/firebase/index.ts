// ============================================================================
// FIREBASE SERVICES INDEX
// ============================================================================
// Centralized export for all Firebase services

// Individual Services
export { BaseFirestoreService } from './base.service';
export { MembersService, membersService } from './members.service';
export { HouseholdsService, householdsService } from './households.service';

// Import classes for FirebaseService constructor
import { MembersService } from './members.service';
import { HouseholdsService } from './households.service';

// Service instances for direct use (lazy loading to avoid circular deps)
export const firebase = {
  get members() {
    return membersService;
  },
  get households() {
    return householdsService;
  },
} as const;

// ============================================================================
// UNIFIED SERVICE CLASS
// ============================================================================
// Single service class that provides access to all Firebase operations

export class FirebaseService {
  public readonly members: MembersService;
  public readonly households: HouseholdsService;

  constructor() {
    this.members = new MembersService();
    this.households = new HouseholdsService();
  }

  // ============================================================================
  // CROSS-SERVICE OPERATIONS
  // ============================================================================

  /**
   * Create a complete member with household
   */
  async createMemberWithHousehold(memberData: {
    // Member data
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    birthdate?: string;
    gender?: 'Male' | 'Female';
    role?: 'admin' | 'pastor' | 'member';
    memberStatus?: 'active' | 'inactive' | 'visitor';
    joinedAt?: string;
    isPrimaryContact?: boolean;

    // Household data (for new household)
    householdData?: {
      familyName: string;
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      };
    };

    // Or existing household ID
    existingHouseholdId?: string;

    // Firebase Auth UID
    authUID?: string;
  }): Promise<{ member: any; household: any }> {
    try {
      let household;
      let householdId: string;

      // Create or use existing household
      if (memberData.existingHouseholdId) {
        householdId = memberData.existingHouseholdId;
        household = await this.households.getById(householdId);
        if (!household) {
          throw new Error('Specified household not found');
        }
      } else if (memberData.householdData) {
        household = await this.households.create({
          familyName: memberData.householdData.familyName,
          address: memberData.householdData.address || {},
          memberIds: [],
          memberCount: 0,
        });
        householdId = household.id;
      } else {
        throw new Error(
          'Either existingHouseholdId or householdData must be provided'
        );
      }

      // Create member
      const member = await this.members.create(
        {
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          email: memberData.email,
          phone: memberData.phone,
          birthdate: memberData.birthdate,
          gender: memberData.gender,
          role: memberData.role || 'member',
          memberStatus: memberData.memberStatus || 'active',
          joinedAt: memberData.joinedAt,
          householdId,
          isPrimaryContact: memberData.isPrimaryContact || false,
          fullName: `${memberData.firstName} ${memberData.lastName}`,
        },
        memberData.authUID
      );

      // Add member to household
      await this.households.addMemberToHousehold(householdId, member.id);

      // Set as primary contact if requested
      if (memberData.isPrimaryContact) {
        await this.households.setPrimaryContact(
          householdId,
          member.id,
          member.fullName
        );
      }

      return { member, household };
    } catch (error) {
      console.error('Error creating member with household:', error);
      throw error;
    }
  }

  /**
   * Get member with full household information
   */
  async getMemberWithHousehold(memberId: string): Promise<any | null> {
    const member = await this.members.getById(memberId);
    if (!member) return null;

    const household = await this.households.getById(member.householdId);
    return {
      ...member,
      household,
    };
  }

  /**
   * Get household with all member details
   */
  async getHouseholdWithMembers(householdId: string): Promise<any | null> {
    const household = await this.households.getById(householdId);
    if (!household) return null;

    const members = await this.members.getByHouseholdId(householdId);
    return {
      ...household,
      members,
    };
  }

  /**
   * Transfer member to different household
   */
  async transferMemberToHousehold(
    memberId: string,
    newHouseholdId: string
  ): Promise<void> {
    const member = await this.members.getById(memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    const newHousehold = await this.households.getById(newHouseholdId);
    if (!newHousehold) {
      throw new Error('Target household not found');
    }

    // Update member with new household
    await this.members.updateWithHouseholdSync(memberId, {
      householdId: newHouseholdId,
      householdName: newHousehold.familyName,
    });
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<{
    members: any;
    households: any;
    overview: {
      totalMembers: number;
      totalHouseholds: number;
        recentActivity: string[];
    };
  }> {
    const [memberStats, householdStats] = await Promise.all([
      this.members.getStatistics(),
      this.households.getStatistics(),
    ]);

    const overview = {
      totalMembers: memberStats.total,
      totalHouseholds: householdStats.total,
      recentActivity: [
        // Add recent activity items here
        'Recent registrations',
        'Member activities',
        'Recent updates',
      ],
    };

    return {
      members: memberStats,
      households: householdStats,
      overview,
    };
  }

  // ============================================================================
  // SEARCH OPERATIONS
  // ============================================================================

  /**
   * Global search across members and households
   */
  async globalSearch(
    searchTerm: string,
    options?: {
      includeMembers?: boolean;
      includeHouseholds?: boolean;
      limit?: number;
    }
  ): Promise<{
    members: any[];
    households: any[];
    total: number;
  }> {
    const {
      includeMembers = true,
      includeHouseholds = true,
      limit = 20,
    } = options || {};

    const [members, households, events] = await Promise.all([
      includeMembers ? this.members.search(searchTerm, { limit }) : [],
      includeHouseholds ? this.households.search(searchTerm, { limit }) : [],
      [],  // events removed
    ]);

    return {
      members: members.slice(0, limit),
      households: households.slice(0, limit),
      total: members.length + households.length,
    };
  }

  // ============================================================================
  // DATA MIGRATION HELPERS
  // ============================================================================

  /**
   * Test Firebase connection and permissions
   */
  async testConnection(): Promise<{
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    error?: string;
  }> {
    try {
      // Test read
      await this.members.getAll({ limit: 1 });
      const canRead = true;

      // Test write
      const testMember = await this.members.create({
        firstName: 'Test',
        lastName: 'Connection',
        email: `test-${Date.now()}@example.com`,
        role: 'member',
        memberStatus: 'active',
        householdId: 'test',
        fullName: 'Test Connection',
        phone: '',
        birthdate: '',
        joinedAt: '',
        isPrimaryContact: false,
        householdName: 'Test Household',
      });
      const canWrite = true;

      // Test delete
      await this.members.delete(testMember.id);
      const canDelete = true;

      return { canRead, canWrite, canDelete };
    } catch (error) {
      return {
        canRead: false,
        canWrite: false,
        canDelete: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get collection counts for migration verification
   */
  async getCollectionCounts(): Promise<{
    members: number;
    households: number;
  }> {
    const [members, households] = await Promise.all([
      this.members.count(),
      this.households.count(),
    ]);

    return { members, households };
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to dashboard updates
   */
  subscribeToDashboard(callback: (stats: any) => void): () => void {
    // For now, just subscribe to member changes
    // In a full implementation, you'd combine multiple subscriptions
    return this.members.subscribeToMemberDirectory({}, async () => {
      const stats = await this.getDashboardStats();
      callback(stats);
    });
  }

  // ============================================================================
  // CLEANUP AND MAINTENANCE
  // ============================================================================

  /**
   * Perform data integrity checks
   */
  async performIntegrityCheck(): Promise<{
    issues: string[];
    fixes: string[];
    summary: {
      membersChecked: number;
      householdsChecked: number;
      issuesFound: number;
      issuesFixed: number;
    };
  }> {
    const issues: string[] = [];
    const fixes: string[] = [];

    // Check members without households
    const allMembers = await this.members.getAll();
    const allHouseholds = await this.households.getAll();
    const householdIds = new Set(allHouseholds.map((h) => h.id));

    let issuesFound = 0;
    let issuesFixed = 0;

    for (const member of allMembers) {
      if (!householdIds.has(member.householdId)) {
        issues.push(
          `Member ${member.fullName} (${member.id}) references non-existent household ${member.householdId}`
        );
        issuesFound++;
      }
    }

    // Check households with incorrect member counts
    for (const household of allHouseholds) {
      const actualMembers = allMembers.filter(
        (m) => m.householdId === household.id
      );
      if (actualMembers.length !== household.memberCount) {
        issues.push(
          `Household ${household.familyName} has incorrect member count: ${household.memberCount} vs actual ${actualMembers.length}`
        );
        issuesFound++;

        // Fix the count
        try {
          await this.households.update(household.id, {
            memberCount: actualMembers.length,
          });
          fixes.push(
            `Fixed member count for household ${household.familyName}`
          );
          issuesFixed++;
        } catch (error) {
          issues.push(
            `Failed to fix member count for household ${household.familyName}`
          );
        }
      }
    }

    return {
      issues,
      fixes,
      summary: {
        membersChecked: allMembers.length,
        householdsChecked: allHouseholds.length,
        issuesFound,
        issuesFixed,
      },
    };
  }
}

// Create and export singleton instance
export const firebaseService = new FirebaseService();
