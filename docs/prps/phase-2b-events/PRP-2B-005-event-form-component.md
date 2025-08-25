# PRP-2B-005: Event Form Component

**Phase**: 2B Event Calendar & Attendance System  
**Task**: 2B.5  
**Priority**: HIGH - Core UI for event creation/editing  
**Estimated Time**: 4-5 hours  

## Purpose

Implement the EventForm component for creating and editing events, following Shepherd's form patterns with React Hook Form, comprehensive validation, and role-based field visibility. This component will be the primary interface for admin/pastor users to manage events.

## Context Required

**Essential Files to Read:**
- `CLAUDE.md` - Form patterns and React Hook Form standards
- `src/components/members/MemberFormEnhanced.tsx` - Form pattern reference
- `src/components/households/HouseholdForm.tsx` - Recent form implementation
- `docs/prps/phase-2b-events/PRP-2B-001-event-data-model.md` - Event types and interfaces
- Output from PRP-2B-001 (`src/types/events.ts`) - Event and form data types
- Output from PRP-2B-002 (`src/services/firebase/events.service.ts`) - Events service

**Key Patterns to Follow:**
- React Hook Form with comprehensive validation
- Collapsible sections for form organization
- Role-based field access and visibility
- Professional styling with TailwindCSS

## Requirements

**Dependencies:**
- **MUST complete PRP-2B-001, PRP-2B-002, PRP-2B-004 first**
- EventFormData interface and Event types
- EventsService implementation
- Security rules deployed

**Critical Requirements:**
1. **Form Validation**: Comprehensive field validation with helpful error messages
2. **Role Integration**: Admin/pastor only access with role-appropriate fields
3. **Date Handling**: Proper date/time input and validation
4. **Event Types**: Dropdown selection with all event categories
5. **Capacity Management**: Optional capacity with waitlist controls

## Detailed Procedure

### Step 1: Create Event Form Component

Create `src/components/events/EventForm.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { EventFormData, EventType, Role } from '../../types';
import { eventsService } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface EventFormProps {
  eventId?: string;
  onSubmit?: (eventData: EventFormData) => void;
  onCancel?: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({
  eventId,
  onSubmit,
  onCancel
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(!!eventId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm<EventFormData>({
    defaultValues: {
      title: '',
      description: '',
      location: '',
      startDate: '',
      endDate: '',
      isAllDay: false,
      eventType: 'other' as EventType,
      isPublic: true,
      requiredRoles: [] as Role[],
      capacity: undefined,
      enableWaitlist: false,
    }
  });

  const watchIsAllDay = watch('isAllDay');
  const watchHasCapacity = watch('capacity');

  // Event type options
  const eventTypeOptions: { value: EventType; label: string }[] = [
    { value: 'service', label: 'Church Service' },
    { value: 'bible_study', label: 'Bible Study' },
    { value: 'prayer_meeting', label: 'Prayer Meeting' },
    { value: 'youth_group', label: 'Youth Group' },
    { value: 'seniors_group', label: 'Seniors Group' },
    { value: 'womens_ministry', label: "Women's Ministry" },
    { value: 'mens_ministry', label: "Men's Ministry" },
    { value: 'special_event', label: 'Special Event' },
    { value: 'outreach', label: 'Outreach' },
    { value: 'volunteer_activity', label: 'Volunteer Activity' },
    { value: 'board_meeting', label: 'Board Meeting' },
    { value: 'training', label: 'Training' },
    { value: 'other', label: 'Other' },
  ];

  // Load existing event for editing
  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    if (!eventId) return;
    
    try {
      setIsLoadingEvent(true);
      const event = await eventsService.getById(eventId);
      
      if (event) {
        reset({
          title: event.title,
          description: event.description,
          location: event.location,
          startDate: formatDateForInput(event.startDate),
          endDate: formatDateForInput(event.endDate),
          isAllDay: event.isAllDay,
          eventType: event.eventType,
          isPublic: event.isPublic,
          requiredRoles: event.requiredRoles,
          capacity: event.capacity,
          enableWaitlist: event.enableWaitlist,
        });
      }
    } catch (error) {
      console.error('Error loading event:', error);
      showToast('Error loading event details', 'error');
    } finally {
      setIsLoadingEvent(false);
    }
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM format
  };

  const handleFormSubmit = async (data: EventFormData) => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      if (onSubmit) {
        onSubmit(data);
      } else if (eventId) {
        await eventsService.update(eventId, data);
        showToast('Event updated successfully!', 'success');
        navigate('/events');
      } else {
        await eventsService.create(data, user.uid);
        showToast('Event created successfully!', 'success');
        navigate('/events');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      showToast('Error saving event. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/events');
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {eventId ? 'Edit Event' : 'Create New Event'}
          </h2>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-8">
          {/* Basic Information Section */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  {...register('title', {
                    required: 'Event title is required',
                    minLength: {
                      value: 3,
                      message: 'Title must be at least 3 characters long'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter event title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type *
                </label>
                <select
                  {...register('eventType', { required: 'Event type is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {eventTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.eventType && (
                  <p className="mt-1 text-sm text-red-600">{errors.eventType.message}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  {...register('location', { required: 'Location is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter event location"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide details about the event..."
              />
            </div>
          </section>

          {/* Date & Time Section */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Date & Time</h3>
            
            {/* All Day Toggle */}
            <div className="mb-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  {...register('isAllDay')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">All day event</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start {watchIsAllDay ? 'Date' : 'Date & Time'} *
                </label>
                <input
                  type={watchIsAllDay ? 'date' : 'datetime-local'}
                  {...register('startDate', { required: 'Start date is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End {watchIsAllDay ? 'Date' : 'Date & Time'} *
                </label>
                <input
                  type={watchIsAllDay ? 'date' : 'datetime-local'}
                  {...register('endDate', { 
                    required: 'End date is required',
                    validate: (value, formValues) => {
                      if (new Date(value) <= new Date(formValues.startDate)) {
                        return 'End date must be after start date';
                      }
                      return true;
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Visibility & Access Section */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Visibility & Access</h3>
            
            {/* Public Event Toggle */}
            <div className="mb-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  {...register('isPublic')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Public event (visible to all members)</span>
              </label>
            </div>
          </section>

          {/* Capacity Management Section */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Capacity Management</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Capacity Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Capacity
                </label>
                <input
                  type="number"
                  {...register('capacity', {
                    min: { value: 1, message: 'Capacity must be at least 1' },
                    valueAsNumber: true
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave empty for unlimited"
                  min="1"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Total number of people who can attend (including guests)
                </p>
                {errors.capacity && (
                  <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
                )}
              </div>

              {/* Waitlist */}
              {watchHasCapacity && (
                <div className="flex items-start pt-8">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      {...register('enableWaitlist')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Enable waitlist when capacity is reached
                    </span>
                  </label>
                </div>
              )}
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </>
              ) : (
                eventId ? 'Update Event' : 'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

### Step 2: Create Event Pages

Create `src/pages/CreateEvent.tsx`:

```typescript
import React from 'react';
import { EventForm } from '../components/events/EventForm';
import { RequireRole } from '../components/auth/RequireRole';

export const CreateEvent: React.FC = () => {
  return (
    <RequireRole allowedRoles={['admin', 'pastor']}>
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <EventForm />
        </div>
      </div>
    </RequireRole>
  );
};
```

Create `src/pages/EditEvent.tsx`:

```typescript
import React from 'react';
import { useParams } from 'react-router-dom';
import { EventForm } from '../components/events/EventForm';
import { RequireRole } from '../components/auth/RequireRole';

export const EditEvent: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <RequireRole allowedRoles={['admin', 'pastor']}>
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <EventForm eventId={id} />
        </div>
      </div>
    </RequireRole>
  );
};
```

### Step 3: Add Form Validation Utilities

Create `src/utils/event-validation.ts`:

```typescript
export const validateEventDates = (startDate: string, endDate: string): string | null => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  if (start <= now) {
    return 'Event must be scheduled for a future date';
  }
  
  if (end <= start) {
    return 'End date must be after start date';
  }
  
  // Check if dates are more than 1 year in the future
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (start > oneYearFromNow) {
    return 'Events cannot be scheduled more than one year in advance';
  }
  
  return null;
};
```

### Step 4: Test Form Component

1. Test form validation with various inputs
2. Verify date/time handling works correctly
3. Test event creation and editing flows
4. Validate role-based access restrictions

## Success Criteria

**Functional Validation:**
- [ ] Form creates events successfully
- [ ] Form updates existing events correctly
- [ ] All validation rules work properly
- [ ] Date/time inputs handle all-day events
- [ ] Capacity and waitlist settings function correctly

**UI/UX Validation:**
- [ ] Form follows Shepherd's design patterns
- [ ] Loading states display correctly
- [ ] Error messages are clear and helpful
- [ ] Form is responsive across devices
- [ ] Role-based access restrictions work

**Integration:**
- [ ] Form integrates with EventsService
- [ ] Navigation works correctly
- [ ] Toast notifications display properly
- [ ] Form data maps to Event types correctly

## Files Created/Modified

**New Files:**
- `src/components/events/EventForm.tsx`
- `src/pages/CreateEvent.tsx`
- `src/pages/EditEvent.tsx`
- `src/utils/event-validation.ts`

## Next Task

After completion, proceed to **PRP-2B-006: Event List & Cards** which will implement the UI for browsing and managing events.

## Notes

- Form follows React Hook Form patterns established in member and household forms
- All validation is comprehensive with helpful error messages
- Date handling supports both all-day and timed events
- Capacity management includes optional waitlist functionality
- Component is fully responsive and accessible
- Role-based access ensures only admin/pastor can create/edit events