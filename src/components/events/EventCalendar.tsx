import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Columns } from 'lucide-react';
import { Event } from '../../types/events';
import { eventsService } from '../../services/firebase/events.service';
import { useAuth } from '../../hooks/useUnifiedAuth';
import { useToast } from '../../contexts/ToastContext';
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
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>(initialView);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load events for the current view period
  useEffect(() => {
    loadEvents();
  }, [currentDate, view, currentUser]);

  const loadEvents = async () => {
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
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    if (view === 'month') {
      setCurrentDate(getNavigationMonth(currentDate, direction));
    } else {
      setCurrentDate(getNavigationWeek(currentDate, direction));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleViewChange = (newView: CalendarView) => {
    setView(newView);
  };

  const handleDateClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(date);
    } else if (onCreateEvent) {
      onCreateEvent(date);
    }
  };

  const getHeaderTitle = () => {
    if (view === 'month') {
      return formatMonthYear(currentDate);
    } else {
      return formatWeekRange(getStartOfWeek(currentDate));
    }
  };

  const renderMonthView = () => {
    const calendarGrid = generateCalendarGrid(currentDate);

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
                  onEventClick={onEventClick}
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
        onEventClick={onEventClick}
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
    <div className="h-full flex flex-col bg-white">
      {/* Calendar header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {/* Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleNavigation('prev')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title={`Previous ${view}`}
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <button
            onClick={() => handleNavigation('next')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title={`Next ${view}`}
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>

          <button
            onClick={handleToday}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Today
          </button>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-900">
          {getHeaderTitle()}
        </h2>

        {/* View controls */}
        <div className="flex items-center space-x-2">
          <div className="flex rounded-md border border-gray-300">
            <button
              onClick={() => handleViewChange('month')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                view === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Month</span>
            </button>
            <button
              onClick={() => handleViewChange('week')}
              className={`px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                view === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Columns className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Week</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-hidden">
        {view === 'month' ? renderMonthView() : renderWeekView()}
      </div>
    </div>
  );
};