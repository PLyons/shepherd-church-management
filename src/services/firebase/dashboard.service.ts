import { BaseFirestoreService } from './base.service';
import { MembersService } from './members.service';
import { HouseholdsService } from './households.service';
import type { Household } from '../../types';

// Placeholder Event interface for future implementation
export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

// ============================================================================
// ROLE-BASED DASHBOARD SERVICE
// ============================================================================
// Provides secure, role-based data access for dashboard views

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: ActivityItem[];
  upcomingEvents: Event[];
  personalInfo?: PersonalDashboardInfo;
  quickActions: QuickAction[];
}

export interface DashboardStats {
  totalMembers?: number;
  activeMembers?: number;
  totalHouseholds?: number;
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
  householdInfo: Household;
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
  private householdsService: HouseholdsService;

  constructor() {
    this.membersService = new MembersService();
    this.householdsService = new HouseholdsService();
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

      const [memberStats, householdStats] = await Promise.all([
        this.membersService.getStatistics().catch((err) => {
          console.error('Members stats error:', err);
          return { total: 0, active: 0, inactive: 0, visitors: 0 };
        }),
        this.householdsService.getStatistics().catch((err) => {
          console.error('Households stats error:', err);
          return { total: 0 };
        }),
      ]);

      console.log('DashboardService: Statistics fetched successfully');

      const recentActivity = await this.getAdminActivity().catch((err) => {
        console.error('Admin activity error:', err);
        return [];
      });

      console.log('DashboardService: Admin dashboard data complete');

      return {
        stats: {
          totalMembers: memberStats.total,
          activeMembers: memberStats.active,
          totalHouseholds: householdStats.total,
        },
        recentActivity,
        upcomingEvents: [],
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
    const [memberStats, householdStats] = await Promise.all([
      this.membersService.getStatistics(),
      this.householdsService.getStatistics(),
    ]);

    const recentActivity = await this.getPastorActivity();

    return {
      stats: {
        totalMembers: memberStats.total,
        activeMembers: memberStats.active,
        totalHouseholds: householdStats.total,
      },
      recentActivity,
      upcomingEvents: [],
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

    // Get personal information and activity
    const [personalInfo, recentActivity] = await Promise.all([
      this.getMemberPersonalInfo(userId),
      this.getMemberActivity(userId),
    ]);

    return {
      stats: {},
      recentActivity,
      upcomingEvents: [],
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

    return {
      householdInfo: household,
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
        id: 'manage-roles',
        title: 'Manage Roles',
        description: 'Assign user roles and permissions',
        route: '/settings',
        icon: 'shield',
        color: 'red',
        allowedRoles: ['admin'],
      },
      {
        id: 'update-profile',
        title: 'Update Profile',
        description: 'Update your personal information',
        route: '/members/' + (role === 'member' ? 'me' : ''),
        icon: 'user',
        color: 'blue',
        allowedRoles: ['member', 'pastor', 'admin'],
      },
      {
        id: 'view-households',
        title: 'View Households',
        description: 'Manage household information',
        route: '/households',
        icon: 'home',
        color: 'green',
        allowedRoles: ['admin', 'pastor'],
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
    data: DashboardData,
    role: 'admin' | 'pastor' | 'member'
  ): DashboardData {
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
