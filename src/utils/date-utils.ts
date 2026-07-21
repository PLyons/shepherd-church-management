import { format, parseISO } from 'date-fns';

/**
 * Format a date for display in a consistent format across the application
 * @param date - Date object, string (ISO format), or Firestore Timestamp
 * @param dateFormat - Optional date-fns format string (defaults to 'MM/dd/yyyy')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | { toDate: () => Date },
  dateFormat: string = 'MM/dd/yyyy'
): string {
  try {
    let dateObj: Date;

    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (date && typeof date === 'object' && 'toDate' in date) {
      // Handle Firestore Timestamp
      dateObj = date.toDate();
    } else {
      throw new Error('Invalid date format');
    }

    return format(dateObj, dateFormat);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a date and time for display
 * @param date - Date object, string (ISO format), or Firestore Timestamp
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: Date | string | { toDate: () => Date }
): string {
  return formatDate(date, 'MM/dd/yyyy h:mm a');
}
