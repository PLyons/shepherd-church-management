// src/components/dashboard/sections/AdminDashboardExtras.tsx
// Admin-only dashboard panels: quick stats sidebar, system status, security notice
// Keeps AdminDashboard thin by isolating secondary admin UI blocks
// RELEVANT FILES: src/components/dashboard/AdminDashboard.tsx, src/components/donations/DonationInsightsWidget.tsx

import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Settings, AlertCircle } from 'lucide-react';
import type { DashboardStats } from '../../../types';

const DonationInsightsWidget = lazy(() =>
  import('../../donations/DonationInsightsWidget').then((m) => ({
    default: m.DonationInsightsWidget,
  }))
);

interface AdminDashboardExtrasProps {
  stats: Partial<DashboardStats>;
  showEvents: boolean;
  showDonations: boolean;
}

export function AdminDashboardExtras({
  stats,
  showEvents,
  showDonations,
}: AdminDashboardExtrasProps) {
  return (
    <>
      <div className="grid grid-cols-3 gap-6">
        {showDonations && (
          <div className="col-span-2">
            <Suspense fallback={null}>
              <DonationInsightsWidget />
            </Suspense>
          </div>
        )}
        <div
          className={`bg-white rounded-lg shadow p-6${showDonations ? '' : ' col-span-3'}`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Members</span>
              <span className="font-semibold text-gray-900">
                {stats.activeMembers || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Households</span>
              <span className="font-semibold text-gray-900">
                {stats.totalHouseholds || 0}
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
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
          <Link
            to="/admin/settings"
            className="text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center"
          >
            Settings <Settings className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Database', status: 'Healthy' },
            { label: 'Authentication', status: 'Active' },
            { label: 'Storage', status: '85% Used' },
            { label: 'Backups', status: '2 days ago', warn: true },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center p-3 rounded-lg ${
                item.warn ? 'bg-yellow-50' : 'bg-green-50'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-3 ${
                  item.warn ? 'bg-yellow-500' : 'bg-green-500'
                }`}
              />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {item.label}
                </div>
                <div className="text-xs text-gray-500">{item.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
          <div className="text-sm text-red-700">
            <strong>Administrator Access:</strong> You have full access to all
            church data including financial records and personal information. All
            administrative actions are logged for audit purposes.
          </div>
        </div>
      </div>
    </>
  );
}
