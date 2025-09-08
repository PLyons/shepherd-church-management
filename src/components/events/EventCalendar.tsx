import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Columns } from 'lucide-react';
import { Event, EventRSVP } from '../../types/events';
import { eventsService } from '../../services/firebase/events.service';
import { eventRSVPService } from '../../services/firebase/event-rsvp.service';
import { useAuth } from '../../hooks/useUnifiedAuth';
import { useToast } from '../../contexts/ToastContext';
import { EventDetailsModal } from './EventDetailsModal';
import { CalendarDay } from './CalendarDay';
import { CalendarWeek } from './CalendarWeek';
import { 
  generateCalendarGrid,
  formatMonthYear,
  formatWeekRange,
  getNavigationMonth,
  getNavigationWeek,
  getStartOfWeek,
  getEndOfWeek,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  DAY_NAMES
} from '../../utils/calendar-helpers';

export type CalendarView = 'month' | 'week';

interface EventCalendarProps {
  onEventClick: (event: Event) => void;
  onDateClick?: (date: Date) => void;
  onCreateEvent?: (date: Date) => void;
  initialView?: CalendarView;
}

export const EventCalendar: React.FC<EventCalendarProps> = ({
  onEventClick,
  onDateClick,
  onCreateEvent,
  initialView = 'month'
}) => {
  const { member: currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>(initialView);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Event Details Modal state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [currentUserRSVP, setCurrentUserRSVP] = useState<EventRSVP | null>(null);

  const loadEvents = useCallback(async () => {
    if (!currentUser) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let startDate: Date;
      let endDate: Date;

      if (view === 'month') {
        // Get full month plus padding days
        const firstDay = getFirstDayOfMonth(currentDate);
        const lastDay = getLastDayOfMonth(currentDate);
        startDate = getStartOfWeek(firstDay);
        endDate = new Date(getStartOfWeek(lastDay));
        endDate.setDate(endDate.getDate() + 41); // 6 weeks
      } else {
        // Get week range
        startDate = getStartOfWeek(currentDate);
        endDate = getEndOfWeek(currentDate);
      }

      const eventsData = await eventsService.getEventsInRange(startDate, endDate);
      setEvents(eventsData);
    } catch (err) {
      console.error('Error loading calendar events:', err);
      setError('Failed to load events');
      showToast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser, view, currentDate, showToast]);

  // Memoize event handlers with useCallback
  const handleNavigation = useCallback((direction: 'prev' | 'next') => {
    if (view === 'month') {
      setCurrentDate(getNavigationMonth(currentDate, direction));
    } else {
      setCurrentDate(getNavigationWeek(currentDate, direction));
    }
  }, [view, currentDate]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleViewChange = useCallback((newView: CalendarView) => {
    setView(newView);
  }, []);

  // Load events for the current view period
  useEffect(() => {
    loadEvents();
  }, [currentDate, view, currentUser, loadEvents]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't interfere if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handleNavigation('prev');
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNavigation('next');
          break;
        case 't':
        case 'T':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            handleToday();
          }
          break;
        case 'm':
        case 'M':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            handleViewChange('month');
          }
          break;
        case 'w':
        case 'W':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            handleViewChange('week');
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNavigation, handleToday, handleViewChange]);

  // Enhanced event click handler to open event details modal
  const handleEventClick = async (event: Event) => {
    // First try external handler
    if (onEventClick) {
      onEventClick(event);
      return;
    }

    // Open event details modal for comprehensive event interaction
    setSelectedEvent(event);
    
    // Load current user's RSVP if exists
    try {
      if (currentUser?.id) {
        const userRSVP = await eventRSVPService.getRSVPByMember(event.id, currentUser.id);
        setCurrentUserRSVP(userRSVP);
      }
    } catch (err) {
      console.error('Error loading user RSVP:', err);
      setCurrentUserRSVP(null);
    }

    setIsDetailsModalOpen(true);
  };

  const handleDetailsModalClose = () => {
    setIsDetailsModalOpen(false);
    setSelectedEvent(null);
    setCurrentUserRSVP(null);
  };

  const handleRSVPUpdate = (rsvp: EventRSVP) => {
    setCurrentUserRSVP(rsvp);
    // Optionally reload events to get updated attendee counts
    loadEvents();
  };

  // Memoize header title calculation
  const headerTitle = useMemo(() => {
    if (view === 'month') {
      return formatMonthYear(currentDate);
    } else {
      return formatWeekRange(getStartOfWeek(currentDate));
    }
  }, [view, currentDate]);

  // Memoize calendar grid generation
  const calendarGrid = useMemo(() => {
    return view === 'month' ? generateCalendarGrid(currentDate) : null;
  }, [view, currentDate]);

  const handleDateClick = useCallback((date: Date) => {
    if (onDateClick) {
      onDateClick(date);
    } else if (onCreateEvent) {
      onCreateEvent(date);
    }
  }, [onDateClick, onCreateEvent]);

  const renderMonthView = () => {
    if (!calendarGrid) return null;

    return (
      <div className="flex flex-col h-full">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAY_NAMES.map((dayName) => (
            <div 
              key={dayName}
              className="p-3 text-center text-sm font-medium text-gray-500 border-r border-gray-200 last:border-r-0"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 grid grid-rows-6">
          {calendarGrid.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7">
              {week.map((date) => (
                <CalendarDay
                  key={date.toISOString()}
                  date={date}
                  currentMonth={currentDate}
                  events={events}
                  onDateClick={handleDateClick}
                  onEventClick={handleEventClick}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <CalendarWeek
        currentDate={currentDate}
        events={events}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading calendar...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-2">{error}</div>
          <button
            onClick={loadEvents}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col bg-white relative" role="application" aria-label="Calendar">
        {/* Calendar header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200" role="toolbar" aria-label="Calendar navigation and controls">
          {/* Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleNavigation('prev')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title={`Previous ${view}`}
              aria-label={`Go to previous ${view}`}
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" aria-hidden="true" />
            </button>
            
            <button
              onClick={() => handleNavigation('next')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title={`Next ${view}`}
              aria-label={`Go to next ${view}`}
            >
              <ChevronRight className="h-5 w-5 text-gray-600" aria-hidden="true" />
            </button>

            <button
              onClick={handleToday}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              aria-label="Go to today"
            >
              Today
            </button>
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-900">
            {headerTitle}
          </h2>

          {/* View controls */}
          <div className="flex items-center space-x-2">
            <div className="flex rounded-md border border-gray-300" role="radiogroup" aria-label="Calendar view">
              <button
                onClick={() => handleViewChange('month')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  view === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                role="radio"
                aria-checked={view === 'month'}
                aria-label="Month view"
              >
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <span className="ml-1 hidden sm:inline">Month</span>
              </button>
              <button
                onClick={() => handleViewChange('week')}
                className={`px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                  view === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                role="radio"
                aria-checked={view === 'week'}
                aria-label="Week view"
              >
                <Columns className="h-4 w-4" aria-hidden="true" />
                <span className="ml-1 hidden sm:inline">Week</span>
              </button>
            </div>
          </div>
        </div>

        {/* Calendar content */}
        <div className="flex-1 overflow-hidden" role="main" aria-label={`${view} view of calendar`}>
          {view === 'month' ? renderMonthView() : renderWeekView()}
        </div>

        {/* Keyboard shortcuts help tooltip */}
        <div className="absolute bottom-4 right-4 group">
          <button 
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium"
            title="Keyboard shortcuts: ← → navigate, T today, M month, W week"
            aria-label="Show keyboard shortcuts"
          >
            ?
          </button>
          <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div className="font-medium mb-1">Keyboard Shortcuts:</div>
            <div className="space-y-1">
              <div>← → Navigate months/weeks</div>
              <div>T Go to today</div>
              <div>M Month view</div>
              <div>W Week view</div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={handleDetailsModalClose}
          event={selectedEvent}
          currentUserRSVP={currentUserRSVP}
          onRSVPUpdate={handleRSVPUpdate}
        />
      )}
    </>
  );
};