// src/components/donations/GivingOverviewWidget.tsx
// Pastor-level giving overview widget for dashboard
// Displays aggregate giving trends and patterns for pastoral insight without individual donor details
// SECURITY LEVEL: MEDIUM - Aggregate data only, no individual donor information
// RELEVANT FILES: src/components/dashboard/PastorDashboard.tsx, src/services/firebase/donations.service.ts

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  TrendingUp,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { donationsService } from '../../services/firebase';
import { logger } from '../../utils/logger';

interface GivingTrends {
  monthlyTrends: Array<{
    month: string;
    totalAmount: number;
    donationCount: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

interface GivingOverviewWidgetProps {
  className?: string;
}

export function GivingOverviewWidget({
  className = '',
}: GivingOverviewWidgetProps) {
  const [trends, setTrends] = useState<GivingTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGivingTrends();
  }, []);

  const fetchGivingTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      logger.debug('GivingOverviewWidget: Fetching giving trends');

      const data = await donationsService.getGivingTrends();
      setTrends(data);
      logger.info('GivingOverviewWidget: Successfully fetched giving trends');
    } catch (err) {
      const errorMessage = 'Unable to load giving data';
      setError(errorMessage);
      logger.error('GivingOverviewWidget: Error fetching giving trends', {
        error: err instanceof Error ? err.message : 'Unknown error',
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

  const getCurrentMonthTotal = () => {
    if (!trends?.monthlyTrends?.length) return 0;
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const currentData = trends.monthlyTrends.find((trend) =>
      trend.month.startsWith(currentMonth.slice(0, 7))
    );
    return currentData?.totalAmount || 0;
  };

  const getTotalGifts = () => {
    if (!trends?.monthlyTrends?.length) return 0;
    return trends.monthlyTrends.reduce(
      (sum, trend) => sum + trend.donationCount,
      0
    );
  };

  if (error) {
    return (
      <div
        data-testid="giving-widget-error"
        className={`bg-white rounded-lg shadow p-6 ${className}`}
      >
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchGivingTrends}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="giving-overview-widget"
      className={`bg-white rounded-lg shadow p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Giving Overview</h3>
        <Heart className="w-6 h-6 text-red-500" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading overview...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-600">This Month</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(getCurrentMonthTotal())}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Gifts</div>
              <div className="text-2xl font-bold text-green-600">
                {getTotalGifts()}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Giving Categories
            </h4>
            <div className="space-y-2">
              {trends?.categoryBreakdown?.slice(0, 3).map((category, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {category.category}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium text-gray-900">
                      {category.percentage}%
                    </div>
                    <div className="w-12 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-sm text-gray-500 text-center py-4">
                  No category data available
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1 text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span>Congregation giving patterns</span>
            </div>
            <Link
              to="/giving-trends"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View Trends →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
