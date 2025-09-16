// src/components/donations/GivingSummary.tsx
// Giving summary component for member profile sidebar
// Shows key donation metrics for a member
// RELEVANT FILES: src/components/members/profile/HouseholdSidebar.tsx, src/services/firebase/donations.service.ts

import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { donationsService } from '../../services/firebase';
import { useAuth } from '../../hooks/useUnifiedAuth';

interface GivingSummaryProps {
  memberId: string;
  className?: string;
}

interface DonationSummary {
  totalAmount: number;
  donationCount: number;
  lastDonationDate: Date | null;
  currentYearTotal?: number;
}

export default function GivingSummary({
  memberId,
  className = '',
}: GivingSummaryProps) {
  const [summary, setSummary] = useState<DonationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { member: currentMember } = useAuth();

  useEffect(() => {
    fetchGivingSummary();
  }, [memberId]);

  const fetchGivingSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      // Security check: ensure proper access
      const isAdminOrPastor =
        currentMember?.role === 'admin' || currentMember?.role === 'pastor';
      const isOwnProfile = currentMember?.id === memberId;

      if (!isAdminOrPastor && !isOwnProfile) {
        setError('Access denied');
        return;
      }

      const summaryData =
        await donationsService.getMemberDonationSummary(memberId);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error fetching giving summary:', err);
      setError('Failed to load giving summary');
    } finally {
      setLoading(false);
    }
  };

  // Don't show giving summary if user doesn't have access
  const isAdminOrPastor =
    currentMember?.role === 'admin' || currentMember?.role === 'pastor';
  const isOwnProfile = currentMember?.id === memberId;

  if (!isAdminOrPastor && !isOwnProfile) {
    return null;
  }

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Giving Summary</h3>
          <DollarSign className="h-4 w-4 text-gray-400" />
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Giving Summary</h3>
          <DollarSign className="h-4 w-4 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">
          {error || 'No giving data available'}
        </p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}
      data-testid="giving-summary"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Giving Summary</h3>
        <DollarSign className="h-4 w-4 text-green-600" />
      </div>

      <div className="space-y-3">
        {/* Total Giving */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">Total Giving</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(summary.totalAmount)}
          </span>
        </div>

        {/* Number of Donations */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              {summary.donationCount} donation
              {summary.donationCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Last Donation */}
        {summary.lastDonationDate && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Last donation</span>
            </div>
            <span className="text-sm text-gray-900">
              {formatDate(summary.lastDonationDate)}
            </span>
          </div>
        )}

        {/* Current Year Total (if available) */}
        {summary.currentYearTotal !== undefined && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {new Date().getFullYear()} YTD
              </span>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(summary.currentYearTotal)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
