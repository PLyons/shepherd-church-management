// src/services/firebase/dashboard.service.ts
// Firebase service for role-based dashboard data aggregation including statistics, activity, and quick actions
// Provides secure, role-filtered dashboard content with real-time updates and permission-based data access
// RELEVANT FILES: src/services/firebase/members.service.ts, src/config/features.ts, src/types/index.ts, src/components/dashboard/AdminDashboard.tsx

import { MembersService } from './members.service';
import { isFeatureEnabled } from '../../config/features';
import type { Event, DashboardStats as MainDashboardStats } from '../../types';

// ============================================================================
// ROLE-BASED DASHBOARD SERVICE
// ============================================================================

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

  /** Public helper for member-only-core dashboards */
  getQuickActionsForRole(role: 'admin' | 'pastor' | 'member'): QuickAction[] {
    return this.filterQuickActionsByFeatures(this.getQuickActions(role));
  }

  private async getAdminDashboard(_userId: string): Promise<DashboardData> {
    const memberStats = await this.membersService.getStatistics().catch(() => ({
      total: 0,
      active: 0,
      inactive: 0,
      visitors: 0,
    }));

    const upcomingEvents = await this.fetchAdminUpcomingEvents();
    const recentActivity = this.filterActivityByFeatures(
      await this.getAdminActivity().catch(() => [])
    );

    return {
      stats: {
        totalMembers: memberStats.total,
        activeMembers: memberStats.active,
        upcomingEvents: upcomingEvents.length,
      },
      recentActivity,
      upcomingEvents: upcomingEvents.slice(0, 5),
      quickActions: this.getQuickActionsForRole('admin'),
    };
  }

  private async getPastorDashboard(_userId: string): Promise<DashboardData> {
    const memberStats = await this.membersService.getStatistics();
    const upcomingEvents = await this.fetchRoleUpcomingEvents('pastor', 5);
    const recentActivity = this.filterActivityByFeatures(
      await this.getPastorActivity()
    );

    return {
      stats: {
        totalMembers: memberStats.total,
        activeMembers: memberStats.active,
      },
      recentActivity,
      upcomingEvents,
      quickActions: this.getQuickActionsForRole('pastor'),
    };
  }

  private async getMemberDashboard(userId: string): Promise<DashboardData> {
    const member = await this.membersService.getById(userId);
    if (!member) {
      throw new Error('Member not found');
    }

    const upcomingEvents = await this.fetchRoleUpcomingEvents('member', 5);
    const recentActivity = this.filterActivityByFeatures(
      await this.getMemberActivity(userId)
    );

    return {
      stats: {},
      recentActivity,
      upcomingEvents,
      quickActions: this.getQuickActionsForRole('member'),
    };
  }

  private async fetchAdminUpcomingEvents(): Promise<Event[]> {
    if (!isFeatureEnabled('events')) {
      return [];
    }

    const { eventsService } = await import('./events.service');
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    return eventsService.getEventsInRange(now, thirtyDaysFromNow).catch(() => []);
  }

  private async fetchRoleUpcomingEvents(
    role: 'pastor' | 'member',
    limit: number
  ): Promise<Event[]> {
    if (!isFeatureEnabled('events')) {
      return [];
    }

    const { eventsService } = await import('./events.service');
    return eventsService.getEventsByRoleSimple(role, limit).catch(() => []);
  }

  private filterActivityByFeatures(activity: ActivityItem[]): ActivityItem[] {
    return activity.filter((item) => {
      if (
        !isFeatureEnabled('events') &&
        (item.type === 'event' || item.type === 'rsvp')
      ) {
        return false;
      }
      if (!isFeatureEnabled('donations') && item.type === 'donation') {
        return false;
      }
      return true;
    });
  }

  private filterQuickActionsByFeatures(actions: QuickAction[]): QuickAction[] {
    return actions.filter((action) => {
      const route = action.route || '';
      if (
        !isFeatureEnabled('events') &&
        (route.startsWith('/events') || route.startsWith('/calendar'))
      ) {
        return false;
      }
      if (
        !isFeatureEnabled('donations') &&
        (route.startsWith('/donations') || route.includes('giving'))
      ) {
        return false;
      }
      return true;
    });
  }

  private async getAdminActivity(): Promise<ActivityItem[]> {
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

  private async getPastorActivity(): Promise<ActivityItem[]> {
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

  private async getMemberActivity(_userId: string): Promise<ActivityItem[]> {
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

    return allActions.filter((action) => action.allowedRoles.includes(role));
  }
}

export const dashboardService = new DashboardService();
