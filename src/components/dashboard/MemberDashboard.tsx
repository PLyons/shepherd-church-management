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
  Calendar,
  Heart,
  User,
  Clock,
  MapPin,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import type { Member } from '../../types';

interface MemberDashboardProps {
  member: Member;
}

export function MemberDashboard({ member }: MemberDashboardProps) {
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
      const data = await dashboardService.getDashboardData(userId, 'member');
      setDashboardData(data);
    } catch (error) {
      logger.error('Error fetching member dashboard data', error);
    } finally {
      setLoading(false);
    }
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {member?.firstName || 'Friend'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening in your church community.
        </p>
      </div>

      {/* Personal Stats Grid */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Upcoming Events
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
                  My Donations This Year
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  ${stats.myDonationsThisYear || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  My Commitments
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {stats.myUpcomingCommitments || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions for Members */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.id}
              to={action.route}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`w-5 h-5 mr-3 text-${action.color}-600`}>
                {action.icon === 'user' && <User className="w-5 h-5" />}
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
        {/* Upcoming Public Events */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Upcoming Events
            </h2>
            <Link
              to="/events"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center"
            >
              View all <ChevronRight className="w-4 h-4 ml-1" />
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
                    </div>
                    <div className="ml-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Public
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Personal Activity */}
      {dashboardData?.recentActivity &&
        dashboardData.recentActivity.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {dashboardData.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {activity.type === 'rsvp' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {activity.type === 'donation' && (
                        <Heart className="w-5 h-5 text-purple-500" />
                      )}
                      {activity.type === 'event' && (
                        <Calendar className="w-5 h-5 text-blue-500" />
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
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
          <div className="text-sm text-blue-700">
            <strong>Your Privacy Matters:</strong> You can only view your own
            donation history and personal information. Contact church leadership
            if you need assistance with your records.
          </div>
        </div>
      </div>
    </div>
  );
}
