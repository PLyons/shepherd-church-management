// src/components/dashboard/RecentActivity.tsx
// Recent activity feed panel for dashboard views
// Renders activity items with role-specific icons and optional view-all link
// RELEVANT FILES: src/services/firebase/dashboard.service.ts, src/components/dashboard/AdminDashboard.tsx

import { Link } from 'react-router-dom';
import {
  Activity,
  Calendar,
  Users,
  Heart,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import type { ActivityItem } from '../../services/firebase/dashboard.service';

interface RecentActivityProps {
  title: string;
  activities: ActivityItem[];
  viewAllLink?: string;
  variant?: 'admin' | 'pastor' | 'member' | 'ministry';
  maxItems?: number;
}

function ActivityIcon({
  type,
  variant,
}: {
  type: ActivityItem['type'];
  variant: RecentActivityProps['variant'];
}) {
  if (variant === 'member') {
    if (type === 'rsvp') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (type === 'donation') return <Heart className="w-5 h-5 text-purple-500" />;
    if (type === 'event') return <Calendar className="w-5 h-5 text-blue-500" />;
  }
  if (variant === 'pastor' || variant === 'ministry') {
    if (type === 'event') return <Calendar className="w-5 h-5 text-blue-500" />;
    if (type === 'member') return <Users className="w-5 h-5 text-green-500" />;
    if (type === 'rsvp') return <Activity className="w-5 h-5 text-purple-500" />;
  }
  return <Activity className="w-5 h-5 text-blue-500" />;
}

export function RecentActivity({
  title,
  activities,
  viewAllLink,
  variant = 'admin',
  maxItems = 5,
}: RecentActivityProps) {
  const items = activities.slice(0, maxItems);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center"
          >
            View all <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        )}
      </div>
      <div className="divide-y divide-gray-200">
        {items.length > 0 ? (
          items.map((activity) => (
            <div key={activity.id} className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ActivityIcon type={activity.type} variant={variant} />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </h3>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {variant === 'member'
                      ? new Date(activity.date).toLocaleDateString()
                      : new Date(activity.date).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">
            <Activity className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
