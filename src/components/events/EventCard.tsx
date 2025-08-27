import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  UserCheck,
  UserX,
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

  const handleRSVP = async (status: RSVPStatus) => {
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

      showToast(`RSVP updated to "${rsvpLabels[status]}"`, 'success');
      await loadUserRSVP();
      onEventUpdate(); // Refresh parent data if needed
    } catch (error) {
      console.error('Error updating RSVP:', error);
      showToast('Failed to update RSVP', 'error');
    } finally {
      setRSVPLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event.id || !window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await eventsService.delete(event.id);
      showToast('Event deleted successfully', 'success');
      onEventUpdate();
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('Failed to delete event', 'error');
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleModalRSVPUpdate = async (updatedRSVP: EventRSVP) => {
    // Update local state with the new RSVP
    setUserRSVP(updatedRSVP);
    
    // Close the modal
    setIsModalOpen(false);
    
    // Notify parent component
    onEventUpdate();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date, isAllDay: boolean) => {
    if (isAllDay) return 'All Day';
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const isUpcoming = event.startDate > new Date();
  const isPast = event.startDate < new Date();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              eventTypeColors[event.eventType] || 'bg-gray-100 text-gray-800'
            }`}>
              {eventTypeLabels[event.eventType] || 'Other'}
            </span>
            {!event.isPublic && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <EyeOff className="w-3 h-3 mr-1" />
                Private
              </span>
            )}
            {isPast && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Past
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h3>
          {event.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
          )}
        </div>
        
        {canManageEvents && (
          <div className="flex items-center space-x-1 ml-4">
            <Link
              to={`/events/${event.id}/edit`}
              className="p-1 text-gray-400 hover:text-blue-600 rounded"
            >
              <Edit className="h-4 w-4" />
            </Link>
            <button
              onClick={handleDeleteEvent}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className="space-y-2 mb-4">
        {/* Date and Time */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(event.startDate)}</span>
          {event.endDate && event.startDate.toDateString() !== event.endDate.toDateString() && (
            <span>- {formatDate(event.endDate)}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>{formatTime(event.startDate, event.isAllDay)}</span>
          {event.endDate && !event.isAllDay && (
            <span>- {formatTime(event.endDate, false)}</span>
          )}
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {/* Capacity - completely rewritten without any loose expressions */}
        {(typeof event.capacity === 'number' && Number.isFinite(event.capacity) && event.capacity > 0) && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>Capacity: {event.capacity} people</span>
          </div>
        )}
      </div>

      {/* RSVP Section */}
      {isUpcoming && currentMember && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {loadingRSVPStatus ? (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Loading RSVP...</span>
                </div>
              ) : userRSVP ? (
                <div className="flex items-center space-x-2 text-sm">
                  {(() => {
                    const IconComponent = rsvpIcons[userRSVP.status];
                    return (
                      <>
                        <IconComponent className={`h-4 w-4 ${rsvpColors[userRSVP.status]}`} />
                        <span className="text-gray-700">
                          You're {rsvpLabels[userRSVP.status].toLowerCase()}
                        </span>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <span className="text-sm text-gray-500">No response yet</span>
              )}
            </div>

            {/* RSVP Button */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleOpenModal}
                disabled={loadingRSVPStatus}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                RSVP
              </button>
            </div>
          </div>
          
          {rsvpLoading && (
            <div className="mt-2 flex items-center justify-center">
              <Loader className="h-4 w-4 animate-spin text-blue-600" />
            </div>
          )}
        </div>
      )}

      {/* Past Event - Show RSVP Status Only */}
      {isPast && userRSVP && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center space-x-2 text-sm">
            {(() => {
              const IconComponent = rsvpIcons[userRSVP.status];
              return (
                <>
                  <IconComponent className={`h-4 w-4 ${rsvpColors[userRSVP.status]}`} />
                  <span className="text-gray-700">
                    You were {rsvpLabels[userRSVP.status].toLowerCase()}
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* RSVP Modal */}
      <RSVPModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={event}
        currentUserRSVP={userRSVP}
        onRSVPUpdate={handleModalRSVPUpdate}
      />
    </div>
  );
}