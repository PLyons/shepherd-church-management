import { format } from 'date-fns';
import { MemberActivity } from '../../../../types/activity';
import { ACTIVITY_CONFIG } from '../../../../types/activity';

interface ActivityCardProps {
  activity: MemberActivity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const config = ACTIVITY_CONFIG[activity.type];

  const renderActivityContent = () => {
    switch (activity.type) {
      case 'profile_update':
        return (
          <div className="text-sm text-gray-600">
            Updated{' '}
            <span className="font-medium">{activity.metadata?.field}</span>
            {activity.metadata?.oldValue && activity.metadata?.newValue && (
              <div className="mt-1 text-xs text-gray-500">
                "{activity.metadata.oldValue}" → "{activity.metadata.newValue}"
              </div>
            )}
          </div>
        );

      case 'status_change':
        return (
          <div className="text-sm text-gray-600">
            Changed from{' '}
            <span className="font-medium">
              {activity.metadata?.previousStatus}
            </span>{' '}
            to{' '}
            <span className="font-medium">{activity.metadata?.newStatus}</span>
            {activity.metadata?.reason && (
              <div className="mt-1 text-xs text-gray-500 italic">
                "{activity.metadata.reason}"
              </div>
            )}
          </div>
        );

      case 'event_attendance':
        return (
          <div className="text-sm text-gray-600">
            {activity.metadata?.attendanceStatus === 'attended'
              ? 'Attended'
              : 'Registered for'}{' '}
            <span className="font-medium">{activity.metadata?.eventName}</span>
            {activity.metadata?.eventDate && (
              <div className="mt-1 text-xs text-gray-500">
                {format(new Date(activity.metadata.eventDate), 'PPP')}
              </div>
            )}
          </div>
        );

      case 'volunteer_service':
        return (
          <div className="text-sm text-gray-600">
            Volunteered as{' '}
            <span className="font-medium">{activity.metadata?.role}</span> in{' '}
            {activity.metadata?.department}
            {activity.metadata?.hours && (
              <div className="mt-1 text-xs text-gray-500">
                {activity.metadata.hours} hours of service
              </div>
            )}
          </div>
        );

      case 'communication':
        return (
          <div className="text-sm text-gray-600">
            {activity.metadata?.direction === 'outgoing' ? 'Sent' : 'Received'}{' '}
            {activity.metadata?.method} communication
            {activity.metadata?.subject && (
              <div className="mt-1 text-xs text-gray-500 italic">
                "{activity.metadata.subject}"
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-600">
            {activity.description || 'Activity recorded'}
          </div>
        );
    }
  };

  return (
    <div className="flex gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      {/* Activity Icon */}
      <div
        className={`flex-shrink-0 h-8 w-8 rounded-full ${config.bgColor} flex items-center justify-center`}
      >
        <span className="text-sm">{config.icon}</span>
      </div>

      {/* Activity Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">
              {activity.title}
            </h4>
            {renderActivityContent()}
          </div>

          <div className="flex-shrink-0 ml-4">
            <time className="text-xs text-gray-500">
              {format(activity.timestamp, 'h:mm a')}
            </time>
          </div>
        </div>

        {/* Source indicator */}
        {activity.source !== 'system' && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {activity.source === 'manual' ? 'Manually added' : 'Imported'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
