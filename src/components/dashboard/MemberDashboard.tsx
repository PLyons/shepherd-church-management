// src/components/dashboard/MemberDashboard.tsx
// Member dashboard coordinator — loads data and composes personal section components
// Thin coordinator for member home view with feature-flagged widgets
// RELEVANT FILES: src/services/firebase/dashboard.service.ts, src/components/dashboard/sections/MemberDashboardSections.tsx

// src/components/dashboard/MemberDashboard.tsx
// Member dashboard coordinator — loads data and composes personal section components
// Thin coordinator for member home view with feature-flagged widgets
// RELEVANT FILES: src/services/firebase/dashboard.service.ts, src/components/dashboard/sections/MemberDashboardSections.tsx

import { useState, useEffect } from 'react';
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
  MemberPersonalStats,
  MemberPersonalInfo,
  MemberPrivacyNotice,
} from './sections/MemberDashboardSections';
import { logger } from '../../utils/logger';
import type { Member } from '../../types';

interface MemberDashboardProps {
  member: Member;
}

export function MemberDashboard({ member }: MemberDashboardProps) {
  const { user } = useAuth();
  const memberOnlyCore =
    !isFeatureEnabled('events') && !isFeatureEnabled('donations');
  const { loading: memberStatsLoading } = useMemberStats({
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
        stats: {},
        recentActivity: [],
        upcomingEvents: [],
        quickActions: dashboardService.getQuickActionsForRole('member'),
      });
      setLoading(false);
      return;
    }
    void fetchDashboardData();
  }, [member, memberOnlyCore, memberStatsLoading]);

  const fetchDashboardData = async () => {
    const userId = user?.uid;
    if (!userId) return;
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardData(userId, 'member');
      setDashboardData(data);
    } catch (error) {
      logger.error('Error fetching member dashboard data', error);
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
  const recentActivity = dashboardData?.recentActivity || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {member?.firstName || 'Friend'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening in your church community.
        </p>
      </div>

      <MemberPersonalStats
        stats={stats}
        showEvents={showEvents}
        showDonations={showDonations}
      />

      <QuickActions
        title="Quick Actions"
        actions={filteredQuickActions}
        gridCols={3}
      />

      <MemberPersonalInfo
        member={member}
        stats={stats}
        showEvents={showEvents}
        showDonations={showDonations}
      />

      {showEvents && (
        <div className="grid grid-cols-2 gap-8">
          <DashboardUpcomingEvents
            title="Upcoming Events"
            events={dashboardData?.upcomingEvents || []}
            badgeVariant="member"
          />
        </div>
      )}

      {recentActivity.length > 0 && (
        <RecentActivity
          title="Recent Activity"
          activities={recentActivity}
          variant="member"
        />
      )}

      <MemberPrivacyNotice showDonations={showDonations} />
    </div>
  );
}
