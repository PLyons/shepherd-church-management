import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, List } from 'lucide-react';
import { Event } from '../types/events';
import { useAuth } from '../hooks/useUnifiedAuth';
import { EventCalendar, CalendarView } from '../components/events/EventCalendar';

interface CalendarFilters {
  view: CalendarView;
}

export const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const { member: currentUser } = useAuth();
  
  const [filters, setFilters] = useState<CalendarFilters>({
    view: 'month'
  });

  // Check if user can manage events (admin or pastor)
  const canManageEvents = currentUser?.role === 'admin' || currentUser?.role === 'pastor';

  const handleEventClick = (event: Event) => {
    // For now, navigate to event details (future: open modal)
    navigate(`/events/${event.id}`);
  };

  const handleDateClick = (date: Date) => {
    if (canManageEvents) {
      // Navigate to create event with pre-filled date
      const dateStr = date.toISOString().split('T')[0];
      navigate(`/events/new?date=${dateStr}`);
    }
  };

  const handleCreateEvent = (date?: Date) => {
    if (canManageEvents) {
      const dateParam = date ? `?date=${date.toISOString().split('T')[0]}` : '';
      navigate(`/events/new${dateParam}`);
    }
  };

  const handleViewEvents = () => {
    navigate('/events');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1">
              View and manage church events
              {canManageEvents && ' • Click dates to create events'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Events button */}
            <button
              onClick={handleViewEvents}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <List className="h-4 w-4 mr-2" />
              View List
            </button>

            {/* Create Event button (admin/pastor only) */}
            {canManageEvents && (
              <button
                onClick={() => handleCreateEvent()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-hidden">
        <EventCalendar
          initialView={filters.view}
          onEventClick={handleEventClick}
          onDateClick={canManageEvents ? handleDateClick : undefined}
          onCreateEvent={canManageEvents ? handleCreateEvent : undefined}
        />
      </div>
    </div>
  );
};