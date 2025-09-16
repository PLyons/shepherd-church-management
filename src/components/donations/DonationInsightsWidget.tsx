// src/components/donations/DonationInsightsWidget.tsx
// Admin-only donation insights widget for dashboard
// Displays comprehensive financial metrics and donation analytics for administrative oversight
// SECURITY LEVEL: HIGH - Admin-only financial data access
// RELEVANT FILES: src/components/dashboard/AdminDashboard.tsx, src/services/firebase/donations.service.ts

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { donationsService } from '../../services/firebase';
import { logger } from '../../utils/logger';

interface DonationSummary {
  totalAmount: number;
  donationCount: number;
  averageDonation: number;
  topCategory: string;
}

interface DonationInsightsWidgetProps {
  className?: string;
}

export function DonationInsightsWidget({
  className = '',
}: DonationInsightsWidgetProps) {
  const [summary, setSummary] = useState<DonationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDonationSummary();
  }, []);

  const fetchDonationSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      logger.debug('DonationInsightsWidget: Fetching donation summary');

      const data = await donationsService.getDonationSummary();
      setSummary(data);
      logger.info(
        'DonationInsightsWidget: Successfully fetched donation summary'
      );
    } catch (err) {
      const errorMessage = 'Unable to load donation data';
      setError(errorMessage);
      logger.error('DonationInsightsWidget: Error fetching donation summary', {
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

  if (error) {
    return (
      <div
        data-testid="donation-widget-error"
        className={`bg-white rounded-lg shadow p-6 ${className}`}
      >
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchDonationSummary}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="donation-insights-widget"
      className={`bg-white rounded-lg shadow p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Donation Insights
        </h3>
        <DollarSign className="w-6 h-6 text-green-600" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading insights...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                Total Donations
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(summary?.totalAmount || 0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Count</div>
              <div className="text-xl font-semibold text-gray-900">
                {summary?.donationCount || 0} donations
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800 font-medium">
                  Average
                </span>
              </div>
              <div className="text-lg font-semibold text-blue-900">
                {formatCurrency(summary?.averageDonation || 0)}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-purple-800 font-medium">
                  Top Category
                </span>
              </div>
              <div className="text-sm font-semibold text-purple-900 truncate">
                {summary?.topCategory || 'General Fund'}
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Link
              to="/financial-reports"
              className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              View Reports
            </Link>
            <Link
              to="/donations/new"
              className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Record Donation
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
