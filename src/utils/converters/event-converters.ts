// src/utils/converters/event-converters.ts
// Active Event converters for the current Event / EventDocument shape (startDate/endDate)
// Single path for events.service — do not duplicate converters in the service file
// RELEVANT FILES: src/services/firebase/events.service.ts, src/types/events.ts, src/utils/firestore-converters.ts

import { Timestamp } from 'firebase/firestore';
import { Event, EventType, Role } from '../../types/events';

/** Firestore document shape for the events collection (matches live EventsService). */
export interface EventDocument {
  title: string;
  description: string;
  location: string;
  startDate: Timestamp;
  endDate: Timestamp;
  isAllDay: boolean;
  eventType: EventType;
  requiredRoles: Role[];
  capacity?: number;
  currentAttendees?: number;
  enableWaitlist: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  isActive: boolean;
  isCancelled: boolean;
  cancellationReason?: string;
}

export const eventDocumentToEvent = (
  id: string,
  document: EventDocument
): Event => {
  return {
    id,
    title: document.title,
    description: document.description,
    location: document.location,
    startDate: document.startDate.toDate(),
    endDate: document.endDate.toDate(),
    isAllDay: document.isAllDay,
    eventType: document.eventType,
    requiredRoles: document.requiredRoles,
    capacity: document.capacity,
    currentAttendees: document.currentAttendees || 0,
    enableWaitlist: document.enableWaitlist,
    createdAt: document.createdAt.toDate(),
    updatedAt: document.updatedAt.toDate(),
    createdBy: document.createdBy,
    isActive: document.isActive,
    isCancelled: document.isCancelled,
    cancellationReason: document.cancellationReason,
  };
};

export const eventToEventDocument = (
  event: Partial<Event>
): Partial<EventDocument> => {
  const document: Partial<EventDocument> = {};

  if (event.title !== undefined) document.title = event.title;
  if (event.description !== undefined) document.description = event.description;
  if (event.location !== undefined) document.location = event.location;
  if (event.startDate !== undefined)
    document.startDate = Timestamp.fromDate(event.startDate);
  if (event.endDate !== undefined)
    document.endDate = Timestamp.fromDate(event.endDate);
  if (event.isAllDay !== undefined) document.isAllDay = event.isAllDay;
  if (event.eventType !== undefined) document.eventType = event.eventType;
  if (event.requiredRoles !== undefined)
    document.requiredRoles = event.requiredRoles;
  if (event.capacity !== undefined) document.capacity = event.capacity;
  if (event.currentAttendees !== undefined)
    document.currentAttendees = event.currentAttendees;
  if (event.enableWaitlist !== undefined)
    document.enableWaitlist = event.enableWaitlist;
  if (event.createdBy !== undefined) document.createdBy = event.createdBy;
  if (event.isActive !== undefined) document.isActive = event.isActive;
  if (event.isCancelled !== undefined) document.isCancelled = event.isCancelled;
  if (event.cancellationReason !== undefined)
    document.cancellationReason = event.cancellationReason;

  return document;
};
