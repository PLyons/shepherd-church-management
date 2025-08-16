import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import {
  analyticsService,
  RegistrationAnalytics,
} from '../../services/firebase/analytics.service';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

interface DateRange {
  startDate: string;
  endDate: string;
}

const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#8dd1e1',
  '#d084d0',
];

export const RegistrationAnalyticsComponent: React.FC = () => {
  const [analytics, setAnalytics] = useState<RegistrationAnalytics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 30);
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    };
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getRegistrationAnalytics(dateRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      showToast('Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field: keyof DateRange, value: string) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  // Format data for charts
  const pieData = [
    { name: 'Visitors', value: analytics.visitorVsMember.visitors },
    { name: 'Members', value: analytics.visitorVsMember.members },
  ];

  const timeData = analytics.registrationsByTime.map((item) => ({
    hour: `${item.hour}:00`,
    registrations: item.registrations,
  }));

  const dateData = analytics.registrationsByDate.map((item) => ({
    date: format(parseISO(item.date), 'MMM dd'),
    registrations: item.registrations,
    approved: item.approved,
    pending: item.pending,
    rejected: item.rejected,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Registration Analytics
        </h1>

        {/* Date Range Picker */}
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <span className="hidden sm:inline text-gray-500 self-center">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Registrations
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.overview.totalRegistrations}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Conversion Rate
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {analytics.overview.conversionRate}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Pending Approvals
          </h3>
          <p className="text-2xl font-bold text-yellow-600">
            {analytics.overview.pendingApprovals}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Active Tokens
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            {analytics.overview.activeTokens}
          </p>
        </div>
      </div>

      {/* Charts Row 1: Registrations by Date and Visitor vs Member */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registrations by Date */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Registrations Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="registrations" stroke="#8884d8" />
              <Line type="monotone" dataKey="approved" stroke="#82ca9d" />
              <Line type="monotone" dataKey="pending" stroke="#ffc658" />
              <Line type="monotone" dataKey="rejected" stroke="#ff7c7c" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Visitor vs Member Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Visitor vs Member
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Registration by Time of Day */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Registrations by Time of Day
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="registrations" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Token Usage Statistics */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Token Usage Statistics
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Registrations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Conversion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {analytics.tokenUsageStats.slice(0, 10).map((token) => (
                <tr key={token.tokenId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {token.purpose}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {token.totalRegistrations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {token.conversionRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        token.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {token.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Geographic Distribution */}
      {analytics.geographicDistribution.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Geographic Distribution (Top Locations)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.geographicDistribution.slice(0, 9).map((location) => (
              <div
                key={`${location.state}-${location.city}`}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <span className="text-sm text-gray-900 dark:text-white">
                  {location.city}, {location.state}
                </span>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  {location.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peak Registration Times */}
      {analytics.peakRegistrationTimes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Peak Registration Times
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.peakRegistrationTimes.slice(0, 6).map((peak) => (
              <div
                key={`${peak.dayOfWeek}-${peak.hour}`}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <span className="text-sm text-gray-900 dark:text-white">
                  {peak.dayOfWeek} at {peak.hour}:00
                </span>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  {peak.count} registrations
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
