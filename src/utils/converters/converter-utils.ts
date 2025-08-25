import { Timestamp } from 'firebase/firestore';

/**
 * Converts a Firestore Timestamp or date string to ISO string
 */
export const timestampToString = (
  timestamp: Timestamp | string | null | undefined
): string | undefined => {
  if (!timestamp) {
    return undefined;
  }

  // If it's already a string, return it (assuming it's already ISO format)
  if (typeof timestamp === 'string') {
    return timestamp;
  }

  // If it's a Firestore Timestamp, convert it
  if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
    try {
      return timestamp.toDate().toISOString();
    } catch (error) {
      console.error('Error converting timestamp to string:', error, timestamp);
      return undefined;
    }
  }

  // If it's a timestamp object with seconds/nanoseconds (new format), convert it
  if (
    timestamp &&
    typeof timestamp === 'object' &&
    'seconds' in timestamp &&
    'nanoseconds' in timestamp
  ) {
    try {
      const date = new Date(
        timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
      );
      return date.toISOString();
    } catch (error) {
      console.error(
        'Error converting timestamp object to string:',
        error,
        timestamp
      );
      return undefined;
    }
  }

  console.warn('Invalid timestamp provided to timestampToString:', timestamp);
  return undefined;
};

/**
 * Converts an ISO string to Firestore Timestamp
 */
export const stringToTimestamp = (
  dateString: string | null | undefined
): Timestamp | undefined => {
  if (!dateString) return undefined;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(
        'Invalid date string provided to stringToTimestamp:',
        dateString
      );
      return undefined;
    }
    return Timestamp.fromDate(date);
  } catch (error) {
    console.error('Error converting string to timestamp:', error, dateString);
    return undefined;
  }
};

/**
 * Converts a Date object to Firestore Timestamp
 */
export const dateToTimestamp = (
  date: Date | null | undefined
): Timestamp | undefined => {
  if (!date) return undefined;
  return Timestamp.fromDate(date);
};

/**
 * Gets current timestamp
 */
export const getCurrentTimestamp = (): Timestamp => {
  return Timestamp.now();
};

/**
 * Converts a timestamp to YYYY-MM-DD format for HTML date inputs
 */
export const timestampToDateString = (
  timestamp:
    | Timestamp
    | { seconds: number; nanoseconds: number }
    | string
    | null
    | undefined
): string | undefined => {
  const isoString = timestampToString(timestamp);
  if (!isoString) return undefined;

  // Convert ISO string to YYYY-MM-DD format
  return isoString.split('T')[0];
};

/**
 * Removes undefined values from an object (Firestore doesn't accept undefined)
 */
export const removeUndefined = <T extends Record<string, unknown>>(
  obj: T
): T => {
  const result = {} as T;
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      // @ts-expect-error - Generic type assignment issue
      result[key] = obj[key];
    }
  });
  return result;
};

/**
 * Generates a computed full name
 */
export const generateFullName = (
  firstName: string,
  lastName: string
): string => {
  return `${firstName} ${lastName}`.trim();
};