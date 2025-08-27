// ============================================================================
// EVENT TYPES - COMPREHENSIVE EVENT CALENDAR & ATTENDANCE SYSTEM
// ============================================================================

// Supporting enums and types
export type EventType = 
  | 'service'
  | 'bible_study'
  | 'prayer_meeting'
  | 'youth_group'
  | 'seniors_group'
  | 'womens_ministry'
  | 'mens_ministry'
  | 'special_event'
  | 'outreach'
  | 'volunteer_activity'
  | 'board_meeting'
  | 'training'
  | 'other';

export type Role = 'admin' | 'pastor' | 'member';

export type RecurrencePattern = {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every N days/weeks/months/years
  endDate?: Date;
  maxOccurrences?: number;
};

// Core Event interface
export interface Event {
  // Core identification
  id: string;
  
  // Basic information
  title: string;
  description: string;
  location: string;
  
  // Temporal data
  startDate: Date;
  endDate?: Date;
  isAllDay?: boolean;
  
  // Event classification
  eventType: EventType;
  isPublic: boolean;
  requiredRoles?: Role[];
  
  // Capacity management
  capacity?: number;
  currentAttendees?: number;
  enableWaitlist?: boolean;
  
  // Recurrence (future enhancement foundation)
  recurrence?: RecurrencePattern;
  
  // Administrative
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Member ID
  
  // Status
  isActive?: boolean;
  isCancelled?: boolean;
  cancellationReason?: string;
}

// RSVP interface
export type RSVPStatus = 'yes' | 'no' | 'maybe' | 'waitlist';

export interface EventRSVP {
  id: string;
  eventId: string;
  memberId: string;
  
  // RSVP details
  status: RSVPStatus;
  responseDate: Date;
  numberOfGuests: number;
  notes?: string;
  
  // Administrative
  createdAt: Date;
  updatedAt: Date;
}

// Attendance interface
export interface EventAttendance {
  id: string;
  eventId: string;
  memberId: string;
  
  // Check-in details
  checkInTime: Date;
  checkInBy: string; // Member ID of person recording attendance
  checkOutTime?: Date;
  
  // Attendance details
  numberOfGuests: number;
  notes?: string;
  
  // Verification
  isVerified: boolean;
  verifiedBy?: string; // Member ID
  
  // Administrative
  createdAt: Date;
  updatedAt: Date;
}

// Form data interfaces for UI components
export interface EventFormData {
  title: string;
  description: string;
  location: string;
  startDate: string; // ISO string for form handling
  endDate: string;
  isAllDay: boolean;
  eventType: EventType;
  isPublic: boolean;
  requiredRoles: Role[];
  capacity?: number;
  enableWaitlist: boolean;
}

export interface RSVPFormData {
  status: RSVPStatus;
  numberOfGuests: number;
  notes?: string;
  dietaryRestrictions?: string;
}