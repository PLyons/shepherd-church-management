// src/components/dashboard/StatsCard.tsx
// Reusable stat card for dashboard metric grids
// Displays an icon, label, and primary value with optional secondary text
// RELEVANT FILES: src/components/dashboard/sections/AdminDashboardStats.tsx, src/components/dashboard/PastorDashboard.tsx

import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBgClass: string;
  secondary?: string;
  trend?: React.ReactNode;
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  iconBgClass,
  secondary,
  trend,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div
            className={`w-8 h-8 ${iconBgClass} rounded-full flex items-center justify-center`}
          >
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {label}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {secondary && (
                <div className="ml-2 text-sm text-gray-500">{secondary}</div>
              )}
              {trend}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
