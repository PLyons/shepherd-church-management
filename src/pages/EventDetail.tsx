import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

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

type Attendance = {
  id: string;
  event_id: string;
  member_id: string;
  status: 'Attending' | 'Absent' | 'Tentative' | null;
  note: string | null;
  created_at: string;
};

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, member, memberRole } = useAuth();
  const { showToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendance[]>([]);
  const [myAttendance, setMyAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id]);

  const fetchEventDetails = async () => {
    if (!id) {
      setError('No event ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) {
        console.error('Event fetch error:', eventError);
        throw new Error(`Failed to fetch event: ${eventError.message}`);
      }
      
      if (!eventData) {
        throw new Error('Event not found');
      }

      // Check if user has permission to view this event
      if (!eventData.is_public && !user) {
        setError('You must be logged in to view this event');
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // Fetch attendance records
      try {
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('event_attendance')
          .select('*')
          .eq('event_id', id)
          .order('created_at', { ascending: false });

        if (attendanceError) {
          console.warn('Attendance fetch error:', attendanceError);
          // Don't fail the whole page for attendance errors
          setAttendees([]);
        } else {
          setAttendees(attendanceData || []);

          // Find current user's attendance
          if (member) {
            const myRecord = attendanceData?.find(a => a.member_id === member.id);
            setMyAttendance(myRecord || null);
          }
        }
      } catch (attendanceErr) {
        console.warn('Attendance error:', attendanceErr);
        setAttendees([]);
      }
    } catch (err) {
      console.error('Event details error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch event details');
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (status: 'Attending' | 'Absent' | 'Tentative') => {
    if (!member) {
      showToast('You must be logged in to RSVP', 'error');
      return;
    }

    try {
      setUpdating(true);

      if (myAttendance) {
        // Update existing RSVP
        const { error } = await supabase
          .from('event_attendance')
          .update({ status: status })
          .eq('id', myAttendance.id);

        if (error) throw error;
      } else {
        // Create new RSVP
        const { error } = await supabase
          .from('event_attendance')
          .insert({
            event_id: id,
            member_id: member.id,
            status: status
          });

        if (error) throw error;
      }

      showToast('RSVP updated successfully', 'success');
      fetchEventDetails(); // Refresh data
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update RSVP', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      setUpdating(true);
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('Event deleted successfully', 'success');
      navigate('/events');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete event', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Date/Time TBD';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start) return 'Date/Time TBD';
    const startDate = new Date(start);
    const startStr = formatDateTime(start);
    
    if (!end) return startStr;
    
    const endDate = new Date(end);
    const endStr = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    // If same day, just show time range
    if (startDate.toDateString() === endDate.toDateString()) {
      return `${startStr} - ${endStr}`;
    }
    
    // Different days, show full range
    return `${startStr} - ${formatDateTime(end)}`;
  };

  const getRSVPCounts = () => {
    const counts = { Attending: 0, Absent: 0, Tentative: 0 };
    attendees.forEach(a => {
      if (a.status && counts.hasOwnProperty(a.status)) {
        counts[a.status]++;
      }
    });
    return counts;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Event not found'}
        </div>
        <Link
          to="/events"
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          ← Back to Events
        </Link>
      </div>
    );
  }

  const rsvpCounts = getRSVPCounts();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link
            to="/events"
            className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
          >
            ← Back to Events
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
          {event.is_public && (
            <span className="inline-block mt-2 px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
              Public Event
            </span>
          )}
        </div>
        {(memberRole === 'admin' || memberRole === 'pastor') && (
          <div className="flex gap-2">
            <Link
              to={`/events/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={updating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Event Details</h2>
        
        <div className="space-y-3">
          <div>
            <span className="text-gray-600">Date & Time:</span>
            <p className="font-medium">{formatDateRange(event.start_time, event.end_time)}</p>
          </div>
          
          {event.location && (
            <div>
              <span className="text-gray-600">Location:</span>
              <p className="font-medium">{event.location}</p>
            </div>
          )}
          
          {event.description && (
            <div>
              <span className="text-gray-600">Description:</span>
              <p className="mt-1 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
          
          {event.created_by && (
            <div>
              <span className="text-gray-600">Created by:</span>
              <p className="font-medium">Church Administrator</p>
            </div>
          )}
        </div>
      </div>

      {/* RSVP Section */}
      {user && member && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">RSVP</h2>
          
          <div className="flex gap-3">
            <button
              onClick={() => handleRSVP('Attending')}
              disabled={updating}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                myAttendance?.status === 'Attending'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              Attending ({rsvpCounts.Attending})
            </button>
            <button
              onClick={() => handleRSVP('Tentative')}
              disabled={updating}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                myAttendance?.status === 'Tentative'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              Tentative ({rsvpCounts.Tentative})
            </button>
            <button
              onClick={() => handleRSVP('Absent')}
              disabled={updating}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                myAttendance?.status === 'Absent'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              Absent ({rsvpCounts.Absent})
            </button>
          </div>
        </div>
      )}

      {/* Attendees List (for admins/pastors) */}
      {(memberRole === 'admin' || memberRole === 'pastor') && attendees.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">RSVPs ({attendees.length})</h2>
          
          <div className="space-y-2">
            {attendees.map(attendance => (
              <div
                key={attendance.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <span className="font-medium">
                    Member {attendance.member_id.slice(0, 8)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {attendance.status && (
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      attendance.status === 'Attending'
                        ? 'bg-green-100 text-green-800'
                        : attendance.status === 'Tentative'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {attendance.status}
                    </span>
                  )}
                  {attendance.note && (
                    <span className="text-xs text-gray-500 italic">
                      "{attendance.note}"
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}