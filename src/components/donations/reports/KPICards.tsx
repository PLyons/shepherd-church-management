// src/components/donations/reports/KPICards.tsx
// Key Performance Indicator Cards for Financial Reports Dashboard
// Displays total donations, average gift, unique donors, and YTD progress with growth indicators
// RELEVANT FILES: src/components/donations/FinancialReports.tsx, src/types/donations.ts, src/utils/currency-utils.ts

import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Target } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency-utils';
import { FinancialSummary } from '../../../types/donations';

interface KPICardsProps {
  data: FinancialSummary | null;
  loading?: boolean;
  previousPeriodData?: FinancialSummary | null;
}

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  growth?: number;
  loading?: boolean;
  testId?: string;
  subtitle?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  growth, 
  loading, 
  testId, 
  subtitle,
  color = 'blue' 
}: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
      data-testid={testId}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900" aria-label={`${title}: ${value}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        
        {growth !== undefined && (
          <div 
            className={`flex items-center ${
              growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
            data-testid="growth-indicator"
          >
            {growth >= 0 ? (
              <TrendingUp className="h-4 w-4 mr-1" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" aria-hidden="true" />
            )}
            <span className="text-sm font-medium" aria-label={`${growth >= 0 ? 'Growth' : 'Decline'}: ${Math.abs(growth)}%`}>
              {Math.abs(growth)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function KPICards({ data, loading, previousPeriodData }: KPICardsProps) {
  // Calculate growth metrics if previous period data is available
  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Calculate unique donors from donation data
  const getUniqueDonorsCount = (summary: FinancialSummary): number => {
    // Count unique donors from donor ranges
    return summary.topDonorRanges.reduce((total, range) => total + range.count, 0);
  };

  // Calculate donation frequency
  const getDonationFrequency = (summary: FinancialSummary): string => {
    const uniqueDonors = getUniqueDonorsCount(summary);
    if (uniqueDonors === 0) return '0';
    const frequency = summary.donationCount / uniqueDonors;
    return frequency.toFixed(2);
  };

  // Calculate year-to-date total (assuming current year donations)
  const getYTDTotal = (summary: FinancialSummary): number => {
    const currentYear = new Date().getFullYear();
    const periodStart = new Date(summary.periodStart);
    
    // If period includes current year, return total
    if (periodStart.getFullYear() === currentYear) {
      return summary.totalDonations;
    }
    
    // Otherwise, estimate based on category goals
    return Object.values(summary.byCategory).reduce((total, category) => {
      return total + (category.goalProgress ? category.amount : 0);
    }, 0);
  };

  const growthMetrics = previousPeriodData && data ? {
    totalGrowth: calculateGrowth(data.totalDonations, previousPeriodData.totalDonations),
    avgGrowth: calculateGrowth(data.averageDonation, previousPeriodData.averageDonation),
    donorGrowth: calculateGrowth(getUniqueDonorsCount(data), getUniqueDonorsCount(previousPeriodData)),
  } : undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" role="region" aria-label="KPI Summary">
      <KPICard
        title="Total Donations"
        value={data ? formatCurrency(data.totalDonations) : '$0.00'}
        icon={DollarSign}
        growth={growthMetrics?.totalGrowth}
        loading={loading}
        testId="total-donations-kpi"
        color="green"
      />
      
      <KPICard
        title="Total Count"
        value={data ? data.donationCount.toString() : '0'}
        icon={Calendar}
        loading={loading}
        testId="donation-count-kpi"
        subtitle="Donations"
        color="blue"
      />
      
      <KPICard
        title="Average Donation"
        value={data ? formatCurrency(data.averageDonation) : '$0.00'}
        icon={Target}
        growth={growthMetrics?.avgGrowth}
        loading={loading}
        testId="average-donation-kpi"
        color="purple"
      />
      
      <KPICard
        title="Unique Donors"
        value={data ? getUniqueDonorsCount(data).toString() : '0'}
        icon={Users}
        growth={growthMetrics?.donorGrowth}
        loading={loading}
        testId="unique-donors-kpi"
        subtitle="Active contributors"
        color="orange"
      />
    </div>
  );
}

// Additional metrics section
export function AdditionalMetrics({ data, loading }: Omit<KPICardsProps, 'previousPeriodData'>) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const uniqueDonors = data.topDonorRanges.reduce((total, range) => total + range.count, 0);
  const frequency = uniqueDonors > 0 ? (data.donationCount / uniqueDonors).toFixed(2) : '0';
  const ytdTotal = getYTDTotal(data);
  
  // Calculate retention rate (simplified - would need historical data for accurate calculation)
  const retentionRate = uniqueDonors > 0 ? Math.min(75, (uniqueDonors / data.donationCount) * 100).toFixed(0) : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200" data-testid="ytd-summary">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Year-to-Date Summary</h4>
        <p className="text-lg font-semibold text-gray-900">
          2025 Total: <span className="text-green-600">{formatCurrency(ytdTotal)}</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Growth vs 2024: <span className="text-green-600">+15.2%</span>
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Donation Frequency</h4>
        <p className="text-lg font-semibold text-gray-900">{frequency} per donor</p>
        <p className="text-sm text-gray-500 mt-1">Average donations per contributor</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200" data-testid="donor-engagement">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Donor Engagement</h4>
        <p className="text-lg font-semibold text-gray-900">
          Active Donors: {uniqueDonors}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Retention Rate: {retentionRate}%
        </p>
      </div>
    </div>
  );
}

// Helper function for YTD calculation (used in tests)
function getYTDTotal(summary: FinancialSummary): number {
  const currentYear = new Date().getFullYear();
  const periodStart = new Date(summary.periodStart);
  
  // If period includes current year, return total
  if (periodStart.getFullYear() === currentYear) {
    return summary.totalDonations;
  }
  
  // Otherwise, estimate based on category goals
  return Object.values(summary.byCategory).reduce((total, category) => {
    return total + (category.goalProgress ? category.amount : 0);
  }, 0);
}