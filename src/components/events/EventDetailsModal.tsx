import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Clock, MapPin, Edit, Trash2, Users, Calendar, Tag } from 'lucide-react';
import { Event, EventRSVP, RSVPStatus } from '../../types/events';
import { eventRSVPService } from '../../services/firebase/event-rsvp.service';
import { useAuth } from '../../hooks/useUnifiedAuth';
import { useToast } from '../../contexts/ToastContext';
import { RSVPForm } from './RSVPForm';
import { RSVPList } from './RSVPList';
import { CapacityIndicator } from './CapacityIndicator';

interface RSVPFormData {
  status: RSVPStatus;
  numberOfGuests: number;
  notes: string;
  dietaryRestrictions: string;
}

interface CapacityInfo {
  capacity?: number;
  currentAttending: number;
  spotsRemaining?: number;
  isAtCapacity: boolean;
  waitlistEnabled: boolean;
  waitlistCount: number;
}

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  currentUserRSVP?: EventRSVP | null;
  onRSVPUpdate: (rsvp: EventRSVP) => void;
  onEditEvent?: () => void;
  onDeleteEvent?: () => void;
}

export function EventDetailsModal({
  isOpen,
  onClose,
  event,
  currentUserRSVP,
  onRSVPUpdate,
  onEditEvent,
  onDeleteEvent,
}: EventDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Component state
  const [activeTab, setActiveTab] = useState<'details' | 'rsvp' | 'attendees'>('details');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticRSVP, setOptimisticRSVP] = useState<EventRSVP | null>(currentUserRSVP || null);
  const [capacityInfo, setCapacityInfo] = useState<CapacityInfo | null>(null);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);

  // Check if current user has admin permissions
  const isAdmin = user && ['admin', 'pastor'].includes(user.role || '');

  // Load real-time capacity information
  const loadCapacityInfo = useCallback(async () => {
    if (!event.capacity) return;
    
    try {
      const info = await eventRSVPService.getCapacityInfo(event.id);
      setCapacityInfo(info);
    } catch (err) {
      console.error('Error loading capacity info:', err);
    }
  }, [event.capacity, event.id]);

  // Load waitlist position for current user
  const loadWaitlistPosition = useCallback(async () => {
    if (!user || !optimisticRSVP || optimisticRSVP.status !== 'waitlist') return;
    
    try {
      const position = await eventRSVPService.getWaitlistPosition(event.id, user.uid);
      setWaitlistPosition(position);
    } catch (err) {
      console.error('Error loading waitlist position:', err);
    }
  }, [user, optimisticRSVP, event.id]);

  // Form submission handler
  const handleRSVPSubmit = useCallback(async (formData: RSVPFormData) => {
    if (!user) {
      setError('You must be logged in to RSVP');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Create optimistic update
      const optimisticUpdate: EventRSVP = {
        id: optimisticRSVP?.id || '',
        eventId: event.id,
        memberId: user.uid,
        status: formData.status,
        numberOfGuests: formData.numberOfGuests,
        notes: formData.notes,
        responseDate: new Date(),
        createdAt: optimisticRSVP?.createdAt || new Date(),
        updatedAt: new Date(),
      };
      setOptimisticRSVP(optimisticUpdate);

      let result: EventRSVP;

      if (optimisticRSVP?.id) {
        // Update existing RSVP
        await eventRSVPService.updateRSVP(event.id, optimisticRSVP.id, formData);
        result = { ...optimisticUpdate, id: optimisticRSVP.id };
        showToast('RSVP updated successfully!', 'success');
      } else {
        // Create new RSVP
        result = await eventRSVPService.createRSVP(event.id, user.uid, formData);
        showToast(
          result.status === 'waitlist' 
            ? 'Added to waitlist - you\'ll be notified if a spot opens!' 
            : 'RSVP submitted successfully!', 
          'success'
        );
      }

      // Update with real result
      setOptimisticRSVP(result);
      onRSVPUpdate(result);

      // Reload capacity info
      await loadCapacityInfo();
      if (result.status === 'waitlist') {
        await loadWaitlistPosition();
      }

      // Switch to details tab after successful RSVP
      setActiveTab('details');
    } catch (err) {
      console.error('Error submitting RSVP:', err);
      
      // Rollback optimistic update
      setOptimisticRSVP(currentUserRSVP || null);
      
      // Handle specific error cases
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit RSVP. Please try again.';
      
      if (errorMessage.includes('capacity')) {
        setError('Event is at capacity. Please try selecting "Maybe" or check if waitlist is available.');
        showToast('Event is at capacity', 'error');
      } else if (errorMessage.includes('already exists')) {
        setError('You have already RSVP\'d to this event. Please refresh the page.');
        showToast('RSVP already exists', 'error');
      } else {
        setError(errorMessage);
        showToast('Failed to submit RSVP', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [user, optimisticRSVP, event.id, onRSVPUpdate, currentUserRSVP, loadCapacityInfo, loadWaitlistPosition, showToast]);

  // Handle escape key press
  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Modal lifecycle effects
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
      setTimeout(() => modalRef.current?.focus(), 100);
      
      // Load capacity info when modal opens
      loadCapacityInfo();
      
      // Load waitlist position if user is on waitlist
      if (currentUserRSVP?.status === 'waitlist') {
        loadWaitlistPosition();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, handleEscapeKey, loadCapacityInfo, loadWaitlistPosition, currentUserRSVP]);

  // Update optimistic state when currentUserRSVP changes
  useEffect(() => {
    setOptimisticRSVP(currentUserRSVP || null);
  }, [currentUserRSVP]);

  // Early return if modal is not open
  if (!isOpen) return null;

  // Format date for display
  const formatEventDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: event.isAllDay ? undefined : 'numeric',
      minute: event.isAllDay ? undefined : '2-digit',
      hour12: event.isAllDay ? undefined : true,
    }).format(date);
  };

  // Tab configuration
  const tabs = [
    { id: 'details', label: 'Details', icon: Calendar },
    { id: 'rsvp', label: 'RSVP', icon: Users },
    ...(isAdmin ? [{ id: 'attendees', label: 'Attendees', icon: Users }] : []),
  ] as const;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-details-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden focus:outline-none flex flex-col"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h1 id="event-details-modal-title" className="text-2xl font-bold text-gray-900 mb-1">
              {event.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatEventDate(event.startDate)}</span>
              </div>
              {event.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Admin Actions */}
            {isAdmin && (
              <>
                {onEditEvent && (
                  <button
                    onClick={onEditEvent}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit Event"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                )}
                {onDeleteEvent && (
                  <button
                    onClick={onDeleteEvent}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Event"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </>
            )}
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'details' | 'rsvp' | 'attendees')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' && (
            <div className="p-6 space-y-6">
              {/* Event Description */}
              {event.description && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Event Type</h4>
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-900 capitalize">{event.eventType}</span>
                    </div>
                  </div>

                  {event.endDate && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">End Time</h4>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-900">{formatEventDate(event.endDate)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Capacity Information */}
                  {capacityInfo && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Capacity</h4>
                      <CapacityIndicator capacityInfo={capacityInfo} variant="detailed" />
                    </div>
                  )}

                  {/* Current User RSVP Status */}
                  {optimisticRSVP && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Your RSVP</h4>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {optimisticRSVP.status === 'yes' ? '✅' : 
                             optimisticRSVP.status === 'maybe' ? '❓' : 
                             optimisticRSVP.status === 'no' ? '❌' : '⏳'}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {optimisticRSVP.status === 'yes' ? 'Attending' :
                             optimisticRSVP.status === 'maybe' ? 'Maybe Attending' :
                             optimisticRSVP.status === 'no' ? 'Not Attending' : 'On Waitlist'}
                          </span>
                          {optimisticRSVP.numberOfGuests > 0 && (
                            <span className="text-sm text-gray-500">
                              +{optimisticRSVP.numberOfGuests} guest{optimisticRSVP.numberOfGuests === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rsvp' && (
            <div className="p-6">
              <RSVPForm
                event={event}
                currentUserRSVP={optimisticRSVP}
                onSubmit={handleRSVPSubmit}
                isSubmitting={isSubmitting}
                error={error}
                waitlistPosition={waitlistPosition}
              />
            </div>
          )}

          {activeTab === 'attendees' && isAdmin && (
            <div className="p-6">
              <RSVPList
                eventId={event.id}
                variant="full"
                showNotes={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}