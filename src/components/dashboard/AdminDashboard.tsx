// src/components/dashboard/AdminDashboard.tsx
// Administrative dashboard coordinator — loads data and composes section components
// Thin coordinator for admin overview with feature-flagged stats and actions
// RELEVANT FILES: src/services/firebase/dashboard.service.ts, src/components/dashboard/sections/AdminDashboardStats.tsx

import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import {
  dashboardService,
  type DashboardData,
} from '../../services/firebase/dashboard.service';
import { useAuth } from '../../hooks/useUnifiedAuth';
import { useMemberStats } from '../../hooks/useMemberStats';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { isFeatureEnabled } from '../../config/features';
import { filterQuickActionsByFeature } from './dashboard-utils';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import { AdminDashboardStats } from './sections/AdminDashboardStats';
import { AdminDashboardExtras } from './sections/AdminDashboardExtras';
import { DashboardUpcomingEvents } from './sections/DashboardUpcomingEvents';
import { logger } from '../../utils/logger';
import type { Member } from '../../types';

interface AdminDashboardProps {
  member: Member;
}

export function AdminDashboard({ member }: AdminDashboardProps) {
  const { user } = useAuth();
  const memberOnlyCore =
    !isFeatureEnabled('events') && !isFeatureEnabled('donations');
  const { stats: memberStats, loading: memberStatsLoading } = useMemberStats({
    enabled: memberOnlyCore,
  });
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (memberOnlyCore) {
      if (memberStatsLoading) return;
      setDashboardData({
        stats: {
          totalMembers: memberStats?.totalMembers ?? 0,
          activeMembers: memberStats?.activeMembers ?? 0,
          totalHouseholds: memberStats?.totalHouseholds ?? 0,
          upcomingEvents: 0,
        },
        recentActivity: [],
        upcomingEvents: [],
        quickActions: dashboardService.getQuickActionsForRole('admin'),
      });
      setLoading(false);
      return;
    }
    void fetchDashboardData();
  }, [member, memberOnlyCore, memberStats, memberStatsLoading]);

  const fetchDashboardData = async () => {
    logger.debug('AdminDashboard: Starting fetchDashboardData');
    const userId = user?.uid;
    if (!userId) {
      logger.warn('AdminDashboard: No user ID available');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardData(userId, 'admin');
      setDashboardData(data);
    } catch (error) {
      logger.error('AdminDashboard: Error fetching dashboard data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        userRole: 'admin',
      });
      setDashboardData({
        stats: {
          totalMembers: 0,
          activeMembers: 0,
          totalHouseholds: 0,
          upcomingEvents: 0,
          monthlyDonations: 0,
          totalDonations: 0,
        },
        recentActivity: [],
        upcomingEvents: [],
        quickActions: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        data-testid="dashboard-loading"
        className="flex justify-center items-center h-64"
      >
        <LoadingSpinner />
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const showEvents = isFeatureEnabled('events');
  const showDonations = isFeatureEnabled('donations');
  const filteredQuickActions = filterQuickActionsByFeature(
    dashboardData?.quickActions || []
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Complete church management and oversight
          </p>
        </div>
        <div className="flex items-center px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
          <Shield className="w-4 h-4 mr-1" />
          Administrator
        </div>
      </div>

      <AdminDashboardStats
        stats={stats}
        showEvents={showEvents}
        showDonations={showDonations}
      />

      <QuickActions
        title="Administrative Actions"
        actions={filteredQuickActions}
        testId="quick-actions-widget"
        showDonationExtras={showDonations}
      />

      <AdminDashboardExtras
        stats={stats}
        showEvents={showEvents}
        showDonations={showDonations}
      />

      <div className="grid grid-cols-2 gap-8">
        {showEvents && (
          <DashboardUpcomingEvents
            title="All Upcoming Events"
            events={dashboardData?.upcomingEvents || []}
            badgeVariant="admin"
          />
        )}
        <RecentActivity
          title="Recent System Activity"
          activities={dashboardData?.recentActivity || []}
          viewAllLink="/admin/audit-logs"
          variant="admin"
        />
      </div>
    </div>
  );
}
