import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { ActivityFilter, ActivityType } from '../../../../types/activity';
import { ACTIVITY_CONFIG } from '../../../../types/activity';

interface ActivityFiltersProps {
  filters: ActivityFilter;
  onFiltersChange: (filters: ActivityFilter) => void;
  availableTypes: ActivityType[];
}

export function ActivityFilters({ filters, onFiltersChange, availableTypes }: ActivityFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);

  const updateFilters = (updates: Partial<ActivityFilter>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleActivityType = (type: ActivityType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    updateFilters({ types: newTypes });
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    onFiltersChange({
      types: [],
      dateRange: { start: null, end: null },
      search: ''
    });
  };

  const hasActiveFilters = filters.types.length > 0 || 
                          filters.dateRange.start || 
                          filters.dateRange.end || 
                          filters.search;

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search activities..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onBlur={() => updateFilters({ search: localSearch })}
          onKeyDown={(e) => e.key === 'Enter' && updateFilters({ search: localSearch })}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
            onChange={(e) => updateFilters({
              dateRange: {
                ...filters.dateRange,
                start: e.target.value ? new Date(e.target.value) : null
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
            onChange={(e) => updateFilters({
              dateRange: {
                ...filters.dateRange,
                end: e.target.value ? new Date(e.target.value) : null
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Activity Types */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Activity Types
        </label>
        <div className="flex flex-wrap gap-2">
          {availableTypes.map(type => {
            const config = ACTIVITY_CONFIG[type];
            const isSelected = filters.types.includes(type);
            
            return (
              <button
                key={type}
                onClick={() => toggleActivityType(type)}
                className={`
                  inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors
                  ${isSelected 
                    ? `${config.bgColor} ${config.color} ring-1 ring-inset ring-current` 
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <span>{config.icon}</span>
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-500">
            {filters.types.length > 0 && `${filters.types.length} type filter(s)`}
            {filters.dateRange.start && `, date range`}
            {filters.search && `, search: "${filters.search}"`}
          </span>
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
          >
            <X className="h-3 w-3" />
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}