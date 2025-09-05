import { useState, useMemo } from 'react';
import { Calendar, Loader } from 'lucide-react';
import { Event, EventType } from '../../types/events';
import { Member } from '../../types';
import { EventCard } from './EventCard';
import { EventDisplayModeToggle, DisplayMode } from './EventDisplayModeToggle';

export interface EventFiltersState {
  type: EventType | 'all';
  dateRange: 'all' | 'upcoming' | 'this_week' | 'this_month' | 'past';
  rsvpStatus: 'all' | 'yes' | 'no' | 'maybe' | 'not_responded';
  isPublic: 'all' | 'public' | 'private';
}

interface EventListProps {
  events: Event[];
  currentMember: Member | null;
  canManageEvents: boolean;
  displayMode?: DisplayMode;
  filters?: EventFiltersState;
  searchTerm?: string;
  onEventUpdate: () => void;
  maxEvents?: number;
  showFilters?: boolean;
  showDisplayModeToggle?: boolean;
  enableVirtualization?: boolean;
  loading?: boolean;
  className?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  showRSVPButtons?: boolean;
}

const defaultFilters: EventFiltersState = {
  type: 'all',
  dateRange: 'upcoming',
  rsvpStatus: 'all',
  isPublic: 'all'
};

export function EventList({
  events,
  currentMember,
  canManageEvents,
  displayMode = 'grid',
  filters = defaultFilters,
  searchTerm = '',
  onEventUpdate,
  maxEvents,
  showDisplayModeToggle = true,
  loading = false,
  className = '',
  emptyStateTitle = 'No events found',
  emptyStateDescription = 'Try adjusting your search or filter criteria.',
  showRSVPButtons = true
}: EventListProps) {
  const [currentDisplayMode, setCurrentDisplayMode] = useState<DisplayMode>(displayMode);

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.location?.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(event => event.eventType === filters.type);
    }

    // Date range filter
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    switch (filters.dateRange) {
      case 'upcoming':
        filtered = filtered.filter(event => event.startDate >= now);
        break;
      case 'this_week':
        filtered = filtered.filter(event => 
          event.startDate >= startOfWeek && event.startDate <= endOfWeek
        );
        break;
      case 'this_month':
        filtered = filtered.filter(event => 
          event.startDate >= startOfMonth && event.startDate <= endOfMonth
        );
        break;
      case 'past':
        filtered = filtered.filter(event => event.startDate < now);
        break;
    }

    // Public/Private filter
    if (filters.isPublic !== 'all') {
      const isPublic = filters.isPublic === 'public';
      filtered = filtered.filter(event => event.isPublic === isPublic);
    }

    // Sort events by start date
    filtered.sort((a, b) => {
      if (filters.dateRange === 'past') {
        return b.startDate.getTime() - a.startDate.getTime(); // Most recent first for past events
      }
      return a.startDate.getTime() - b.startDate.getTime(); // Soonest first for upcoming events
    });

    // Apply max events limit
    if (maxEvents && maxEvents > 0) {
      filtered = filtered.slice(0, maxEvents);
    }

    return filtered;
  }, [events, searchTerm, filters, maxEvents]);

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Empty state
  if (filteredEvents.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {emptyStateTitle}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {emptyStateDescription}
        </p>
      </div>
    );
  }

  const renderEventsByDisplayMode = () => {
    switch (currentDisplayMode) {
      case 'grid':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                currentMember={currentMember}
                canManageEvents={canManageEvents}
                displayMode="full"
                showRSVPButton={showRSVPButtons}
                onEventUpdate={onEventUpdate}
              />
            ))}
          </div>
        );

      case 'list':
        return (
          <div className="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                currentMember={currentMember}
                canManageEvents={canManageEvents}
                displayMode="list"
                showRSVPButton={showRSVPButtons}
                onEventUpdate={onEventUpdate}
              />
            ))}
          </div>
        );

      case 'agenda': {
        // Group events by date for agenda view
        const eventsByDate = filteredEvents.reduce((acc, event) => {
          const dateKey = event.startDate.toDateString();
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(event);
          return acc;
        }, {} as Record<string, Event[]>);

        return (
          <div className="space-y-6">
            {Object.entries(eventsByDate).map(([dateString, dateEvents]) => (
              <div key={dateString} className="space-y-3">
                <div className="sticky top-0 bg-white py-2 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {new Date(dateString).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                </div>
                <div className="space-y-3">
                  {dateEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      currentMember={currentMember}
                      canManageEvents={canManageEvents}
                      displayMode="compact"
                      showRSVPButton={showRSVPButtons}
                      onEventUpdate={onEventUpdate}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'compact':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                currentMember={currentMember}
                canManageEvents={canManageEvents}
                displayMode="compact"
                showRSVPButton={showRSVPButtons}
                onEventUpdate={onEventUpdate}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Display Mode Toggle */}
      {showDisplayModeToggle && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
            {maxEvents && events.length > maxEvents && (
              <span className="text-gray-500 ml-2">
                (showing {Math.min(maxEvents, filteredEvents.length)} of {events.length})
              </span>
            )}
          </div>
          <EventDisplayModeToggle
            currentMode={currentDisplayMode}
            onModeChange={setCurrentDisplayMode}
          />
        </div>
      )}

      {/* Events Display */}
      {renderEventsByDisplayMode()}
    </div>
  );
}