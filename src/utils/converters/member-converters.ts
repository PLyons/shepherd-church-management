// src/utils/converters/member-converters.ts
// Type-safe converters for Member domain models to/from Firestore document format with timestamp handling
// Provides bidirectional transformation between Member TypeScript interface and MemberDocument Firestore schema
// RELEVANT FILES: src/types/firestore.ts, src/utils/converters/converter-utils.ts, src/services/firebase/members/members-service.ts, src/types/index.ts

import { MemberDocument } from '../../types/firestore';
import type { Member } from '../../types';
import {
  timestampToString,
  timestampToDateString,
  stringToTimestamp,
  getCurrentTimestamp,
  removeUndefined,
  generateFullName,
} from './converter-utils';

function toFirestoreTimestamp(
  value: Date | string | { toDate?: () => Date } | undefined
): ReturnType<typeof stringToTimestamp> | undefined {
  if (!value) return undefined;
  if (typeof value === 'object' && 'toDate' in value && value.toDate) {
    return stringToTimestamp(value.toDate().toISOString());
  }
  if (value instanceof Date) {
    return stringToTimestamp(value.toISOString());
  }
  if (typeof value === 'string') {
    return stringToTimestamp(value);
  }
  return undefined;
}

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
    gender: doc.gender === '' ? undefined : doc.gender,
    role: doc.role || 'member',
    memberStatus: doc.memberStatus || 'not_set',
    joinedAt: timestampToString(doc.joinedAt),
    householdId: doc.householdId,
    isPrimaryContact: doc.isPrimaryContact,
    createdAt: timestampToString(doc.createdAt)!,
    updatedAt: timestampToString(doc.updatedAt)!,
    fullName: doc.fullName,
    emails: doc.emails,
    phones: doc.phones?.map((phone) => ({
      type: phone.type,
      number: phone.number,
      primary: phone.primary,
      smsOptIn:
        phone.sms_opt_in !== undefined ? phone.sms_opt_in : phone.smsOptIn,
    })),
    addresses: doc.addresses?.map((addr) => ({
      type: addr.type,
      addressLine1: addr.address_line1 || addr.addressLine1 || '',
      addressLine2: addr.address_line2 || addr.addressLine2,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postal_code || addr.postalCode || '',
      country: addr.country,
      primary: addr.primary,
    })),
    prefix: doc.prefix,
    middleName: doc.middle_name || doc.middleName,
    suffix: doc.suffix,
    birthDate: timestampToDateString(doc.birth_date || doc.birthdate),
    anniversaryDate: timestampToDateString(
      doc.anniversary_date || doc.anniversaryDate
    ),
    maritalStatus: doc.marital_status || doc.maritalStatus,
  };
};

export const memberToMemberDocument = (
  member: Partial<Member>
): Partial<MemberDocument> => {
  const now = getCurrentTimestamp();

  // Derive legacy email/phone from primary (or first) array entries
  const primaryEmail =
    member.email ||
    member.emails?.find((e) => e.primary)?.address ||
    member.emails?.[0]?.address;
  const primaryPhone =
    member.phone ||
    member.phones?.find((p) => p.primary)?.number ||
    member.phones?.[0]?.number;

  return removeUndefined({
    firstName: member.firstName,
    lastName: member.lastName,
    email: primaryEmail,
    phone: primaryPhone,
    emails: member.emails,
    phones: member.phones?.map((phone) =>
      removeUndefined({
        type: phone.type,
        number: phone.number,
        primary: phone.primary,
        smsOptIn: phone.smsOptIn,
      })
    ),
    addresses: member.addresses?.map((addr) =>
      removeUndefined({
        type: addr.type,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
        primary: addr.primary,
      })
    ),
    prefix: member.prefix,
    middleName: member.middleName,
    suffix: member.suffix,
    birthdate: stringToTimestamp(member.birthdate),
    birth_date: toFirestoreTimestamp(member.birthDate),
    anniversaryDate: toFirestoreTimestamp(member.anniversaryDate),
    maritalStatus: member.maritalStatus,
    gender: member.gender,
    role: member.role || 'member',
    memberStatus: member.memberStatus || 'active',
    joinedAt: stringToTimestamp(member.joinedAt),
    householdId: member.householdId,
    isPrimaryContact: member.isPrimaryContact || false,
    createdAt: member.createdAt
      ? toFirestoreTimestamp(member.createdAt) || now
      : now,
    updatedAt: now,
    fullName:
      member.firstName && member.lastName
        ? generateFullName(member.firstName, member.lastName)
        : member.fullName || '',
  });
};
