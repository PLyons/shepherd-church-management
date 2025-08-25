export const validateEventDates = (startDate: string, endDate: string): string | null => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  if (start <= now) {
    return 'Event must be scheduled for a future date';
  }
  
  if (end <= start) {
    return 'End date must be after start date';
  }
  
  // Check if dates are more than 1 year in the future
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (start > oneYearFromNow) {
    return 'Events cannot be scheduled more than one year in advance';
  }
  
  return null;
};