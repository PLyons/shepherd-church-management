// src/services/firebase/event-rsvp.service.ts
// Firebase service for event RSVP management with capacity tracking, waitlist handling, and atomic operations
// Handles RSVP submissions, capacity management, status updates, and ensures data consistency with transaction safety
// RELEVANT FILES: src/types/events.ts, src/services/firebase/events.service.ts, src/services/firebase/base.service.ts, src/components/events/RSVPModal.tsx

import {
  Timestamp,
  orderBy,
  where,
  doc,
  collection,
  writeBatch,
  runTransaction,
  getDocs,
  query,
  limit,
  collectionGroup,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BaseFirestoreService } from './base.service';
import { EventRSVP, RSVPFormData, RSVPStatus } from '../../types/events';
import { eventsService } from './events.service';

// RSVP Document type for Firestore
export interface RSVPDocument {
  eventId: string;
  memberId: string;

  // RSVP details
  status: RSVPStatus;
  responseDate: Timestamp;
  numberOfGuests: number;
  notes?: string;

  // Administrative
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Converter functions
function rsvpToRSVPDocument(rsvp: Partial<EventRSVP>): Partial<RSVPDocument> {
  return {
    ...rsvp,
    responseDate:
      rsvp.responseDate instanceof Date
        ? Timestamp.fromDate(rsvp.responseDate)
        : rsvp.responseDate,
    createdAt:
      rsvp.createdAt instanceof Date
        ? Timestamp.fromDate(rsvp.createdAt)
        : rsvp.createdAt,
    updatedAt:
      rsvp.updatedAt instanceof Date
        ? Timestamp.fromDate(rsvp.updatedAt)
        : rsvp.updatedAt,
  };
}

function rsvpDocumentToRSVP(id: string, document: RSVPDocument): EventRSVP {
  return {
    id,
    ...document,
    responseDate: document.responseDate?.toDate() || new Date(),
    createdAt: document.createdAt?.toDate() || new Date(),
    updatedAt: document.updatedAt?.toDate() || new Date(),
  } as EventRSVP;
}

export class EventRSVPService extends BaseFirestoreService<
  RSVPDocument,
  EventRSVP
> {
  constructor() {
    super(
      db,
      'eventRSVPs', // This will be overridden for subcollection access
      (id: string, document: RSVPDocument) => rsvpDocumentToRSVP(id, document),
      (client: Partial<EventRSVP>) => rsvpToRSVPDocument(client)
    );
  }

  // Override collection path for subcollection
  private getEventRSVPCollection(eventId: string) {
    return collection(db, 'events', eventId, 'rsvps');
  }

  // ============================================================================
  // CORE RSVP OPERATIONS
  // ============================================================================

  async createRSVP(
    eventId: string,
    memberId: string,
    rsvpData: RSVPFormData
  ): Promise<EventRSVP> {
    const now = new Date();

    // Use transaction for capacity checking
    return runTransaction(db, async (transaction) => {
      // Check if RSVP already exists
      const existingRSVP = await this.getRSVPByMember(eventId, memberId);
      if (existingRSVP) {
        throw new Error('RSVP already exists for this member and event');
      }

      // Get event details for capacity checking
      const event = await eventsService.getById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      let finalStatus = rsvpData.status;

      // Check capacity if event has a limit and member is RSVPing 'yes'
      if (event.capacity && rsvpData.status === 'yes') {
        const currentRSVPs = await this.getRSVPsByStatus(eventId, 'yes');
        const totalAttending = currentRSVPs.reduce(
          (sum, rsvp) => sum + (rsvp.numberOfGuests + 1),
          0
        );
        const requestedTotal = rsvpData.numberOfGuests + 1;

        if (totalAttending + requestedTotal > event.capacity) {
          if (event.enableWaitlist) {
            finalStatus = 'waitlist';
          } else {
            throw new Error('Event is at capacity and waitlist is not enabled');
          }
        }
      }

      const rsvp: EventRSVP = {
        id: '', // Will be set by Firestore
        eventId,
        memberId,
        ...rsvpData,
        status: finalStatus,
        responseDate: now,
        createdAt: now,
        updatedAt: now,
      };

      // Create RSVP in subcollection
      const rsvpCollection = this.getEventRSVPCollection(eventId);
      const docRef = doc(rsvpCollection);
      rsvp.id = docRef.id;

      transaction.set(docRef, rsvpToRSVPDocument(rsvp));
      return rsvp;
    });
  }

  async updateRSVP(
    eventId: string,
    rsvpId: string,
    updates: Partial<RSVPFormData>
  ): Promise<void> {
    return runTransaction(db, async (transaction) => {
      const rsvpRef = doc(this.getEventRSVPCollection(eventId), rsvpId);
      const rsvpDoc = await transaction.get(rsvpRef);

      if (!rsvpDoc.exists()) {
        throw new Error('RSVP not found');
      }

      const currentRSVP = rsvpDocumentToRSVP(
        rsvpDoc.id,
        rsvpDoc.data() as RSVPDocument
      );

      // If changing status to 'yes', check capacity
      if (updates.status === 'yes' && currentRSVP.status !== 'yes') {
        const event = await eventsService.getById(eventId);
        if (event?.capacity) {
          const currentRSVPs = await this.getRSVPsByStatus(eventId, 'yes');
          const totalAttending = currentRSVPs
            .filter((rsvp) => rsvp.id !== rsvpId)
            .reduce((sum, rsvp) => sum + (rsvp.numberOfGuests + 1), 0);
          const requestedTotal =
            (updates.numberOfGuests ?? currentRSVP.numberOfGuests) + 1;

          if (totalAttending + requestedTotal > event.capacity) {
            throw new Error('Cannot change RSVP to yes - event is at capacity');
          }
        }
      }

      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      transaction.update(rsvpRef, updateData);
    });
  }

  async deleteRSVP(eventId: string, rsvpId: string): Promise<void> {
    const rsvpRef = doc(this.getEventRSVPCollection(eventId), rsvpId);
    await this.delete(rsvpRef.path);
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  async getRSVPsByEvent(eventId: string): Promise<EventRSVP[]> {
    const rsvpCollection = this.getEventRSVPCollection(eventId);
    const q = query(rsvpCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) =>
      rsvpDocumentToRSVP(doc.id, doc.data() as RSVPDocument)
    );
  }

  async getRSVPsByStatus(
    eventId: string,
    status: RSVPStatus
  ): Promise<EventRSVP[]> {
    const rsvpCollection = this.getEventRSVPCollection(eventId);
    const q = query(
      rsvpCollection,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) =>
      rsvpDocumentToRSVP(doc.id, doc.data() as RSVPDocument)
    );
  }

  async getRSVPByMember(
    eventId: string,
    memberId: string
  ): Promise<EventRSVP | null> {
    const rsvpCollection = this.getEventRSVPCollection(eventId);
    const q = query(
      rsvpCollection,
      where('memberId', '==', memberId),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return rsvpDocumentToRSVP(doc.id, doc.data() as RSVPDocument);
  }

  async getRSVPsByMember(memberId: string): Promise<EventRSVP[]> {
    // This requires a collection group query across all event RSVPs
    const q = query(
      collectionGroup(db, 'rsvps'),
      where('memberId', '==', memberId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) =>
      rsvpDocumentToRSVP(doc.id, doc.data() as RSVPDocument)
    );
  }

  // ============================================================================
  // STATISTICS AND SUMMARY METHODS
  // ============================================================================

  async getRSVPSummary(eventId: string): Promise<{
    totalRSVPs: number;
    attendingCount: number;
    notAttendingCount: number;
    maybeCount: number;
    waitlistCount: number;
    totalPeople: number; // Including guests
    statusBreakdown: Record<RSVPStatus, number>;
  }> {
    const allRSVPs = await this.getRSVPsByEvent(eventId);

    const statusBreakdown = allRSVPs.reduce(
      (acc, rsvp) => {
        acc[rsvp.status] = (acc[rsvp.status] || 0) + 1;
        return acc;
      },
      {} as Record<RSVPStatus, number>
    );

    const attendingRSVPs = allRSVPs.filter((rsvp) => rsvp.status === 'yes');
    const totalPeople = attendingRSVPs.reduce(
      (sum, rsvp) => sum + rsvp.numberOfGuests + 1,
      0
    );

    return {
      totalRSVPs: allRSVPs.length,
      attendingCount: statusBreakdown.yes || 0,
      notAttendingCount: statusBreakdown.no || 0,
      maybeCount: statusBreakdown.maybe || 0,
      waitlistCount: statusBreakdown.waitlist || 0,
      totalPeople,
      statusBreakdown,
    };
  }

  async getCapacityInfo(eventId: string): Promise<{
    capacity?: number;
    currentAttending: number;
    spotsRemaining?: number;
    isAtCapacity: boolean;
    waitlistEnabled: boolean;
    waitlistCount: number;
  }> {
    const event = await eventsService.getById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const summary = await this.getRSVPSummary(eventId);

    return {
      capacity: event.capacity,
      currentAttending: summary.totalPeople,
      spotsRemaining: event.capacity
        ? Math.max(0, event.capacity - summary.totalPeople)
        : undefined,
      isAtCapacity: event.capacity
        ? summary.totalPeople >= event.capacity
        : false,
      waitlistEnabled: event.enableWaitlist,
      waitlistCount: summary.waitlistCount,
    };
  }

  // ============================================================================
  // WAITLIST MANAGEMENT
  // ============================================================================

  async processWaitlist(eventId: string): Promise<number> {
    const event = await eventsService.getById(eventId);
    if (!event?.capacity || !event.enableWaitlist) {
      return 0;
    }

    const capacityInfo = await this.getCapacityInfo(eventId);
    const spotsAvailable = capacityInfo.spotsRemaining || 0;

    if (spotsAvailable <= 0) {
      return 0;
    }

    const waitlistRSVPs = await this.getRSVPsByStatus(eventId, 'waitlist');
    const sortedWaitlist = waitlistRSVPs.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    let promoted = 0;
    let remainingSpots = spotsAvailable;

    for (const rsvp of sortedWaitlist) {
      const totalNeeded = rsvp.numberOfGuests + 1;

      if (totalNeeded <= remainingSpots) {
        await this.updateRSVP(eventId, rsvp.id, { status: 'yes' });
        promoted++;
        remainingSpots -= totalNeeded;
      } else {
        break; // Can't fit this group, stop processing
      }
    }

    return promoted;
  }

  async getWaitlistPosition(
    eventId: string,
    memberId: string
  ): Promise<number | null> {
    const memberRSVP = await this.getRSVPByMember(eventId, memberId);
    if (!memberRSVP || memberRSVP.status !== 'waitlist') {
      return null;
    }

    const waitlistRSVPs = await this.getRSVPsByStatus(eventId, 'waitlist');
    const sortedWaitlist = waitlistRSVPs.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    const position = sortedWaitlist.findIndex(
      (rsvp) => rsvp.memberId === memberId
    );
    return position >= 0 ? position + 1 : null;
  }
}

// Create and export service instance
export const eventRSVPService = new EventRSVPService();
