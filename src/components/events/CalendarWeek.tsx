import React from 'react';
import { Event } from '../../types/events';
import { 
  generateWeekDates,
  DAY_NAMES,
  TIME_SLOTS,
  formatCalendarDate,
  isToday,
  getEventsForDate,
  sortEventsByTime,
  isEventInTimeSlot
} from '../../utils/calendar-helpers';

interface CalendarWeekProps {
  currentDate: Date;
  events: Event[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
}

export const CalendarWeek: React.FC<CalendarWeekProps> = ({
  currentDate,
  events,
  onDateClick,
  onEventClick
}) => {
  const weekDates = generateWeekDates(currentDate);

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
            {TIME_SLOTS.map((time, index) => (
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
                    const endDate = event.endDate instanceof Date ? event.endDate : new Date(event.endDate);
                    
                    return isEventInTimeSlot(startDate, endDate, slotHour);
                  });

                  return (
                    <div 
                      key={`${date.toISOString()}-${time}`}
                      className="h-16 p-1 border-b border-gray-100 hover:bg-gray-25 cursor-pointer transition-colors"
                      onClick={() => onDateClick(date)}
                    >
                      {slotEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 mb-1 rounded cursor-pointer transition-colors truncate ${
                            event.isAllDay 
                              ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200'
                          }`}
                          onClick={(e) => handleEventClick(event, e)}
                          title={`${event.title}${event.location ? ` - ${event.location}` : ''}`}
                        >
                          <div className="font-medium truncate">
                            {event.title}
                          </div>
                          {event.location && (
                            <div className="text-xs opacity-75 truncate">
                              {event.location}
                            </div>
                          )}
                        </div>
                      ))}
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
};