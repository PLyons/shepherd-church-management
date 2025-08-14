import { BaseFirestoreService } from './base.service';
import { MembersService } from './members.service';
import { HouseholdsService } from './households.service';

// ============================================================================
// ROLE-BASED DASHBOARD SERVICE
// ============================================================================
// Provides secure, role-based data access for dashboard views

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: ActivityItem[];
  upcomingEvents: any[];
  personalInfo?: PersonalDashboardInfo;
  quickActions: QuickAction[];
}

export interface DashboardStats {
  totalMembers?: number;
  activeMembers?: number;
  totalHouseholds?: number;
  upcomingEvents?: number;
  thisWeekEvents?: number;
  myUpcomingCommitments?: number;
  // Financial stats (role-restricted)
  monthlyDonations?: number;
  totalDonations?: number;
  myDonations?: number;
  myDonationsThisYear?: number;
}

export interface ActivityItem {
  id: string;
  type: 'event' | 'member' | 'donation' | 'rsvp';
  title: string;
  description: string;
  date: string;
  icon?: string;
}

export interface PersonalDashboardInfo {
  upcomingEvents: any[];
  myRSVPs: any[];
  myDonations: any[];
  householdInfo: any;
  myVolunteerCommitments: any[];
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  color: string;
  allowedRoles: ('admin' | 'pastor' | 'member')[];
}

export class DashboardService {
  private membersService: MembersService;
  private eventsService: EventsService;
  private householdsService: HouseholdsService;
  private donationsService: DonationsService;

  constructor() {
    this.membersService = new MembersService();
    this.eventsService = new EventsService();
    this.householdsService = new HouseholdsService();
    this.donationsService = new DonationsService();
  }

  // ============================================================================
  // ROLE-BASED DASHBOARD DATA
  // ============================================================================

  /**
   * Get dashboard data filtered by user role
   */
  async getDashboardData(
    userId: string,
    userRole: 'admin' | 'pastor' | 'member'
  ): Promise<DashboardData> {
    switch (userRole) {
      case 'admin':
        return this.getAdminDashboard(userId);
      case 'pastor':
        return this.getPastorDashboard(userId);
      case 'member':
        return this.getMemberDashboard(userId);
      default:
        throw new Error('Invalid user role');
    }
  }

  /**
   * Admin Dashboard - Full system access
   */
  private async getAdminDashboard(userId: string): Promise<DashboardData> {
    try {
      console.log('DashboardService: Starting admin dashboard data fetch');

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Dashboard data fetch timeout')),
          30000
        ); // 30 second timeout
      });

      const dataPromise = Promise.all([
        this.membersService.getStatistics().catch((err) => {
          console.error('Members stats error:', err);
          return { total: 0, active: 0, inactive: 0, visitors: 0 };
        }),
        this.eventsService.getStatistics().catch((err) => {
          console.error('Events stats error:', err);
          return { upcoming: 0, total: 0 };
        }),
        this.householdsService.getStatistics().catch((err) => {
          console.error('Households stats error:', err);
          return { total: 0 };
        }),
        this.donationsService.getDonationStats(userId, 'admin').catch((err) => {
          console.error('Donations stats error:', err);
          return { monthlyTotal: 0, totalAmount: 0 };
        }),
      ]);

      const [memberStats, eventStats, householdStats, donationStats] =
        await Promise.race([dataPromise, timeoutPromise]);

      console.log('DashboardService: Statistics fetched successfully');

      const [upcomingEvents, recentActivity] = await Promise.all([
        this.eventsService.getUpcomingEvents(5, false).catch((err) => {
          console.error('Upcoming events error:', err);
          return [];
        }),
        this.getAdminActivity().catch((err) => {
          console.error('Admin activity error:', err);
          return [];
        }),
      ]);

      console.log('DashboardService: Admin dashboard data complete');

      return {
        stats: {
          totalMembers: memberStats.total,
          activeMembers: memberStats.active,
          totalHouseholds: householdStats.total,
          upcomingEvents: eventStats.upcoming,
          thisWeekEvents: eventStats.upcoming, // TODO: Add week filtering
          // Financial data available for admins
          monthlyDonations: donationStats.monthlyTotal,
          totalDonations: donationStats.totalAmount,
        },
        recentActivity,
        upcomingEvents,
        quickActions: this.getQuickActions('admin'),
      };
    } catch (error) {
      console.error('DashboardService: Error in getAdminDashboard:', error);
      throw error;
    }
  }

  /**
   * Pastor Dashboard - Pastoral care focus
   */
  private async getPastorDashboard(userId: string): Promise<DashboardData> {
    const [memberStats, eventStats, donationStats] = await Promise.all([
      this.membersService.getStatistics(),
      this.eventsService.getStatistics(),
      this.donationsService.getDonationStats(userId, 'pastor'),
    ]);

    const upcomingEvents = await this.eventsService.getUpcomingEvents(5, false);
    const recentActivity = await this.getPastorActivity();

    return {
      stats: {
        totalMembers: memberStats.total,
        activeMembers: memberStats.active,
        upcomingEvents: eventStats.upcoming,
        thisWeekEvents: eventStats.upcoming, // TODO: Add week filtering
        // Aggregate financial data only - no individual donations
        monthlyDonations: donationStats.monthlyTotal,
      },
      recentActivity,
      upcomingEvents,
      quickActions: this.getQuickActions('pastor'),
    };
  }

  /**
   * Member Dashboard - Personal data only
   */
  private async getMemberDashboard(userId: string): Promise<DashboardData> {
    // Get member data
    const member = await this.membersService.getById(userId);
    if (!member) {
      throw new Error('Member not found');
    }

    // Get only public events for regular members
    const upcomingEvents = await this.eventsService.getUpcomingEvents(5, true);

    // Get personal information and donation stats
    const [personalInfo, donationStats, recentActivity] = await Promise.all([
      this.getMemberPersonalInfo(userId),
      this.donationsService.getDonationStats(userId, 'member'),
      this.getMemberActivity(userId),
    ]);

    return {
      stats: {
        upcomingEvents: upcomingEvents.length,
        myUpcomingCommitments: 0, // TODO: Add when volunteer service is implemented
        // Personal financial data only - SECURE: Only member's own data
        myDonations: donationStats.totalAmount,
        myDonationsThisYear: donationStats.yearToDateTotal,
      },
      recentActivity,
      upcomingEvents,
      personalInfo,
      quickActions: this.getQuickActions('member'),
    };
  }

  // ============================================================================
  // PERSONAL INFORMATION (MEMBERS ONLY)
  // ============================================================================

  /**
   * Get member's personal dashboard information
   */
  private async getMemberPersonalInfo(
    userId: string
  ): Promise<PersonalDashboardInfo> {
    const member = await this.membersService.getById(userId);
    if (!member) {
      throw new Error('Member not found');
    }

    // Get household information
    const household = member.householdId
      ? await this.householdsService.getById(member.householdId)
      : null;

    // Get member's event RSVPs
    // TODO: Implement RSVP service to get user's RSVPs
    const myRSVPs: any[] = [];

    // Get personal donations - SECURE: Only user's own donations
    const myDonations = await this.donationsService.getDonationsByRole(
      userId,
      'member',
      userId
    );

    // Get volunteer commitments
    // TODO: Implement volunteer service to get user's commitments
    const myVolunteerCommitments: any[] = [];

    return {
      upcomingEvents: await this.eventsService.getUpcomingEvents(3, true),
      myRSVPs,
      myDonations,
      householdInfo: household,
      myVolunteerCommitments,
    };
  }

  // ============================================================================
  // ACTIVITY FEEDS (ROLE-SPECIFIC)
  // ============================================================================

  /**
   * Get recent activity for admin users
   */
  private async getAdminActivity(): Promise<ActivityItem[]> {
    // TODO: Implement comprehensive admin activity feed
    // - New member registrations
    // - Event creations
    // - Role changes
    // - System activities
    return [
      {
        id: '1',
        type: 'member',
        title: 'New Member Registered',
        description: 'John Doe joined the church',
        date: new Date().toISOString(),
        icon: 'user-plus',
      },
    ];
  }

  /**
   * Get recent activity for pastor users
   */
  private async getPastorActivity(): Promise<ActivityItem[]> {
    // TODO: Implement pastor-focused activity feed
    // - New member registrations
    // - Event RSVPs
    // - Pastoral care needs
    // - Ministry activities
    return [
      {
        id: '1',
        type: 'event',
        title: 'Sunday Service RSVP',
        description: '15 new RSVPs for this Sunday',
        date: new Date().toISOString(),
        icon: 'calendar',
      },
    ];
  }

  /**
   * Get recent activity for member users
   */
  private async getMemberActivity(userId: string): Promise<ActivityItem[]> {
    // TODO: Implement member personal activity feed
    // - Own event RSVPs
    // - Own donations
    // - Volunteer assignments
    // - Household updates
    return [
      {
        id: '1',
        type: 'rsvp',
        title: 'Event RSVP Confirmed',
        description: 'You RSVPd to Sunday Service',
        date: new Date().toISOString(),
        icon: 'check-circle',
      },
    ];
  }

  // ============================================================================
  // QUICK ACTIONS (ROLE-BASED)
  // ============================================================================

  /**
   * Get role-appropriate quick actions
   */
  private getQuickActions(role: 'admin' | 'pastor' | 'member'): QuickAction[] {
    const allActions: QuickAction[] = [
      // Admin-only actions
      {
        id: 'create-event',
        title: 'Create Event',
        description: 'Schedule a new church event',
        route: '/events/new',
        icon: 'plus',
        color: 'blue',
        allowedRoles: ['admin', 'pastor'],
      },
      {
        id: 'add-member',
        title: 'Add Member',
        description: 'Register a new church member',
        route: '/members?action=create',
        icon: 'user-plus',
        color: 'green',
        allowedRoles: ['admin', 'pastor'],
      },
      {
        id: 'record-donation',
        title: 'Record Donation',
        description: 'Add a new donation record',
        route: '/donations',
        icon: 'dollar-sign',
        color: 'purple',
        allowedRoles: ['admin'],
      },
      {
        id: 'manage-roles',
        title: 'Manage Roles',
        description: 'Assign user roles and permissions',
        route: '/admin/roles',
        icon: 'shield',
        color: 'red',
        allowedRoles: ['admin'],
      },
      // Member actions
      {
        id: 'update-profile',
        title: 'Update Profile',
        description: 'Update your personal information',
        route: '/profile',
        icon: 'user',
        color: 'blue',
        allowedRoles: ['member', 'pastor', 'admin'],
      },
      {
        id: 'view-events',
        title: 'Browse Events',
        description: 'See upcoming church events',
        route: '/events',
        icon: 'calendar',
        color: 'green',
        allowedRoles: ['member', 'pastor', 'admin'],
      },
      {
        id: 'my-donations',
        title: 'My Donations',
        description: 'View your donation history',
        route: '/donations/my-donations',
        icon: 'heart',
        color: 'purple',
        allowedRoles: ['member', 'pastor', 'admin'],
      },
    ];

    // Filter actions based on role
    return allActions.filter((action) => action.allowedRoles.includes(role));
  }

  // ============================================================================
  // DATA VALIDATION AND SECURITY
  // ============================================================================

  /**
   * Validate that user can access requested data
   */
  private async validateDataAccess(
    userId: string,
    requestedUserId: string,
    userRole: string
  ): Promise<boolean> {
    // Admins can access all data
    if (userRole === 'admin') {
      return true;
    }

    // Pastors can access member data for pastoral care
    if (userRole === 'pastor') {
      return true; // TODO: Add specific pastoral care access rules
    }

    // Members can only access their own data
    if (userRole === 'member') {
      return userId === requestedUserId;
    }

    return false;
  }

  /**
   * Sanitize data based on role permissions
   */
  private sanitizeDataForRole(
    data: any,
    role: 'admin' | 'pastor' | 'member'
  ): any {
    if (role === 'admin') {
      return data; // Admins see everything
    }

    if (role === 'pastor') {
      // Remove sensitive admin-only information
      const { systemLogs, adminNotes, ...pastoralData } = data;
      return pastoralData;
    }

    if (role === 'member') {
      // Members only see basic information
      const { id, title, startTime, location, isPublic, description } = data;
      return { id, title, startTime, location, isPublic, description };
    }

    return {};
  }

  // ============================================================================
  // AUDIT LOGGING
  // ============================================================================

  /**
   * Log dashboard data access for audit purposes
   */
  private async logDataAccess(
    userId: string,
    userRole: string,
    dataType: string
  ): Promise<void> {
    // TODO: Implement audit logging
    console.log(
      `[AUDIT] User ${userId} (${userRole}) accessed ${dataType} dashboard data`
    );
  }
}

// Create and export singleton instance
export const dashboardService = new DashboardService();
