import { useMemo } from 'react';
import { format, isToday, isYesterday, startOfDay } from 'date-fns';
import { MemberActivity } from '../../../../types/activity';
import { ActivityCard } from './ActivityCard';

interface ActivityTimelineProps {
  activities: MemberActivity[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

export function ActivityTimeline({
  activities,
  hasMore,
  loadingMore,
  onLoadMore,
}: ActivityTimelineProps) {
  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, MemberActivity[]> = {};

    activities.forEach((activity) => {
      const date = startOfDay(activity.timestamp);
      const dateKey = date.toISOString();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });

    // Sort groups by date (newest first)
    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([dateKey, activities]) => ({
        date: new Date(dateKey),
        activities: activities.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        ),
      }));
  }, [activities]);

  const formatDateHeader = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  return (
    <div className="space-y-6">
      {groupedActivities.map(({ date, activities }) => (
        <div key={date.toISOString()} className="space-y-4">
          {/* Date Header */}
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-medium text-gray-900">
              {formatDateHeader(date)}
            </h3>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-500">
              {activities.length}{' '}
              {activities.length === 1 ? 'activity' : 'activities'}
            </span>
          </div>

          {/* Activities for this date */}
          <div className="space-y-3 pl-4">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ))}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center py-4">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border border-gray-600 border-t-transparent" />
                Loading...
              </>
            ) : (
              'Load More Activities'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
