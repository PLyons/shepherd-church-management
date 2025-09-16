import { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  MessageCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { EventRSVP, RSVPStatus } from '../../types/events';
import { Member } from '../../types';
import { eventRSVPService } from '../../services/firebase/event-rsvp.service';
import { membersService } from '../../services/firebase/members.service';
import { useAuth } from '../../hooks/useUnifiedAuth';

interface RSVPListProps {
  eventId: string;
  className?: string;
  variant?: 'full' | 'summary' | 'compact';
  showNotes?: boolean;
}

interface RSVPWithMember extends EventRSVP {
  member?: Member;
}

export function RSVPList({
  eventId,
  className = '',
  variant = 'full',
  showNotes = false,
}: RSVPListProps) {
  const { user } = useAuth();
  const [rsvps, setRSVPs] = useState<RSVPWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<RSVPStatus, boolean>
  >({
    yes: true,
    maybe: false,
    no: false,
    waitlist: false,
  });

  // Check if current user has permission to view RSVP details
  const canViewDetails = user && ['admin', 'pastor'].includes(user.role || '');
  const canViewNames = user; // All authenticated users can see names

  useEffect(() => {
    if (!eventId) return;

    const loadRSVPs = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all RSVPs for the event
        const eventRSVPs = await eventRSVPService.getRSVPsByEvent(eventId);

        // Load member information for each RSVP
        const rsvpsWithMembers = await Promise.all(
          eventRSVPs.map(async (rsvp) => {
            try {
              const member = await membersService.getMemberById(rsvp.memberId);
              return { ...rsvp, member } as RSVPWithMember;
            } catch (err) {
              console.error(`Failed to load member ${rsvp.memberId}:`, err);
              return rsvp as RSVPWithMember;
            }
          })
        );

        setRSVPs(rsvpsWithMembers);
      } catch (err) {
        console.error('Error loading RSVPs:', err);
        setError('Failed to load RSVP information');
      } finally {
        setLoading(false);
      }
    };

    loadRSVPs();
  }, [eventId]);

  const toggleSection = (status: RSVPStatus) => {
    setExpandedSections((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  // Group RSVPs by status
  const groupedRSVPs = rsvps.reduce(
    (acc, rsvp) => {
      if (!acc[rsvp.status]) acc[rsvp.status] = [];
      acc[rsvp.status].push(rsvp);
      return acc;
    },
    {} as Record<RSVPStatus, RSVPWithMember[]>
  );

  // Status configurations
  const statusConfig = {
    yes: {
      label: 'Attending',
      icon: '✅',
      bgClass: 'bg-green-50 border-green-200',
      textClass: 'text-green-800',
      iconClass: 'text-green-600',
    },
    maybe: {
      label: 'Maybe Attending',
      icon: '❓',
      bgClass: 'bg-yellow-50 border-yellow-200',
      textClass: 'text-yellow-800',
      iconClass: 'text-yellow-600',
    },
    no: {
      label: 'Not Attending',
      icon: '❌',
      bgClass: 'bg-red-50 border-red-200',
      textClass: 'text-red-800',
      iconClass: 'text-red-600',
    },
    waitlist: {
      label: 'Waitlist',
      icon: '⏳',
      bgClass: 'bg-gray-50 border-gray-200',
      textClass: 'text-gray-800',
      iconClass: 'text-gray-600',
    },
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}
      >
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  // Compact variant for cards
  if (variant === 'compact') {
    const attendingCount = groupedRSVPs.yes?.length || 0;
    const maybeCount = groupedRSVPs.maybe?.length || 0;
    const waitlistCount = groupedRSVPs.waitlist?.length || 0;

    return (
      <div className={`flex items-center space-x-4 text-sm ${className}`}>
        <div className="flex items-center space-x-1">
          <Users className="h-4 w-4 text-green-600" />
          <span className="text-green-600 font-medium">{attendingCount}</span>
        </div>
        {maybeCount > 0 && (
          <div className="flex items-center space-x-1">
            <span className="text-yellow-600">❓ {maybeCount}</span>
          </div>
        )}
        {waitlistCount > 0 && (
          <div className="flex items-center space-x-1">
            <span className="text-gray-600">⏳ {waitlistCount}</span>
          </div>
        )}
      </div>
    );
  }

  // Summary variant
  if (variant === 'summary') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Object.entries(statusConfig).map(([status, config]) => {
          const statusRSVPs = groupedRSVPs[status as RSVPStatus] || [];
          if (statusRSVPs.length === 0) return null;

          return (
            <div
              key={status}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center space-x-2">
                <span>{config.icon}</span>
                <span className={config.textClass}>{config.label}</span>
              </div>
              <span className="font-medium">{statusRSVPs.length}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Full variant with detailed list
  return (
    <div className={`space-y-4 ${className}`}>
      {Object.entries(statusConfig).map(([status, config]) => {
        const statusRSVPs = groupedRSVPs[status as RSVPStatus] || [];
        if (statusRSVPs.length === 0) return null;

        const isExpanded = expandedSections[status as RSVPStatus];

        return (
          <div key={status} className={`border rounded-lg ${config.bgClass}`}>
            <button
              onClick={() => toggleSection(status as RSVPStatus)}
              className={`w-full p-3 flex items-center justify-between hover:bg-opacity-75 transition-colors ${config.bgClass}`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{config.icon}</span>
                <span className={`font-medium ${config.textClass}`}>
                  {config.label} ({statusRSVPs.length})
                </span>
              </div>
              {isExpanded ? (
                <ChevronDown className={`h-4 w-4 ${config.iconClass}`} />
              ) : (
                <ChevronRight className={`h-4 w-4 ${config.iconClass}`} />
              )}
            </button>

            {isExpanded && (
              <div className="px-3 pb-3 space-y-2">
                {statusRSVPs.map((rsvp) => (
                  <div
                    key={rsvp.id}
                    className="bg-white rounded p-3 border border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {canViewNames
                              ? rsvp.member
                                ? `${rsvp.member.firstName} ${rsvp.member.lastName}`
                                : 'Unknown Member'
                              : 'Member'}
                          </span>
                          {rsvp.numberOfGuests > 0 && (
                            <span className="text-sm text-gray-500">
                              +{rsvp.numberOfGuests} guest
                              {rsvp.numberOfGuests === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>

                        {canViewDetails && rsvp.notes && showNotes && (
                          <div className="mt-2 flex items-start space-x-2">
                            <MessageCircle className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600">
                              {rsvp.notes}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Intl.DateTimeFormat('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          }).format(rsvp.responseDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {rsvps.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>No RSVPs yet</p>
        </div>
      )}
    </div>
  );
}
