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
import type { Member } from '../../types';

// Service instances for direct use (lazy loading to avoid circular deps)
interface MemberStatistics {
  total: number;
  active: number;
  inactive: number;
  visitors: number;
  admins: number;
  pastors: number;
  members: number;
}

interface DashboardStatistics {
  members: MemberStatistics;
  overview: {
    totalMembers: number;
    recentActivity: string[];
  };
}
export const firebase = {
  get members() {
    return new MembersService();
  },
} as const;

// ============================================================================
// UNIFIED SERVICE CLASS
// ============================================================================
// Single service class that provides access to all Firebase operations

export class FirebaseService {
  public readonly members: MembersService;

  constructor() {
    this.members = new MembersService();
  }

  // ============================================================================
  // CROSS-SERVICE OPERATIONS
  // ============================================================================

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStatistics> {
    const memberStats = await this.members.getStatistics();

    const overview = {
      totalMembers: memberStats.total,
      recentActivity: [
        'Recent registrations',
        'Member activities',
        'Recent updates',
      ],
    };

    return {
      members: memberStats,
      overview,
    };
  }

  // ============================================================================
  // SEARCH OPERATIONS
  // ============================================================================

  /**
   * Global search across members
   */
  async globalSearch(
    searchTerm: string,
    options?: {
      includeMembers?: boolean;
      limit?: number;
    }
  ): Promise<{
    members: Member[];
    total: number;
  }> {
    const { includeMembers = true, limit = 20 } = options || {};

    const members = includeMembers
      ? await this.members.search(searchTerm, { limit })
      : [];

    return {
      members: members.slice(0, limit),
      total: members.length,
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
      await this.members.getAll();
      const canRead = true;

      // Test write
      const testMember = await this.members.create({
        firstName: 'Test',
        lastName: 'Connection',
        email: `test-${Date.now()}@example.com`,
        role: 'member',
        memberStatus: 'active',
        fullName: 'Test Connection',
        phone: '',
      });
      const canWrite = true;

      // Test delete
      if (testMember && typeof testMember === 'object' && 'id' in testMember) {
        await this.members.delete(testMember.id);
      }
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
  }> {
    const members = await this.members.count();

    return { members };
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to dashboard updates
   */
  subscribeToDashboard(
    callback: (stats: DashboardStatistics) => void
  ): () => void {
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
      issuesFound: number;
      issuesFixed: number;
    };
  }> {
    const issues: string[] = [];
    const fixes: string[] = [];

    // Basic member validation only
    const allMembers = await this.members.getAll();

    let issuesFound = 0;
    let issuesFixed = 0;

    // Basic member data validation
    for (const member of allMembers) {
      if (!member.firstName || !member.lastName) {
        issues.push(
          `Member ${member.id} has missing required fields (firstName/lastName)`
        );
        issuesFound++;
      }
    }

    return {
      issues,
      fixes,
      summary: {
        membersChecked: allMembers.length,
        issuesFound,
        issuesFixed,
      },
    };
  }
}

// Create and export singleton instance
export const firebaseService = new FirebaseService();
