// src/components/donations/reports/TrendChart.tsx
// Line chart component for displaying donation trends over time
// Supports monthly/quarterly/yearly views with year-over-year comparison
// RELEVANT FILES: src/components/donations/FinancialReports.tsx, src/types/donations.ts, package.json (recharts)

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subYears } from 'date-fns';
import { formatCurrency } from '../../../utils/currency-utils';
import { Donation, FinancialSummary } from '../../../types/donations';

interface TrendChartProps {
  data: FinancialSummary | null;
  donations?: Donation[];
  loading?: boolean;
  height?: number;
}

type TimeFrame = 'monthly' | 'quarterly' | 'yearly';

interface TrendDataPoint {
  period: string;
  currentYear: number;
  previousYear: number;
  label: string;
  count: number;
  previousCount: number;
}

export function TrendChart({ data, donations = [], loading, height = 400 }: TrendChartProps) {
  // Ensure minimum dimensions for chart rendering
  const chartHeight = Math.max(height, 300);
  const chartWidth = '100%';
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('monthly');
  const [showComparison, setShowComparison] = useState(true);

  // Process donation data into trend format
  const processTrendData = (): TrendDataPoint[] => {
    if (!data || donations.length === 0) {
      return generateEmptyData();
    }

    const currentYear = new Date().getFullYear();
    const startDate = parseISO(data.periodStart);
    const endDate = parseISO(data.periodEnd);

    switch (timeFrame) {
      case 'monthly':
        return processMonthlyData(donations, startDate, endDate, currentYear);
      case 'quarterly':
        return processQuarterlyData(donations, startDate, endDate, currentYear);
      case 'yearly':
        return processYearlyData(donations, currentYear);
      default:
        return [];
    }
  };

  const processMonthlyData = (
    donations: Donation[],
    startDate: Date,
    endDate: Date,
    currentYear: number
  ): TrendDataPoint[] => {
    // Generate all months in the range
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    
    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      // Current year donations for this month
      const currentMonthDonations = donations.filter((donation) => {
        const donationDate = parseISO(donation.donationDate);
        return donationDate >= monthStart && 
               donationDate <= monthEnd && 
               donationDate.getFullYear() === currentYear;
      });
      
      // Previous year donations for same month
      const previousMonthDonations = donations.filter((donation) => {
        const donationDate = parseISO(donation.donationDate);
        const previousYearMonth = new Date(monthStart.getFullYear() - 1, monthStart.getMonth(), 1);
        const previousYearMonthEnd = endOfMonth(previousYearMonth);
        
        return donationDate >= previousYearMonth && 
               donationDate <= previousYearMonthEnd;
      });
      
      const currentTotal = currentMonthDonations.reduce((sum, d) => sum + d.amount, 0);
      const previousTotal = previousMonthDonations.reduce((sum, d) => sum + d.amount, 0);
      
      return {
        period: format(month, 'MMM yyyy'),
        label: format(month, 'MMMM yyyy'),
        currentYear: currentTotal,
        previousYear: previousTotal,
        count: currentMonthDonations.length,
        previousCount: previousMonthDonations.length,
      };
    });
  };

  const processQuarterlyData = (
    donations: Donation[],
    startDate: Date,
    endDate: Date,
    currentYear: number
  ): TrendDataPoint[] => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const quarterMonths = [
      [0, 1, 2], // Q1: Jan, Feb, Mar
      [3, 4, 5], // Q2: Apr, May, Jun
      [6, 7, 8], // Q3: Jul, Aug, Sep
      [9, 10, 11] // Q4: Oct, Nov, Dec
    ];

    return quarters.map((quarter, index) => {
      const months = quarterMonths[index];
      
      const currentQuarterDonations = donations.filter((donation) => {
        const donationDate = parseISO(donation.donationDate);
        return donationDate.getFullYear() === currentYear &&
               months.includes(donationDate.getMonth());
      });
      
      const previousQuarterDonations = donations.filter((donation) => {
        const donationDate = parseISO(donation.donationDate);
        return donationDate.getFullYear() === currentYear - 1 &&
               months.includes(donationDate.getMonth());
      });
      
      const currentTotal = currentQuarterDonations.reduce((sum, d) => sum + d.amount, 0);
      const previousTotal = previousQuarterDonations.reduce((sum, d) => sum + d.amount, 0);
      
      return {
        period: `${quarter} ${currentYear}`,
        label: `${quarter} ${currentYear}`,
        currentYear: currentTotal,
        previousYear: previousTotal,
        count: currentQuarterDonations.length,
        previousCount: previousQuarterDonations.length,
      };
    });
  };

  const processYearlyData = (donations: Donation[], currentYear: number): TrendDataPoint[] => {
    const years = Array.from(
      new Set(donations.map(d => parseISO(d.donationDate).getFullYear()))
    ).sort();
    
    return years.map((year) => {
      const yearDonations = donations.filter(d => 
        parseISO(d.donationDate).getFullYear() === year
      );
      
      const previousYearDonations = donations.filter(d => 
        parseISO(d.donationDate).getFullYear() === year - 1
      );
      
      const total = yearDonations.reduce((sum, d) => sum + d.amount, 0);
      const previousTotal = previousYearDonations.reduce((sum, d) => sum + d.amount, 0);
      
      return {
        period: year.toString(),
        label: year.toString(),
        currentYear: total,
        previousYear: previousTotal,
        count: yearDonations.length,
        previousCount: previousYearDonations.length,
      };
    });
  };

  const generateEmptyData = (): TrendDataPoint[] => {
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return months.map((month, index) => ({
      period: `${month} ${currentYear}`,
      label: `${month} ${currentYear}`,
      currentYear: 0,
      previousYear: 0,
      count: 0,
      previousCount: 0,
    }));
  };

  const trendData = processTrendData();

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600">{entry.name}:</span>
              </div>
              <span className="text-sm font-medium">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Donation Trends</h3>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="bg-gray-100 rounded animate-pulse flex items-center justify-center" style={{ height: height, minHeight: 300, width: '100%', minWidth: 400 }}>
          <span className="text-gray-500">Loading chart...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Donation Trends</h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Time frame selector */}
          <div className="flex rounded-md shadow-sm">
            {(['monthly', 'quarterly', 'yearly'] as TimeFrame[]).map((frame) => (
              <button
                key={frame}
                type="button"
                onClick={() => setTimeFrame(frame)}
                className={`px-4 py-2 text-sm font-medium border ${
                  timeFrame === frame
                    ? 'bg-blue-50 border-blue-500 text-blue-700 z-10'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                } ${
                  frame === 'monthly' 
                    ? 'rounded-l-md' 
                    : frame === 'yearly' 
                      ? 'rounded-r-md -ml-px' 
                      : '-ml-px'
                }`}
              >
                {frame.charAt(0).toUpperCase() + frame.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Year-over-year comparison toggle */}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showComparison}
              onChange={(e) => setShowComparison(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Compare Years</span>
          </label>
        </div>
      </div>

      <div style={{ height, minHeight: 300, width: '100%', minWidth: 400 }} data-testid="line-chart" className="w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={400} minHeight={300}>
          <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="period"
              tick={{ fontSize: 12 }}
              interval={timeFrame === 'monthly' ? 1 : 0}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            <Line
              type="monotone"
              dataKey="currentYear"
              stroke="#3b82f6"
              strokeWidth={2}
              name={`${new Date().getFullYear()}`}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
            
            {showComparison && (
              <Line
                type="monotone"
                dataKey="previousYear"
                stroke="#6b7280"
                strokeWidth={2}
                strokeDasharray="5 5"
                name={`${new Date().getFullYear() - 1}`}
                dot={{ fill: '#6b7280', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#6b7280', strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="font-medium text-gray-900">
              {formatCurrency(trendData.reduce((sum, d) => sum + d.currentYear, 0))}
            </p>
            <p className="text-gray-500">Total {new Date().getFullYear()}</p>
          </div>
          
          {showComparison && (
            <div className="text-center">
              <p className="font-medium text-gray-900">
                {formatCurrency(trendData.reduce((sum, d) => sum + d.previousYear, 0))}
              </p>
              <p className="text-gray-500">Total {new Date().getFullYear() - 1}</p>
            </div>
          )}
          
          <div className="text-center">
            <p className="font-medium text-gray-900">
              {trendData.reduce((sum, d) => sum + d.count, 0)}
            </p>
            <p className="text-gray-500">Total Donations</p>
          </div>
        </div>
      </div>
    </div>
  );
}