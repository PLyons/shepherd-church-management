import {
  Event,
  EventDocument,
  EventRSVP,
  EventRSVPDocument,
  EventAttendance,
  EventAttendanceDocument,
  MemberEvent,
  MemberEventDocument,
} from '../../types/firestore';
import {
  timestampToString,
  stringToTimestamp,
  getCurrentTimestamp,
} from './converter-utils';

// ============================================================================
// EVENT CONVERTERS
// ============================================================================

export const eventDocumentToEvent = (id: string, doc: EventDocument): Event => {
  return {
    id,
    title: doc.title,
    description: doc.description,
    startTime: timestampToString(doc.startTime)!,
    endTime: timestampToString(doc.endTime)!,
    location: doc.location,
    eventType: doc.eventType,
    capacity: doc.capacity,
    registeredCount: doc.registeredCount,
    attendanceCount: doc.attendanceCount,
    isRecurring: doc.isRecurring,
    recurrencePattern: doc.recurrencePattern,
    organizerId: doc.organizerId,
    organizerName: doc.organizerName,
    isActive: doc.isActive,
    registrationDeadline: timestampToString(doc.registrationDeadline),
    notes: doc.notes,
    createdAt: timestampToString(doc.createdAt)!,
    updatedAt: timestampToString(doc.updatedAt)!,
  };
};

export const eventToEventDocument = (
  event: Partial<Event>
): Partial<EventDocument> => {
  const now = getCurrentTimestamp();

  return {
    title: event.title,
    description: event.description,
    startTime: stringToTimestamp(event.startTime),
    endTime: stringToTimestamp(event.endTime),
    location: event.location,
    eventType: event.eventType,
    capacity: event.capacity,
    registeredCount: event.registeredCount || 0,
    attendanceCount: event.attendanceCount || 0,
    isRecurring: event.isRecurring || false,
    recurrencePattern: event.recurrencePattern,
    organizerId: event.organizerId,
    organizerName: event.organizerName,
    isActive: event.isActive !== undefined ? event.isActive : true,
    registrationDeadline: stringToTimestamp(event.registrationDeadline),
    notes: event.notes,
    createdAt: event.createdAt ? stringToTimestamp(event.createdAt) : now,
    updatedAt: now,
  };
};

// ============================================================================
// EVENT RSVP CONVERTERS
// ============================================================================

export const eventRSVPDocumentToEventRSVP = (
  id: string,
  doc: EventRSVPDocument
): EventRSVP => {
  return {
    id,
    eventId: doc.eventId,
    eventTitle: doc.eventTitle,
    memberId: doc.memberId,
    memberName: doc.memberName,
    response: doc.response,
    note: doc.note,
    partySize: doc.partySize,
    registeredAt: timestampToString(doc.registeredAt)!,
  };
};

export const eventRSVPToEventRSVPDocument = (
  rsvp: Partial<EventRSVP>
): Partial<EventRSVPDocument> => {
  return {
    eventId: rsvp.eventId,
    eventTitle: rsvp.eventTitle,
    memberId: rsvp.memberId,
    memberName: rsvp.memberName,
    response: rsvp.response || 'No Response',
    note: rsvp.note,
    partySize: rsvp.partySize || 1,
    registeredAt: rsvp.registeredAt
      ? stringToTimestamp(rsvp.registeredAt)
      : getCurrentTimestamp(),
  };
};

// ============================================================================
// EVENT ATTENDANCE CONVERTERS
// ============================================================================

export const eventAttendanceDocumentToEventAttendance = (
  id: string,
  doc: EventAttendanceDocument
): EventAttendance => {
  return {
    id,
    memberId: doc.memberId,
    memberName: doc.memberName,
    attended: doc.attended,
    checkedInAt: timestampToString(doc.checkedInAt),
    checkedInBy: doc.checkedInBy,
  };
};

export const eventAttendanceToEventAttendanceDocument = (
  attendance: Partial<EventAttendance>
): Partial<EventAttendanceDocument> => {
  return {
    memberId: attendance.memberId,
    memberName: attendance.memberName,
    attended: attendance.attended || false,
    checkedInAt: attendance.checkedInAt
      ? stringToTimestamp(attendance.checkedInAt)
      : undefined,
    checkedInBy: attendance.checkedInBy,
  };
};

// ============================================================================
// MEMBER EVENT CONVERTERS
// ============================================================================

export const memberEventDocumentToMemberEvent = (
  id: string,
  doc: MemberEventDocument
): MemberEvent => {
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

export const memberEventToMemberEventDocument = (
  memberEvent: Partial<MemberEvent>
): Partial<MemberEventDocument> => {
  const now = getCurrentTimestamp();

  return {
    memberId: memberEvent.memberId,
    memberName: memberEvent.memberName,
    eventType: memberEvent.eventType,
    eventDate: stringToTimestamp(memberEvent.eventDate),
    description: memberEvent.description,
    notes: memberEvent.notes,
    createdAt: memberEvent.createdAt
      ? stringToTimestamp(memberEvent.createdAt)
      : now,
    updatedAt: now,
  };
};