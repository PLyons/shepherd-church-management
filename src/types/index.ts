export interface Member {
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
  household?: Household;
}

export interface Household {
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