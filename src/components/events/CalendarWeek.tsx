import React, { memo, useMemo } from 'react';
import { Event } from '../../types/events';
import { 
  generateWeekDates,
  DAY_NAMES,
  TIME_SLOTS,
  formatCalendarDate,
  isToday,
  getEventsForDate,
  sortEventsByTime,
  isEventInTimeSlot,
  getEventTypeColors,
  hasCapacityInfo,
  getCapacityStatus
} from '../../utils/calendar-helpers';

interface CalendarWeekProps {
  currentDate: Date;
  events: Event[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
}

export const CalendarWeek: React.FC<CalendarWeekProps> = memo(({
  currentDate,
  events,
  onDateClick,
  onEventClick
}) => {
  const weekDates = useMemo(() => generateWeekDates(currentDate), [currentDate]);

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick(event);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Week header with dates */}
      <div className="grid grid-cols-8 border-b border-gray-200">
        {/* Time column header */}
        <div className="p-3 text-sm font-medium text-gray-500 border-r border-gray-200">
          Time
        </div>
        
        {/* Day headers */}
        {weekDates.map((date, index) => {
          const isTodayDate = isToday(date);
          return (
            <div
              key={date.toISOString()}
              className={`p-3 text-center border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                isTodayDate ? 'bg-blue-50' : ''
              }`}
              onClick={() => onDateClick(date)}
            >
              <div className="text-sm font-medium text-gray-900">
                {DAY_NAMES[index]}
              </div>
              <div className={`text-lg font-semibold mt-1 ${
                isTodayDate ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {formatCalendarDate(date)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Week grid with time slots */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8">
          {/* Time slots column */}
          <div className="border-r border-gray-200">
            {TIME_SLOTS.map((time) => (
              <div 
                key={time}
                className="h-16 p-2 text-xs text-gray-500 border-b border-gray-100"
              >
                {time}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDates.map((date) => {
            const dayEvents = sortEventsByTime(getEventsForDate(events, date));
            
            return (
              <div key={date.toISOString()} className="border-r border-gray-200">
                {TIME_SLOTS.map((time, slotIndex) => {
                  const slotHour = slotIndex + 6;
                  const slotEvents = dayEvents.filter(event => {
                    if (event.isAllDay) return slotIndex === 0; // Show all-day events in first slot
                    
                    const startDate = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
                    const endDate = event.endDate ? (event.endDate instanceof Date ? event.endDate : new Date(event.endDate)) : startDate;
                    
                    return isEventInTimeSlot(startDate, endDate, slotHour);
                  });

                  return (
                    <div 
                      key={`${date.toISOString()}-${time}`}
                      className="h-16 p-1 border-b border-gray-100 hover:bg-gray-25 cursor-pointer transition-colors"
                      onClick={() => onDateClick(date)}
                    >
                      {slotEvents.map((event) => {
                        const colors = getEventTypeColors(event.eventType);
                        const capacityStatus = getCapacityStatus(event);
                        
                        return (
                          <div
                            key={event.id}
                            className={`text-xs p-1 mb-1 rounded cursor-pointer transition-all duration-150 truncate border relative group/event ${colors.bg} ${colors.text} ${colors.border} ${colors.hover}`}
                            onClick={(e) => handleEventClick(event, e)}
                            title={`${event.title} - ${event.eventType}${event.location ? ` at ${event.location}` : ''}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {event.title}
                                </div>
                                {event.location && (
                                  <div className="text-xs opacity-75 truncate">
                                    {event.location}
                                  </div>
                                )}
                              </div>
                              
                              {/* Capacity indicator */}
                              {hasCapacityInfo(event) && (
                                <div className="ml-1 flex-shrink-0">
                                  <div className={`w-2 h-2 rounded-full ${capacityStatus.full ? 'bg-red-500' : 'bg-green-500'}`} />
                                </div>
                              )}
                            </div>

                            {/* Week view hover preview */}
                            <div className="absolute invisible group-hover/event:visible opacity-0 group-hover/event:opacity-100 transition-all duration-200 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64 -top-1 left-full ml-2">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-semibold text-gray-900 text-sm leading-5">{event.title}</h4>
                                  <span className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                                    {event.eventType}
                                  </span>
                                </div>
                                
                                {event.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                                )}
                                
                                <div className="space-y-1 text-xs text-gray-500">
                                  <div className="flex items-center">
                                    <span className="font-medium">Time:</span>
                                    <span className="ml-1">
                                      {event.isAllDay ? 'All Day' : 'See calendar time slot'}
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
                                      <span className={`ml-1 ${capacityStatus.color}`}>
                                        {capacityStatus.text}
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
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});