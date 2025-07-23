// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  PASTOR: 'pastor',
  MEMBER: 'member',
  VISITOR: 'visitor',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Member Event Types
export const MEMBER_EVENT_TYPES = {
  JOINED: 'joined',
  BAPTIZED: 'baptized',
  TRANSFERRED_IN: 'transferred_in',
  TRANSFERRED_OUT: 'transferred_out',
  DECEASED: 'deceased',
  INACTIVE: 'inactive',
  REACTIVATED: 'reactivated',
} as const;

export type MemberEventType =
  (typeof MEMBER_EVENT_TYPES)[keyof typeof MEMBER_EVENT_TYPES];

// Event Types
export const EVENT_TYPES = {
  WORSHIP: 'worship',
  BIBLE_STUDY: 'bible_study',
  PRAYER_MEETING: 'prayer_meeting',
  YOUTH: 'youth',
  SOCIAL: 'social',
  OUTREACH: 'outreach',
  SPECIAL: 'special',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

// Donation Types
export const DONATION_TYPES = {
  TITHE: 'tithe',
  OFFERING: 'offering',
  BUILDING_FUND: 'building_fund',
  MISSIONS: 'missions',
  BENEVOLENCE: 'benevolence',
  OTHER: 'other',
} as const;

export type DonationType = (typeof DONATION_TYPES)[keyof typeof DONATION_TYPES];

// Volunteer Status
export const VOLUNTEER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_LEAVE: 'on_leave',
} as const;

export type VolunteerStatus =
  (typeof VOLUNTEER_STATUS)[keyof typeof VOLUNTEER_STATUS];

// Schema name
export const SCHEMA_NAME = 'churchops';

// Storage buckets
export const STORAGE_BUCKETS = {
  SERMONS: 'sermons',
  DOCUMENTS: 'documents',
  IMAGES: 'images',
} as const;

// Date formats
export const DATE_FORMAT = 'MM/dd/yyyy';
export const TIME_FORMAT = 'h:mm a';
export const DATETIME_FORMAT = 'MM/dd/yyyy h:mm a';
