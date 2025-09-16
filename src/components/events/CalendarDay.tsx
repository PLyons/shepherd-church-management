import React, { memo, useMemo } from 'react';
import { Event } from '../../types/events';
import {
  formatCalendarDate,
  isToday,
  isPast,
  isInCurrentMonth,
  getEventsForDate,
  sortEventsByTime,
  getEventTypeColors,
  formatEventTime,
  hasCapacityInfo,
  getCapacityStatus,
} from '../../utils/calendar-helpers';

interface CalendarDayProps {
  date: Date;
  currentMonth: Date;
  events: Event[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
}

export const CalendarDay: React.FC<CalendarDayProps> = memo(
  ({ date, currentMonth, events, onDateClick, onEventClick }) => {
    // Memoize expensive computations
    const dayData = useMemo(() => {
      const dayEvents = getEventsForDate(events, date);
      const sortedEvents = sortEventsByTime(dayEvents);
      const isCurrentMonth = isInCurrentMonth(date, currentMonth);
      const isTodayDate = isToday(date);
      const isPastDate = isPast(date);
      const displayEvents = sortedEvents.slice(0, 3);
      const hasMoreEvents = sortedEvents.length > 3;

      return {
        dayEvents,
        sortedEvents,
        isCurrentMonth,
        isTodayDate,
        isPastDate,
        displayEvents,
        hasMoreEvents,
      };
    }, [date, currentMonth, events]);

    const {
      sortedEvents,
      isCurrentMonth,
      isTodayDate,
      isPastDate,
      displayEvents,
      hasMoreEvents,
    } = dayData;

    const handleDateClick = () => {
      onDateClick(date);
    };

    const handleEventClick = (event: Event, e: React.MouseEvent) => {
      e.stopPropagation();
      onEventClick(event);
    };

    const dayClasses = [
      'min-h-24 p-1 border border-gray-200 cursor-pointer transition-colors relative group',
      isTodayDate ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50',
      !isCurrentMonth && 'text-gray-400 bg-gray-50',
      isPastDate && isCurrentMonth && 'bg-gray-25',
    ]
      .filter(Boolean)
      .join(' ');

    const dateClasses = [
      'w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mb-1 relative z-10',
      isTodayDate
        ? 'bg-blue-600 text-white'
        : isCurrentMonth
          ? 'text-gray-900 hover:bg-gray-100'
          : 'text-gray-400',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={dayClasses} onClick={handleDateClick}>
        {/* Date number */}
        <div className={dateClasses}>{formatCalendarDate(date)}</div>

        {/* Events list with color coding */}
        <div className="space-y-1">
          {displayEvents.map((event) => {
            const colors = getEventTypeColors(event.eventType);
            const eventDate =
              event.startDate instanceof Date
                ? event.startDate
                : new Date(event.startDate);

            return (
              <div
                key={event.id}
                className={`text-xs p-1 rounded border cursor-pointer transition-all duration-150 truncate relative group/event ${colors.bg} ${colors.text} ${colors.border} ${colors.hover}`}
                onClick={(e) => handleEventClick(event, e)}
                title={`${event.title} - ${event.eventType}${event.location ? ` at ${event.location}` : ''}`}
              >
                {/* Event content */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {event.isAllDay ? (
                      <span className="font-medium truncate block">
                        {event.title}
                      </span>
                    ) : (
                      <div className="space-y-0.5">
                        <div className="font-medium text-xs leading-3">
                          {formatEventTime(eventDate)}
                        </div>
                        <div className="truncate text-xs opacity-90">
                          {event.title}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Capacity indicator */}
                  {hasCapacityInfo(event) && (
                    <div className="ml-1 flex-shrink-0">
                      <div
                        className={`w-2 h-2 rounded-full ${getCapacityStatus(event).full ? 'bg-red-500' : 'bg-green-500'}`}
                      />
                    </div>
                  )}
                </div>

                {/* Desktop hover preview */}
                <div className="absolute invisible group-hover/event:visible opacity-0 group-hover/event:opacity-100 transition-all duration-200 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64 -top-1 left-full ml-2">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-gray-900 text-sm leading-5">
                        {event.title}
                      </h4>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}
                      >
                        {event.eventType}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center">
                        <span className="font-medium">Time:</span>
                        <span className="ml-1">
                          {event.isAllDay
                            ? 'All Day'
                            : `${formatEventTime(eventDate)}${event.endDate ? ` - ${formatEventTime(new Date(event.endDate))}` : ''}`}
                        </span>
                      </div>

                      {event.location && (
                        <div className="flex items-center">
                          <span className="font-medium">Location:</span>
                          <span className="ml-1">{event.location}</span>
                        </div>
                      )}

                      {hasCapacityInfo(event) && (
                        <div className="flex items-center">
                          <span className="font-medium">Capacity:</span>
                          <span
                            className={`ml-1 ${getCapacityStatus(event).color}`}
                          >
                            {getCapacityStatus(event).text}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-xs text-blue-600">
                        Click to RSVP or view details
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* More events indicator */}
          {hasMoreEvents && (
            <div className="text-xs text-gray-500 p-1 bg-gray-50 rounded border border-gray-200">
              +{sortedEvents.length - 3} more event
              {sortedEvents.length - 3 !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    );
  }
);
