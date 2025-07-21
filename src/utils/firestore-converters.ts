import { Timestamp } from 'firebase/firestore';
import {
  Member,
  MemberDocument,
  Household,
  HouseholdDocument,
  Event,
  EventDocument,
  Donation,
  DonationDocument,
  DonationCategory,
  DonationCategoryDocument,
  Sermon,
  SermonDocument,
  VolunteerRole,
  VolunteerRoleDocument,
  VolunteerSlot,
  VolunteerSlotDocument,
  MemberEvent,
  MemberEventDocument,
  EventRSVP,
  EventRSVPDocument,
  EventAttendance,
  EventAttendanceDocument,
} from '../types/firestore';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts a Firestore Timestamp to ISO string
 */
export const timestampToString = (timestamp: Timestamp | null | undefined): string | undefined => {
  if (!timestamp) return undefined;
  return timestamp.toDate().toISOString();
};

/**
 * Converts an ISO string to Firestore Timestamp
 */
export const stringToTimestamp = (dateString: string | null | undefined): Timestamp | undefined => {
  if (!dateString) return undefined;
  return Timestamp.fromDate(new Date(dateString));
};

/**
 * Converts a Date object to Firestore Timestamp
 */
export const dateToTimestamp = (date: Date | null | undefined): Timestamp | undefined => {
  if (!date) return undefined;
  return Timestamp.fromDate(date);
};

/**
 * Gets current timestamp
 */
export const getCurrentTimestamp = (): Timestamp => {
  return Timestamp.now();
};

/**
 * Removes undefined values from an object (Firestore doesn't accept undefined)
 */
export const removeUndefined = <T extends Record<string, any>>(obj: T): T => {
  const result = {} as T;
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  });
  return result;
};

/**
 * Generates a computed full name
 */
export const generateFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

// ============================================================================
// MEMBER CONVERTERS
// ============================================================================

export const memberDocumentToMember = (id: string, doc: MemberDocument): Member => {
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
  };
};

export const memberToMemberDocument = (member: Partial<Member>): Partial<MemberDocument> => {
  const now = getCurrentTimestamp();
  
  return removeUndefined({
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    birthdate: stringToTimestamp(member.birthdate),
    gender: member.gender,
    role: member.role,
    memberStatus: member.memberStatus,
    joinedAt: stringToTimestamp(member.joinedAt),
    householdId: member.householdId,
    isPrimaryContact: member.isPrimaryContact || false,
    createdAt: member.createdAt ? stringToTimestamp(member.createdAt) : now,
    updatedAt: now,
    householdName: member.householdName,
    fullName: member.firstName && member.lastName ? 
      generateFullName(member.firstName, member.lastName) : '',
  });
};

// ============================================================================
// HOUSEHOLD CONVERTERS
// ============================================================================

export const householdDocumentToHousehold = (id: string, doc: HouseholdDocument): Household => {
  return {
    id,
    familyName: doc.familyName,
    address: doc.address,
    primaryContactId: doc.primaryContactId,
    primaryContactName: doc.primaryContactName,
    memberIds: doc.memberIds,
    memberCount: doc.memberCount,
    createdAt: timestampToString(doc.createdAt)!,
    updatedAt: timestampToString(doc.updatedAt)!,
  };
};

export const householdToHouseholdDocument = (household: Partial<Household>): Partial<HouseholdDocument> => {
  const now = getCurrentTimestamp();
  
  return removeUndefined({
    familyName: household.familyName,
    address: household.address || {},
    primaryContactId: household.primaryContactId,
    primaryContactName: household.primaryContactName,
    memberIds: household.memberIds || [],
    memberCount: household.memberCount || 0,
    createdAt: household.createdAt ? stringToTimestamp(household.createdAt) : now,
    updatedAt: now,
  });
};

// ============================================================================
// EVENT CONVERTERS
// ============================================================================

export const eventDocumentToEvent = (id: string, doc: EventDocument): Event => {
  return {
    id,
    title: doc.title,
    description: doc.description,
    location: doc.location,
    startTime: timestampToString(doc.startTime)!,
    endTime: timestampToString(doc.endTime),
    isPublic: doc.isPublic,
    createdBy: doc.createdBy,
    createdByName: doc.createdByName,
    rsvpStats: doc.rsvpStats,
    createdAt: timestampToString(doc.createdAt)!,
    updatedAt: timestampToString(doc.updatedAt)!,
  };
};

export const eventToEventDocument = (event: Partial<Event>): Partial<EventDocument> => {
  const now = getCurrentTimestamp();
  
  return removeUndefined({
    title: event.title,
    description: event.description,
    location: event.location,
    startTime: stringToTimestamp(event.startTime),
    endTime: stringToTimestamp(event.endTime),
    isPublic: event.isPublic || false,
    createdBy: event.createdBy,
    createdByName: event.createdByName,
    rsvpStats: event.rsvpStats || { yes: 0, no: 0, maybe: 0, total: 0 },
    createdAt: event.createdAt ? stringToTimestamp(event.createdAt) : now,
    updatedAt: now,
  });
};

// ============================================================================
// EVENT RSVP CONVERTERS
// ============================================================================

export const eventRSVPDocumentToEventRSVP = (id: string, doc: EventRSVPDocument): EventRSVP => {
  return {
    id,
    memberId: doc.memberId,
    memberName: doc.memberName,
    response: doc.response,
    respondedAt: timestampToString(doc.respondedAt)!,
    note: doc.note,
  };
};

export const eventRSVPToEventRSVPDocument = (rsvp: Partial<EventRSVP>): Partial<EventRSVPDocument> => {
  return {
    memberId: rsvp.memberId,
    memberName: rsvp.memberName,
    response: rsvp.response,
    respondedAt: rsvp.respondedAt ? stringToTimestamp(rsvp.respondedAt) : getCurrentTimestamp(),
    note: rsvp.note,
  };
};

// ============================================================================
// EVENT ATTENDANCE CONVERTERS
// ============================================================================

export const eventAttendanceDocumentToEventAttendance = (id: string, doc: EventAttendanceDocument): EventAttendance => {
  return {
    id,
    memberId: doc.memberId,
    memberName: doc.memberName,
    attended: doc.attended,
    checkedInAt: timestampToString(doc.checkedInAt),
    checkedInBy: doc.checkedInBy,
  };
};

export const eventAttendanceToEventAttendanceDocument = (attendance: Partial<EventAttendance>): Partial<EventAttendanceDocument> => {
  return {
    memberId: attendance.memberId,
    memberName: attendance.memberName,
    attended: attendance.attended || false,
    checkedInAt: attendance.checkedInAt ? stringToTimestamp(attendance.checkedInAt) : undefined,
    checkedInBy: attendance.checkedInBy,
  };
};

// ============================================================================
// DONATION CONVERTERS
// ============================================================================

export const donationDocumentToDonation = (id: string, doc: DonationDocument): Donation => {
  return {
    id,
    memberId: doc.memberId,
    memberName: doc.memberName,
    amount: doc.amount,
    donationDate: timestampToString(doc.donationDate)!,
    method: doc.method,
    sourceLabel: doc.sourceLabel,
    note: doc.note,
    categoryId: doc.categoryId,
    categoryName: doc.categoryName,
    createdAt: timestampToString(doc.createdAt)!,
    createdBy: doc.createdBy,
  };
};

export const donationToDonationDocument = (donation: Partial<Donation>): Partial<DonationDocument> => {
  return {
    memberId: donation.memberId,
    memberName: donation.memberName,
    amount: donation.amount,
    donationDate: stringToTimestamp(donation.donationDate),
    method: donation.method,
    sourceLabel: donation.sourceLabel,
    note: donation.note,
    categoryId: donation.categoryId,
    categoryName: donation.categoryName,
    createdAt: donation.createdAt ? stringToTimestamp(donation.createdAt) : getCurrentTimestamp(),
    createdBy: donation.createdBy,
  };
};

// ============================================================================
// DONATION CATEGORY CONVERTERS
// ============================================================================

export const donationCategoryDocumentToDonationCategory = (id: string, doc: DonationCategoryDocument): DonationCategory => {
  return {
    id,
    name: doc.name,
    description: doc.description,
    isActive: doc.isActive,
    totalAmount: doc.totalAmount,
    donationCount: doc.donationCount,
    lastDonationDate: timestampToString(doc.lastDonationDate),
    createdAt: timestampToString(doc.createdAt)!,
    updatedAt: timestampToString(doc.updatedAt)!,
  };
};

export const donationCategoryToDonationCategoryDocument = (category: Partial<DonationCategory>): Partial<DonationCategoryDocument> => {
  const now = getCurrentTimestamp();
  
  return {
    name: category.name,
    description: category.description,
    isActive: category.isActive !== undefined ? category.isActive : true,
    totalAmount: category.totalAmount || 0,
    donationCount: category.donationCount || 0,
    lastDonationDate: stringToTimestamp(category.lastDonationDate),
    createdAt: category.createdAt ? stringToTimestamp(category.createdAt) : now,
    updatedAt: now,
  };
};

// ============================================================================
// SERMON CONVERTERS
// ============================================================================

export const sermonDocumentToSermon = (id: string, doc: SermonDocument): Sermon => {
  return {
    id,
    title: doc.title,
    speakerName: doc.speakerName,
    datePreached: timestampToString(doc.datePreached)!,
    notes: doc.notes,
    scriptureReferences: doc.scriptureReferences,
    mediaFiles: doc.mediaFiles,
    createdBy: doc.createdBy,
    createdByName: doc.createdByName,
    createdAt: timestampToString(doc.createdAt)!,
    updatedAt: timestampToString(doc.updatedAt)!,
    searchTerms: doc.searchTerms,
  };
};

export const sermonToSermonDocument = (sermon: Partial<Sermon>): Partial<SermonDocument> => {
  const now = getCurrentTimestamp();
  
  return {
    title: sermon.title,
    speakerName: sermon.speakerName,
    datePreached: stringToTimestamp(sermon.datePreached),
    notes: sermon.notes,
    scriptureReferences: sermon.scriptureReferences,
    mediaFiles: sermon.mediaFiles || {},
    createdBy: sermon.createdBy,
    createdByName: sermon.createdByName,
    createdAt: sermon.createdAt ? stringToTimestamp(sermon.createdAt) : now,
    updatedAt: now,
    searchTerms: sermon.searchTerms || [],
  };
};

// ============================================================================
// VOLUNTEER ROLE CONVERTERS
// ============================================================================

export const volunteerRoleDocumentToVolunteerRole = (id: string, doc: VolunteerRoleDocument): VolunteerRole => {
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

export const volunteerRoleToVolunteerRoleDocument = (role: Partial<VolunteerRole>): Partial<VolunteerRoleDocument> => {
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

export const volunteerSlotDocumentToVolunteerSlot = (id: string, doc: VolunteerSlotDocument): VolunteerSlot => {
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

export const volunteerSlotToVolunteerSlotDocument = (slot: Partial<VolunteerSlot>): Partial<VolunteerSlotDocument> => {
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

// ============================================================================
// MEMBER EVENT CONVERTERS
// ============================================================================

export const memberEventDocumentToMemberEvent = (id: string, doc: MemberEventDocument): MemberEvent => {
  return {
    id,
    memberId: doc.memberId,
    memberName: doc.memberName,
    eventType: doc.eventType,
    eventDate: timestampToString(doc.eventDate)!,
    description: doc.description,
    notes: doc.notes,
    createdAt: timestampToString(doc.createdAt)!,
    updatedAt: timestampToString(doc.updatedAt)!,
  };
};

export const memberEventToMemberEventDocument = (memberEvent: Partial<MemberEvent>): Partial<MemberEventDocument> => {
  const now = getCurrentTimestamp();
  
  return {
    memberId: memberEvent.memberId,
    memberName: memberEvent.memberName,
    eventType: memberEvent.eventType,
    eventDate: stringToTimestamp(memberEvent.eventDate),
    description: memberEvent.description,
    notes: memberEvent.notes,
    createdAt: memberEvent.createdAt ? stringToTimestamp(memberEvent.createdAt) : now,
    updatedAt: now,
  };
};