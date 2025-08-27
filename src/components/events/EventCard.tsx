import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  EyeOff,
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader,
} from 'lucide-react';
import { Event, EventRSVP, RSVPStatus } from '../../types/events';
import { Member } from '../../types';
import { eventRSVPService } from '../../services/firebase/event-rsvp.service';
import { eventsService } from '../../services/firebase/events.service';
import { useToast } from '../../contexts/ToastContext';
import { RSVPModal } from './RSVPModal';

interface EventCardProps {
  event: Event;
  currentMember: Member | null;
  canManageEvents: boolean;
  onEventUpdate: () => void;
}

const eventTypeLabels: Record<string, string> = {
  service: 'Service',
  bible_study: 'Bible Study',
  prayer_meeting: 'Prayer Meeting',
  youth_group: 'Youth Group',
  seniors_group: 'Seniors Group',
  womens_ministry: "Women's Ministry",
  mens_ministry: "Men's Ministry",
  special_event: 'Special Event',
  outreach: 'Outreach',
  volunteer_activity: 'Volunteer Activity',
  board_meeting: 'Board Meeting',
  training: 'Training',
  other: 'Other',
};

const eventTypeColors: Record<string, string> = {
  service: 'bg-blue-100 text-blue-800',
  bible_study: 'bg-green-100 text-green-800',
  prayer_meeting: 'bg-purple-100 text-purple-800',
  youth_group: 'bg-orange-100 text-orange-800',
  seniors_group: 'bg-gray-100 text-gray-800',
  womens_ministry: 'bg-pink-100 text-pink-800',
  mens_ministry: 'bg-indigo-100 text-indigo-800',
  special_event: 'bg-yellow-100 text-yellow-800',
  outreach: 'bg-teal-100 text-teal-800',
  volunteer_activity: 'bg-emerald-100 text-emerald-800',
  board_meeting: 'bg-slate-100 text-slate-800',
  training: 'bg-cyan-100 text-cyan-800',
  other: 'bg-neutral-100 text-neutral-800',
};

const rsvpIcons = {
  yes: CheckCircle,
  no: XCircle,
  maybe: HelpCircle,
  waitlist: HelpCircle,
};

const rsvpColors = {
  yes: 'text-green-600',
  no: 'text-red-600',
  maybe: 'text-yellow-600',
  waitlist: 'text-orange-600',
};

const rsvpLabels = {
  yes: 'Going',
  no: 'Not Going',
  maybe: 'Maybe',
  waitlist: 'Waitlist',
};

export function EventCard({ 
  event, 
  currentMember, 
  canManageEvents, 
  onEventUpdate 
}: EventCardProps) {
  const [userRSVP, setUserRSVP] = useState<EventRSVP | null>(null);
  const [rsvpLoading, setRSVPLoading] = useState(false);
  const [loadingRSVPStatus, setLoadingRSVPStatus] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadUserRSVP();
  }, [event.id, currentMember?.id]);

  const loadUserRSVP = async () => {
    if (!currentMember || !event.id) return;

    try {
      setLoadingRSVPStatus(true);
      const rsvp = await eventRSVPService.getRSVPByMember(event.id, currentMember.id);
      setUserRSVP(rsvp);
    } catch (error) {
      console.error('Error loading RSVP:', error);
    } finally {
      setLoadingRSVPStatus(false);
    }
  };

  const handleRSVPUpdate = async (status: RSVPStatus) => {
    if (!currentMember || !event.id) return;

    try {
      setRSVPLoading(true);
      
      if (userRSVP) {
        // Update existing RSVP
        await eventRSVPService.updateRSVP(event.id, userRSVP.id!, {
          status,
          updatedAt: new Date(),
        });
      } else {
        // Create new RSVP
        await eventRSVPService.createRSVP({
          eventId: event.id,
          memberId: currentMember.id,
          status,
          numberOfGuests: 0,
          responseDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Refresh RSVP data
      await loadUserRSVP();
      showToast('RSVP updated successfully', 'success');
    } catch (error) {
      console.error('Error updating RSVP:', error);
      showToast('Failed to update RSVP', 'error');
    } finally {
      setRSVPLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await eventsService.deleteEvent(event.id);
      showToast('Event deleted successfully', 'success');
      onEventUpdate();
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('Failed to delete event', 'error');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const canRSVP = currentMember && event.enableRSVP;
  const eventDate = event.startDateTime instanceof Date ? event.startDateTime : new Date(event.startDateTime);
  const isPastEvent = eventDate < new Date();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Event Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                eventTypeColors[event.type] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {eventTypeLabels[event.type] || event.type}
            </span>
            {event.visibility === 'private' && (
              <EyeOff className="h-4 w-4 text-gray-400" title="Private Event" />
            )}
          </div>
          {event.description && (
            <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
          )}
        </div>

        {/* Action Buttons */}
        {canManageEvents && (
          <div className="flex gap-2 ml-4">
            <Link
              to={`/events/${event.id}/edit`}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit Event"
            >
              <Edit className="h-4 w-4" />
            </Link>
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete Event"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{formatDate(eventDate)}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>
            {formatTime(eventDate)}
            {event.endDateTime && (
              <span>
                {' - '}
                {formatTime(event.endDateTime instanceof Date ? event.endDateTime : new Date(event.endDateTime))}
              </span>
            )}
          </span>
        </div>

        {event.location && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{event.location}</span>
          </div>
        )}

        {event.maxAttendees && (
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>
              {event.currentAttendees || 0} / {event.maxAttendees} attendees
              {event.currentAttendees === event.maxAttendees && (
                <span className="text-amber-600 font-medium"> (Full)</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* RSVP Section */}
      {canRSVP && !isPastEvent && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {loadingRSVPStatus ? (
                <Loader className="h-4 w-4 animate-spin text-gray-400" />
              ) : userRSVP ? (
                <>
                  {(() => {
                    const IconComponent = rsvpIcons[userRSVP.status];
                    return (
                      <IconComponent
                        className={`h-4 w-4 ${rsvpColors[userRSVP.status]}`}
                      />
                    );
                  })()}
                  <span className={`text-sm font-medium ${rsvpColors[userRSVP.status]}`}>
                    {rsvpLabels[userRSVP.status]}
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-500">No RSVP</span>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              disabled={rsvpLoading}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
            >
              {rsvpLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : userRSVP ? (
                'Update RSVP'
              ) : (
                'RSVP'
              )}
            </button>
          </div>
        </div>
      )}

      {/* RSVP Modal */}
      {isModalOpen && (
        <RSVPModal
          event={event}
          currentRSVP={userRSVP}
          onClose={() => setIsModalOpen(false)}
          onRSVPSubmit={handleRSVPUpdate}
        />
      )}
    </div>
  );
}