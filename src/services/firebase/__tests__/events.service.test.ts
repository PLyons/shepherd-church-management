import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventsService } from '../events.service';
import { Event, EventRSVP, EventAttendance } from '../../../types/firestore';

// Mock the base service and dependencies
vi.mock('../base.service');
vi.mock('../../lib/firebase', () => ({
  db: 'mock-db',
}));

// Import Firebase functions for testing
import {
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  limit as firestoreLimit,
  doc,
} from 'firebase/firestore';

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => 'mock-db'),
  collection: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(() => ({})),
  onSnapshot: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1640995200, nanoseconds: 0 })),
    fromDate: vi.fn((date: Date) => ({
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    })),
  },
}));

// Mock the converters
vi.mock('../../utils/firestore-converters', () => ({
  eventDocumentToEvent: vi.fn((id: string, doc: any) => ({ id, ...doc })),
  eventToEventDocument: vi.fn((event: any) => event),
  eventRSVPDocumentToEventRSVP: vi.fn((id: string, doc: any) => ({
    id,
    ...doc,
  })),
  eventRSVPToEventRSVPDocument: vi.fn((rsvp: any) => rsvp),
  eventAttendanceDocumentToEventAttendance: vi.fn((id: string, doc: any) => ({
    id,
    ...doc,
  })),
  eventAttendanceToEventAttendanceDocument: vi.fn(
    (attendance: any) => attendance
  ),
}));

// Mock the BaseFirestoreService class
vi.mock('../base.service', () => ({
  BaseFirestoreService: class MockBaseFirestoreService {
    protected collectionName: string;
    private mockData: Map<string, any> = new Map();

    constructor(collectionName: string) {
      this.collectionName = collectionName;
    }

    async create(data: any, customId?: string): Promise<any> {
      const id = customId || `generated-${Date.now()}`;
      const event = { id, ...data };
      this.mockData.set(id, event);
      return event;
    }

    async getById(id: string): Promise<any | null> {
      return this.mockData.get(id) || null;
    }

    async getWhere(
      field: string,
      operator: string,
      value: any
    ): Promise<any[]> {
      const results: any[] = [];
      for (const [id, doc] of this.mockData.entries()) {
        if (doc[field] === value) {
          results.push(doc);
        }
      }
      return results;
    }

    async getAll(options?: any): Promise<any[]> {
      let results = Array.from(this.mockData.values());

      // Apply where clauses if provided
      if (options?.where && options.where.length > 0) {
        results = results.filter((doc) => {
          return options.where.every((condition: any) => {
            const fieldValue = doc[condition.field];
            const conditionValue = condition.value;

            // Handle timestamp comparisons
            const getTimestampValue = (val: any) => {
              if (val && typeof val === 'object' && val.seconds !== undefined) {
                return val.seconds;
              }
              if (val instanceof Date) {
                return Math.floor(val.getTime() / 1000);
              }
              if (typeof val === 'string') {
                return Math.floor(new Date(val).getTime() / 1000);
              }
              return val;
            };

            const normalizedField = getTimestampValue(fieldValue);
            const normalizedCondition = getTimestampValue(conditionValue);

            if (condition.operator === '==') {
              return normalizedField === normalizedCondition;
            } else if (condition.operator === '>=') {
              return normalizedField >= normalizedCondition;
            } else if (condition.operator === '<=') {
              return normalizedField <= normalizedCondition;
            } else if (condition.operator === '<') {
              return normalizedField < normalizedCondition;
            }
            return true;
          });
        });
      }

      // Apply limit if provided
      if (options?.limit) {
        results = results.slice(0, options.limit);
      }

      return results;
    }

    async update(id: string, data: any): Promise<any> {
      const existing = this.mockData.get(id);
      if (!existing) throw new Error('Event not found');

      const updated = { ...existing, ...data };
      this.mockData.set(id, updated);
      return updated;
    }

    async delete(id: string): Promise<void> {
      this.mockData.delete(id);
    }

    async count(options?: any): Promise<number> {
      if (!options?.where) return this.mockData.size;

      let count = 0;
      for (const [id, doc] of this.mockData.entries()) {
        const matchesAll = options.where.every((condition: any) => {
          return doc[condition.field] === condition.value;
        });
        if (matchesAll) count++;
      }
      return count;
    }

    subscribeToCollection(options: any, callback?: any): () => void {
      return vi.fn();
    }

    getDocRef(id: string) {
      return { id };
    }

    getCollectionRef() {
      return { path: this.collectionName };
    }

    handleFirestoreError(error: any) {
      return error;
    }

    // Helper methods for testing
    setMockData(data: Record<string, any>) {
      this.mockData.clear();
      Object.entries(data).forEach(([id, event]) => {
        this.mockData.set(id, event);
      });
    }

    clearMockData() {
      this.mockData.clear();
    }
  },
}));

describe('EventsService', () => {
  let service: EventsService;
  let mockBaseService: any;

  const createMockEvent = (overrides: Partial<Event> = {}): Event => ({
    id: 'event-1',
    title: 'Test Event',
    description: 'Test event description',
    startTime: '2024-01-15T10:00:00Z',
    endTime: '2024-01-15T12:00:00Z',
    location: 'Test Location',
    isPublic: true,
    maxAttendees: 50,
    rsvpDeadline: '2024-01-14T23:59:59Z',
    createdBy: 'user-1',
    rsvpStats: {
      yes: 0,
      no: 0,
      maybe: 0,
      total: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockRSVP = (overrides: Partial<EventRSVP> = {}): EventRSVP => ({
    id: 'rsvp-1',
    memberId: 'member-1',
    memberName: 'John Doe',
    response: 'yes',
    respondedAt: '2024-01-10T10:00:00Z',
    notes: '',
    ...overrides,
  });

  const createMockAttendance = (
    overrides: Partial<EventAttendance> = {}
  ): EventAttendance => ({
    id: 'attendance-1',
    memberId: 'member-1',
    memberName: 'John Doe',
    attended: true,
    checkedInAt: '2024-01-15T09:30:00Z',
    checkedInBy: 'admin-1',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EventsService();
    mockBaseService = service as any;
    mockBaseService.clearMockData();
  });

  describe('basic event operations', () => {
    it('should create an event', async () => {
      const eventData = {
        title: 'New Event',
        description: 'New event description',
        startTime: '2024-02-01T10:00:00Z',
        isPublic: true,
      };

      const result = await service.create(eventData);

      expect(result.title).toBe('New Event');
      expect(result.description).toBe('New event description');
      expect(result.isPublic).toBe(true);
    });

    it('should get event by id', async () => {
      const event = createMockEvent({ id: 'test-event' });
      mockBaseService.setMockData({ [event.id]: event });

      const result = await service.getById('test-event');

      expect(result).toEqual(event);
    });
  });

  describe('public events', () => {
    beforeEach(() => {
      const events = [
        createMockEvent({
          id: 'public-1',
          title: 'Public Event 1',
          isPublic: true,
        }),
        createMockEvent({
          id: 'private-1',
          title: 'Private Event 1',
          isPublic: false,
        }),
        createMockEvent({
          id: 'public-2',
          title: 'Public Event 2',
          isPublic: true,
        }),
      ];

      const eventMap = events.reduce(
        (acc, event) => {
          acc[event.id] = event;
          return acc;
        },
        {} as Record<string, Event>
      );

      mockBaseService.setMockData(eventMap);
    });

    it('should get only public events', async () => {
      const result = await service.getPublicEvents();

      expect(result).toHaveLength(2);
      expect(result.every((e) => e.isPublic === true)).toBe(true);
      expect(result.map((e) => e.title).sort()).toEqual([
        'Public Event 1',
        'Public Event 2',
      ]);
    });
  });

  describe('date range queries', () => {
    beforeEach(() => {
      // Clear data first to avoid interference
      mockBaseService.clearMockData();

      const mockTimestamp = (dateStr: string) => ({
        seconds: Math.floor(new Date(dateStr).getTime() / 1000),
        nanoseconds: 0,
      });

      const events = [
        createMockEvent({
          id: 'event-1',
          startTime: mockTimestamp('2024-01-10T10:00:00Z') as any,
          isPublic: true,
        }),
        createMockEvent({
          id: 'event-2',
          startTime: mockTimestamp('2024-01-20T10:00:00Z') as any,
          isPublic: false,
        }),
        createMockEvent({
          id: 'event-3',
          startTime: mockTimestamp('2024-02-05T10:00:00Z') as any,
          isPublic: true,
        }),
      ];

      const eventMap = events.reduce(
        (acc, event) => {
          acc[event.id] = event;
          return acc;
        },
        {} as Record<string, Event>
      );

      mockBaseService.setMockData(eventMap);
    });

    it('should get events by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await service.getEventsByDateRange(startDate, endDate);

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.id).sort()).toEqual(['event-1', 'event-2']);
    });

    it('should get only public events in date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await service.getEventsByDateRange(
        startDate,
        endDate,
        true
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('event-1');
      expect(result[0].isPublic).toBe(true);
    });
  });

  describe('upcoming and past events', () => {
    beforeEach(() => {
      // Clear data first to avoid interference
      mockBaseService.clearMockData();

      const now = { seconds: 1640995200, nanoseconds: 0 }; // Mock current time

      const events = [
        createMockEvent({
          id: 'past-1',
          startTime: { seconds: now.seconds - 86400, nanoseconds: 0 } as any, // 1 day ago
          isPublic: true,
        }),
        createMockEvent({
          id: 'upcoming-1',
          startTime: { seconds: now.seconds + 86400, nanoseconds: 0 } as any, // 1 day from now
          isPublic: true,
        }),
        createMockEvent({
          id: 'upcoming-2',
          startTime: { seconds: now.seconds + 172800, nanoseconds: 0 } as any, // 2 days from now
          isPublic: false,
        }),
      ];

      const eventMap = events.reduce(
        (acc, event) => {
          acc[event.id] = event;
          return acc;
        },
        {} as Record<string, Event>
      );

      mockBaseService.setMockData(eventMap);
    });

    it('should get upcoming events', async () => {
      const result = await service.getUpcomingEvents(10);

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.id).sort()).toEqual([
        'upcoming-1',
        'upcoming-2',
      ]);
    });

    it('should get only public upcoming events', async () => {
      const result = await service.getUpcomingEvents(10, true);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('upcoming-1');
      expect(result[0].isPublic).toBe(true);
    });

    it('should get past events', async () => {
      const result = await service.getPastEvents(10);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('past-1');
    });
  });

  describe('event search', () => {
    beforeEach(() => {
      // Clear data first to avoid interference
      mockBaseService.clearMockData();

      const events = [
        createMockEvent({
          id: 'event-1',
          title: 'Sunday Service',
          description: 'Weekly worship service',
          location: 'Main Sanctuary',
          isPublic: true,
        }),
        createMockEvent({
          id: 'event-2',
          title: 'Bible Study',
          description: 'Study group meeting',
          location: 'Conference Room',
          isPublic: false,
        }),
        createMockEvent({
          id: 'event-3',
          title: 'Youth Group',
          description: 'Service project planning',
          location: 'Youth Room',
          isPublic: true,
        }),
      ];

      const eventMap = events.reduce(
        (acc, event) => {
          acc[event.id] = event;
          return acc;
        },
        {} as Record<string, Event>
      );

      mockBaseService.setMockData(eventMap);
    });

    it('should search events by title', async () => {
      const result = await service.searchEvents('bible');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Bible Study');
    });

    it('should search events by description', async () => {
      const result = await service.searchEvents('service');

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.title).sort()).toEqual([
        'Sunday Service',
        'Youth Group',
      ]);
    });

    it('should search events by location', async () => {
      const result = await service.searchEvents('room');

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.title).sort()).toEqual([
        'Bible Study',
        'Youth Group',
      ]);
    });

    it('should search only public events', async () => {
      const result = await service.searchEvents('worship', true); // More specific search

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Sunday Service');
      expect(result[0].isPublic).toBe(true);
    });
  });

  describe('events by creator', () => {
    beforeEach(() => {
      // Clear data first to avoid interference
      mockBaseService.clearMockData();

      const events = [
        createMockEvent({
          id: 'event-1',
          title: 'Event 1',
          createdBy: 'user-1',
        }),
        createMockEvent({
          id: 'event-2',
          title: 'Event 2',
          createdBy: 'user-2',
        }),
        createMockEvent({
          id: 'event-3',
          title: 'Event 3',
          createdBy: 'user-1',
        }),
      ];

      const eventMap = events.reduce(
        (acc, event) => {
          acc[event.id] = event;
          return acc;
        },
        {} as Record<string, Event>
      );

      mockBaseService.setMockData(eventMap);
    });

    it('should get events by creator', async () => {
      const result = await service.getEventsByCreator('user-1');

      expect(result).toHaveLength(2);
      expect(result.every((e) => e.createdBy === 'user-1')).toBe(true);
      expect(result.map((e) => e.title).sort()).toEqual(['Event 1', 'Event 3']);
    });
  });

  describe('RSVP management', () => {
    const mockGetDocs = vi.fn();
    const mockGetDoc = vi.fn();

    beforeEach(() => {
      vi.mocked(getDocs).mockImplementation(mockGetDocs);
      vi.mocked(getDoc).mockImplementation(mockGetDoc);
    });

    it('should get event RSVPs', async () => {
      const mockRSVPs = [
        {
          id: 'rsvp-1',
          data: () => ({ memberId: 'member-1', response: 'yes' }),
        },
        {
          id: 'rsvp-2',
          data: () => ({ memberId: 'member-2', response: 'no' }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockRSVPs });

      const result = await service.getEventRSVPs('event-1');

      expect(result).toHaveLength(2);
      expect(mockGetDocs).toHaveBeenCalled();
    });

    it('should update RSVP', async () => {
      const rsvpData = {
        response: 'yes' as const,
        notes: 'Looking forward to it!',
      };

      mockGetDoc.mockResolvedValue({
        id: 'member-1',
        data: () => ({
          ...rsvpData,
          memberId: 'member-1',
          respondedAt: {
            toDate: () => new Date('2024-01-10T10:00:00Z'),
          },
        }),
      });

      // Mock the updateEventRSVPStats method
      vi.spyOn(service as any, 'updateEventRSVPStats').mockResolvedValue(
        undefined
      );

      const result = await service.updateRSVP('event-1', 'member-1', rsvpData);

      expect(result.response).toBe('yes');
      expect(result.notes).toBe('Looking forward to it!');
    });

    it('should remove RSVP', async () => {
      const mockDocRef = { id: 'mock-doc-ref' };
      vi.mocked(doc).mockReturnValue(mockDocRef as any);
      vi.spyOn(service as any, 'updateEventRSVPStats').mockResolvedValue(
        undefined
      );

      await service.removeRSVP('event-1', 'member-1');

      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { response: 'no' });
    });

    it('should get member RSVP', async () => {
      const mockRSVP = {
        exists: () => true,
        id: 'member-1',
        data: () => ({ memberId: 'member-1', response: 'yes' }),
      };

      mockGetDoc.mockResolvedValue(mockRSVP);

      const result = await service.getMemberRSVP('event-1', 'member-1');

      expect(result).toBeTruthy();
      expect(result?.response).toBe('yes');
    });

    it('should return null for non-existent RSVP', async () => {
      mockGetDoc.mockResolvedValue({ exists: () => false });

      const result = await service.getMemberRSVP('event-1', 'member-1');

      expect(result).toBeNull();
    });
  });

  describe('attendance management', () => {
    const mockGetDocs = vi.fn();
    const mockGetDoc = vi.fn();

    beforeEach(() => {
      vi.mocked(getDocs).mockImplementation(mockGetDocs);
      vi.mocked(getDoc).mockImplementation(mockGetDoc);
    });

    it('should get event attendance', async () => {
      const mockAttendance = [
        {
          id: 'member-1',
          data: () => ({ memberId: 'member-1', attended: true }),
        },
        {
          id: 'member-2',
          data: () => ({ memberId: 'member-2', attended: false }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockAttendance });

      const result = await service.getEventAttendance('event-1');

      expect(result).toHaveLength(2);
      expect(mockGetDocs).toHaveBeenCalled();
    });

    it('should mark attendance', async () => {
      const attendanceData = {
        attended: true,
        checkedInBy: 'admin-1',
      };

      mockGetDoc.mockResolvedValue({
        id: 'member-1',
        data: () => ({ ...attendanceData, memberId: 'member-1' }),
      });

      const result = await service.markAttendance(
        'event-1',
        'member-1',
        attendanceData
      );

      expect(result.attended).toBe(true);
      expect(result.checkedInBy).toBe('admin-1');
      expect(setDoc).toHaveBeenCalled();
    });

    it('should get member attendance', async () => {
      const mockAttendance = {
        exists: () => true,
        id: 'member-1',
        data: () => ({ memberId: 'member-1', attended: true }),
      };

      mockGetDoc.mockResolvedValue(mockAttendance);

      const result = await service.getMemberAttendance('event-1', 'member-1');

      expect(result).toBeTruthy();
      expect(result?.attended).toBe(true);
    });

    it('should return null for non-existent attendance', async () => {
      mockGetDoc.mockResolvedValue({ exists: () => false });

      const result = await service.getMemberAttendance('event-1', 'member-1');

      expect(result).toBeNull();
    });
  });

  describe('bulk attendance operations', () => {
    it('should bulk mark attendance from RSVPs', async () => {
      const mockRSVPs = [
        createMockRSVP({
          memberId: 'member-1',
          memberName: 'John Doe',
          response: 'yes',
        }),
        createMockRSVP({
          memberId: 'member-2',
          memberName: 'Jane Smith',
          response: 'yes',
        }),
        createMockRSVP({
          memberId: 'member-3',
          memberName: 'Bob Johnson',
          response: 'no',
        }),
      ];

      // Mock getEventRSVPs
      vi.spyOn(service, 'getEventRSVPs').mockResolvedValue(mockRSVPs);

      // Mock markAttendance
      vi.spyOn(service, 'markAttendance').mockResolvedValue(
        createMockAttendance()
      );

      const result = await service.bulkMarkAttendanceFromRSVPs(
        'event-1',
        'admin-1'
      );

      expect(result.marked).toBe(2); // Only 'yes' RSVPs
      expect(result.errors).toHaveLength(0);
      expect(service.markAttendance).toHaveBeenCalledTimes(2);
    });

    it('should handle errors in bulk attendance marking', async () => {
      const mockRSVPs = [
        createMockRSVP({
          memberId: 'member-1',
          memberName: 'John Doe',
          response: 'yes',
        }),
        createMockRSVP({
          memberId: 'member-2',
          memberName: 'Jane Smith',
          response: 'yes',
        }),
      ];

      vi.spyOn(service, 'getEventRSVPs').mockResolvedValue(mockRSVPs);
      vi.spyOn(service, 'markAttendance')
        .mockResolvedValueOnce(createMockAttendance())
        .mockRejectedValueOnce(new Error('Database error'));

      const result = await service.bulkMarkAttendanceFromRSVPs(
        'event-1',
        'admin-1'
      );

      expect(result.marked).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Jane Smith');
    });
  });

  describe('calendar operations', () => {
    it('should get calendar events for a month', async () => {
      vi.spyOn(service, 'getEventsByDateRange').mockResolvedValue([
        createMockEvent({ id: 'event-1' }),
        createMockEvent({ id: 'event-2' }),
      ]);

      const result = await service.getCalendarEvents(2024, 1); // January 2024

      expect(result).toHaveLength(2);
      expect(service.getEventsByDateRange).toHaveBeenCalledWith(
        new Date(2024, 0, 1), // January 1st
        new Date(2024, 1, 0, 23, 59, 59), // January 31st
        false // isPublicOnly default value
      );
    });

    it('should check for scheduling conflicts', async () => {
      const conflictingEvents = [
        createMockEvent({
          id: 'conflict-1',
          startTime: '2024-01-15T09:30:00Z',
          endTime: '2024-01-15T11:30:00Z',
        }),
        createMockEvent({
          id: 'no-conflict',
          startTime: '2024-01-15T14:00:00Z',
          endTime: '2024-01-15T16:00:00Z',
        }),
      ];

      vi.spyOn(service, 'getEventsByDateRange').mockResolvedValue(
        conflictingEvents
      );

      const startTime = new Date('2024-01-15T10:00:00Z');
      const endTime = new Date('2024-01-15T12:00:00Z');

      const result = await service.checkForConflicts(startTime, endTime);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('conflict-1');
    });
  });

  describe('statistics', () => {
    beforeEach(() => {
      // Clear data first to avoid interference
      mockBaseService.clearMockData();

      const events = [
        createMockEvent({
          id: 'event-1',
          isPublic: true,
          rsvpStats: { yes: 5, no: 2, maybe: 1, total: 8 },
        }),
        createMockEvent({
          id: 'event-2',
          isPublic: false,
          rsvpStats: { yes: 3, no: 1, maybe: 0, total: 4 },
        }),
        createMockEvent({
          id: 'event-3',
          isPublic: true,
          rsvpStats: { yes: 7, no: 3, maybe: 2, total: 12 },
        }),
      ];

      const eventMap = events.reduce(
        (acc, event) => {
          acc[event.id] = event;
          return acc;
        },
        {} as Record<string, Event>
      );

      mockBaseService.setMockData(eventMap);
    });

    it('should get event statistics', async () => {
      // Mock the methods that are called
      vi.spyOn(service, 'getUpcomingEvents').mockResolvedValue([
        createMockEvent(),
      ]);
      vi.spyOn(service, 'getPastEvents').mockResolvedValue([
        createMockEvent(),
        createMockEvent(),
      ]);
      vi.spyOn(service, 'getEventsByDateRange').mockResolvedValue([
        createMockEvent(),
      ]);
      vi.spyOn(service, 'getEventAttendance').mockResolvedValue([
        createMockAttendance({ attended: true }),
        createMockAttendance({ attended: true }),
        createMockAttendance({ attended: false }),
      ]);

      const result = await service.getStatistics();

      expect(result.total).toBe(3);
      expect(result.public).toBe(2);
      expect(result.private).toBe(1);
      expect(result.upcoming).toBe(1);
      expect(result.past).toBe(2);
      expect(result.averageRSVPs).toBe(8); // (8 + 4 + 12) / 3
    });
  });

  describe('subscriptions', () => {
    it('should subscribe to upcoming events', () => {
      const callback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(onSnapshot).mockReturnValue(mockUnsubscribe);
      vi.mocked(firestoreLimit).mockReturnValue({} as any);

      const unsubscribe = service.subscribeToUpcomingEvents(true, 10, callback);

      expect(query).toHaveBeenCalled();
      expect(onSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should subscribe to event RSVPs', () => {
      const callback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(onSnapshot).mockReturnValue(mockUnsubscribe);
      vi.mocked(collection).mockReturnValue({} as any);

      const unsubscribe = service.subscribeToEventRSVPs('event-1', callback);

      expect(collection).toHaveBeenCalled();
      expect(onSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should subscribe to event attendance', () => {
      const callback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(onSnapshot).mockReturnValue(mockUnsubscribe);
      vi.mocked(collection).mockReturnValue({} as any);

      const unsubscribe = service.subscribeToEventAttendance(
        'event-1',
        callback
      );

      expect(collection).toHaveBeenCalled();
      expect(onSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('error handling', () => {
    it('should handle errors when getting RSVPs', async () => {
      vi.mocked(getDocs).mockRejectedValue(new Error('Database error'));

      await expect(service.getEventRSVPs('event-1')).rejects.toThrow(
        'Database error'
      );
    });

    it('should handle errors when marking attendance', async () => {
      vi.mocked(setDoc).mockRejectedValue(new Error('Database error'));

      await expect(
        service.markAttendance('event-1', 'member-1', { attended: true })
      ).rejects.toThrow('Database error');
    });
  });
});
