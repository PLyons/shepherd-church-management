import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Users, MessageCircle, Utensils, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Event, EventRSVP, RSVPFormData, RSVPStatus } from '../../types/events';
import { eventRSVPService } from '../../services/firebase/event-rsvp.service';
import { useAuth } from '../../contexts/FirebaseAuthContext';
import { useToast } from '../../contexts/ToastContext';

export interface RSVPModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  currentUserRSVP?: EventRSVP | null;
  onRSVPUpdate: (rsvp: EventRSVP) => void;
}

export function RSVPModal({
  isOpen,
  onClose,
  event,
  currentUserRSVP,
  onRSVPUpdate,
}: RSVPModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Component state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticRSVP, setOptimisticRSVP] = useState<EventRSVP | null>(currentUserRSVP || null);
  const [capacityInfo, setCapacityInfo] = useState<{
    capacity?: number;
    currentAttending: number;
    spotsRemaining?: number;
    isAtCapacity: boolean;
    waitlistEnabled: boolean;
    waitlistCount: number;
  } | null>(null);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [isLoadingCapacity, setIsLoadingCapacity] = useState(false);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<RSVPFormData>({
    defaultValues: {
      status: currentUserRSVP?.status || 'yes',
      numberOfGuests: currentUserRSVP?.numberOfGuests || 0,
      notes: currentUserRSVP?.notes || '',
      dietaryRestrictions: '',
    },
  });

  const watchStatus = watch('status');
  const maxGuests = event.capacity ? Math.min(10, event.capacity) : 10;

  // RSVP options with enhanced UI
  const rsvpOptions = [
    {
      value: 'yes' as RSVPStatus,
      label: 'Yes, I will attend',
      description: 'Confirm your attendance',
      icon: '✅',
      colorClass: 'text-green-600',
      bgClass: 'bg-green-50 border-green-200',
    },
    {
      value: 'maybe' as RSVPStatus,
      label: 'Maybe, I might attend',
      description: 'Tentative attendance',
      icon: '❓',
      colorClass: 'text-yellow-600',
      bgClass: 'bg-yellow-50 border-yellow-200',
    },
    {
      value: 'no' as RSVPStatus,
      label: 'No, I cannot attend',
      description: 'Will not be attending',
      icon: '❌',
      colorClass: 'text-red-600',
      bgClass: 'bg-red-50 border-red-200',
    },
  ];

  // Load real-time capacity information
  const loadCapacityInfo = async () => {
    if (!event.capacity) return;
    
    try {
      setIsLoadingCapacity(true);
      const info = await eventRSVPService.getCapacityInfo(event.id);
      setCapacityInfo(info);
    } catch (err) {
      console.error('Error loading capacity info:', err);
    } finally {
      setIsLoadingCapacity(false);
    }
  };

  // Load waitlist position for current user
  const loadWaitlistPosition = async () => {
    if (!user || !optimisticRSVP || optimisticRSVP.status !== 'waitlist') return;
    
    try {
      const position = await eventRSVPService.getWaitlistPosition(event.id, user.uid);
      setWaitlistPosition(position);
    } catch (err) {
      console.error('Error loading waitlist position:', err);
    }
  };

  // Form submission handler with full service integration
  const onSubmit = async (formData: RSVPFormData) => {
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

      onClose();
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
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      // Focus modal
      setTimeout(() => modalRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Handle form reset and data loading when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset optimistic state to current RSVP
      setOptimisticRSVP(currentUserRSVP || null);
      
      // Reset form with existing RSVP data
      if (currentUserRSVP) {
        reset({
          status: currentUserRSVP.status,
          numberOfGuests: currentUserRSVP.numberOfGuests || 0,
          notes: currentUserRSVP.notes || '',
          dietaryRestrictions: '',
        });
      }

      // Load real-time capacity information
      loadCapacityInfo();
      
      // Load waitlist position if user is on waitlist
      if (currentUserRSVP?.status === 'waitlist') {
        loadWaitlistPosition();
      }
    }
  }, [isOpen, currentUserRSVP, reset, loadCapacityInfo, loadWaitlistPosition]);

  // Update optimistic state when currentUserRSVP changes
  useEffect(() => {
    setOptimisticRSVP(currentUserRSVP || null);
  }, [currentUserRSVP]);

  // Early return if modal is not open
  if (!isOpen) return null;

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rsvp-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden focus:outline-none"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 id="rsvp-modal-title" className="text-xl font-semibold text-gray-900">
            RSVP to {event.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Error Display */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700"
            >
              {error}
            </div>
          )}

          {/* Event Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Event Details</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div>
                <span className="font-medium">Date:</span>{' '}
                {new Date(event.startDate).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Time:</span>{' '}
                {new Date(event.startDate).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {event.endDate && (
                  <span>
                    {' - '}
                    {new Date(event.endDate).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
              {event.location && (
                <div>
                  <span className="font-medium">Location:</span> {event.location}
                </div>
              )}
              {event.capacity && (
                <div>
                  <span className="font-medium">Capacity:</span> {event.capacity} people
                </div>
              )}
            </div>
          </div>

          {/* Real-time Capacity Information */}
          {event.capacity && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Event Capacity
              </h3>
              {isLoadingCapacity ? (
                <div className="flex items-center text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600 mr-2"></div>
                  Loading capacity information...
                </div>
              ) : capacityInfo ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Capacity:</span>
                    <span className="font-medium">{event.capacity} people</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Currently Attending:</span>
                    <span className="font-medium">{capacityInfo.currentAttending} people</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Spots:</span>
                    <span className={`font-medium ${capacityInfo.spotsRemaining === 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {capacityInfo.spotsRemaining ?? 'Unlimited'} {capacityInfo.spotsRemaining !== undefined ? 'spots' : ''}
                    </span>
                  </div>
                  {capacityInfo.isAtCapacity && capacityInfo.waitlistEnabled && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      Event is at capacity. New RSVPs will be added to the waitlist.
                    </div>
                  )}
                  {capacityInfo.isAtCapacity && !capacityInfo.waitlistEnabled && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
                      <X className="h-3 w-3 inline mr-1" />
                      Event is at capacity. No new RSVPs accepted.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Capacity: {event.capacity} people
                </div>
              )}
            </div>
          )}

          {/* Current RSVP Status with optimistic updates */}
          {optimisticRSVP && (
            <div className={`mb-6 p-4 border rounded-lg ${
              optimisticRSVP.status === 'yes' ? 'bg-green-50 border-green-200' :
              optimisticRSVP.status === 'maybe' ? 'bg-yellow-50 border-yellow-200' :
              optimisticRSVP.status === 'waitlist' ? 'bg-orange-50 border-orange-200' :
              'bg-red-50 border-red-200'
            }`}>
              <h3 className={`font-medium mb-2 flex items-center ${
                optimisticRSVP.status === 'yes' ? 'text-green-900' :
                optimisticRSVP.status === 'maybe' ? 'text-yellow-900' :
                optimisticRSVP.status === 'waitlist' ? 'text-orange-900' :
                'text-red-900'
              }`}>
                {optimisticRSVP.status === 'yes' && <CheckCircle className="h-4 w-4 mr-2" />}
                {optimisticRSVP.status === 'maybe' && <Clock className="h-4 w-4 mr-2" />}
                {optimisticRSVP.status === 'waitlist' && <AlertCircle className="h-4 w-4 mr-2" />}
                {optimisticRSVP.status === 'no' && <X className="h-4 w-4 mr-2" />}
                Current RSVP
              </h3>
              <div className={`text-sm ${
                optimisticRSVP.status === 'yes' ? 'text-green-700' :
                optimisticRSVP.status === 'maybe' ? 'text-yellow-700' :
                optimisticRSVP.status === 'waitlist' ? 'text-orange-700' :
                'text-red-700'
              }`}>
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <span className="capitalize">
                    {optimisticRSVP.status === 'waitlist' ? 'On Waitlist' : optimisticRSVP.status}
                  </span>
                </div>
                {optimisticRSVP.status === 'waitlist' && waitlistPosition && (
                  <div>
                    <span className="font-medium">Waitlist Position:</span>{' '}
                    #{waitlistPosition}
                  </div>
                )}
                {optimisticRSVP.numberOfGuests > 0 && (
                  <div>
                    <span className="font-medium">Guests:</span>{' '}
                    {optimisticRSVP.numberOfGuests}
                  </div>
                )}
                {optimisticRSVP.notes && (
                  <div>
                    <span className="font-medium">Notes:</span> {optimisticRSVP.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RSVP Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* RSVP Status Selection */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Your Response
              </h3>
              <fieldset className="space-y-3">
                <legend className="sr-only">Select your RSVP response</legend>
                {rsvpOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      watchStatus === option.value
                        ? `${option.bgClass} border-current`
                        : 'bg-white border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      {...register('status', {
                        required: 'Please select your response',
                      })}
                      className="sr-only"
                    />
                    <span className="text-2xl mr-3">{option.icon}</span>
                    <span className="flex flex-col">
                      <span
                        className={`text-sm font-medium ${
                          watchStatus === option.value
                            ? option.colorClass
                            : 'text-gray-900'
                        }`}
                      >
                        {option.label}
                      </span>
                      <span
                        className={`text-sm ${
                          watchStatus === option.value
                            ? option.colorClass
                            : 'text-gray-500'
                        }`}
                      >
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
              {errors.status && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {errors.status.message}
                </p>
              )}
            </section>

            {/* Guest Count - Show only for 'yes' and 'maybe' responses */}
            {(watchStatus === 'yes' || watchStatus === 'maybe') && (
              <section>
                <label
                  htmlFor="numberOfGuests"
                  className="flex items-center text-sm font-medium text-gray-900 mb-2"
                >
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  Number of Additional Guests
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    id="numberOfGuests"
                    type="number"
                    {...register('numberOfGuests', {
                      required: 'Guest count is required',
                      min: {
                        value: 0,
                        message: 'Guest count cannot be negative',
                      },
                      max: {
                        value: maxGuests,
                        message: `Maximum ${maxGuests} guests allowed`,
                      },
                      valueAsNumber: true,
                    })}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    max={maxGuests}
                  />
                  <span className="text-sm text-gray-500">
                    guests (not including yourself)
                  </span>
                </div>
                {errors.numberOfGuests && (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    {errors.numberOfGuests.message}
                  </p>
                )}
                {event.capacity && (
                  <p className="mt-2 text-sm text-gray-500">
                    Event capacity: {event.capacity} people total
                  </p>
                )}
              </section>
            )}

            {/* Dietary Restrictions - Show only for 'yes' responses */}
            {watchStatus === 'yes' && (
              <section>
                <label
                  htmlFor="dietaryRestrictions"
                  className="flex items-center text-sm font-medium text-gray-900 mb-2"
                >
                  <Utensils className="h-4 w-4 mr-2 text-gray-500" />
                  Dietary Restrictions or Special Needs
                </label>
                <textarea
                  id="dietaryRestrictions"
                  {...register('dietaryRestrictions')}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Please let us know about any dietary restrictions, allergies, or special accommodations needed..."
                />
              </section>
            )}

            {/* Notes/Comments */}
            <section>
              <label
                htmlFor="notes"
                className="flex items-center text-sm font-medium text-gray-900 mb-2"
              >
                <MessageCircle className="h-4 w-4 mr-2 text-gray-500" />
                Additional Notes or Comments
              </label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional information, questions, or special requests..."
              />
            </section>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                )}
                {isSubmitting ? 'Submitting...' : 'Save RSVP'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}