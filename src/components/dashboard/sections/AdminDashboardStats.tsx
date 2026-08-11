// src/components/dashboard/sections/AdminDashboardStats.tsx
// Admin dashboard statistics grid with feature-flagged donation and event cards
// Renders member/household counts plus optional financial and event metrics
// RELEVANT FILES: src/components/dashboard/StatsCard.tsx, src/components/dashboard/AdminDashboard.tsx

import { Users, Home, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { StatsCard } from '../StatsCard';
import { formatCurrency } from '../dashboard-utils';
import type { DashboardStats } from '../../../types';

interface AdminDashboardStatsProps {
  stats: Partial<DashboardStats>;
  showEvents: boolean;
  showDonations: boolean;
}

export function AdminDashboardStats({
  stats,
  showEvents,
  showDonations,
}: AdminDashboardStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-6">
      <StatsCard
        label="Total Members"
        value={stats.totalMembers || 0}
        icon={Users}
        iconBgClass="bg-blue-500"
        secondary={`(${stats.activeMembers || 0} active)`}
      />
      <StatsCard
        label="Households"
        value={stats.totalHouseholds || 0}
        icon={Home}
        iconBgClass="bg-green-500"
      />
      {showDonations && (
        <StatsCard
          label="Monthly Donations"
          value={formatCurrency(stats.monthlyDonations || 0)}
          icon={DollarSign}
          iconBgClass="bg-purple-500"
          trend={
            <div className="ml-2 flex items-center text-sm text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>+5%</span>
            </div>
          }
        />
      )}
      {showEvents && (
        <StatsCard
          label="Upcoming Events"
          value={stats.upcomingEvents || 0}
          icon={Calendar}
          iconBgClass="bg-yellow-500"
        />
      )}
    </div>
  );
}
