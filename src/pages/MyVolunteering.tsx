import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useUnifiedAuth';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

type VolunteerCommitment = {
  id: string;
  event_id: string;
  role_id: string;
  status: 'Open' | 'Filled' | 'Cancelled';
  note: string | null;
  created_at: string;
  updated_at: string;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  event: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    location: string | null;
    description: string | null;
    is_public: boolean;
  };
};

export default function MyVolunteering() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [commitments, setCommitments] = useState<VolunteerCommitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (user) {
      fetchMyCommitments();
    }
  }, [user]);

  const fetchMyCommitments = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('volunteer_slots')
        .select(
          `
          *,
          role:volunteer_roles(id, name, description),
          event:events(id, title, start_time, end_time, location, description, is_public)
        `
        )
        .eq('assigned_to', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommitments(data || []);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Failed to load volunteer commitments',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCommitment = async (slotId: string) => {
    if (
      !confirm('Are you sure you want to cancel this volunteer commitment?')
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from('volunteer_slots')
        .update({
          assigned_to: null,
          status: 'Open',
          updated_at: new Date().toISOString(),
        })
        .eq('id', slotId)
        .eq('assigned_to', user?.id);

      if (error) throw error;

      showToast('Volunteer commitment cancelled successfully', 'success');
      await fetchMyCommitments();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to cancel commitment',
        'error'
      );
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getFilteredCommitments = () => {
    const now = new Date();

    switch (filter) {
      case 'upcoming':
        return commitments.filter((c) => new Date(c.event.start_time) >= now);
      case 'past':
        return commitments.filter((c) => new Date(c.event.start_time) < now);
      default:
        return commitments;
    }
  };

  const getEventStatus = (eventStartTime: string) => {
    const now = new Date();
    const eventTime = new Date(eventStartTime);

    if (eventTime < now) {
      return { status: 'completed', color: 'text-gray-500', icon: CheckCircle };
    } else if (eventTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return { status: 'soon', color: 'text-yellow-600', icon: AlertCircle };
    } else {
      return { status: 'upcoming', color: 'text-green-600', icon: Calendar };
    }
  };

  const filteredCommitments = getFilteredCommitments();
  const upcomingCount = commitments.filter(
    (c) => new Date(c.event.start_time) >= new Date()
  ).length;
  const totalCount = commitments.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            My Volunteer Schedule
          </h1>
          <p className="mt-2 text-gray-600">
            Your volunteer commitments and upcoming service opportunities
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Commitments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Upcoming
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {upcomingCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalCount - upcomingCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setFilter('upcoming')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                filter === 'upcoming'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                filter === 'past'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Past ({totalCount - upcomingCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                filter === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All ({totalCount})
            </button>
          </nav>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredCommitments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {filter === 'upcoming'
                  ? 'No upcoming volunteer commitments'
                  : filter === 'past'
                    ? 'No past volunteer commitments'
                    : 'No volunteer commitments'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'upcoming'
                  ? 'Visit the Volunteers page to sign up for opportunities.'
                  : 'Your volunteer history will appear here.'}
              </p>
            </div>
          ) : (
            filteredCommitments.map((commitment) => {
              const eventStatus = getEventStatus(commitment.event.start_time);
              const StatusIcon = eventStatus.icon;

              return (
                <div
                  key={commitment.id}
                  className="px-6 py-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-3">
                        <StatusIcon
                          className={`w-5 h-5 mr-2 ${eventStatus.color}`}
                        />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {commitment.role.name}
                        </h3>
                        <span
                          className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            commitment.status === 'Filled'
                              ? 'bg-green-100 text-green-800'
                              : commitment.status === 'Cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {commitment.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">
                            {commitment.event.title}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          <span>
                            {formatDateTime(commitment.event.start_time)}
                          </span>
                          {commitment.event.end_time && (
                            <span className="ml-1">
                              - {formatTime(commitment.event.end_time)}
                            </span>
                          )}
                        </div>
                        {commitment.event.location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{commitment.event.location}</span>
                          </div>
                        )}
                      </div>

                      {commitment.role.description && (
                        <p className="mt-3 text-sm text-gray-700">
                          <strong>Role:</strong> {commitment.role.description}
                        </p>
                      )}

                      {commitment.note && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-700">
                            <strong>Note:</strong> {commitment.note}
                          </p>
                        </div>
                      )}

                      {commitment.event.description && (
                        <div className="mt-3">
                          <details className="group">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                              <span>View Event Details</span>
                              <svg
                                className="w-4 h-4 ml-1 transition-transform group-open:rotate-180"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </summary>
                            <div className="mt-2 text-sm text-gray-700 pl-2 border-l-2 border-gray-200">
                              {commitment.event.description}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>

                    {eventStatus.status === 'upcoming' ||
                    eventStatus.status === 'soon' ? (
                      <div className="ml-6 flex-shrink-0">
                        <button
                          onClick={() => handleCancelCommitment(commitment.id)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="ml-6 flex-shrink-0">
                        <div className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Completed
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
