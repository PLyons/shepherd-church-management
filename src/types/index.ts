// ============================================================================
// LEGACY SUPABASE TYPES (for backward compatibility)
// ============================================================================

export interface SupabaseMember {
  id: string;
  household_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  birthdate?: string;
  gender?: 'Male' | 'Female';
  role: 'admin' | 'pastor' | 'member';
  member_status: 'active' | 'inactive' | 'visitor';
  joined_at: string;
  created_at: string;
  updated_at: string;
  household?: SupabaseHousehold;
}

export interface SupabaseHousehold {
  id: string;
  family_name: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  primary_contact_id?: string;
  created_at: string;
  updated_at: string;
  members?: SupabaseMember[];
}

// ============================================================================
// UNIFIED TYPES (work with both Supabase and Firebase)
// ============================================================================

export interface Member {
  id: string;
  
  // Personal Information (unified naming)
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthdate?: string;
  gender?: 'Male' | 'Female';
  
  // Church Information
  role: 'admin' | 'pastor' | 'member';
  memberStatus: 'active' | 'inactive' | 'visitor';
  joinedAt?: string;
  
  // Household Relationship
  householdId: string;
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
  
  // Legacy address fields for backward compatibility
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  
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