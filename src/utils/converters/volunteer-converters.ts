// src/utils/converters/volunteer-converters.ts
// Type-safe converters for transforming between volunteer management TypeScript types and Firestore document schemas
// This file exists to handle volunteer role and scheduling data persistence with Timestamp conversions
// RELEVANT FILES: src/types/firestore.ts, src/services/firebase/volunteer.service.ts, src/utils/converters/converter-utils.ts, src/components/volunteers/*

import {
  VolunteerRole,
  VolunteerRoleDocument,
  VolunteerSlot,
  VolunteerSlotDocument,
} from '../../types/firestore';
import {
  timestampToString,
  stringToTimestamp,
  getCurrentTimestamp,
} from './converter-utils';

// ============================================================================
// VOLUNTEER ROLE CONVERTERS
// ============================================================================

export const volunteerRoleDocumentToVolunteerRole = (
  id: string,
  doc: VolunteerRoleDocument
): VolunteerRole => {
  return {
    id,
    name: doc.name,
    description: doc.description,
    isActive: doc.isActive,
    totalSlots: doc.totalSlots,
    filledSlots: doc.filledSlots,
    createdAt: timestampToString(doc.createdAt)!,
    updatedAt: timestampToString(doc.updatedAt)!,
  };
};

export const volunteerRoleToVolunteerRoleDocument = (
  role: Partial<VolunteerRole>
): Partial<VolunteerRoleDocument> => {
  const now = getCurrentTimestamp();

  return {
    name: role.name,
    description: role.description,
    isActive: role.isActive !== undefined ? role.isActive : true,
    totalSlots: role.totalSlots || 0,
    filledSlots: role.filledSlots || 0,
    createdAt: role.createdAt ? stringToTimestamp(role.createdAt) : now,
    updatedAt: now,
  };
};

// ============================================================================
// VOLUNTEER SLOT CONVERTERS
// ============================================================================

export const volunteerSlotDocumentToVolunteerSlot = (
  id: string,
  doc: VolunteerSlotDocument
): VolunteerSlot => {
  return {
    id,
    eventId: doc.eventId,
    eventTitle: doc.eventTitle,
    eventStartTime: timestampToString(doc.eventStartTime)!,
    roleId: doc.roleId,
    roleName: doc.roleName,
    assignedTo: doc.assignedTo,
    assignedToName: doc.assignedToName,
    status: doc.status,
    note: doc.note,
    createdAt: timestampToString(doc.createdAt)!,
    updatedAt: timestampToString(doc.updatedAt)!,
  };
};

export const volunteerSlotToVolunteerSlotDocument = (
  slot: Partial<VolunteerSlot>
): Partial<VolunteerSlotDocument> => {
  const now = getCurrentTimestamp();

  return {
    eventId: slot.eventId,
    eventTitle: slot.eventTitle,
    eventStartTime: stringToTimestamp(slot.eventStartTime),
    roleId: slot.roleId,
    roleName: slot.roleName,
    assignedTo: slot.assignedTo,
    assignedToName: slot.assignedToName,
    status: slot.status || 'Open',
    note: slot.note,
    createdAt: slot.createdAt ? stringToTimestamp(slot.createdAt) : now,
    updatedAt: now,
  };
};
