// src/components/donations/DonationFilters.tsx
// Advanced filtering controls for donation history with date ranges, categories, and search
// Provides comprehensive filtering options for member donation history with accessibility
// RELEVANT FILES: src/components/donations/MemberDonationHistory.tsx, src/types/donations.ts, src/services/firebase/donation-categories.service.ts

import React, { useState, useEffect, useCallback } from 'react';
import { DonationMethod, DonationCategory } from '../../types/donations';
import { donationCategoriesService } from '../../services/firebase';

export interface FilterState {
  dateRange?: { start: string; end: string };
  categoryIds: string[];
  methods: DonationMethod[];
  searchTerm: string;
  sortBy: 'donationDate' | 'amount' | 'categoryName';
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

interface DonationFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  className?: string;
}

const PAYMENT_METHODS: { value: DonationMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'online', label: 'Online' },
  { value: 'mobile_app', label: 'Mobile App' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'other', label: 'Other' },
];

const DATE_PRESETS = [
  { label: 'Year to Date', value: 'ytd' },
  { label: 'Last Year', value: 'last_year' },
  { label: 'Last 6 Months', value: 'last_6_months' },
  { label: 'Last 3 Months', value: 'last_3_months' },
  { label: 'Custom Range', value: 'custom' },
];

export const DonationFilters: React.FC<DonationFiltersProps> = ({
  filters,
  onFiltersChange,
  className = '',
}) => {
  const [categories, setCategories] = useState<DonationCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [datePreset, setDatePreset] = useState<string>('ytd');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Load donation categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const categoryData =
          await donationCategoriesService.getActiveCategories();
        setCategories(categoryData);
      } catch (error) {
        console.error('Failed to load donation categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Handle date preset changes
  const handleDatePresetChange = useCallback(
    (preset: string) => {
      setDatePreset(preset);

      const now = new Date();
      const currentYear = now.getFullYear();

      let dateRange: { start: string; end: string } | undefined;

      switch (preset) {
        case 'ytd': {
          dateRange = {
            start: `${currentYear}-01-01`,
            end: now.toISOString().split('T')[0],
          };
          break;
        }
        case 'last_year': {
          dateRange = {
            start: `${currentYear - 1}-01-01`,
            end: `${currentYear - 1}-12-31`,
          };
          break;
        }
        case 'last_6_months': {
          const sixMonthsAgo = new Date(now);
          sixMonthsAgo.setMonth(now.getMonth() - 6);
          dateRange = {
            start: sixMonthsAgo.toISOString().split('T')[0],
            end: now.toISOString().split('T')[0],
          };
          break;
        }
        case 'last_3_months': {
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          dateRange = {
            start: threeMonthsAgo.toISOString().split('T')[0],
            end: now.toISOString().split('T')[0],
          };
          break;
        }
        case 'custom':
          // Don't set dateRange, let user set custom dates
          return;
        default:
          dateRange = undefined;
      }

      onFiltersChange({ dateRange });
    },
    [onFiltersChange]
  );

  // Handle custom date range
  const handleCustomDateChange = useCallback(() => {
    if (customStartDate && customEndDate) {
      if (customStartDate > customEndDate) {
        // Show error - start date must be before end date
        return;
      }

      onFiltersChange({
        dateRange: {
          start: customStartDate,
          end: customEndDate,
        },
      });
    }
  }, [customStartDate, customEndDate, onFiltersChange]);

  // Apply custom date changes when dates change
  useEffect(() => {
    if (datePreset === 'custom') {
      handleCustomDateChange();
    }
  }, [datePreset, customStartDate, customEndDate, handleCustomDateChange]);

  // Handle category filter toggle
  const handleCategoryToggle = useCallback(
    (categoryId: string) => {
      const newCategoryIds = filters.categoryIds.includes(categoryId)
        ? filters.categoryIds.filter((id) => id !== categoryId)
        : [...filters.categoryIds, categoryId];

      onFiltersChange({ categoryIds: newCategoryIds });
    },
    [filters.categoryIds, onFiltersChange]
  );

  // Handle payment method toggle
  const handleMethodToggle = useCallback(
    (method: DonationMethod) => {
      const newMethods = filters.methods.includes(method)
        ? filters.methods.filter((m) => m !== method)
        : [...filters.methods, method];

      onFiltersChange({ methods: newMethods });
    },
    [filters.methods, onFiltersChange]
  );

  // Handle search with debouncing
  const handleSearchChange = useCallback(
    (value: string) => {
      onFiltersChange({ searchTerm: value });
    },
    [onFiltersChange]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setDatePreset('ytd');
    setCustomStartDate('');
    setCustomEndDate('');
    onFiltersChange({
      dateRange: undefined,
      categoryIds: [],
      methods: [],
      searchTerm: '',
      page: 1,
    });
  }, [onFiltersChange]);

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 space-y-4 ${className}`}
    >
      {/* Search and Basic Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <label htmlFor="search-donations" className="sr-only">
            Search donations
          </label>
          <input
            id="search-donations"
            type="text"
            placeholder="Search by description, receipt number..."
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search donations by description or receipt number"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            aria-label="Toggle advanced filters"
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? 'Hide' : 'Show'} Filters
          </button>

          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50"
            aria-label="Clear all filters"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-4 space-y-6">
          {/* Date Range Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Date Range
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleDatePresetChange(preset.value)}
                  className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                    datePreset === preset.value
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-pressed={datePreset === preset.value}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range */}
            {datePreset === 'custom' && (
              <div className="mt-3 flex gap-3 items-center">
                <div>
                  <label
                    htmlFor="start-date"
                    className="block text-xs text-gray-600 mb-1"
                  >
                    Start Date
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="end-date"
                    className="block text-xs text-gray-600 mb-1"
                  >
                    End Date
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {customStartDate > customEndDate && customEndDate && (
                  <p className="text-xs text-red-600" role="alert">
                    Start date must be before end date
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Categories
            </h4>
            {loading ? (
              <p className="text-sm text-gray-500">Loading categories...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={filters.categoryIds.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      aria-describedby={`category-${category.id}-desc`}
                    />
                    <span className="flex-1 text-gray-700">
                      {category.name}
                    </span>
                  </label>
                ))}

                {filters.categoryIds.length > 0 && (
                  <button
                    onClick={() => onFiltersChange({ categoryIds: [] })}
                    className="text-xs text-blue-600 hover:text-blue-700 text-left"
                    aria-label="Clear category filters"
                  >
                    Clear Categories
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Payment Method Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Payment Methods
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filters.methods.includes(method.value)}
                    onChange={() => handleMethodToggle(method.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="flex-1 text-gray-700">{method.label}</span>
                </label>
              ))}

              {filters.methods.length > 0 && (
                <button
                  onClick={() => onFiltersChange({ methods: [] })}
                  className="text-xs text-blue-600 hover:text-blue-700 text-left"
                  aria-label="Clear payment method filters"
                >
                  Clear Methods
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {(filters.categoryIds.length > 0 ||
        filters.methods.length > 0 ||
        filters.searchTerm ||
        filters.dateRange) && (
        <div className="border-t border-gray-200 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Active filters:
            </span>

            {filters.searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                Search: "{filters.searchTerm}"
                <button
                  onClick={() => handleSearchChange('')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                  aria-label="Clear search"
                >
                  ×
                </button>
              </span>
            )}

            {filters.dateRange && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                {filters.dateRange.start} to {filters.dateRange.end}
                <button
                  onClick={() => onFiltersChange({ dateRange: undefined })}
                  className="ml-1 text-green-600 hover:text-green-800"
                  aria-label="Clear date range"
                >
                  ×
                </button>
              </span>
            )}

            {filters.categoryIds.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                {filters.categoryIds.length}{' '}
                {filters.categoryIds.length === 1 ? 'category' : 'categories'}
                <button
                  onClick={() => onFiltersChange({ categoryIds: [] })}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                  aria-label="Clear category filters"
                >
                  ×
                </button>
              </span>
            )}

            {filters.methods.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                {filters.methods.length} payment{' '}
                {filters.methods.length === 1 ? 'method' : 'methods'}
                <button
                  onClick={() => onFiltersChange({ methods: [] })}
                  className="ml-1 text-orange-600 hover:text-orange-800"
                  aria-label="Clear payment method filters"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
