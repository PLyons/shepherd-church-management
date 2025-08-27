import {
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BaseFirestoreService } from './base.service';
import { Event, EventType, Role } from '../../types/events';

// Updated EventDocument type to match PRP-2B-001 Event interface
export interface EventDocument {
  // Basic information
  title: string;
  description: string;
  location: string;
  
  // Temporal data
  startDate: Timestamp;
  endDate: Timestamp;
  isAllDay: boolean;
  
  // Event classification
  eventType: EventType;
  isPublic: boolean;
  requiredRoles: Role[];
  
  // Capacity management
  capacity?: number;
  enableWaitlist: boolean;
  
  // Administrative
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // Member ID
  
  // Status
  isActive: boolean;
  isCancelled: boolean;
  cancellationReason?: string;
}

export class EventsService extends BaseFirestoreService<EventDocument, Event> {
  constructor() {
    super(
      db,
      'events',
      (id: string, document: EventDocument) => eventDocumentToEvent(id, document),
      (client: Partial<Event>) => eventToEventDocument(client)
    );
  }

  /**
   * Create a new event with proper timestamps
   */
  async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    const now = new Date();
    const event: Partial<Event> = {
      ...eventData,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      isCancelled: false,
    };

    return this.create(event);
  }

  /**
   * Update an event with automatic updatedAt timestamp
   */
  async updateEvent(id: string, eventData: Partial<Event>): Promise<Event> {
    const updateData = {
      ...eventData,
      updatedAt: new Date(),
    };

    return this.update(id, updateData);
  }

  /**
   * Get upcoming public events
   */
  async getUpcomingPublicEvents(limitCount = 10): Promise<Event[]> {
    const now = Timestamp.now();
    const constraints = [
      where('isPublic', '==', true),
      where('isActive', '==', true),
      where('isCancelled', '==', false),
      where('startDate', '>=', now),
      orderBy('startDate', 'asc'),
      limit(limitCount)
    ];

    return this.getAll(constraints);
  }

  /**
   * Get events filtered by role access
   */
  async getEventsByRole(userRole: Role, limitCount = 20): Promise<Event[]> {
    const now = Timestamp.now();
    const constraints: QueryConstraint[] = [
      where('isActive', '==', true),
      where('isCancelled', '==', false),
      where('startDate', '>=', now),
      orderBy('startDate', 'asc'),
      limit(limitCount)
    ];

    // If user is not admin or pastor, only show public events or events that specifically allow their role
    if (userRole === 'member') {
      constraints.push(where('isPublic', '==', true));
    }

    let events = await this.getAll(constraints);

    // Additional filtering for role-specific events
    if (userRole !== 'admin') {
      events = events.filter(event => 
        event.isPublic || 
        event.requiredRoles.length === 0 || 
        event.requiredRoles.includes(userRole)
      );
    }

    return events;
  }

  /**
   * Temporary method to get events without complex indexes (while building)
   */
  async getEventsByRoleSimple(userRole: Role, limitCount = 20): Promise<Event[]> {
    // Use a simpler query that doesn't require custom indexes
    const constraints: QueryConstraint[] = [
      where('isActive', '==', true),
      limit(limitCount)
    ];

    let events = await this.getAll(constraints);
    const now = new Date();

    // Filter client-side to avoid complex indexes while they're building
    events = events.filter(event => 
      !event.isCancelled && 
      event.startDate >= now &&
      (userRole === 'admin' || userRole === 'pastor' || event.isPublic)
    );

    // Sort by start date
    events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return events.slice(0, limitCount);
  }

  /**
   * Get events by type
   */
  async getEventsByType(eventType: EventType, limitCount = 10): Promise<Event[]> {
    const now = Timestamp.now();
    const constraints = [
      where('eventType', '==', eventType),
      where('isActive', '==', true),
      where('isCancelled', '==', false),
      where('startDate', '>=', now),
      orderBy('startDate', 'asc'),
      limit(limitCount)
    ];

    return this.getAll(constraints);
  }

  /**
   * Get events in a date range
   */
  async getEventsInRange(startDate: Date, endDate: Date): Promise<Event[]> {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const constraints = [
      where('isActive', '==', true),
      where('startDate', '>=', startTimestamp),
      where('startDate', '<=', endTimestamp),
      orderBy('startDate', 'asc')
    ];

    return this.getAll(constraints);
  }

  /**
   * Cancel an event
   */
  async cancelEvent(id: string, reason: string): Promise<Event> {
    return this.updateEvent(id, {
      isCancelled: true,
      cancellationReason: reason,
    });
  }

  /**
   * Reactivate a cancelled event
   */
  async reactivateEvent(id: string): Promise<Event> {
    return this.updateEvent(id, {
      isCancelled: false,
      cancellationReason: undefined,
    });
  }

  /**
   * Get all events created by a specific user
   */
  async getEventsByCreator(createdBy: string): Promise<Event[]> {
    const constraints = [
      where('createdBy', '==', createdBy),
      orderBy('createdAt', 'desc')
    ];

    return this.getAll(constraints);
  }

  /**
   * Get past events
   */
  async getPastEvents(limitCount = 10): Promise<Event[]> {
    const now = Timestamp.now();
    const constraints = [
      where('endDate', '<', now),
      where('isActive', '==', true),
      orderBy('endDate', 'desc'),
      limit(limitCount)
    ];

    return this.getAll(constraints);
  }

  /**
   * Get today's events
   */
  async getTodaysEvents(): Promise<Event[]> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    return this.getEventsInRange(startOfDay, endOfDay);
  }

  /**
   * Get public events only
   */
  async getPublicEvents(): Promise<Event[]> {
    const constraints = [
      where('isPublic', '==', true),
      where('isActive', '==', true),
      where('isCancelled', '==', false),
      orderBy('startDate', 'asc')
    ];

    return this.getAll(constraints);
  }

  /**
   * Search events by text query
   */
  async searchEvents(query: string): Promise<Event[]> {
    // Get all active events first, then filter client-side
    // In production, you might want to implement Firestore full-text search
    const allEvents = await this.getUpcomingPublicEvents(100);
    const searchLower = query.toLowerCase();
    
    return allEvents.filter(event => 
      event.title.toLowerCase().includes(searchLower) ||
      event.description.toLowerCase().includes(searchLower) ||
      event.location.toLowerCase().includes(searchLower)
    );
  }

  /**
   * Get events that need attention (happening soon)
   */
  async getEventsNeedingAttention(): Promise<Event[]> {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getEventsInRange(now, tomorrow);
  }

  /**
   * Get comprehensive event statistics
   */
  async getEventStatistics(): Promise<{
    totalEvents: number;
    upcomingEvents: number;
    pastEvents: number;
    cancelledEvents: number;
    eventsByType: Record<EventType, number>;
  }> {
    // Get all events for comprehensive statistics
    const allEvents = await this.getAll();

    const now = new Date();
    const upcoming = allEvents.filter(event => 
      event.startDate >= now && event.isActive && !event.isCancelled
    );
    const past = allEvents.filter(event => 
      event.endDate < now && event.isActive
    );
    const cancelled = allEvents.filter(event => event.isCancelled);

    const eventsByType = allEvents.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<EventType, number>);

    return {
      totalEvents: allEvents.length,
      upcomingEvents: upcoming.length,
      pastEvents: past.length,
      cancelledEvents: cancelled.length,
      eventsByType,
    };
  }
}

// Converter functions
function eventDocumentToEvent(id: string, document: EventDocument): Event {
  return {
    id,
    title: document.title,
    description: document.description,
    location: document.location,
    startDate: document.startDate.toDate(),
    endDate: document.endDate.toDate(),
    isAllDay: document.isAllDay,
    eventType: document.eventType,
    isPublic: document.isPublic,
    requiredRoles: document.requiredRoles,
    capacity: document.capacity,
    enableWaitlist: document.enableWaitlist,
    createdAt: document.createdAt.toDate(),
    updatedAt: document.updatedAt.toDate(),
    createdBy: document.createdBy,
    isActive: document.isActive,
    isCancelled: document.isCancelled,
    cancellationReason: document.cancellationReason,
  };
}

function eventToEventDocument(event: Partial<Event>): Partial<EventDocument> {
  const document: Partial<EventDocument> = {};

  if (event.title !== undefined) document.title = event.title;
  if (event.description !== undefined) document.description = event.description;
  if (event.location !== undefined) document.location = event.location;
  if (event.startDate !== undefined) document.startDate = Timestamp.fromDate(event.startDate);
  if (event.endDate !== undefined) document.endDate = Timestamp.fromDate(event.endDate);
  if (event.isAllDay !== undefined) document.isAllDay = event.isAllDay;
  if (event.eventType !== undefined) document.eventType = event.eventType;
  if (event.isPublic !== undefined) document.isPublic = event.isPublic;
  if (event.requiredRoles !== undefined) document.requiredRoles = event.requiredRoles;
  if (event.capacity !== undefined) document.capacity = event.capacity;
  if (event.enableWaitlist !== undefined) document.enableWaitlist = event.enableWaitlist;
  if (event.createdBy !== undefined) document.createdBy = event.createdBy;
  if (event.isActive !== undefined) document.isActive = event.isActive;
  if (event.isCancelled !== undefined) document.isCancelled = event.isCancelled;
  if (event.cancellationReason !== undefined) document.cancellationReason = event.cancellationReason;

  return document;
}

// Create singleton instance
export const eventsService = new EventsService();