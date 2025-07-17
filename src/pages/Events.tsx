import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import 'react-calendar/dist/Calendar.css';

type Event = {
  id: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
};

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function Events() {
  const { user, memberRole } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const query = supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });

      // Non-members can only see public events
      if (!user || memberRole === 'visitor') {
        query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      if (!event.start_time) return false;
      const eventDate = new Date(event.start_time);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dayEvents = getEventsForDate(date);
      if (dayEvents.length > 0) {
        return (
          <div className="flex justify-center mt-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        );
      }
    }
    return null;
  };

  const selectedDateEvents = selectedDate instanceof Date 
    ? getEventsForDate(selectedDate)
    : [];

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start) return 'Time TBD';
    const startTime = formatTime(start);
    const endTime = end ? formatTime(end) : '';
    return endTime ? `${startTime} - ${endTime}` : startTime;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Events</h1>
        {(memberRole === 'admin' || memberRole === 'pastor') && (
          <Link
            to="/events/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Event
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileContent={tileContent}
              className="w-full border-none"
            />
          </div>
        </div>

        {/* Selected Date Events */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              {selectedDate instanceof Date
                ? selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'Select a date'}
            </h2>
            
            {selectedDateEvents.length === 0 ? (
              <p className="text-gray-500">No events scheduled</p>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map(event => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="block p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <h3 className="font-medium text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDateRange(event.start_time, event.end_time)}
                    </p>
                    {event.location && (
                      <p className="text-sm text-gray-600">
                        📍 {event.location}
                      </p>
                    )}
                    {event.is_public && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        Public Event
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
        <div className="space-y-4">
          {events
            .filter(event => event.start_time && new Date(event.start_time) >= new Date())
            .slice(0, 10)
            .map(event => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        📅 {event.start_time ? new Date(event.start_time).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Date TBD'}
                      </p>
                      <p className="text-sm text-gray-600">
                        🕐 {formatDateRange(event.start_time, event.end_time)}
                      </p>
                      {event.location && (
                        <p className="text-sm text-gray-600">
                          📍 {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                  {event.is_public && (
                    <span className="ml-4 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                      Public
                    </span>
                  )}
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}