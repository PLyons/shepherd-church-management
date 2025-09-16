// src/components/donations/reports/CategoryChart.tsx
// Bar and pie chart components for category breakdown visualization
// Displays top categories with drill-down capability and percentage labels
// RELEVANT FILES: src/components/donations/FinancialReports.tsx, src/types/donations.ts, package.json (recharts)

import { useState } from 'react';
import {
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
import { formatCurrency } from '../../../utils/currency-utils';
import { FinancialSummary } from '../../../types/donations';
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

interface CategoryChartProps {
  data: FinancialSummary | null;
  loading?: boolean;
  maxCategories?: number;
  height?: number;
}

interface CategoryData {
  id: string;
  name: string;
  amount: number;
  count: number;
  percentage: number;
  goalProgress?: number;
}

type ChartType = 'bar' | 'pie';

// Predefined color palette for consistent category colors
const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#ec4899', // pink
  '#6b7280', // gray
];

export function CategoryChart({ data, loading, maxCategories = 10, height = 400 }: CategoryChartProps) {
  // Ensure minimum dimensions for chart rendering
  const chartHeight = Math.max(height, 300);
  const chartWidth = '100%';
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [showGoalProgress, setShowGoalProgress] = useState(true);

  // Process category data for charts
  const processCategoryData = (): CategoryData[] => {
    if (!data || !data.byCategory) {
      return [];
    }

    const categories = Object.entries(data.byCategory).map(([id, category]) => ({
      id,
      name: category.categoryName,
      amount: category.amount,
      count: category.count,
      percentage: category.percentage,
      goalProgress: category.goalProgress,
    }));

    // Sort by amount descending and limit to maxCategories
    return categories
      .sort((a, b) => b.amount - a.amount)
      .slice(0, maxCategories);
  };

  const categoryData = processCategoryData();

  // Custom tooltip for both chart types
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="font-medium text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">{formatCurrency(data.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Count:</span>
              <span className="font-medium">{data.count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Percentage:</span>
              <span className="font-medium">{data.percentage.toFixed(1)}%</span>
            </div>
            {data.goalProgress && (
              <div className="flex justify-between">
                <span className="text-gray-600">Goal Progress:</span>
                <span className="font-medium text-green-600">{data.goalProgress.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderPieLabel = ({ name, percentage }: any) => {
    return `${name}: ${percentage.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="bg-gray-100 rounded animate-pulse flex items-center justify-center" style={{ height: chartHeight, minHeight: 300, width: '100%', minWidth: 400 }}>
          <span className="text-gray-500">Loading chart...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Chart type selector */}
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-3 py-2 text-sm font-medium border rounded-l-md flex items-center gap-2 ${
                chartType === 'bar'
                  ? 'bg-blue-50 border-blue-500 text-blue-700 z-10'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Bar
            </button>
            <button
              type="button"
              onClick={() => setChartType('pie')}
              className={`px-3 py-2 text-sm font-medium border rounded-r-md -ml-px flex items-center gap-2 ${
                chartType === 'pie'
                  ? 'bg-blue-50 border-blue-500 text-blue-700 z-10'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <PieChartIcon className="h-4 w-4" />
              Pie
            </button>
          </div>
          
          {/* Goal progress toggle */}
          {chartType === 'bar' && (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showGoalProgress}
                onChange={(e) => setShowGoalProgress(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show Goals</span>
            </label>
          )}
        </div>
      </div>

      {/* Chart container */}
      <div style={{ height: chartHeight, minHeight: 300, width: '100%', minWidth: 400 }} data-testid={`${chartType}-chart`} className="w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={400} minHeight={300}>
          {chartType === 'bar' ? (
            <BarChart data={categoryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <Bar
                dataKey="amount"
                name="Amount"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              
              {showGoalProgress && (
                <Bar
                  dataKey="goalProgress"
                  name="Goal Progress (%)"
                  fill="#10b981"
                  opacity={0.6}
                  yAxisId="right"
                />
              )}
            </BarChart>
          ) : (
            <PieChart width={400} height={chartHeight} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                />
              )}
            </BarChart>
          ) : (
            <PieChart width={400} height={chartHeight} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderPieLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="amount"
                nameKey="name"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Category ranking list */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Top Categories</h4>
        <div 
          className="space-y-2 max-h-48 overflow-y-auto" 
          data-testid="category-ranking"
        >
          {categoryData.map((category, index) => (
            <div 
              key={category.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              data-testid="category-item"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <div>
                  <p className="font-medium text-gray-900">{category.name}</p>
                  <p className="text-sm text-gray-500">{category.count} donations</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {formatCurrency(category.amount)}
                </p>
                <p className="text-sm text-gray-500">
                  {category.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category comparison (if showing goals) */}
      {showGoalProgress && categoryData.some(c => c.goalProgress) && (
        <div className="mt-4 pt-4 border-t border-gray-200" data-testid="category-breakdown">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Goal Progress
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryData
              .filter(c => c.goalProgress)
              .slice(0, 6)
              .map((category) => (
                <div key={category.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {category.name}
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {category.goalProgress!.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, category.goalProgress!)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatCurrency(category.amount)}</span>
                    <span>
                      Goal: {formatCurrency(category.amount / (category.goalProgress! / 100))}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Additional component for comparison charts
export function CategoryComparisonChart({ data, loading }: CategoryChartProps) {
  const [comparisonType, setComparisonType] = useState<'amount' | 'count' | 'percentage'>('amount');

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="bg-gray-100 rounded animate-pulse flex items-center justify-center" style={{ height: 300, minHeight: 300, width: '100%', minWidth: 400 }}>
          <span className="text-gray-500">Loading comparison...</span>
        </div>
      </div>
    );
  }

  if (!data || !data.byCategory) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center py-12">
        <p className="text-gray-500">No category data available for comparison</p>
      </div>
    );
  }

  const categories = Object.entries(data.byCategory)
    .map(([id, category]) => ({
      id,
      name: category.categoryName,
      amount: category.amount,
      count: category.count,
      percentage: category.percentage,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200" data-testid="comparison-chart">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Category Comparison</h4>
        
        <select
          value={comparisonType}
          onChange={(e) => setComparisonType(e.target.value as typeof comparisonType)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="amount">By Amount</option>
          <option value="count">By Count</option>
          <option value="percentage">By Percentage</option>
        </select>
      </div>

      <div className="space-y-3">
        {categories.map((category, index) => {
          const value = category[comparisonType];
          const maxValue = Math.max(...categories.map(c => c[comparisonType]));
          const percentage = (value / maxValue) * 100;

          return (
            <div key={category.id} className="relative">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-gray-900">{category.name}</span>
                <span className="text-gray-600">
                  {comparisonType === 'amount' && formatCurrency(value)}
                  {comparisonType === 'count' && `${value} donations`}
                  {comparisonType === 'percentage' && `${value.toFixed(1)}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}