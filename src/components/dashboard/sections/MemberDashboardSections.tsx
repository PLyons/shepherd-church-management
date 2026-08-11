// src/components/dashboard/sections/MemberDashboardSections.tsx
// Member dashboard UI sections: personal stats, info sidebar, privacy notice
// Extracted from MemberDashboard to keep the coordinator under 300 LOC
// RELEVANT FILES: src/components/dashboard/MemberDashboard.tsx, src/components/dashboard/StatsCard.tsx

import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Heart, CheckCircle, AlertCircle } from 'lucide-react';
import { StatsCard } from '../StatsCard';
import type { DashboardStats, Member } from '../../../types';

const MyGivingWidget = lazy(() =>
  import('../../donations/MyGivingWidget').then((m) => ({
    default: m.MyGivingWidget,
  }))
);

interface MemberDashboardSectionsProps {
  member: Member;
  stats: Partial<DashboardStats>;
  showEvents: boolean;
  showDonations: boolean;
}

export function MemberPersonalStats({
  stats,
  showEvents,
  showDonations,
}: Omit<MemberDashboardSectionsProps, 'member'>) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {showEvents && (
        <StatsCard
          label="Upcoming Events"
          value={stats.upcomingEvents || 0}
          icon={Calendar}
          iconBgClass="bg-blue-500"
        />
      )}
      {showDonations && (
        <StatsCard
          label="My Donations This Year"
          value={`$${stats.myDonationsThisYear || 0}`}
          icon={Heart}
          iconBgClass="bg-purple-500"
        />
      )}
      <StatsCard
        label="My Commitments"
        value={stats.myUpcomingCommitments || 0}
        icon={CheckCircle}
        iconBgClass="bg-green-500"
      />
    </div>
  );
}

export function MemberPersonalInfo({
  member,
  stats,
  showEvents,
  showDonations,
}: MemberDashboardSectionsProps) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {showDonations && (
        <div className="col-span-2">
          <Suspense fallback={null}>
            <MyGivingWidget memberId={member.id} />
          </Suspense>
        </div>
      )}
      <div
        className={`bg-white rounded-lg shadow p-6${showDonations ? '' : ' col-span-3'}`}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Personal Info
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Member Since</span>
            <span className="font-semibold text-gray-900">
              {new Date(member.joinDate).getFullYear()}
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
              to="/profile"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View Profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MemberPrivacyNotice({ showDonations }: { showDonations: boolean }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
        <div className="text-sm text-blue-700">
          <strong>Your Privacy Matters:</strong>{' '}
          {showDonations
            ? 'You can only view your own donation history and personal information. Contact church leadership if you need assistance with your records.'
            : 'You can only view your own personal information. Contact church leadership if you need assistance with your records.'}
        </div>
      </div>
    </div>
  );
}
