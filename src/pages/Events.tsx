// src/pages/Events.tsx
// Events management page displaying filterable list of church events with role-based access controls
// This file exists to provide the main events management interface with search, filtering, and CRUD operations
// RELEVANT FILES: src/components/events/EventList.tsx, src/services/firebase/events.service.ts, src/pages/CreateEvent.tsx, src/components/events/EventFilters.tsx

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, Search, RefreshCw, Filter, X } from 'lucide-react';
import { Event, EventType } from '../types/events';
import { eventsService } from '../services/firebase/events.service';
import { useAuth } from '../hooks/useUnifiedAuth';
import { useToast } from '../contexts/ToastContext';
import { EventFilters } from '../components/events/EventFilters';
import { EventList } from '../components/events/EventList';

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
      const data = await eventsService.getEventsByRoleSimple(
        currentMember.role
      );
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      showToast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setShowFilters(false);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.type !== 'all' ||
      filters.dateRange !== 'upcoming' ||
      filters.rsvpStatus !== 'all' ||
      filters.isPublic !== 'all' ||
      searchTerm.trim() !== ''
    );
  }, [filters, searchTerm]);

  const canManageEvents =
    currentMember?.role === 'admin' || currentMember?.role === 'pastor';

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

      {/* Event List */}
      <EventList
        events={events}
        currentMember={currentMember}
        canManageEvents={canManageEvents}
        filters={filters}
        searchTerm={searchTerm}
        onEventUpdate={loadEvents}
        loading={loading}
        showDisplayModeToggle={true}
        emptyStateTitle={hasActiveFilters ? 'No events found' : 'No events yet'}
        emptyStateDescription={
          hasActiveFilters
            ? 'Try adjusting your search or filter criteria.'
            : 'Get started by creating your first event.'
        }
      />
    </div>
  );
}
