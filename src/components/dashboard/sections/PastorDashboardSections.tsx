// src/components/dashboard/sections/PastorDashboardSections.tsx
// Pastor dashboard UI sections: stats, ministry focus, engagement, health
// Extracted from PastorDashboard to keep the coordinator under 300 LOC
// RELEVANT FILES: src/components/dashboard/PastorDashboard.tsx, src/components/dashboard/StatsCard.tsx

import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Heart,
  Activity,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { StatsCard } from '../StatsCard';
import { formatCurrency } from '../dashboard-utils';
import type { DashboardStats } from '../../../types';

const GivingOverviewWidget = lazy(() =>
  import('../../donations/GivingOverviewWidget').then((m) => ({
    default: m.GivingOverviewWidget,
  }))
);

interface PastorDashboardSectionsProps {
  stats: Partial<DashboardStats>;
  showEvents: boolean;
  showDonations: boolean;
}

export function PastorDashboardStats({
  stats,
  showEvents,
  showDonations,
}: PastorDashboardSectionsProps) {
  return (
    <div className="grid grid-cols-4 gap-6">
      <StatsCard
        label="Church Members"
        value={stats.totalMembers || 0}
        icon={Users}
        iconBgClass="bg-blue-500"
        secondary={`(${stats.activeMembers || 0} active)`}
      />
      {showEvents && (
        <StatsCard
          label="Ministry Events"
          value={stats.upcomingEvents || 0}
          icon={Calendar}
          iconBgClass="bg-green-500"
        />
      )}
      {showDonations && (
        <StatsCard
          label="Giving (Monthly)"
          value={formatCurrency(stats.monthlyDonations || 0)}
          icon={Heart}
          iconBgClass="bg-purple-500"
          trend={
            <div className="ml-2 flex items-center text-sm text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>+3%</span>
            </div>
          }
        />
      )}
      <StatsCard
        label="Engagement Score"
        value="87%"
        icon={Activity}
        iconBgClass="bg-yellow-500"
      />
    </div>
  );
}

export function PastorMinistryFocus({
  stats,
  showEvents,
  showDonations,
}: PastorDashboardSectionsProps) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {showDonations && (
        <div className="col-span-2">
          <Suspense fallback={null}>
            <GivingOverviewWidget />
          </Suspense>
        </div>
      )}
      <div
        className={`bg-white rounded-lg shadow p-6${showDonations ? '' : ' col-span-3'}`}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Ministry Focus
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Active Members</span>
            <span className="font-semibold text-gray-900">
              {stats.activeMembers || 0}
            </span>
          </div>
          {showEvents && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Upcoming Events</span>
              <span className="font-semibold text-gray-900">
                {stats.upcomingEvents || 0}
              </span>
            </div>
          )}
          <div className="pt-2 border-t border-gray-200">
            <Link
              to="/member-care"
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              View Member Care →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PastorMemberEngagement({
  stats,
}: {
  stats: Partial<DashboardStats>;
}) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Member Engagement
        </h2>
        <Link
          to="/members"
          className="text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center"
        >
          View all →
        </Link>
      </div>
      <div className="p-6 space-y-4">
        {[
          {
            title: 'Active Members',
            desc: 'Attended event in last 30 days',
            value: stats.activeMembers || 0,
            sub: `of ${stats.totalMembers || 0}`,
            color: 'text-green-600',
          },
          {
            title: 'New Members',
            desc: 'Joined in last 60 days',
            value: 3,
            sub: 'this month',
            color: 'text-blue-600',
          },
          {
            title: 'Follow-up Needed',
            desc: 'Members needing pastoral care',
            value: 5,
            sub: 'priority',
            color: 'text-yellow-600',
          },
        ].map((row) => (
          <div key={row.title} className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{row.title}</h4>
              <p className="text-sm text-gray-500">{row.desc}</p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-semibold ${row.color}`}>
                {row.value}
              </div>
              <div className="text-sm text-gray-500">{row.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PastorMinistryHealth({
  showEvents,
  showDonations,
}: {
  showEvents: boolean;
  showDonations: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Ministry Health
      </h2>
      <div className="grid grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">87%</div>
          <div className="text-sm text-gray-500">Member Engagement</div>
          <div className="text-xs text-gray-400 mt-1">Above average</div>
        </div>
        {showEvents && (
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">92%</div>
            <div className="text-sm text-gray-500">Event Attendance</div>
            <div className="text-xs text-gray-400 mt-1">Strong participation</div>
          </div>
        )}
        {showDonations && (
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">78%</div>
            <div className="text-sm text-gray-500">Giving Participation</div>
            <div className="text-xs text-gray-400 mt-1">Regular donors</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PastorAccessNotice({ showDonations }: { showDonations: boolean }) {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 mr-2" />
        <div className="text-sm text-purple-700">
          <strong>Pastoral Access:</strong> You can view member information for
          pastoral care purposes
          {showDonations
            ? '. Aggregate giving data is available for ministry planning; individual donation details require justification and are logged.'
            : '.'}
        </div>
      </div>
    </div>
  );
}
