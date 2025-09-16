// src/utils/converters/member-converters.ts
// Type-safe converters for Member domain models to/from Firestore document format with timestamp handling
// Provides bidirectional transformation between Member TypeScript interface and MemberDocument Firestore schema
// RELEVANT FILES: src/types/firestore.ts, src/utils/converters/converter-utils.ts, src/services/firebase/members/members-service.ts, src/types/index.ts

import { Member, MemberDocument } from '../../types/firestore';
import {
  timestampToString,
  timestampToDateString,
  stringToTimestamp,
  getCurrentTimestamp,
  removeUndefined,
  generateFullName,
} from './converter-utils';

export const memberDocumentToMember = (
  id: string,
  doc: MemberDocument
): Member => {
  return {
    id,
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    phone: doc.phone,
    birthdate: timestampToString(doc.birthdate),
    gender: doc.gender,
    role: doc.role,
    memberStatus: doc.memberStatus,
    joinedAt: timestampToString(doc.joinedAt),
    householdId: doc.householdId,
    isPrimaryContact: doc.isPrimaryContact,
    createdAt: timestampToString(doc.createdAt)!,
    updatedAt: timestampToString(doc.updatedAt)!,
    householdName: doc.householdName,
    fullName: doc.fullName,
    // Enhanced Phase 0.1 fields - convert from snake_case to camelCase
    emails: doc.emails,
    phones: doc.phones?.map((phone) => ({
      ...phone,
      smsOptIn:
        phone.sms_opt_in !== undefined ? phone.sms_opt_in : phone.smsOptIn,
    })),
    addresses: doc.addresses?.map((addr) => ({
      type: addr.type,
      addressLine1: addr.address_line1 || addr.addressLine1,
      addressLine2: addr.address_line2 || addr.addressLine2,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postal_code || addr.postalCode,
      country: addr.country,
      primary: addr.primary,
    })),
    prefix: doc.prefix,
    middleName: doc.middle_name || doc.middleName,
    suffix: doc.suffix,
    birthDate: timestampToDateString(doc.birth_date || doc.birthdate),
    anniversaryDate: timestampToDateString(doc.anniversary_date),
    maritalStatus: doc.marital_status || doc.maritalStatus,
  };
};

export const memberToMemberDocument = (
  member: Partial<Member>
): Partial<MemberDocument> => {
  const now = getCurrentTimestamp();

  return removeUndefined({
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    birthdate: stringToTimestamp(member.birthdate),
    gender: member.gender,
    role: member.role || 'member', // Default to 'member' if not provided
    memberStatus: member.memberStatus || 'active', // Default to 'active' if not provided
    joinedAt: stringToTimestamp(member.joinedAt),
    householdId: member.householdId,
    isPrimaryContact: member.isPrimaryContact || false,
    createdAt: member.createdAt ? stringToTimestamp(member.createdAt) : now,
    updatedAt: now,
    householdName: member.householdName,
    fullName:
      member.firstName && member.lastName
        ? generateFullName(member.firstName, member.lastName)
        : '',
  });
};
