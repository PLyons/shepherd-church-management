import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  X,
  Users,
  MessageCircle,
  Utensils,
  Clock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
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
  const [optimisticRSVP, setOptimisticRSVP] = useState<EventRSVP | null>(
    currentUserRSVP || null
  );
  const [capacityInfo, setCapacityInfo] = useState<{
    capacity?: number;
    currentAttending: number;
    spotsRemaining?: number;
    isAtCapacity: boolean;
    waitlistEnabled: boolean;
    waitlistCount: number;
  } | null>(null);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [, setIsLoadingCapacity] = useState(false);

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

  // Load real-time capacity information - properly memoized
  const loadCapacityInfo = useCallback(async () => {
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
  }, [event.capacity, event.id]);

  // Load waitlist position for current user - properly memoized
  const loadWaitlistPosition = useCallback(async () => {
    if (!user || !optimisticRSVP || optimisticRSVP.status !== 'waitlist')
      return;

    try {
      const position = await eventRSVPService.getWaitlistPosition(
        event.id,
        user.uid
      );
      setWaitlistPosition(position);
    } catch (err) {
      console.error('Error loading waitlist position:', err);
    }
  }, [user, optimisticRSVP, event.id]);

  // Form submission handler with full service integration - properly memoized
  const onSubmit = useCallback(
    async (formData: RSVPFormData) => {
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
          await eventRSVPService.updateRSVP(
            event.id,
            optimisticRSVP.id,
            formData
          );
          result = { ...optimisticUpdate, id: optimisticRSVP.id };
          showToast('RSVP updated successfully!', 'success');
        } else {
          // Create new RSVP
          result = await eventRSVPService.createRSVP(
            event.id,
            user.uid,
            formData
          );
          showToast(
            result.status === 'waitlist'
              ? "Added to waitlist - you'll be notified if a spot opens!"
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
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to submit RSVP. Please try again.';

        if (errorMessage.includes('capacity')) {
          setError(
            'Event is at capacity. Please try selecting "Maybe" or check if waitlist is available.'
          );
          showToast('Event is at capacity', 'error');
        } else if (errorMessage.includes('already exists')) {
          setError(
            "You have already RSVP'd to this event. Please refresh the page."
          );
          showToast('RSVP already exists', 'error');
        } else {
          setError(errorMessage);
          showToast('Failed to submit RSVP', 'error');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      user,
      optimisticRSVP,
      event.id,
      onRSVPUpdate,
      onClose,
      currentUserRSVP,
      loadCapacityInfo,
      loadWaitlistPosition,
      showToast,
    ]
  );

  // Handle escape key press - properly memoized
  const handleEscapeKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Handle escape key press
  useEffect(() => {
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
  }, [isOpen, handleEscapeKey]);

  // Handle form reset and data loading when modal opens - FIXED: removed function dependencies
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

  // Update optimistic state when currentUserRSVP changes - properly memoized
  useEffect(() => {
    setOptimisticRSVP(currentUserRSVP || null);
  }, [currentUserRSVP]);

  // Handle backdrop click - properly memoized
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Early return if modal is not open
  if (!isOpen) return null;

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
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden focus:outline-none flex flex-col"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2
            id="rsvp-modal-title"
            className="text-xl font-semibold text-gray-900"
          >
            RSVP to {event.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Event Details Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Event Details</h3>
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {new Intl.DateTimeFormat('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: event.isAllDay ? undefined : 'numeric',
                  minute: event.isAllDay ? undefined : '2-digit',
                  hour12: event.isAllDay ? undefined : true,
                }).format(event.startDate)}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 text-gray-500">📍</div>
                <span className="text-sm text-gray-600">{event.location}</span>
              </div>
            )}
          </div>

          {/* Capacity Information */}
          {capacityInfo && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Event Capacity
                </span>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <div>Currently attending: {capacityInfo.currentAttending}</div>
                {capacityInfo.capacity && (
                  <div>
                    Spots remaining: {capacityInfo.spotsRemaining || 0} of{' '}
                    {capacityInfo.capacity}
                  </div>
                )}
                {capacityInfo.isAtCapacity && capacityInfo.waitlistEnabled && (
                  <div className="flex items-center space-x-2 mt-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-700">
                      Event is at capacity. New RSVPs will be waitlisted.
                    </span>
                  </div>
                )}
                {capacityInfo.waitlistCount > 0 && (
                  <div>People on waitlist: {capacityInfo.waitlistCount}</div>
                )}
              </div>
            </div>
          )}

          {/* Waitlist Position */}
          {waitlistPosition && (
            <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  You are #{waitlistPosition} on the waitlist
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* RSVP Form Fields (without buttons) */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* RSVP Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Will you attend this event?
              </label>
              <div className="space-y-2">
                {rsvpOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                      watchStatus === option.value
                        ? option.bgClass
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      {...register('status', {
                        required: 'Please select your attendance status',
                      })}
                      className="sr-only"
                    />
                    <div className="flex items-center flex-1">
                      <span className="text-lg mr-3">{option.icon}</span>
                      <div className="flex-1">
                        <div
                          className={`font-medium ${
                            watchStatus === option.value
                              ? option.colorClass
                              : 'text-gray-900'
                          }`}
                        >
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {option.description}
                        </div>
                      </div>
                      {watchStatus === option.value && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.status.message}
                </p>
              )}
            </div>

            {/* Number of Guests */}
            {watchStatus === 'yes' && (
              <div>
                <label
                  htmlFor="numberOfGuests"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Number of additional guests (not including yourself)
                </label>
                <select
                  id="numberOfGuests"
                  {...register('numberOfGuests', {
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: 'Number of guests cannot be negative',
                    },
                    max: {
                      value: maxGuests,
                      message: `Maximum ${maxGuests} guests allowed`,
                    },
                  })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: maxGuests + 1 }, (_, i) => (
                    <option key={i} value={i}>
                      {i} {i === 1 ? 'guest' : 'guests'}
                    </option>
                  ))}
                </select>
                {errors.numberOfGuests && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.numberOfGuests.message}
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <MessageCircle className="h-4 w-4 inline mr-1" />
                Additional notes (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                {...register('notes')}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any special requests, dietary restrictions, or other notes..."
              />
            </div>

            {/* Dietary Restrictions */}
            {watchStatus === 'yes' && (
              <div>
                <label
                  htmlFor="dietaryRestrictions"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Utensils className="h-4 w-4 inline mr-1" />
                  Dietary restrictions (optional)
                </label>
                <input
                  type="text"
                  id="dietaryRestrictions"
                  {...register('dietaryRestrictions')}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., vegetarian, gluten-free, allergies..."
                />
              </div>
            )}
          </form>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {currentUserRSVP ? 'Update RSVP' : 'Submit RSVP'}
          </button>
        </div>
      </div>
    </div>
  );
}
