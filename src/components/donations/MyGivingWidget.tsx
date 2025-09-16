// src/components/donations/MyGivingWidget.tsx
// Member personal giving widget for dashboard
// Displays only the current member's giving summary and recent donations
// SECURITY LEVEL: HIGH - Member-only access to personal financial data
// RELEVANT FILES: src/components/dashboard/MemberDashboard.tsx, src/services/firebase/donations.service.ts

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Calendar, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { donationsService } from '../../services/firebase';
import { logger } from '../../utils/logger';
import type { Donation } from '../../types/donations';

interface MyGivingWidgetProps {
  memberId: string;
  className?: string;
}

export function MyGivingWidget({
  memberId,
  className = '',
}: MyGivingWidgetProps) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (memberId) {
      fetchMemberDonations();
    }
  }, [memberId]);

  const fetchMemberDonations = async () => {
    try {
      setLoading(true);
      setError(null);
      logger.debug('MyGivingWidget: Fetching member donations', { memberId });

      const data = await donationsService.getMemberDonations(memberId);
      setDonations(data);
      logger.info('MyGivingWidget: Successfully fetched member donations');
    } catch (err) {
      const errorMessage = 'Unable to load your giving data';
      setError(errorMessage);
      logger.error('MyGivingWidget: Error fetching member donations', {
        error: err instanceof Error ? err.message : 'Unknown error',
        memberId,
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
      month: 'short',
      day: 'numeric',
    });
  };

  const getCurrentYearTotal = () => {
    const currentYear = new Date().getFullYear();
    return donations
      .filter(
        (donation) => new Date(donation.date).getFullYear() === currentYear
      )
      .reduce((sum, donation) => sum + donation.amount, 0);
  };

  const getRecentDonations = () => {
    return donations
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  };

  if (error) {
    return (
      <div
        data-testid="my-giving-widget-error"
        className={`bg-white rounded-lg shadow p-6 ${className}`}
      >
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchMemberDonations}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="my-giving-widget"
      className={`bg-white rounded-lg shadow p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">My Giving</h3>
        <Gift className="w-6 h-6 text-green-600" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading your giving...</span>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">This Year</div>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(getCurrentYearTotal())}
              </div>
              <div className="text-sm text-gray-500">
                {
                  donations.filter(
                    (d) =>
                      new Date(d.date).getFullYear() ===
                      new Date().getFullYear()
                  ).length
                }{' '}
                gifts
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Recent Gifts
            </h4>
            {getRecentDonations().length > 0 ? (
              <div className="space-y-2">
                {getRecentDonations().map((donation, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {donation.category}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(donation.date)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(donation.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No recent gifts to display
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <Link
              to="/member/donations"
              className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
            >
              <Eye className="w-4 h-4" />
              <span>View Full History</span>
            </Link>
            <Link
              to="/donations/new"
              className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Give Now
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
