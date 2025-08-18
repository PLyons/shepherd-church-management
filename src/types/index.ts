// ============================================================================
// CORE TYPES - FIREBASE-BASED
// ============================================================================

export interface Member {
  id: string;

  // Personal Information (unified naming)
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthdate?: string;
  gender?: 'Male' | 'Female';

  // Church Information
  role?: 'admin' | 'pastor' | 'member';
  memberStatus?: 'active' | 'inactive' | 'visitor';
  joinedAt?: string;

  // Household Relationship
  householdId?: string;
  isPrimaryContact?: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;

  // Computed/Denormalized Data
  fullName?: string;
  householdName?: string;

  // Optional populated data
  household?: Household;
}

export interface Household {
  id: string;
  familyName: string;

  // Address Information (unified structure)
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  // Contact Information
  primaryContactId?: string;
  primaryContactName?: string;

  // Member Management
  memberIds?: string[];
  memberCount?: number;

  // Metadata
  createdAt: string;
  updatedAt: string;

  // Optional populated data
  members?: Member[];
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
