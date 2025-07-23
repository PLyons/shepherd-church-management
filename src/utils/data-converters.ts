import { Member, Household, SupabaseMember, SupabaseHousehold } from '../types';

// ============================================================================
// SUPABASE TO UNIFIED FORMAT CONVERTERS
// ============================================================================

/**
 * Converts Supabase member format to unified Member format
 */
export const supabaseMemberToMember = (
  supabaseMember: SupabaseMember
): Member => {
  return {
    id: supabaseMember.id,
    firstName: supabaseMember.first_name,
    lastName: supabaseMember.last_name,
    email: supabaseMember.email,
    phone: supabaseMember.phone,
    birthdate: supabaseMember.birthdate,
    gender: supabaseMember.gender,
    role: supabaseMember.role,
    memberStatus: supabaseMember.member_status,
    joinedAt: supabaseMember.joined_at,
    householdId: supabaseMember.household_id,
    isPrimaryContact: false, // This will need to be determined from household data
    createdAt: supabaseMember.created_at,
    updatedAt: supabaseMember.updated_at,
    fullName: `${supabaseMember.first_name} ${supabaseMember.last_name}`.trim(),
    household: supabaseMember.household
      ? supabaseHouseholdToHousehold(supabaseMember.household)
      : undefined,
  };
};

/**
 * Converts unified Member format to Supabase member format
 */
export const memberToSupabaseMember = (member: Member): SupabaseMember => {
  return {
    id: member.id,
    household_id: member.householdId,
    first_name: member.firstName,
    last_name: member.lastName,
    email: member.email,
    phone: member.phone,
    birthdate: member.birthdate,
    gender: member.gender,
    role: member.role,
    member_status: member.memberStatus,
    joined_at: member.joinedAt || member.createdAt,
    created_at: member.createdAt,
    updated_at: member.updatedAt,
    household: member.household
      ? householdToSupabaseHousehold(member.household)
      : undefined,
  };
};

/**
 * Converts Supabase household format to unified Household format
 */
export const supabaseHouseholdToHousehold = (
  supabaseHousehold: SupabaseHousehold
): Household => {
  return {
    id: supabaseHousehold.id,
    familyName: supabaseHousehold.family_name,
    address: {
      line1: supabaseHousehold.address_line1,
      line2: supabaseHousehold.address_line2,
      city: supabaseHousehold.city,
      state: supabaseHousehold.state,
      postalCode: supabaseHousehold.postal_code,
      country: supabaseHousehold.country,
    },
    // Legacy fields for backward compatibility
    addressLine1: supabaseHousehold.address_line1,
    addressLine2: supabaseHousehold.address_line2,
    city: supabaseHousehold.city,
    state: supabaseHousehold.state,
    postalCode: supabaseHousehold.postal_code,
    country: supabaseHousehold.country,
    primaryContactId: supabaseHousehold.primary_contact_id,
    createdAt: supabaseHousehold.created_at,
    updatedAt: supabaseHousehold.updated_at,
    members: supabaseHousehold.members?.map(supabaseMemberToMember),
  };
};

/**
 * Converts unified Household format to Supabase household format
 */
export const householdToSupabaseHousehold = (
  household: Household
): SupabaseHousehold => {
  return {
    id: household.id,
    family_name: household.familyName,
    address_line1: household.address?.line1 || household.addressLine1,
    address_line2: household.address?.line2 || household.addressLine2,
    city: household.address?.city || household.city,
    state: household.address?.state || household.state,
    postal_code: household.address?.postalCode || household.postalCode,
    country: household.address?.country || household.country,
    primary_contact_id: household.primaryContactId,
    created_at: household.createdAt,
    updated_at: household.updatedAt,
    members: household.members?.map(memberToSupabaseMember),
  };
};

// ============================================================================
// FIREBASE TO UNIFIED FORMAT CONVERTERS
// ============================================================================
// These are handled by the firestore-converters.ts file
// Re-export them here for consistency

export {
  memberDocumentToMember as firebaseMemberToMember,
  memberToMemberDocument as memberToFirebaseMember,
  householdDocumentToHousehold as firebaseHouseholdToHousehold,
  householdToHouseholdDocument as householdToFirebaseHousehold,
} from './firestore-converters';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determines if a data object is in Supabase format
 */
export const isSupabaseFormat = (data: any): boolean => {
  return (
    data &&
    (data.hasOwnProperty('first_name') ||
      data.hasOwnProperty('family_name') ||
      data.hasOwnProperty('household_id') ||
      data.hasOwnProperty('member_status'))
  );
};

/**
 * Determines if a data object is in Firebase format
 */
export const isFirebaseFormat = (data: any): boolean => {
  return (
    data &&
    (data.hasOwnProperty('firstName') ||
      data.hasOwnProperty('familyName') ||
      data.hasOwnProperty('householdId') ||
      data.hasOwnProperty('memberStatus'))
  );
};

/**
 * Auto-converts data to unified format regardless of source
 */
export const autoConvertMember = (data: any): Member => {
  if (isSupabaseFormat(data)) {
    return supabaseMemberToMember(data as SupabaseMember);
  } else if (isFirebaseFormat(data)) {
    // Already in unified format, but might need some cleanup
    return {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      birthdate: data.birthdate,
      gender: data.gender,
      role: data.role,
      memberStatus: data.memberStatus,
      joinedAt: data.joinedAt,
      householdId: data.householdId,
      isPrimaryContact: data.isPrimaryContact || false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      fullName: data.fullName || `${data.firstName} ${data.lastName}`.trim(),
      householdName: data.householdName,
      household: data.household,
    };
  } else {
    throw new Error('Unknown data format for member conversion');
  }
};

/**
 * Auto-converts household data to unified format regardless of source
 */
export const autoConvertHousehold = (data: any): Household => {
  if (isSupabaseFormat(data)) {
    return supabaseHouseholdToHousehold(data as SupabaseHousehold);
  } else if (isFirebaseFormat(data)) {
    // Already in unified format, but might need some cleanup
    return {
      id: data.id,
      familyName: data.familyName,
      address: data.address,
      addressLine1: data.addressLine1 || data.address?.line1,
      addressLine2: data.addressLine2 || data.address?.line2,
      city: data.city || data.address?.city,
      state: data.state || data.address?.state,
      postalCode: data.postalCode || data.address?.postalCode,
      country: data.country || data.address?.country,
      primaryContactId: data.primaryContactId,
      primaryContactName: data.primaryContactName,
      memberIds: data.memberIds,
      memberCount: data.memberCount,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      members: data.members,
    };
  } else {
    throw new Error('Unknown data format for household conversion');
  }
};

// ============================================================================
// BULK CONVERSION UTILITIES
// ============================================================================

/**
 * Converts an array of members from any format to unified format
 */
export const convertMemberArray = (members: any[]): Member[] => {
  return members.map(autoConvertMember);
};

/**
 * Converts an array of households from any format to unified format
 */
export const convertHouseholdArray = (households: any[]): Household[] => {
  return households.map(autoConvertHousehold);
};
