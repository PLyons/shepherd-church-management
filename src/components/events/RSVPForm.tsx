import { useForm } from 'react-hook-form';
import { CheckCircle, MessageCircle, Utensils, AlertCircle } from 'lucide-react';
import { Event, EventRSVP, RSVPStatus } from '../../types/events';

interface RSVPFormData {
  status: RSVPStatus;
  numberOfGuests: number;
  notes: string;
  dietaryRestrictions: string;
}

interface RSVPFormProps {
  event: Event;
  currentUserRSVP?: EventRSVP | null;
  onSubmit: (data: RSVPFormData) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
  waitlistPosition?: number | null;
}

export function RSVPForm({
  event,
  currentUserRSVP,
  onSubmit,
  isSubmitting,
  error,
  waitlistPosition,
}: RSVPFormProps) {
  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
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

  return (
    <div className="space-y-6">
      {/* Waitlist Position */}
      {waitlistPosition && (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

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
                  watchStatus === option.value ? option.bgClass : 'bg-white border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  value={option.value}
                  {...register('status', { required: 'Please select your attendance status' })}
                  className="sr-only"
                />
                <div className="flex items-center flex-1">
                  <span className="text-lg mr-3">{option.icon}</span>
                  <div className="flex-1">
                    <div className={`font-medium ${
                      watchStatus === option.value ? option.colorClass : 'text-gray-900'
                    }`}>
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                  {watchStatus === option.value && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </label>
            ))}
          </div>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
          )}
        </div>

        {/* Number of Guests */}
        {watchStatus === 'yes' && (
          <div>
            <label htmlFor="numberOfGuests" className="block text-sm font-medium text-gray-700 mb-2">
              Number of additional guests (not including yourself)
            </label>
            <select
              id="numberOfGuests"
              {...register('numberOfGuests', {
                valueAsNumber: true,
                min: { value: 0, message: 'Number of guests cannot be negative' },
                max: { value: maxGuests, message: `Maximum ${maxGuests} guests allowed` },
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
              <p className="mt-1 text-sm text-red-600">{errors.numberOfGuests.message}</p>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
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
            <label htmlFor="dietaryRestrictions" className="block text-sm font-medium text-gray-700 mb-2">
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

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {currentUserRSVP ? 'Update RSVP' : 'Submit RSVP'}
          </button>
        </div>
      </form>
    </div>
  );
}