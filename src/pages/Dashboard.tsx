import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { firebaseService } from '../services/firebase';
import { useAuth } from '../hooks/useUnifiedAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  PlayCircle, 
  UserPlus, 
  Plus,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

type DashboardStats = {
  totalMembers: number;
  activeMembers: number;
  upcomingEvents: number;
  thisWeekEvents: number;
  monthlyDonations: number;
  totalDonations: number;
  totalSermons: number;
  openVolunteerSlots: number;
  myUpcomingCommitments: number;
};

type RecentEvent = {
  id: string;
  title: string;
  start_time: string;
  location: string | null;
  is_public: boolean;
};

type RecentSermon = {
  id: string;
  title: string;
  speaker_name: string;
  date_preached: string;
  media_url: string | null;
};

type UpcomingCommitment = {
  id: string;
  role: { name: string };
  event: {
    title: string;
    start_time: string;
    location: string | null;
  };
};

export default function Dashboard() {
  const { member } = useAuth();
  const memberRole = member?.role || null;
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    upcomingEvents: 0,
    thisWeekEvents: 0,
    monthlyDonations: 0,
    totalDonations: 0,
    totalSermons: 0,
    openVolunteerSlots: 0,
    myUpcomingCommitments: 0,
  });
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [recentSermons, setRecentSermons] = useState<RecentSermon[]>([]);
  const [upcomingCommitments, setUpcomingCommitments] = useState<UpcomingCommitment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [member]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get dashboard stats from Firebase service
      const dashboardStats = await firebaseService.getDashboardStats();
      
      setStats({
        totalMembers: dashboardStats.members.total,
        activeMembers: dashboardStats.members.active,
        upcomingEvents: dashboardStats.events.upcoming,
        thisWeekEvents: dashboardStats.events.upcoming, // Firebase service can be enhanced for week filtering
        monthlyDonations: 0, // TODO: Add donations when implemented
        totalDonations: 0, // TODO: Add donations when implemented
        totalSermons: 0, // TODO: Add sermons when implemented
        openVolunteerSlots: 0, // TODO: Add volunteers when implemented
        myUpcomingCommitments: 0, // TODO: Add volunteers when implemented
      });

      // Get recent events
      const upcomingEvents = await firebaseService.events.getUpcomingEvents(5, false);
      setRecentEvents(upcomingEvents.map(event => ({
        id: event.id,
        title: event.title,
        start_time: event.startTime,
        location: event.location || null,
        is_public: event.isPublic
      })));

      // For now, set empty arrays for features not yet implemented in Firebase
      setRecentSermons([]);
      setUpcomingCommitments([]);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const canViewFinancials = memberRole === 'admin' || memberRole === 'pastor';
  const canManage = memberRole === 'admin' || memberRole === 'pastor';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back{member?.first_name ? `, ${member.first_name}` : ''}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening in your church community.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Active Members</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{stats.activeMembers}</div>
                  <div className="ml-2 text-sm text-gray-500">of {stats.totalMembers}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">This Week</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{stats.thisWeekEvents}</div>
                  <div className="ml-2 text-sm text-gray-500">events</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {canViewFinancials && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">This Month</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.monthlyDonations)}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Open Volunteer Slots</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{stats.openVolunteerSlots}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {canManage && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/events/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-5 h-5 text-blue-600 mr-3" />
              <span className="font-medium text-gray-900">Create Event</span>
            </Link>
            <Link
              to="/members?action=create"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UserPlus className="w-5 h-5 text-green-600 mr-3" />
              <span className="font-medium text-gray-900">Add Member</span>
            </Link>
            <Link
              to="/donations"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <DollarSign className="w-5 h-5 text-purple-600 mr-3" />
              <span className="font-medium text-gray-900">Record Donation</span>
            </Link>
            <Link
              to="/sermons"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <PlayCircle className="w-5 h-5 text-red-600 mr-3" />
              <span className="font-medium text-gray-900">Upload Sermon</span>
            </Link>
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            <Link to="/events" className="text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentEvents.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p>No upcoming events</p>
              </div>
            ) : (
              recentEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{event.title}</h3>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{formatDate(event.start_time)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {event.is_public ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Sermons */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Sermons</h2>
            <Link to="/sermons" className="text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentSermons.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <PlayCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p>No sermons available</p>
              </div>
            ) : (
              recentSermons.map((sermon) => (
                <div key={sermon.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{sermon.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">by {sermon.speaker_name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(sermon.date_preached).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    {sermon.media_url && (
                      <div className="ml-2">
                        <a
                          href={sermon.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-500"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* My Volunteer Commitments */}
      {upcomingCommitments.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">My Upcoming Volunteer Commitments</h2>
            <Link to="/my-volunteering" className="text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingCommitments.map((commitment) => (
              <div key={commitment.id} className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{commitment.role.name}</h3>
                    <p className="text-sm text-gray-500">{commitment.event.title}</p>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{formatDate(commitment.event.start_time)}</span>
                      {commitment.event.location && (
                        <>
                          <span className="mx-2">•</span>
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{commitment.event.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats (for admins/pastors) */}
      {canViewFinancials && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ministry Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalSermons}</div>
              <div className="text-sm text-gray-500">Total Sermons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalDonations)}</div>
              <div className="text-sm text-gray-500">Total Donations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.upcomingEvents}</div>
              <div className="text-sm text-gray-500">Upcoming Events</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}