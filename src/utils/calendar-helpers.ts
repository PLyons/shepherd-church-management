// Calendar utility functions for date manipulation and calendar grid generation

// Get the first day of the month
export const getFirstDayOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Get the last day of the month
export const getLastDayOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

// Get the first day of the week for a given date (Sunday = 0)
export const getStartOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.getFullYear(), date.getMonth(), diff);
};

// Get the last day of the week for a given date
export const getEndOfWeek = (date: Date): Date => {
  const startOfWeek = getStartOfWeek(date);
  return new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6);
};

// Generate calendar grid for a month (includes prev/next month days)
export const generateCalendarGrid = (date: Date): Date[][] => {
  const firstDay = getFirstDayOfMonth(date);
  const lastDay = getLastDayOfMonth(date);
  const startDate = getStartOfWeek(firstDay);
  
  const weeks: Date[][] = [];
  let currentDate = new Date(startDate);
  
  // Generate 6 weeks (42 days) to ensure consistent grid
  for (let week = 0; week < 6; week++) {
    const weekDays: Date[] = [];
    
    for (let day = 0; day < 7; day++) {
      weekDays.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    weeks.push(weekDays);
  }
  
  return weeks;
};

// Generate week view dates (7 days)
export const generateWeekDates = (date: Date): Date[] => {
  const startOfWeek = getStartOfWeek(date);
  const weekDates: Date[] = [];
  
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + i);
    weekDates.push(dayDate);
  }
  
  return weekDates;
};

// Check if two dates are the same day
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// Check if date is in current month
export const isInCurrentMonth = (date: Date, currentMonth: Date): boolean => {
  return date.getFullYear() === currentMonth.getFullYear() &&
         date.getMonth() === currentMonth.getMonth();
};

// Check if date is today
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

// Check if date is in the past
export const isPast = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};

// Format date for display
export const formatCalendarDate = (date: Date): string => {
  return date.getDate().toString();
};

// Format month and year for header
export const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
};

// Format week range for header
export const formatWeekRange = (startDate: Date): string => {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  const startStr = startDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  const endStr = endDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  return `${startStr} - ${endStr}`;
};

// Get month navigation (previous/next month)
export const getNavigationMonth = (date: Date, direction: 'prev' | 'next'): Date => {
  const newDate = new Date(date);
  if (direction === 'prev') {
    newDate.setMonth(date.getMonth() - 1);
  } else {
    newDate.setMonth(date.getMonth() + 1);
  }
  return newDate;
};

// Get week navigation (previous/next week)
export const getNavigationWeek = (date: Date, direction: 'prev' | 'next'): Date => {
  const newDate = new Date(date);
  if (direction === 'prev') {
    newDate.setDate(date.getDate() - 7);
  } else {
    newDate.setDate(date.getDate() + 7);
  }
  return newDate;
};

// Day names for calendar header
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Time slots for week view (hourly from 6 AM to 11 PM)
export const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const hour = i + 6;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${period}`;
});

// Check if event falls within a time slot
export const isEventInTimeSlot = (eventStart: Date, eventEnd: Date, slotHour: number): boolean => {
  const eventStartHour = eventStart.getHours();
  const eventEndHour = eventEnd.getHours();
  
  return slotHour >= eventStartHour && slotHour < eventEndHour;
};

// Get events for a specific date
export const getEventsForDate = (events: any[], date: Date): any[] => {
  return events.filter(event => {
    const eventDate = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
    return isSameDay(eventDate, date);
  });
};

// Sort events by start time
export const sortEventsByTime = (events: any[]): any[] => {
  return [...events].sort((a, b) => {
    const timeA = a.startDate instanceof Date ? a.startDate : new Date(a.startDate);
    const timeB = b.startDate instanceof Date ? b.startDate : new Date(b.startDate);
    return timeA.getTime() - timeB.getTime();
  });
};