import {
  RegistrationTokenDocument,
  PendingRegistrationDocument,
} from '../../types/firestore';
import { RegistrationToken, PendingRegistration } from '../../types/registration';
import {
  timestampToString,
  stringToTimestamp,
  getCurrentTimestamp,
  removeUndefined,
} from './converter-utils';

// ============================================================================
// REGISTRATION TOKEN CONVERTERS
// ============================================================================

export const registrationTokenDocumentToRegistrationToken = (
  id: string,
  doc: RegistrationTokenDocument
): RegistrationToken => {
  return {
    id,
    token: doc.token,
    createdBy: doc.createdBy,
    createdAt: timestampToString(doc.createdAt)!,
    expiresAt: timestampToString(doc.expiresAt),
    maxUses: doc.maxUses,
    currentUses: doc.currentUses,
    isActive: doc.isActive,
    metadata: {
      purpose: doc.metadata.purpose,
      notes: doc.metadata.notes,
      eventDate: timestampToString(doc.metadata.eventDate),
      location: doc.metadata.location,
    },
  };
};

export const registrationTokenToRegistrationTokenDocument = (
  token: Partial<RegistrationToken>
): Partial<RegistrationTokenDocument> => {
  const now = getCurrentTimestamp();

  return removeUndefined({
    token: token.token,
    createdBy: token.createdBy,
    createdAt: token.createdAt ? stringToTimestamp(token.createdAt) : now,
    expiresAt: stringToTimestamp(token.expiresAt),
    maxUses: token.maxUses !== undefined ? token.maxUses : -1,
    currentUses: token.currentUses !== undefined ? token.currentUses : 0,
    isActive: token.isActive !== undefined ? token.isActive : true,
    metadata: token.metadata
      ? {
          purpose: token.metadata.purpose,
          notes: token.metadata.notes,
          eventDate: stringToTimestamp(token.metadata.eventDate),
          location: token.metadata.location,
        }
      : undefined,
  });
};

// ============================================================================
// PENDING REGISTRATION CONVERTERS
// ============================================================================

export const pendingRegistrationDocumentToPendingRegistration = (
  id: string,
  doc: PendingRegistrationDocument
): PendingRegistration => {
  return {
    id,
    tokenId: doc.tokenId,
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    phone: doc.phone,
    birthdate: timestampToString(doc.birthdate),
    gender: doc.gender,
    address: doc.address,
    memberStatus: doc.memberStatus,
    submittedAt: timestampToString(doc.submittedAt)!,
    ipAddress: doc.ipAddress,
    userAgent: doc.userAgent,
    approvalStatus: doc.approvalStatus,
    approvedBy: doc.approvedBy,
    approvedAt: timestampToString(doc.approvedAt),
    rejectionReason: doc.rejectionReason,
    memberId: doc.memberId,
  };
};

export const pendingRegistrationToPendingRegistrationDocument = (
  registration: Partial<PendingRegistration>
): Partial<PendingRegistrationDocument> => {
  const now = getCurrentTimestamp();

  return removeUndefined({
    tokenId: registration.tokenId,
    firstName: registration.firstName,
    lastName: registration.lastName,
    email: registration.email,
    phone: registration.phone,
    birthdate: stringToTimestamp(registration.birthdate),
    gender: registration.gender,
    address: registration.address,
    memberStatus: registration.memberStatus,
    submittedAt: registration.submittedAt
      ? stringToTimestamp(registration.submittedAt)
      : now,
    ipAddress: registration.ipAddress,
    userAgent: registration.userAgent,
    approvalStatus: registration.approvalStatus || 'pending',
    approvedBy: registration.approvedBy,
    approvedAt: stringToTimestamp(registration.approvedAt),
    rejectionReason: registration.rejectionReason,
    memberId: registration.memberId,
  });
};