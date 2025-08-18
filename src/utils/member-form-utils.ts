/**
 * Shared utilities for member form handling
 * Extracted from MemberForm.tsx and MemberProfile.tsx to eliminate duplication
 */

// Phone number formatting utilities
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, '');

  // Apply formatting based on length
  if (phoneNumber.length <= 3) {
    return phoneNumber;
  } else if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  }
};

export const cleanPhoneNumber = (value: string): string => {
  // Remove all formatting and return just digits
  return value.replace(/\D/g, '');
};

export const normalizePhoneForStorage = (value: string): string => {
  const cleaned = cleanPhoneNumber(value);
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return cleaned; // Return as-is if not 10 digits
};

// Email validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Birthdate utilities
export interface BirthdateComponents {
  month: string;
  day: string;
  year: string;
}

export const parseBirthdate = (birthdate: string): BirthdateComponents => {
  if (!birthdate) {
    return { month: '', day: '', year: '' };
  }

  const parts = birthdate.split('-');
  if (parts.length === 3) {
    return {
      month: parts[1],
      day: parts[2],
      year: parts[0],
    };
  }

  return { month: '', day: '', year: '' };
};

export const formatBirthdate = (month: string, day: string, year: string): string => {
  if (month && day && year) {
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return '';
};

// Auto-tabbing logic for birthdate inputs
export const shouldAdvanceFromMonth = (value: string): boolean => {
  const monthNum = parseInt(value);
  return (
    (value.length === 1 && monthNum >= 2 && monthNum <= 9) ||
    (value.length === 2 && monthNum >= 10 && monthNum <= 12) ||
    (value.length === 2 && monthNum === 1)
  );
};

export const shouldAdvanceFromDay = (value: string): boolean => {
  const dayNum = parseInt(value);
  return (
    (value.length === 1 && dayNum >= 4 && dayNum <= 9) ||
    (value.length === 2 && dayNum >= 10 && dayNum <= 31) ||
    (value.length === 2 && dayNum >= 1 && dayNum <= 3)
  );
};

// Form data initialization utilities
export const initializeMemberFormData = (member?: Record<string, unknown>) => {
  if (!member) {
    return {
      householdId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthdate: '',
      gender: '' as 'Male' | 'Female' | '',
      role: 'member' as 'admin' | 'pastor' | 'member',
      memberStatus: 'active' as 'active' | 'inactive' | 'visitor',
    };
  }

  return {
    householdId: member.householdId || '',
    firstName: member.firstName || '',
    lastName: member.lastName || '',
    email: member.email || '',
    phone: member.phone ? formatPhoneNumber(String(member.phone)) : '',
    birthdate: member.birthdate || '',
    gender: member.gender || '',
    role: member.role || 'member',
    memberStatus: member.memberStatus || 'active',
  };
};

// Member data preparation for API calls
export const prepareMemberDataForSave = (formData: Record<string, unknown>) => {
  const memberData: Record<string, unknown> = {
    firstName: formData.firstName,
    lastName: formData.lastName,
  };

  // Only include optional fields if they have values
  if (formData.email) memberData.email = formData.email;
  if (formData.phone) memberData.phone = normalizePhoneForStorage(String(formData.phone));
  if (formData.birthdate) memberData.birthdate = formData.birthdate;
  if (formData.gender) memberData.gender = formData.gender;
  if (formData.householdId) memberData.householdId = formData.householdId;

  // Always include role and memberStatus with defaults
  memberData.role = formData.role || 'member';
  memberData.memberStatus = formData.memberStatus || 'active';

  return memberData;
};