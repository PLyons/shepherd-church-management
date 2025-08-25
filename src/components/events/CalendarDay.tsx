import React from 'react';
import { Event } from '../../types/events';
import { 
  formatCalendarDate, 
  isToday, 
  isPast, 
  isInCurrentMonth,
  getEventsForDate,
  sortEventsByTime
} from '../../utils/calendar-helpers';

interface CalendarDayProps {
  date: Date;
  currentMonth: Date;
  events: Event[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  currentMonth,
  events,
  onDateClick,
  onEventClick
}) => {
  const dayEvents = getEventsForDate(events, date);
  const sortedEvents = sortEventsByTime(dayEvents);
  const isCurrentMonth = isInCurrentMonth(date, currentMonth);
  const isTodayDate = isToday(date);
  const isPastDate = isPast(date);

  // Limit displayed events to prevent overflow
  const displayEvents = sortedEvents.slice(0, 3);
  const hasMoreEvents = sortedEvents.length > 3;

  const handleDateClick = () => {
    onDateClick(date);
  };

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick(event);
  };

  const dayClasses = [
    'min-h-24 p-1 border border-gray-200 cursor-pointer transition-colors',
    isTodayDate 
      ? 'bg-blue-50 border-blue-300' 
      : 'hover:bg-gray-50',
    !isCurrentMonth && 'text-gray-400 bg-gray-50',
    isPastDate && isCurrentMonth && 'bg-gray-25'
  ].filter(Boolean).join(' ');

  const dateClasses = [
    'w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mb-1',
    isTodayDate 
      ? 'bg-blue-600 text-white' 
      : isCurrentMonth 
        ? 'text-gray-900 hover:bg-gray-100' 
        : 'text-gray-400'
  ].filter(Boolean).join(' ');

  return (
    <div className={dayClasses} onClick={handleDateClick}>
      {/* Date number */}
      <div className={dateClasses}>
        {formatCalendarDate(date)}
      </div>

      {/* Events list */}
      <div className="space-y-1">
        {displayEvents.map((event) => (
          <div
            key={event.id}
            className="text-xs p-1 rounded bg-blue-100 text-blue-800 border border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors truncate"
            onClick={(e) => handleEventClick(event, e)}
            title={event.title}
          >
            {event.isAllDay ? (
              <span className="font-medium">{event.title}</span>
            ) : (
              <span>
                <span className="font-medium">
                  {event.startDate instanceof Date 
                    ? event.startDate.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })
                    : new Date(event.startDate).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })
                  }
                </span>
                <span className="ml-1">{event.title}</span>
              </span>
            )}
          </div>
        ))}

        {/* More events indicator */}
        {hasMoreEvents && (
          <div className="text-xs text-gray-500 p-1">
            +{sortedEvents.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
};