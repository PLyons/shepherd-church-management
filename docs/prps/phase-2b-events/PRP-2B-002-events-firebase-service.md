# PRP-2B-002: Events Firebase Service

**Phase**: 2B Event Calendar & Attendance System  
**Task**: 2B.2  
**Priority**: HIGH - Core service layer for event management  
**Estimated Time**: 3-4 hours  

## Purpose

Implement the EventsService class extending BaseFirestoreService to provide complete CRUD operations and specialized query methods for event management. This service will handle Firestore interactions, data conversion, and role-based filtering for the event system.

## Context Required

**Essential Files to Read:**
- `CLAUDE.md` - Service layer patterns and standards
- `src/services/firebase/base.service.ts` - BaseFirestoreService pattern
- `src/services/firebase/households.service.ts` - Recent service implementation example
- `src/utils/firestore-converters.ts` - Conversion patterns
- `docs/prps/phase-2b-events/PRP-2B-001-event-data-model.md` - Type definitions
- Output from PRP-2B-001 (`src/types/events.ts`)

**Key Patterns to Follow:**
- Extend BaseFirestoreService for consistency
- Implement clientToDocument and documentToClient converters
- Use proper Firestore Timestamp handling
- Follow error handling patterns from existing services

## Requirements

**Dependencies:**
- **MUST complete PRP-2B-001 first** - requires Event types
- BaseFirestoreService implementation
- Firebase configuration

**Critical Requirements:**
1. **Service Architecture**: Extend BaseFirestoreService consistently
2. **Data Conversion**: Proper TypeScript ↔ Firestore conversion
3. **Query Methods**: Role-based and date-based filtering
4. **Error Handling**: Comprehensive error management
5. **Real-time Updates**: Support for Firestore listeners

## Detailed Procedure

### Step 1: Create Events Service Foundation

Create `src/services/firebase/events.service.ts`:

```typescript
import { 
  Timestamp,
  QueryOrderByConstraint,
  orderBy,
  where,
  WhereFilterOp
} from 'firebase/firestore';
import { BaseFirestoreService } from './base.service';
import { Event, EventFormData, EventType, Role } from '../../types';

export class EventsService extends BaseFirestoreService<Event, EventFormData> {
  constructor() {
    super(
      'events',
      (client: Event) => this.clientToDocument(client),
      (doc: any) => this.documentToClient(doc)
    );
  }

  protected clientToDocument(event: Event): Record<string, any> {
    return {
      ...event,
      startDate: event.startDate instanceof Date ? Timestamp.fromDate(event.startDate) : event.startDate,
      endDate: event.endDate instanceof Date ? Timestamp.fromDate(event.endDate) : event.endDate,
      createdAt: event.createdAt instanceof Date ? Timestamp.fromDate(event.createdAt) : event.createdAt,
      updatedAt: event.updatedAt instanceof Date ? Timestamp.fromDate(event.updatedAt) : event.updatedAt,
    };
  }

  protected documentToClient(doc: any): Event {
    return {
      ...doc,
      startDate: doc.startDate?.toDate() || new Date(),
      endDate: doc.endDate?.toDate() || new Date(),
      createdAt: doc.createdAt?.toDate() || new Date(),
      updatedAt: doc.updatedAt?.toDate() || new Date(),
    } as Event;
  }
}
```

### Step 2: Implement Core CRUD Operations

Add enhanced CRUD methods:

```typescript
// Add to EventsService class

async create(eventData: EventFormData, createdBy: string): Promise<Event> {
  const now = new Date();
  const event: Event = {
    id: '', // Will be set by Firestore
    ...eventData,
    startDate: new Date(eventData.startDate),
    endDate: new Date(eventData.endDate),
    createdAt: now,
    updatedAt: now,
    createdBy,
    isActive: true,
    isCancelled: false,
    enableWaitlist: eventData.enableWaitlist ?? false,
  };

  return super.create(event);
}

async update(id: string, updates: Partial<EventFormData>): Promise<void> {
  const updateData: Partial<Event> = {
    ...updates,
    updatedAt: new Date(),
  };

  // Convert date strings to Date objects if present
  if (updates.startDate) {
    updateData.startDate = new Date(updates.startDate);
  }
  if (updates.endDate) {
    updateData.endDate = new Date(updates.endDate);
  }

  return super.update(id, updateData);
}

async cancelEvent(id: string, cancellationReason: string, cancelledBy: string): Promise<void> {
  await this.update(id, {
    isCancelled: true,
    cancellationReason,
    updatedAt: new Date(),
  } as any);
}
```

### Step 3: Implement Date-Based Query Methods

Add time-based filtering methods:

```typescript
// Add to EventsService class

async getUpcomingEvents(limit?: number): Promise<Event[]> {
  const now = Timestamp.now();
  
  return this.getWhere([
    where('startDate', '>=', now),
    where('isActive', '==', true),
    where('isCancelled', '==', false),
  ], [
    orderBy('startDate', 'asc'),
  ], limit);
}

async getPastEvents(limit?: number): Promise<Event[]> {
  const now = Timestamp.now();
  
  return this.getWhere([
    where('endDate', '<', now),
    where('isActive', '==', true),
  ], [
    orderBy('startDate', 'desc'),
  ], limit);
}

async getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
  const start = Timestamp.fromDate(startDate);
  const end = Timestamp.fromDate(endDate);
  
  return this.getWhere([
    where('startDate', '>=', start),
    where('startDate', '<=', end),
    where('isActive', '==', true),
    where('isCancelled', '==', false),
  ], [
    orderBy('startDate', 'asc'),
  ]);
}

async getTodaysEvents(): Promise<Event[]> {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  return this.getEventsByDateRange(startOfDay, endOfDay);
}
```

### Step 4: Implement Role-Based Access Methods

Add role-based filtering:

```typescript
// Add to EventsService class

async getPublicEvents(): Promise<Event[]> {
  return this.getWhere([
    where('isPublic', '==', true),
    where('isActive', '==', true),
    where('isCancelled', '==', false),
  ], [
    orderBy('startDate', 'asc'),
  ]);
}

async getEventsForRole(userRole: Role): Promise<Event[]> {
  if (userRole === 'admin') {
    // Admins see all events
    return this.getAll();
  }

  // Get public events and events that require this role or lower
  const roleHierarchy: Record<Role, Role[]> = {
    'admin': ['admin', 'pastor', 'member'],
    'pastor': ['pastor', 'member'],
    'member': ['member'],
  };

  const allowedRoles = roleHierarchy[userRole] || ['member'];
  
  return this.getWhere([
    where('isActive', '==', true),
    where('isCancelled', '==', false),
  ], [
    orderBy('startDate', 'asc'),
  ]).then(events => 
    events.filter(event => 
      event.isPublic || 
      event.requiredRoles.some(role => allowedRoles.includes(role))
    )
  );
}

async getEventsByType(eventType: EventType): Promise<Event[]> {
  return this.getWhere([
    where('eventType', '==', eventType),
    where('isActive', '==', true),
    where('isCancelled', '==', false),
  ], [
    orderBy('startDate', 'asc'),
  ]);
}
```

### Step 5: Implement Search and Utility Methods

Add search functionality:

```typescript
// Add to EventsService class

async searchEvents(query: string): Promise<Event[]> {
  const allEvents = await this.getAll();
  const lowercaseQuery = query.toLowerCase();
  
  return allEvents.filter(event => 
    event.title.toLowerCase().includes(lowercaseQuery) ||
    event.description.toLowerCase().includes(lowercaseQuery) ||
    event.location.toLowerCase().includes(lowercaseQuery)
  );
}

async getEventsByCreator(creatorId: string): Promise<Event[]> {
  return this.getWhere([
    where('createdBy', '==', creatorId),
  ], [
    orderBy('createdAt', 'desc'),
  ]);
}

async getEventsNeedingAttention(): Promise<Event[]> {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const upcomingEvents = await this.getEventsByDateRange(now, tomorrow);
  
  // Return events happening today or tomorrow
  return upcomingEvents;
}
```

### Step 6: Add Statistics and Analytics Methods

Implement useful analytics:

```typescript
// Add to EventsService class

async getEventStatistics(): Promise<{
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  cancelledEvents: number;
  eventsByType: Record<EventType, number>;
}> {
  const [
    total,
    upcoming,
    past,
    cancelled,
    allEvents
  ] = await Promise.all([
    this.count(),
    this.getUpcomingEvents().then(events => events.length),
    this.getPastEvents().then(events => events.length),
    this.getWhere([where('isCancelled', '==', true)]).then(events => events.length),
    this.getAll()
  ]);

  const eventsByType = allEvents.reduce((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {} as Record<EventType, number>);

  return {
    totalEvents: total,
    upcomingEvents: upcoming,
    pastEvents: past,
    cancelledEvents: cancelled,
    eventsByType,
  };
}
```

### Step 7: Export Service Instance

Add at the bottom of the file:

```typescript
// Create and export service instance
export const eventsService = new EventsService();
```

### Step 8: Update Service Index

Update `src/services/firebase/index.ts`:

```typescript
// Add to existing exports
export { eventsService, EventsService } from './events.service';
```

### Step 9: Validation & Testing

1. Run TypeScript compilation: `npm run typecheck`
2. Test basic CRUD operations
3. Verify converter functions work correctly
4. Test role-based filtering logic

## Success Criteria

**Technical Validation:**
- [ ] TypeScript compiles without errors
- [ ] Service extends BaseFirestoreService correctly
- [ ] All CRUD operations implemented
- [ ] Date conversion works properly
- [ ] Service exports correctly

**Functional Validation:**
- [ ] Can create events from form data
- [ ] Date-based queries return correct results
- [ ] Role-based filtering works as expected
- [ ] Search functionality operates correctly
- [ ] Statistics methods return accurate data

**Integration Readiness:**
- [ ] Service instance exported and available
- [ ] Compatible with existing service patterns
- [ ] Error handling follows project standards
- [ ] Ready for UI component integration

## Files Created/Modified

**New Files:**
- `src/services/firebase/events.service.ts`

**Modified Files:**
- `src/services/firebase/index.ts` (add exports)

## Next Task

After completion, proceed to **PRP-2B-003: Event RSVP Service** which will implement RSVP functionality using this events service as a foundation.

## Notes

- This service follows the established BaseFirestoreService pattern
- Date handling is critical - all dates are stored as Firestore Timestamps
- Role-based access is implemented at the service level for security
- Search is implemented client-side for simplicity (can be enhanced with Firestore full-text search later)
- Statistics methods support dashboard and reporting features