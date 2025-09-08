import { Users, AlertCircle } from 'lucide-react';

interface CapacityInfo {
  capacity?: number;
  currentAttending: number;
  spotsRemaining?: number;
  isAtCapacity: boolean;
  waitlistEnabled: boolean;
  waitlistCount: number;
}

interface CapacityIndicatorProps {
  capacityInfo: CapacityInfo;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export function CapacityIndicator({ 
  capacityInfo, 
  variant = 'default',
  className = '' 
}: CapacityIndicatorProps) {
  const {
    capacity,
    currentAttending,
    spotsRemaining,
    isAtCapacity,
    waitlistEnabled,
    waitlistCount
  } = capacityInfo;

  // Compact variant for cards and small displays
  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 text-sm ${className}`}>
        <Users className="h-4 w-4 text-gray-500" />
        <span className="text-gray-600">
          {currentAttending}
          {capacity && ` / ${capacity}`}
        </span>
        {isAtCapacity && (
          <span className="text-amber-600 font-medium">Full</span>
        )}
        {waitlistCount > 0 && (
          <span className="text-gray-500">
            (+{waitlistCount} waiting)
          </span>
        )}
      </div>
    );
  }

  // Detailed variant for modals and full displays
  if (variant === 'detailed') {
    return (
      <div className={`p-4 bg-blue-50 rounded-lg border border-blue-200 ${className}`}>
        <div className="flex items-center space-x-2 mb-2">
          <Users className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Event Capacity</span>
        </div>
        <div className="text-sm text-blue-700 space-y-1">
          <div>Currently attending: {currentAttending}</div>
          {capacity && (
            <div>
              Spots remaining: {spotsRemaining || 0} of {capacity}
            </div>
          )}
          {isAtCapacity && waitlistEnabled && (
            <div className="flex items-center space-x-2 mt-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-amber-700">Event is at capacity. New RSVPs will be waitlisted.</span>
            </div>
          )}
          {waitlistCount > 0 && (
            <div>People on waitlist: {waitlistCount}</div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-600">
          {currentAttending} attending
        </span>
      </div>
      
      {capacity && (
        <div className="text-sm text-gray-500">
          {spotsRemaining || 0} spots remaining
        </div>
      )}
      
      {isAtCapacity && (
        <div className="flex items-center space-x-1">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-amber-600 font-medium">
            At capacity
          </span>
        </div>
      )}
      
      {waitlistCount > 0 && (
        <div className="text-sm text-gray-500">
          {waitlistCount} on waitlist
        </div>
      )}
    </div>
  );
}