// src/components/events/EventCard.tsx
// Event display card component with RSVP functionality and role-based action controls
// Shows event details, capacity status, and provides RSVP modal integration for member interaction
// RELEVANT FILES: src/components/events/RSVPModal.tsx, src/components/events/EventList.tsx, src/types/events.ts, src/services/firebase/eventsService.ts

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
import { Event, EventRSVP } from '../../types/events';
import { Member } from '../../types';
import { eventRSVPService } from '../../services/firebase/event-rsvp.service';
import { eventsService } from '../../services/firebase/events.service';
import { useToast } from '../../contexts/ToastContext';
import { RSVPModal } from './RSVPModal';

interface EventCardProps {
  event: Event;
  currentMember: Member | null;
  canManageEvents: boolean;
  displayMode?: 'full' | 'compact' | 'minimal' | 'list';
  showRSVPButton?: boolean;
  onEventUpdate: () => void;
  enableQuickActions?: boolean;
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
  displayMode = 'full',
  showRSVPButton = true,
  onEventUpdate,
  enableQuickActions = true
}: EventCardProps) {
  const [userRSVP, setUserRSVP] = useState<EventRSVP | null>(null);
  const [rsvpLoading] = useState(false);
  const [loadingRSVPStatus, setLoadingRSVPStatus] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (showRSVPButton) {
      loadUserRSVP();
    }
  }, [event.id, currentMember?.id, showRSVPButton]);

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

  // Handler for RSVP updates from the modal (receives full EventRSVP object)
  const handleRSVPUpdateFromModal = async (updatedRSVP: EventRSVP) => {
    // Update local state with the new RSVP
    setUserRSVP(updatedRSVP);
    
    // Close the modal
    setIsModalOpen(false);
    
    // Notify parent component
    onEventUpdate();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to cancel this event?')) return;

    try {
      await eventsService.cancelEvent(event.id);
      showToast('Event cancelled successfully', 'success');
      onEventUpdate();
    } catch (error) {
      console.error('Error cancelling event:', error);
      showToast('Failed to cancel event', 'error');
    }
  };

  const formatDate = (date: Date) => {
    if (displayMode === 'compact' || displayMode === 'minimal') {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
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

  const canRSVP = currentMember && (typeof event.capacity === 'number' && !isNaN(event.capacity));
  const eventDate = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
  const isPastEvent = eventDate < new Date();

  // Minimal display mode
  if (displayMode === 'minimal') {
    return (
      <div className="bg-white rounded-md border p-3 hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-900 truncate">{event.title}</h4>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                  eventTypeColors[event.eventType] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {eventTypeLabels[event.eventType] || event.eventType}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(eventDate)} at {formatTime(eventDate)}
            </p>
          </div>
          {canManageEvents && enableQuickActions && (
            <div className="flex gap-1">
              <Link
                to={`/events/${event.id}/edit`}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit Event"
              >
                <Edit className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Compact display mode
  if (displayMode === 'compact') {
    return (
      <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-gray-900 truncate">{event.title}</h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  eventTypeColors[event.eventType] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {eventTypeLabels[event.eventType] || event.eventType}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{formatDate(eventDate)}</span>
              <span>{formatTime(eventDate)}</span>
              {event.location && (
                <span className="truncate">{event.location}</span>
              )}
            </div>
          </div>
          {canManageEvents && enableQuickActions && (
            <div className="flex gap-1 ml-2">
              <Link
                to={`/events/${event.id}/edit`}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit Event"
              >
                <Edit className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
        
        {/* RSVP Status for compact mode */}
        {canRSVP && showRSVPButton && !isPastEvent && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {loadingRSVPStatus ? (
                <Loader className="h-3 w-3 animate-spin text-gray-400" />
              ) : userRSVP ? (
                <>
                  {(() => {
                    const IconComponent = rsvpIcons[userRSVP.status];
                    return (
                      <IconComponent
                        className={`h-3 w-3 ${rsvpColors[userRSVP.status]}`}
                      />
                    );
                  })()}
                  <span className={`text-xs font-medium ${rsvpColors[userRSVP.status]}`}>
                    {rsvpLabels[userRSVP.status]}
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-500">No RSVP</span>
              )}
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={rsvpLoading || loadingRSVPStatus}
              className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
            >
              RSVP
            </button>
          </div>
        )}
        
        <RSVPModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          event={event}
          currentUserRSVP={userRSVP}
          onRSVPUpdate={handleRSVPUpdateFromModal}
        />
      </div>
    );
  }

  // List display mode
  if (displayMode === 'list') {
    return (
      <div className="bg-white border-b hover:bg-gray-50 transition-colors">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    eventTypeColors[event.eventType] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {eventTypeLabels[event.eventType] || event.eventType}
                </span>
                {!event.isPublic && (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                )}
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-600 mb-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(eventDate)}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTime(eventDate)}
                  {event.endDate && (
                    <span>
                      {' - '}
                      {formatTime(event.endDate instanceof Date ? event.endDate : new Date(event.endDate))}
                    </span>
                  )}
                </div>
                {event.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {event.location}
                  </div>
                )}
                {(typeof event.capacity === 'number' && !isNaN(event.capacity)) && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {(typeof event.currentAttendees === 'number' && !isNaN(event.currentAttendees)) ? event.currentAttendees : 0} / {event.capacity}
                  </div>
                )}
              </div>
              
              {event.description && (
                <p className="text-gray-600 text-sm line-clamp-1">{event.description}</p>
              )}
            </div>
            
            <div className="flex items-center gap-3 ml-4">
              {/* RSVP Status */}
              {canRSVP && showRSVPButton && !isPastEvent && (
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
                  <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={rsvpLoading || loadingRSVPStatus}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                  >
                    RSVP
                  </button>
                </div>
              )}
              
              {/* Admin Actions */}
              {canManageEvents && enableQuickActions && (
                <div className="flex gap-2">
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
          </div>
        </div>
        
        <RSVPModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          event={event}
          currentUserRSVP={userRSVP}
          onRSVPUpdate={handleRSVPUpdateFromModal}
        />
      </div>
    );
  }

  // Full display mode (default)
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Event Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                eventTypeColors[event.eventType] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {eventTypeLabels[event.eventType] || event.eventType}
            </span>
            {!event.isPublic && (
              <EyeOff className="h-4 w-4 text-gray-400" />
            )}
          </div>
          {event.description && (
            <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
          )}
        </div>

        {/* Action Buttons */}
        {canManageEvents && enableQuickActions && (
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
            {event.endDate && (
              <span>
                {' - '}
                {formatTime(event.endDate instanceof Date ? event.endDate : new Date(event.endDate))}
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
        
        {(typeof event.capacity === 'number' && !isNaN(event.capacity)) && (
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>
              {(typeof event.currentAttendees === 'number' && !isNaN(event.currentAttendees)) ? event.currentAttendees : 0} / {event.capacity} attendees
              {((typeof event.currentAttendees === 'number' ? event.currentAttendees : 0)) >= event.capacity && (
                <span className="text-amber-600 font-medium"> (Full)</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* RSVP Section */}
      {canRSVP && showRSVPButton && !isPastEvent && (
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
              disabled={rsvpLoading || loadingRSVPStatus}
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

      {/* RSVP Modal - Fixed props */}
      {showRSVPButton && (
        <RSVPModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          event={event}
          currentUserRSVP={userRSVP}
          onRSVPUpdate={handleRSVPUpdateFromModal}
        />
      )}
    </div>
  );
}