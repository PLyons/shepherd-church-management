import { useState } from 'react';
import { Search, X, Calendar } from 'lucide-react';
import { NoteFilter, NoteCategory, NotePriority } from '../../../../types/notes';
import { NOTE_CONFIG, PRIORITY_CONFIG } from '../../../../types/notes';

interface NotesFiltersProps {
  filters: NoteFilter;
  onFiltersChange: (filters: NoteFilter) => void;
}

export function NotesFilters({ filters, onFiltersChange }: NotesFiltersProps) {
  const [tagInput, setTagInput] = useState('');

  const handleCategoryToggle = (category: NoteCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handlePriorityToggle = (priority: NotePriority) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority];
    
    onFiltersChange({ ...filters, priorities: newPriorities });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim())) {
      onFiltersChange({ 
        ...filters, 
        tags: [...filters.tags, tagInput.trim()] 
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onFiltersChange({ 
      ...filters, 
      tags: filters.tags.filter(tag => tag !== tagToRemove) 
    });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleDateRangeChange = (field: 'start' | 'end', date: string) => {
    const dateValue = date ? new Date(date) : null;
    onFiltersChange({ 
      ...filters, 
      dateRange: { 
        ...filters.dateRange, 
        [field]: dateValue 
      } 
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      categories: [],
      priorities: [],
      tags: [],
      dateRange: { start: null, end: null },
      search: '',
      createdBy: []
    });
  };

  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.priorities.length > 0 ||
    filters.tags.length > 0 ||
    filters.search ||
    filters.dateRange.start ||
    filters.dateRange.end;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Notes
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search in title, content, or tags..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Date Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={filters.dateRange.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
            onChange={(e) => handleDateRangeChange('start', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={filters.dateRange.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
            onChange={(e) => handleDateRangeChange('end', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categories
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(NOTE_CONFIG).map(([key, config]) => {
            const isSelected = filters.categories.includes(key as NoteCategory);
            return (
              <button
                key={key}
                onClick={() => handleCategoryToggle(key as NoteCategory)}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${
                  isSelected
                    ? `${config.bgColor} ${config.color} border-current`
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{config.icon}</span>
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Priorities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priorities
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRIORITY_CONFIG).map(([key, config]) => {
            const isSelected = filters.priorities.includes(key as NotePriority);
            return (
              <button
                key={key}
                onClick={() => handlePriorityToggle(key as NotePriority)}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${
                  isSelected
                    ? `${config.bgColor} ${config.color} border-current`
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{config.icon}</span>
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Tags
        </label>
        <div className="space-y-2">
          {/* Selected Tags */}
          {filters.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {/* Add Tag Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Add tag to filter..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddTag}
              disabled={!tagInput.trim() || filters.tags.includes(tagInput.trim())}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-gray-200">
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}