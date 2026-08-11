// src/services/firebase/unified-firebase.service.ts
// Optional multi-module Firebase facade (lazy sub-services)
// Kept out of the barrel so importing membersService does not construct events/donations
// RELEVANT FILES: src/services/firebase/index.ts, src/services/firebase/facades/members-facade.ts, src/config/features.ts

import { MembersService } from './members.service';
import { HouseholdsService } from './households.service';
import { EventsService } from './events.service';
import { EventRSVPService } from './event-rsvp.service';
import { DonationsService } from './donations.service';
import { DonationCategoriesService } from './donation-categories.service';
import { DonationStatementsService } from './donationStatements.service';
import { isFeatureEnabled } from '../../config/features';
import type { Member } from '../../types';
import type { Event } from '../../types/events';

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

/** Lazy module bag — sub-services created on first access. */
export class FirebaseService {
  private _members?: MembersService;
  private _households?: HouseholdsService;
  private _events?: EventsService;
  private _eventRSVPs?: EventRSVPService;
  private _donations?: DonationsService;
  private _donationCategories?: DonationCategoriesService;
  private _donationStatements?: DonationStatementsService;

  get members(): MembersService {
    return (this._members ??= new MembersService());
  }

  get households(): HouseholdsService {
    return (this._households ??= new HouseholdsService());
  }

  get events(): EventsService {
    return (this._events ??= new EventsService());
  }

  get eventRSVPs(): EventRSVPService {
    return (this._eventRSVPs ??= new EventRSVPService());
  }

  get donations(): DonationsService {
    return (this._donations ??= new DonationsService());
  }

  get donationCategories(): DonationCategoriesService {
    return (this._donationCategories ??= new DonationCategoriesService());
  }

  get donationStatements(): DonationStatementsService {
    return (this._donationStatements ??= new DonationStatementsService());
  }

  async getDashboardStats(): Promise<DashboardStatistics> {
    const memberStats = await this.members.getStatistics();

    let eventStats: EventStatistics = {
      total: 0,
      upcoming: 0,
      thisWeek: 0,
      thisMonth: 0,
    };

    if (isFeatureEnabled('events')) {
      const upcomingEvents = await this.events.getUpcomingPublicEvents(100);
      const now = new Date();
      const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      eventStats = {
        total: upcomingEvents.length,
        upcoming: upcomingEvents.length,
        thisWeek: upcomingEvents.filter((event) => event.startDate <= oneWeek)
          .length,
        thisMonth: upcomingEvents.filter(
          (event) => event.startDate <= oneMonth
        ).length,
      };
    }

    return {
      members: memberStats,
      events: eventStats,
      overview: {
        totalMembers: memberStats.total,
        upcomingEvents: eventStats.upcoming,
        recentActivity: [
          'Recent registrations',
          'Member activities',
          'Recent updates',
          'Event activities',
        ],
      },
    };
  }

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
      includeEvents = isFeatureEnabled('events'),
      limit = 20,
    } = options || {};

    const shouldSearchEvents = includeEvents && isFeatureEnabled('events');

    const [members, events] = await Promise.all([
      includeMembers ? this.members.search(searchTerm, { limit }) : [],
      shouldSearchEvents ? this.searchEvents(searchTerm, limit) : [],
    ]);

    return {
      members: members.slice(0, limit),
      events: events.slice(0, limit),
      total: members.length + events.length,
    };
  }

  private async searchEvents(
    searchTerm: string,
    limitCount: number
  ): Promise<Event[]> {
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

  async testConnection(): Promise<{
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    error?: string;
  }> {
    try {
      await this.members.getAll();
      const testMember = await this.members.create({
        firstName: 'Test',
        lastName: 'Connection',
        email: `test-${Date.now()}@example.com`,
        role: 'member',
        memberStatus: 'active',
        fullName: 'Test Connection',
        phone: '',
      });

      if (testMember && typeof testMember === 'object' && 'id' in testMember) {
        await this.members.delete(testMember.id);
      }

      return { canRead: true, canWrite: true, canDelete: true };
    } catch (error) {
      return {
        canRead: false,
        canWrite: false,
        canDelete: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getCollectionCounts(): Promise<{
    members: number;
    events: number;
  }> {
    const members = await this.members.count();
    const events = isFeatureEnabled('events')
      ? (await this.events.getUpcomingPublicEvents(1000)).length
      : 0;

    return { members, events };
  }

  subscribeToDashboard(
    callback: (stats: DashboardStatistics) => void
  ): () => void {
    return this.members.subscribeToMemberDirectory({}, async () => {
      const stats = await this.getDashboardStats();
      callback(stats);
    });
  }

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
    const allMembers = await this.members.getAll();
    let issuesFound = 0;

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
        issuesFixed: 0,
      },
    };
  }
}

export const firebase = {
  get members() {
    return new MembersService();
  },
  get households() {
    return new HouseholdsService();
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

let firebaseServiceSingleton: FirebaseService | null = null;

export function getFirebaseService(): FirebaseService {
  return (firebaseServiceSingleton ??= new FirebaseService());
}

export const firebaseService = new Proxy({} as FirebaseService, {
  get(_target, prop, receiver) {
    return Reflect.get(getFirebaseService(), prop, receiver);
  },
});
