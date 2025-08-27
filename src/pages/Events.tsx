import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Search,
  RefreshCw,
  Filter,
  Clock,
  Users,
  MapPin,
  X,
} from 'lucide-react';
import { Event, EventType } from '../types/events';
import { eventsService } from '../services/firebase/events.service';
import { useAuth } from '../hooks/useUnifiedAuth';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EventCard } from '../components/events/EventCard';
import { EventFilters } from '../components/events/EventFilters';

export interface EventFiltersState {
  type: EventType | 'all';
  dateRange: 'all' | 'upcoming' | 'this_week' | 'this_month' | 'past';
  rsvpStatus: 'all' | 'yes' | 'no' | 'maybe' | 'not_responded';
  isPublic: 'all' | 'public' | 'private';
}

const initialFilters: EventFiltersState = {
  type: 'all',
  dateRange: 'upcoming',
  rsvpStatus: 'all',
  isPublic: 'all',
};

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<EventFiltersState>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const { member: currentMember } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    loadEvents();
  }, [currentMember]);

  const loadEvents = async () => {
    if (!currentMember) return;
    
    try {
      setLoading(true);
      const data = await eventsService.getEventsByRoleSimple(currentMember.role);
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      showToast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    let filtered = events;

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
    return filtered.sort((a, b) => {
      if (filters.dateRange === 'past') {
        return b.startDate.getTime() - a.startDate.getTime(); // Most recent first for past events
      }
      return a.startDate.getTime() - b.startDate.getTime(); // Soonest first for upcoming events
    });
  }, [events, searchTerm, filters]);

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setShowFilters(false);
  };

  const hasActiveFilters = useMemo(() => {
    return filters.type !== 'all' || 
           filters.dateRange !== 'upcoming' || 
           filters.rsvpStatus !== 'all' || 
           filters.isPublic !== 'all' ||
           searchTerm.trim() !== '';
  }, [filters, searchTerm]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const canManageEvents = currentMember?.role === 'admin' || currentMember?.role === 'pastor';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-600">Discover and manage church events</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
          </div>
          {canManageEvents && (
            <Link
              to="/events/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Link>
          )}
          <button
            onClick={loadEvents}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events by title, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              hasActiveFilters || showFilters
                ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-100 bg-blue-600 rounded-full">
                !
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <EventFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClear={handleClearFilters}
            canManageEvents={canManageEvents}
          />
        )}
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {hasActiveFilters ? 'No events found' : 'No events yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {hasActiveFilters 
              ? 'Try adjusting your search or filter criteria.' 
              : 'Get started by creating your first event.'
            }
          </p>
          {!hasActiveFilters && canManageEvents && (
            <div className="mt-6">
              <Link
                to="/events/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              currentMember={currentMember}
              canManageEvents={canManageEvents}
              onEventUpdate={loadEvents}
            />
          ))}
        </div>
      )}
    </div>
  );
}