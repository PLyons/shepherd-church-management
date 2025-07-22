import { 
  collection, 
  doc, 
  updateDoc, 
  writeBatch, 
  Timestamp,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BaseFirestoreService } from './base.service';
import { 
  Event, 
  EventDocument, 
  EventRSVP,
  EventRSVPDocument,
  EventAttendance,
  EventAttendanceDocument,
  COLLECTIONS, 
  SUBCOLLECTIONS,
  QueryOptions 
} from '../../types/firestore';
import { 
  eventDocumentToEvent, 
  eventToEventDocument,
  eventRSVPDocumentToEventRSVP,
  eventRSVPToEventRSVPDocument,
  eventAttendanceDocumentToEventAttendance,
  eventAttendanceToEventAttendanceDocument
} from '../../utils/firestore-converters';

// ============================================================================
// EVENTS SERVICE
// ============================================================================
// Handles all CRUD operations for event documents and subcollections

export class EventsService extends BaseFirestoreService<EventDocument, Event> {
  constructor() {
    super(COLLECTIONS.EVENTS);
  }

  // ============================================================================
  // ABSTRACT METHOD IMPLEMENTATIONS
  // ============================================================================

  protected documentToClient(id: string, document: EventDocument): Event {
    return eventDocumentToEvent(id, document);
  }

  protected clientToDocument(client: Partial<Event>): Partial<EventDocument> {
    return eventToEventDocument(client);
  }

  // ============================================================================
  // SPECIALIZED EVENT OPERATIONS
  // ============================================================================

  /**
   * Get public events
   */
  async getPublicEvents(options?: QueryOptions): Promise<Event[]> {
    return this.getAll({
      ...options,
      where: [
        ...(options?.where || []),
        { field: 'isPublic', operator: '==', value: true }
      ]
    });
  }

  /**
   * Get events by date range
   */
  async getEventsByDateRange(startDate: Date, endDate: Date, isPublicOnly = false): Promise<Event[]> {
    const queryOptions: QueryOptions = {
      where: [
        { field: 'startTime', operator: '>=', value: Timestamp.fromDate(startDate) },
        { field: 'startTime', operator: '<=', value: Timestamp.fromDate(endDate) }
      ],
      orderBy: { field: 'startTime', direction: 'asc' }
    };

    if (isPublicOnly) {
      queryOptions.where!.push({ field: 'isPublic', operator: '==', value: true });
    }

    return this.getAll(queryOptions);
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit = 10, isPublicOnly = false): Promise<Event[]> {
    const now = Timestamp.now();
    const queryOptions: QueryOptions = {
      where: [{ field: 'startTime', operator: '>=', value: now }],
      orderBy: { field: 'startTime', direction: 'asc' },
      limit
    };

    if (isPublicOnly) {
      queryOptions.where!.push({ field: 'isPublic', operator: '==', value: true });
    }

    return this.getAll(queryOptions);
  }

  /**
   * Get past events
   */
  async getPastEvents(limit = 10, isPublicOnly = false): Promise<Event[]> {
    const now = Timestamp.now();
    const queryOptions: QueryOptions = {
      where: [{ field: 'startTime', operator: '<', value: now }],
      orderBy: { field: 'startTime', direction: 'desc' },
      limit
    };

    if (isPublicOnly) {
      queryOptions.where!.push({ field: 'isPublic', operator: '==', value: true });
    }

    return this.getAll(queryOptions);
  }

  /**
   * Get events created by a specific member
   */
  async getEventsByCreator(createdBy: string): Promise<Event[]> {
    return this.getWhere('createdBy', '==', createdBy);
  }

  /**
   * Search events by title or description
   */
  async searchEvents(searchTerm: string, isPublicOnly = false): Promise<Event[]> {
    // Get events based on visibility
    const events = isPublicOnly ? await this.getPublicEvents() : await this.getAll();
    
    // Filter by search term
    const searchLower = searchTerm.toLowerCase();
    return events.filter(event => 
      event.title.toLowerCase().includes(searchLower) ||
      (event.description && event.description.toLowerCase().includes(searchLower)) ||
      (event.location && event.location.toLowerCase().includes(searchLower))
    );
  }

  // ============================================================================
  // RSVP MANAGEMENT
  // ============================================================================

  /**
   * Get RSVPs for an event
   */
  async getEventRSVPs(eventId: string): Promise<EventRSVP[]> {
    try {
      const rsvpsRef = collection(db, COLLECTIONS.EVENTS, eventId, SUBCOLLECTIONS.EVENT_RSVPS);
      const querySnapshot = await getDocs(rsvpsRef);
      
      return querySnapshot.docs.map(doc => 
        eventRSVPDocumentToEventRSVP(doc.id, doc.data() as EventRSVPDocument)
      );
    } catch (error) {
      console.error('Error getting event RSVPs:', error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Add or update RSVP for an event
   */
  async updateRSVP(eventId: string, memberId: string, rsvpData: Partial<EventRSVP>): Promise<EventRSVP> {
    try {
      const batch = writeBatch(db);

      // Update/create RSVP document
      const rsvpRef = doc(db, COLLECTIONS.EVENTS, eventId, SUBCOLLECTIONS.EVENT_RSVPS, memberId);
      const rsvpDocumentData = eventRSVPToEventRSVPDocument({
        ...rsvpData,
        memberId,
        respondedAt: new Date().toISOString()
      });
      
      batch.set(rsvpRef, {
        ...rsvpDocumentData,
        respondedAt: Timestamp.now()
      });

      // Update event RSVP statistics
      await this.updateEventRSVPStats(eventId);

      await batch.commit();

      // Return the created/updated RSVP
      const updatedRSVP = await getDoc(rsvpRef);
      return eventRSVPDocumentToEventRSVP(updatedRSVP.id, updatedRSVP.data() as EventRSVPDocument);
    } catch (error) {
      console.error('Error updating RSVP:', error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Remove RSVP for an event
   */
  async removeRSVP(eventId: string, memberId: string): Promise<void> {
    try {
      const rsvpRef = doc(db, COLLECTIONS.EVENTS, eventId, SUBCOLLECTIONS.EVENT_RSVPS, memberId);
      await updateDoc(rsvpRef, { response: 'no' });
      
      // Update event RSVP statistics
      await this.updateEventRSVPStats(eventId);
    } catch (error) {
      console.error('Error removing RSVP:', error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Get member's RSVP for an event
   */
  async getMemberRSVP(eventId: string, memberId: string): Promise<EventRSVP | null> {
    try {
      const rsvpRef = doc(db, COLLECTIONS.EVENTS, eventId, SUBCOLLECTIONS.EVENT_RSVPS, memberId);
      const rsvpSnap = await getDoc(rsvpRef);
      
      if (!rsvpSnap.exists()) {
        return null;
      }
      
      return eventRSVPDocumentToEventRSVP(rsvpSnap.id, rsvpSnap.data() as EventRSVPDocument);
    } catch (error) {
      console.error('Error getting member RSVP:', error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Update RSVP statistics for an event
   */
  private async updateEventRSVPStats(eventId: string): Promise<void> {
    const rsvps = await this.getEventRSVPs(eventId);
    
    const stats = {
      yes: rsvps.filter(r => r.response === 'yes').length,
      no: rsvps.filter(r => r.response === 'no').length,
      maybe: rsvps.filter(r => r.response === 'maybe').length,
      total: rsvps.length
    };

    const eventRef = this.getDocRef(eventId);
    await updateDoc(eventRef, {
      rsvpStats: stats,
      updatedAt: Timestamp.now()
    });
  }

  // ============================================================================
  // ATTENDANCE MANAGEMENT
  // ============================================================================

  /**
   * Get attendance for an event
   */
  async getEventAttendance(eventId: string): Promise<EventAttendance[]> {
    try {
      const attendanceRef = collection(db, COLLECTIONS.EVENTS, eventId, SUBCOLLECTIONS.EVENT_ATTENDANCE);
      const querySnapshot = await getDocs(attendanceRef);
      
      return querySnapshot.docs.map(doc => 
        eventAttendanceDocumentToEventAttendance(doc.id, doc.data() as EventAttendanceDocument)
      );
    } catch (error) {
      console.error('Error getting event attendance:', error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Mark member attendance for an event
   */
  async markAttendance(eventId: string, memberId: string, attendanceData: Partial<EventAttendance>): Promise<EventAttendance> {
    try {
      const attendanceRef = doc(db, COLLECTIONS.EVENTS, eventId, SUBCOLLECTIONS.EVENT_ATTENDANCE, memberId);
      const attendanceDocumentData = eventAttendanceToEventAttendanceDocument({
        ...attendanceData,
        memberId,
        checkedInAt: attendanceData.attended ? new Date().toISOString() : undefined
      });
      
      await setDoc(attendanceRef, {
        ...attendanceDocumentData,
        checkedInAt: attendanceData.attended ? Timestamp.now() : undefined
      });

      // Return the created/updated attendance
      const updatedAttendance = await getDoc(attendanceRef);
      return eventAttendanceDocumentToEventAttendance(updatedAttendance.id, updatedAttendance.data() as EventAttendanceDocument);
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Get member's attendance for an event
   */
  async getMemberAttendance(eventId: string, memberId: string): Promise<EventAttendance | null> {
    try {
      const attendanceRef = doc(db, COLLECTIONS.EVENTS, eventId, SUBCOLLECTIONS.EVENT_ATTENDANCE, memberId);
      const attendanceSnap = await getDoc(attendanceRef);
      
      if (!attendanceSnap.exists()) {
        return null;
      }
      
      return eventAttendanceDocumentToEventAttendance(attendanceSnap.id, attendanceSnap.data() as EventAttendanceDocument);
    } catch (error) {
      console.error('Error getting member attendance:', error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Bulk mark attendance from RSVP list
   */
  async bulkMarkAttendanceFromRSVPs(eventId: string, checkedInBy: string): Promise<{ marked: number, errors: string[] }> {
    const rsvps = await this.getEventRSVPs(eventId);
    const yesRSVPs = rsvps.filter(rsvp => rsvp.response === 'yes');
    
    let marked = 0;
    const errors: string[] = [];

    for (const rsvp of yesRSVPs) {
      try {
        await this.markAttendance(eventId, rsvp.memberId, {
          memberId: rsvp.memberId,
          memberName: rsvp.memberName,
          attended: true,
          checkedInBy
        });
        marked++;
      } catch (error) {
        errors.push(`Failed to mark attendance for ${rsvp.memberName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { marked, errors };
  }

  // ============================================================================
  // CALENDAR AND SCHEDULING
  // ============================================================================

  /**
   * Get events for a calendar view
   */
  async getCalendarEvents(year: number, month: number, isPublicOnly = false): Promise<Event[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    return this.getEventsByDateRange(startDate, endDate, isPublicOnly);
  }

  /**
   * Check for scheduling conflicts
   */
  async checkForConflicts(startTime: Date, endTime: Date, excludeEventId?: string): Promise<Event[]> {
    const conflicts = await this.getEventsByDateRange(
      new Date(startTime.getTime() - 60 * 60 * 1000), // 1 hour before
      new Date(endTime.getTime() + 60 * 60 * 1000)    // 1 hour after
    );

    return conflicts.filter(event => 
      event.id !== excludeEventId && 
      event.endTime && 
      new Date(event.startTime) < endTime && 
      new Date(event.endTime) > startTime
    );
  }

  // ============================================================================
  // STATISTICS AND ANALYTICS
  // ============================================================================

  /**
   * Get event statistics
   */
  async getStatistics(): Promise<{
    total: number;
    public: number;
    private: number;
    upcoming: number;
    past: number;
    thisMonth: number;
    averageRSVPs: number;
    averageAttendance: number;
  }> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Use count queries for better performance
    const [total, publicCount, upcomingCount, pastCount, thisMonthCount] = await Promise.all([
      this.count(),
      this.count({ where: [{ field: 'isPublic', operator: '==', value: true }] }),
      this.count({ where: [{ field: 'startTime', operator: '>=', value: now.toISOString() }] }),
      this.count({ where: [{ field: 'startTime', operator: '<', value: now.toISOString() }] }),
      this.count({
        where: [
          { field: 'startTime', operator: '>=', value: thisMonthStart.toISOString() },
          { field: 'startTime', operator: '<=', value: thisMonthEnd.toISOString() }
        ]
      })
    ]);

    // For averages, we'll need to fetch a sample of events
    // Get a small sample of recent events for RSVP average
    const recentEvents = await this.getAll({ limit: 50, orderBy: { field: 'startTime', direction: 'desc' } });
    const totalRSVPs = recentEvents.reduce((sum, e) => sum + e.rsvpStats.total, 0);
    const averageRSVPs = recentEvents.length > 0 ? totalRSVPs / recentEvents.length : 0;

    // Calculate average attendance from recent past events
    const recentPastEvents = await this.getPastEvents(20);
    let totalAttendance = 0;
    let eventsWithAttendance = 0;
    
    for (const event of recentPastEvents) {
      try {
        const attendance = await this.getEventAttendance(event.id);
        const attendedCount = attendance.filter(a => a.attended).length;
        totalAttendance += attendedCount;
        eventsWithAttendance++;
      } catch (error) {
        // Skip events with attendance errors
        continue;
      }
    }
    const averageAttendance = eventsWithAttendance > 0 ? totalAttendance / eventsWithAttendance : 0;

    return {
      total,
      public: publicCount,
      private: total - publicCount,
      upcoming: upcomingCount,
      past: pastCount,
      thisMonth: thisMonthCount,
      averageRSVPs: Math.round(averageRSVPs * 100) / 100,
      averageAttendance: Math.round(averageAttendance * 100) / 100,
    };
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to upcoming events
   */
  subscribeToUpcomingEvents(
    isPublicOnly = false, 
    limit = 10, 
    callback?: (events: Event[]) => void
  ): () => void {
    const constraints = [
      where('startTime', '>=', Timestamp.now()),
      orderBy('startTime', 'asc')
    ];

    if (isPublicOnly) {
      constraints.unshift(where('isPublic', '==', true));
    }

    if (limit) {
      constraints.push(limit(limit) as any);
    }

    const q = query(this.getCollectionRef(), ...constraints);

    return onSnapshot(q, (querySnapshot) => {
      const events = querySnapshot.docs.map(doc => 
        this.documentToClient(doc.id, doc.data() as EventDocument)
      );
      callback?.(events);
    });
  }

  /**
   * Subscribe to event RSVPs
   */
  subscribeToEventRSVPs(eventId: string, callback: (rsvps: EventRSVP[]) => void): () => void {
    const rsvpsRef = collection(db, COLLECTIONS.EVENTS, eventId, SUBCOLLECTIONS.EVENT_RSVPS);
    
    return onSnapshot(rsvpsRef, (querySnapshot) => {
      const rsvps = querySnapshot.docs.map(doc => 
        eventRSVPDocumentToEventRSVP(doc.id, doc.data() as EventRSVPDocument)
      );
      callback(rsvps);
    });
  }

  /**
   * Subscribe to event attendance
   */
  subscribeToEventAttendance(eventId: string, callback: (attendance: EventAttendance[]) => void): () => void {
    const attendanceRef = collection(db, COLLECTIONS.EVENTS, eventId, SUBCOLLECTIONS.EVENT_ATTENDANCE);
    
    return onSnapshot(attendanceRef, (querySnapshot) => {
      const attendance = querySnapshot.docs.map(doc => 
        eventAttendanceDocumentToEventAttendance(doc.id, doc.data() as EventAttendanceDocument)
      );
      callback(attendance);
    });
  }
}

// Create and export singleton instance
export const eventsService = new EventsService();