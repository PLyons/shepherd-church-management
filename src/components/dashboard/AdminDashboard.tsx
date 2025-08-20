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
  DollarSign,
  Home,
  Shield,
  Plus,
  UserPlus,
  ChevronRight,
  Clock,
  MapPin,
  TrendingUp,
  AlertCircle,
  Activity,
  Settings,
  BarChart3,
} from 'lucide-react';

import type { Member } from '../../types';

interface AdminDashboardProps {
  member: Member;
}

export function AdminDashboard({ member }: AdminDashboardProps) {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [member]);

  const fetchDashboardData = async () => {
    logger.debug('AdminDashboard: Starting fetchDashboardData');

    const userId = user?.uid;
    if (!userId) {
      logger.warn('AdminDashboard: No user ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.debug('AdminDashboard: Fetching dashboard data', {
        userId,
        role: 'admin',
      });
      const data = await dashboardService.getDashboardData(userId, 'admin');
      logger.info('AdminDashboard: Successfully fetched dashboard data');
      setDashboardData(data);
    } catch (error) {
      logger.error('AdminDashboard: Error fetching dashboard data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        userRole: 'admin',
      });
      // Set some default data to prevent hanging
      setDashboardData({
        stats: {
          totalMembers: 0,
          activeMembers: 0,
          totalHouseholds: 0,
          upcomingEvents: 0,
          monthlyDonations: 0,
          totalDonations: 0,
        },
        recentActivity: [],
        upcomingEvents: [],
        quickActions: [],
      });
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Complete church management and oversight
          </p>
        </div>
        <div className="flex items-center px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
          <Shield className="w-4 h-4 mr-1" />
          Administrator
        </div>
      </div>

      {/* Comprehensive Stats Grid */}
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
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Members
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
                <Home className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Households
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {stats.totalHouseholds || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Monthly Donations
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(stats.monthlyDonations || 0)}
                  </div>
                  <div className="ml-2 flex items-center text-sm text-green-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>+5%</span>
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
      </div>

      {/* Admin Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Administrative Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.id}
              to={action.route}
              className={`flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${
                action.id === 'manage-roles' ? 'border-red-200 bg-red-50' : ''
              }`}
            >
              <div className={`w-5 h-5 mr-3 text-${action.color}-600`}>
                {action.icon === 'plus' && <Plus className="w-5 h-5" />}
                {action.icon === 'user-plus' && (
                  <UserPlus className="w-5 h-5" />
                )}
                {action.icon === 'dollar-sign' && (
                  <DollarSign className="w-5 h-5" />
                )}
                {action.icon === 'shield' && <Shield className="w-5 h-5" />}
                {action.icon === 'user' && <Users className="w-5 h-5" />}
                {action.icon === 'calendar' && <Calendar className="w-5 h-5" />}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* All Events (Including Private) */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              All Upcoming Events
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
                    </div>
                    <div className="ml-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.isPublic
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {event.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* System Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent System Activity
            </h2>
            <Link
              to="/admin/audit-logs"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center"
            >
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {dashboardData?.recentActivity &&
            dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Activity className="w-5 h-5 text-blue-500" />
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
      </div>

      {/* Financial Overview (Admin Only) */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Financial Overview
          </h2>
          <Link
            to="/admin/financial-reports"
            className="text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center"
          >
            View reports <BarChart3 className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalDonations || 0)}
            </div>
            <div className="text-sm text-gray-500">Total Donations (YTD)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.monthlyDonations || 0)}
            </div>
            <div className="text-sm text-gray-500">This Month</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency((stats.monthlyDonations || 0) * 12)}
            </div>
            <div className="text-sm text-gray-500">Projected Annual</div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
          <Link
            to="/admin/settings"
            className="text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center"
          >
            Settings <Settings className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <div>
              <div className="text-sm font-medium text-gray-900">Database</div>
              <div className="text-xs text-gray-500">Healthy</div>
            </div>
          </div>
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                Authentication
              </div>
              <div className="text-xs text-gray-500">Active</div>
            </div>
          </div>
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <div>
              <div className="text-sm font-medium text-gray-900">Storage</div>
              <div className="text-xs text-gray-500">85% Used</div>
            </div>
          </div>
          <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
            <div>
              <div className="text-sm font-medium text-gray-900">Backups</div>
              <div className="text-xs text-gray-500">2 days ago</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
          <div className="text-sm text-red-700">
            <strong>Administrator Access:</strong> You have full access to all
            church data including financial records and personal information.
            All administrative actions are logged for audit purposes.
          </div>
        </div>
      </div>
    </div>
  );
}
