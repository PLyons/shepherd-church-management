// ============================================================================
// CORE TYPES - FIREBASE-BASED
// ============================================================================

export interface Member {
  id: string;

  // Name fields
  prefix?: string; // Mr., Mrs., Dr., etc.
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string; // Jr., Sr., III, etc.

  // Email addresses (array)
  emails?: {
    type: 'home' | 'work' | 'other';
    address: string;
    primary?: boolean;
  }[];

  // Phone numbers (array)
  phones?: {
    type: 'mobile' | 'home' | 'work' | 'other';
    number: string;
    primary?: boolean;
    smsOptIn?: boolean; // Only for mobile type
  }[];

  // Physical addresses (array)
  addresses?: {
    type: 'home' | 'work' | 'other';
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    primary?: boolean;
  }[];

  // Dates
  birthDate?: Date | string;
  birthdate?: string; // Alternative format for compatibility
  anniversaryDate?: Date | string;

  // Status fields
  maritalStatus?: 'single' | 'married' | 'widowed' | 'divorced';
  memberStatus:
    | 'active'
    | 'inactive'
    | 'regular_attender'
    | 'visitor'
    | 'participant'
    | 'not_set';
  role: 'admin' | 'pastor' | 'member';
  gender?: 'Male' | 'Female';
  joinedAt?: string;

  // Household relationship
  householdId?: string;
  isPrimaryContact?: boolean;

  // Metadata
  createdAt?: Date | string;
  updatedAt?: Date | string;

  // Computed
  fullName?: string;

  // DEPRECATED - kept for compatibility during migration
  email?: string; // Will migrate to emails array
  phone?: string; // Will migrate to phones array
}

export interface Household {
  id: string;
  familyName: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  createdAt?: Date | string; // Firestore Timestamp
  updatedAt?: Date | string; // Firestore Timestamp
}

export interface MemberEvent {
  id: string;
  member_id: string;
  event_type: 'baptism' | 'marriage' | 'death' | 'membership' | 'other';
  event_date: string;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalMembers?: number;
  activeMembers?: number;
  totalHouseholds?: number;
  upcomingEvents?: number;
  monthlyDonations?: number;
  totalDonations?: number;
  myDonationsThisYear?: number;
  myUpcomingCommitments?: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity?: Record<string, unknown>[];
  upcomingEvents?: Event[];
  quickActions?: Record<string, unknown>[];
  personalInfo?: Record<string, unknown>;
}

// Form-specific types
export interface MemberFormData
  extends Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'fullName'> {
  // Form uses same structure as Member but excludes auto-generated fields
}

// Membership status change tracking
export interface MembershipStatusChange {
  id: string;
  memberId: string;
  previousStatus: string;
  newStatus: string;
  reason?: string;
  changedBy: string;
  changedByName: string;
  changedAt: Date;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    source: 'profile' | 'admin_panel' | 'bulk_import';
  };
}

// Export comprehensive event types
export * from './events';
