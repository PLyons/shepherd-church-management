import { ChevronDown, RotateCcw } from 'lucide-react';
import { EventType } from '../../types/events';
import { EventFiltersState } from '../../pages/Events';

interface EventFiltersProps {
  filters: EventFiltersState;
  onFiltersChange: (filters: EventFiltersState) => void;
  onClear: () => void;
  canManageEvents: boolean;
}

const eventTypeLabels: Record<EventType | 'all', string> = {
  all: 'All Types',
  service: 'Service',
  bible_study: 'Bible Study',
  prayer_meeting: 'Prayer Meeting',
  youth_group: 'Youth Group',
  seniors_group: 'Seniors Group',
  womens_ministry: "Women's Ministry",
  mens_ministry: "Men's Ministry",
  special_event: 'Special Event',
  outreach: 'Outreach',
  volunteer_activity: 'Volunteer Activity',
  board_meeting: 'Board Meeting',
  training: 'Training',
  other: 'Other',
};

const dateRangeLabels = {
  all: 'All Time',
  upcoming: 'Upcoming',
  this_week: 'This Week',
  this_month: 'This Month',
  past: 'Past Events',
};

const rsvpStatusLabels = {
  all: 'All Events',
  yes: 'Going',
  no: 'Not Going', 
  maybe: 'Maybe',
  not_responded: 'No Response',
};

const publicPrivateLabels = {
  all: 'All Events',
  public: 'Public Events',
  private: 'Private Events',
};

export function EventFilters({ 
  filters, 
  onFiltersChange, 
  onClear,
  canManageEvents 
}: EventFiltersProps) {
  const updateFilter = <K extends keyof EventFiltersState>(
    key: K, 
    value: EventFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Event Type Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Type:</label>
          <div className="relative">
            <select
              value={filters.type}
              onChange={(e) => updateFilter('type', e.target.value as EventType | 'all')}
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(eventTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">When:</label>
          <div className="relative">
            <select
              value={filters.dateRange}
              onChange={(e) => updateFilter('dateRange', e.target.value as EventFiltersState['dateRange'])}
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(dateRangeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* RSVP Status Filter - Only for members */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">My RSVP:</label>
          <div className="relative">
            <select
              value={filters.rsvpStatus}
              onChange={(e) => updateFilter('rsvpStatus', e.target.value as EventFiltersState['rsvpStatus'])}
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(rsvpStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Public/Private Filter - Only for admin/pastor */}
        {canManageEvents && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Visibility:</label>
            <div className="relative">
              <select
                value={filters.isPublic}
                onChange={(e) => updateFilter('isPublic', e.target.value as EventFiltersState['isPublic'])}
                className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(publicPrivateLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Clear Filters Button */}
        <button
          onClick={onClear}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Clear
        </button>
      </div>
    </div>
  );
}