import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { eventsService } from '../services/firebase';
import { useAuth } from '../hooks/useUnifiedAuth';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Event } from '../types/firestore';

type EventFormData = {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  isPublic: boolean;
};

export default function EventForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { member } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    isPublic: false,
  });

  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      setInitialLoading(true);
      const event = await eventsService.getById(id!);

      if (event) {
        setFormData({
          title: event.title || '',
          description: event.description || '',
          startTime: event.startTime
            ? formatDateTimeForInput(event.startTime)
            : '',
          endTime: event.endTime ? formatDateTimeForInput(event.endTime) : '',
          location: event.location || '',
          isPublic: event.isPublic || false,
        });
      } else {
        throw new Error('Event not found');
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to fetch event',
        'error'
      );
      navigate('/events');
    } finally {
      setInitialLoading(false);
    }
  };

  const formatDateTimeForInput = (dateString: string) => {
    const date = new Date(dateString);
    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!member) {
      showToast('You must be logged in to create events', 'error');
      return;
    }

    // Validate form
    if (!formData.title.trim()) {
      showToast('Event title is required', 'error');
      return;
    }

    if (!formData.startTime) {
      showToast('Start date/time is required', 'error');
      return;
    }

    // Validate end time is after start time
    if (
      formData.endTime &&
      new Date(formData.endTime) <= new Date(formData.startTime)
    ) {
      showToast('End time must be after start time', 'error');
      return;
    }

    try {
      setLoading(true);

      const eventData: Partial<Event> = {
        title: formData.title.trim(),
        description: formData.description.trim() || '',
        startTime: new Date(formData.startTime).toISOString(),
        endTime: formData.endTime
          ? new Date(formData.endTime).toISOString()
          : '',
        location: formData.location.trim() || '',
        isPublic: formData.isPublic,
      };

      if (isEditMode) {
        // Update existing event
        await eventsService.update(id!, eventData);
        showToast('Event updated successfully', 'success');
      } else {
        // Create new event
        const newEvent = await eventsService.create({
          ...eventData,
          createdBy: member.id,
        });
        showToast('Event created successfully', 'success');

        // Navigate to the new event
        navigate(`/events/${newEvent.id}`);
        return;
      }

      navigate('/events');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to save event',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          to="/events"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ← Back to Events
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          {isEditMode ? 'Edit Event' : 'Create New Event'}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-lg p-6 space-y-6"
      >
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Event Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="e.g., Sunday Service, Bible Study, Youth Meeting"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Provide details about the event..."
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="startTime"
              className="block text-sm font-medium text-gray-700"
            >
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="endTime"
              className="block text-sm font-medium text-gray-700"
            >
              End Date & Time
            </label>
            <input
              type="datetime-local"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              min={formData.startTime}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700"
          >
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="e.g., Main Sanctuary, Fellowship Hall, Room 201"
          />
        </div>

        {/* Public Event */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            name="isPublic"
            checked={formData.isPublic}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="isPublic"
            className="ml-2 block text-sm text-gray-700"
          >
            Public Event (visible to non-members)
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Link
            to="/events"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : isEditMode ? (
              'Update Event'
            ) : (
              'Create Event'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
