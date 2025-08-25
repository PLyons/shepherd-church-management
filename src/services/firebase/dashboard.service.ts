import { MembersService } from './members.service';
import type { Event, DashboardStats as MainDashboardStats } from '../../types';

// ============================================================================
// ROLE-BASED DASHBOARD SERVICE
// ============================================================================
// Provides secure, role-based data access for dashboard views

export interface DashboardData {
  stats: MainDashboardStats;
  recentActivity: ActivityItem[];
  upcomingEvents: Event[];
  quickActions: QuickAction[];
}

export interface ActivityItem {
  id: string;
  type: 'event' | 'member' | 'donation' | 'rsvp';
  title: string;
  description: string;
  date: string;
  icon?: string;
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

  constructor() {
    this.membersService = new MembersService();
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
  private async getAdminDashboard(_userId: string): Promise<DashboardData> {
    try {
      console.log('DashboardService: Starting admin dashboard data fetch');

      const memberStats = await this.membersService
        .getStatistics()
        .catch((err: unknown) => {
          console.error('Members stats error:', err);
          return { total: 0, active: 0, inactive: 0, visitors: 0 };
        });

      console.log('DashboardService: Statistics fetched successfully');

      const recentActivity = await this.getAdminActivity().catch((err: unknown) => {
        console.error('Admin activity error:', err);
        return [];
      });

      console.log('DashboardService: Admin dashboard data complete');

      return {
        stats: {
          totalMembers: memberStats.total,
          activeMembers: memberStats.active,
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
  private async getPastorDashboard(_userId: string): Promise<DashboardData> {
    const memberStats = await this.membersService.getStatistics();

    const recentActivity = await this.getPastorActivity();

    return {
      stats: {
        totalMembers: memberStats.total,
        activeMembers: memberStats.active,
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

    // Get personal activity
    const recentActivity = await this.getMemberActivity(userId);

    return {
      stats: {},
      recentActivity,
      upcomingEvents: [],
      quickActions: this.getQuickActions('member'),
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
  private async getMemberActivity(_userId: string): Promise<ActivityItem[]> {
    // TODO: Implement member personal activity feed
    // - Own event RSVPs
    // - Own donations
    // - Volunteer assignments
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
    ];

    // Filter actions based on role
    return allActions.filter((action) => action.allowedRoles.includes(role));
  }
}

// Create and export singleton instance
export const dashboardService = new DashboardService();
