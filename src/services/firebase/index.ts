// src/services/firebase/index.ts
// Centralized export aggregator and unified service class for all Firebase services with cross-service operations
// Provides single entry point for Firebase operations, dashboard statistics, global search, and service orchestration
// RELEVANT FILES: src/services/firebase/members.service.ts, src/services/firebase/events.service.ts, src/services/firebase/donations.service.ts, src/services/firebase/base.service.ts

// ============================================================================
// FIREBASE SERVICES INDEX
// ============================================================================
// Centralized export for all Firebase services

// Individual Services
export { BaseFirestoreService } from './base.service';
export { MembersService, membersService } from './members.service';
export { HouseholdsService, householdsService } from './households.service';
export { EventsService, eventsService } from './events.service';
export { EventRSVPService, eventRSVPService } from './event-rsvp.service';
export { DonationsService, donationsService } from './donations.service';
export {
  DonationCategoriesService,
  donationCategoriesService,
} from './donation-categories.service';
export {
  DonationStatementsService,
  donationStatementsService,
} from './donationStatements.service';

// Import classes for FirebaseService constructor
import { MembersService } from './members.service';
import { EventsService } from './events.service';
import { EventRSVPService } from './event-rsvp.service';
import { DonationsService } from './donations.service';
import { DonationCategoriesService } from './donation-categories.service';
import { DonationStatementsService } from './donationStatements.service';
import type { Member } from '../../types';
import type { Event } from '../../types/events';

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

interface EventStatistics {
  total: number;
  upcoming: number;
  thisWeek: number;
  thisMonth: number;
}

interface DashboardStatistics {
  members: MemberStatistics;
  events: EventStatistics;
  overview: {
    totalMembers: number;
    upcomingEvents: number;
    recentActivity: string[];
  };
}
export const firebase = {
  get members() {
    return new MembersService();
  },
  get events() {
    return new EventsService();
  },
  get eventRSVPs() {
    return new EventRSVPService();
  },
  get donations() {
    return new DonationsService();
  },
  get donationCategories() {
    return new DonationCategoriesService();
  },
  get donationStatements() {
    return new DonationStatementsService();
  },
} as const;

// ============================================================================
// UNIFIED SERVICE CLASS
// ============================================================================
// Single service class that provides access to all Firebase operations

export class FirebaseService {
  public readonly members: MembersService;
  public readonly events: EventsService;
  public readonly eventRSVPs: EventRSVPService;
  public readonly donations: DonationsService;
  public readonly donationCategories: DonationCategoriesService;
  public readonly donationStatements: DonationStatementsService;

  constructor() {
    this.members = new MembersService();
    this.events = new EventsService();
    this.eventRSVPs = new EventRSVPService();
    this.donations = new DonationsService();
    this.donationCategories = new DonationCategoriesService();
    this.donationStatements = new DonationStatementsService();
  }

  // ============================================================================
  // CROSS-SERVICE OPERATIONS
  // ============================================================================

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStatistics> {
    const memberStats = await this.members.getStatistics();

    // Get upcoming events for stats
    const upcomingEvents = await this.events.getUpcomingPublicEvents(100);
    const now = new Date();
    const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const eventStats: EventStatistics = {
      total: upcomingEvents.length,
      upcoming: upcomingEvents.length,
      thisWeek: upcomingEvents.filter((event) => event.startDate <= oneWeek)
        .length,
      thisMonth: upcomingEvents.filter((event) => event.startDate <= oneMonth)
        .length,
    };

    const overview = {
      totalMembers: memberStats.total,
      upcomingEvents: eventStats.upcoming,
      recentActivity: [
        'Recent registrations',
        'Member activities',
        'Recent updates',
        'Event activities',
      ],
    };

    return {
      members: memberStats,
      events: eventStats,
      overview,
    };
  }

  // ============================================================================
  // SEARCH OPERATIONS
  // ============================================================================

  /**
   * Global search across members and events
   */
  async globalSearch(
    searchTerm: string,
    options?: {
      includeMembers?: boolean;
      includeEvents?: boolean;
      limit?: number;
    }
  ): Promise<{
    members: Member[];
    events: Event[];
    total: number;
  }> {
    const {
      includeMembers = true,
      includeEvents = true,
      limit = 20,
    } = options || {};

    const [members, events] = await Promise.all([
      includeMembers ? this.members.search(searchTerm, { limit }) : [],
      includeEvents ? this.searchEvents(searchTerm, limit) : [],
    ]);

    const totalResults = members.length + events.length;

    return {
      members: members.slice(0, limit),
      events: events.slice(0, limit),
      total: totalResults,
    };
  }

  /**
   * Search events by title, description, or location
   */
  private async searchEvents(
    searchTerm: string,
    limitCount: number
  ): Promise<Event[]> {
    // For now, get all upcoming events and filter client-side
    // In production, you might want to implement server-side text search
    const allEvents = await this.events.getUpcomingPublicEvents(100);

    const searchLower = searchTerm.toLowerCase();
    return allEvents
      .filter(
        (event) =>
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          event.location.toLowerCase().includes(searchLower)
      )
      .slice(0, limitCount);
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
    events: number;
  }> {
    const [members, allEvents] = await Promise.all([
      this.members.count(),
      this.events.getUpcomingPublicEvents(1000), // Get a large number to count
    ]);

    return {
      members,
      events: allEvents.length,
    };
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
    const issuesFixed = 0;

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
