// src/components/dashboard/PastorDashboard.tsx
// Pastor dashboard coordinator — loads data and composes ministry section components
// Thin coordinator for pastoral oversight with feature-flagged widgets
// RELEVANT FILES: src/services/firebase/dashboard.service.ts, src/components/dashboard/sections/PastorDashboardSections.tsx

import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
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
import { DashboardUpcomingEvents } from './sections/DashboardUpcomingEvents';
import {
  PastorDashboardStats,
  PastorMinistryFocus,
  PastorMemberEngagement,
  PastorMinistryHealth,
  PastorAccessNotice,
} from './sections/PastorDashboardSections';
import { logger } from '../../utils/logger';
import type { Member } from '../../types';

interface PastorDashboardProps {
  member: Member;
}

export function PastorDashboard({ member }: PastorDashboardProps) {
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
          totalHouseholds: memberStats?.totalHouseholds,
        },
        recentActivity: [],
        upcomingEvents: [],
        quickActions: dashboardService.getQuickActionsForRole('pastor'),
      });
      setLoading(false);
      return;
    }
    void fetchDashboardData();
  }, [member, memberOnlyCore, memberStats, memberStatsLoading]);

  const fetchDashboardData = async () => {
    const userId = user?.uid;
    if (!userId) return;
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardData(userId, 'pastor');
      setDashboardData(data);
    } catch (error) {
      logger.error('Error fetching pastor dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
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
          <h1 className="text-3xl font-bold text-gray-900">Pastor Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Ministry oversight and pastoral care
          </p>
        </div>
        <div className="flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
          <BookOpen className="w-4 h-4 mr-1" />
          Pastor
        </div>
      </div>

      <PastorDashboardStats
        stats={stats}
        showEvents={showEvents}
        showDonations={showDonations}
      />

      <QuickActions
        title="Ministry Actions"
        actions={filteredQuickActions}
        gridCols={3}
      />

      <PastorMinistryFocus
        stats={stats}
        showEvents={showEvents}
        showDonations={showDonations}
      />

      <div className="grid grid-cols-2 gap-8">
        {showEvents && (
          <DashboardUpcomingEvents
            title="Ministry Events"
            events={dashboardData?.upcomingEvents || []}
            badgeVariant="pastor"
            showRsvpInfo
          />
        )}
        <PastorMemberEngagement stats={stats} />
      </div>

      <RecentActivity
        title="Recent Ministry Activity"
        activities={dashboardData?.recentActivity || []}
        variant="ministry"
      />

      <PastorMinistryHealth
        showEvents={showEvents}
        showDonations={showDonations}
      />

      <PastorAccessNotice showDonations={showDonations} />
    </div>
  );
}
