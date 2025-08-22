import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  dashboardService,
  type DashboardData,
} from '../../services/firebase/dashboard.service';
import { useAuth } from '../../hooks/useUnifiedAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { logger } from '../../utils/logger';
import {
  Users,
  Calendar,
  Heart,
  UserPlus,
  Plus,
  ChevronRight,
  Clock,
  MapPin,
  AlertCircle,
  Activity,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

import type { Member } from '../../types';

interface PastorDashboardProps {
  member: Member;
}

export function PastorDashboard({ member }: PastorDashboardProps) {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [member]);

  const fetchDashboardData = async () => {
    const userId = user?.uid;
    if (!userId) return;

    try {
      setLoading(true);
      const data = await dashboardService.getDashboardData(userId, 'pastor');
      setDashboardData(data);
    } catch (error) {
      logger.error('Error fetching pastor dashboard data', error);
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
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const upcomingEvents = dashboardData?.upcomingEvents || [];
  const quickActions = dashboardData?.quickActions || [];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pastor Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Ministry oversight and pastoral care
          </p>
        </div>
        <div className="flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
          <BookOpen className="w-4 h-4 mr-1" />
          Pastor
        </div>
      </div>

      {/* Ministry Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Church Members
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stats.totalMembers || 0}
                  </div>
                  <div className="ml-2 text-sm text-gray-500">
                    ({stats.activeMembers || 0} active)
                  </div>
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
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Ministry Events
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {stats.upcomingEvents || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Giving (Monthly)
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(stats.monthlyDonations || 0)}
                  </div>
                  <div className="ml-2 flex items-center text-sm text-green-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>+3%</span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Engagement Score
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">87%</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Ministry Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ministry Actions
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.id}
              to={action.route}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`w-5 h-5 mr-3 text-${action.color}-600`}>
                {action.icon === 'plus' && <Plus className="w-5 h-5" />}
                {action.icon === 'user-plus' && (
                  <UserPlus className="w-5 h-5" />
                )}
                {action.icon === 'user' && <Users className="w-5 h-5" />}
                {action.icon === 'calendar' && <Calendar className="w-5 h-5" />}
                {action.icon === 'heart' && <Heart className="w-5 h-5" />}
              </div>
              <div>
                <span className="font-medium text-gray-900 block">
                  {action.title}
                </span>
                <span className="text-sm text-gray-500">
                  {action.description}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-8">
        {/* All Ministry Events */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Ministry Events
            </h2>
            <Link
              to="/events"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center"
            >
              Manage all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingEvents.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p>No upcoming events</p>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {event.title}
                      </h3>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{formatDate(event.startTime)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {/* Show RSVP info for pastors */}
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <Users className="w-3 h-3 mr-1" />
                        <span>12 RSVPs • 8 confirmed</span>
                      </div>
                    </div>
                    <div className="ml-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.isPublic
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {event.isPublic ? 'Public' : 'Ministry'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Member Engagement */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Member Engagement
            </h2>
            <Link
              to="/members"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center"
            >
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Active Members
                  </h4>
                  <p className="text-sm text-gray-500">
                    Attended event in last 30 days
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-green-600">
                    {stats.activeMembers || 0}
                  </div>
                  <div className="text-sm text-gray-500">
                    of {stats.totalMembers || 0}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    New Members
                  </h4>
                  <p className="text-sm text-gray-500">
                    Joined in last 60 days
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-blue-600">3</div>
                  <div className="text-sm text-gray-500">this month</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Follow-up Needed
                  </h4>
                  <p className="text-sm text-gray-500">
                    Members needing pastoral care
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-yellow-600">
                    5
                  </div>
                  <div className="text-sm text-gray-500">priority</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ministry Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Ministry Activity
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {dashboardData?.recentActivity &&
          dashboardData.recentActivity.length > 0 ? (
            dashboardData.recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {activity.type === 'event' && (
                      <Calendar className="w-5 h-5 text-blue-500" />
                    )}
                    {activity.type === 'member' && (
                      <Users className="w-5 h-5 text-green-500" />
                    )}
                    {activity.type === 'rsvp' && (
                      <Activity className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.date).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Activity className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Ministry Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ministry Health
        </h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">87%</div>
            <div className="text-sm text-gray-500">Member Engagement</div>
            <div className="text-xs text-gray-400 mt-1">Above average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">92%</div>
            <div className="text-sm text-gray-500">Event Attendance</div>
            <div className="text-xs text-gray-400 mt-1">
              Strong participation
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">78%</div>
            <div className="text-sm text-gray-500">Giving Participation</div>
            <div className="text-xs text-gray-400 mt-1">Regular donors</div>
          </div>
        </div>
      </div>

      {/* Access Notice */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 mr-2" />
          <div className="text-sm text-purple-700">
            <strong>Pastoral Access:</strong> You can view member information
            for pastoral care purposes and aggregate giving data for ministry
            planning. Individual donation details require specific justification
            and are logged for audit purposes.
          </div>
        </div>
      </div>
    </div>
  );
}
