# PRP-2B-003: Event RSVP Service

**Phase**: 2B Event Calendar & Attendance System  
**Task**: 2B.3  
**Priority**: HIGH - Core RSVP functionality for event management  
**Estimated Time**: 3-4 hours  

## Purpose

Implement the EventRSVPService to handle event RSVP functionality including capacity management, waitlist handling, and RSVP statistics. This service will work closely with the EventsService to provide comprehensive event registration capabilities.

## Context Required

**Essential Files to Read:**
- `CLAUDE.md` - Service layer patterns and standards
- `src/services/firebase/base.service.ts` - BaseFirestoreService pattern
- `docs/prps/phase-2b-events/PRP-2B-001-event-data-model.md` - RSVP type definitions
- `docs/prps/phase-2b-events/PRP-2B-002-events-firebase-service.md` - Events service integration
- Output from PRP-2B-001 (`src/types/events.ts`) - EventRSVP interface
- Output from PRP-2B-002 (`src/services/firebase/events.service.ts`) - Events service

**Key Patterns to Follow:**
- Extend BaseFirestoreService for consistency
- Use subcollection pattern for RSVPs under events
- Implement atomic operations for capacity management
- Follow error handling patterns from existing services

## Requirements

**Dependencies:**
- **MUST complete PRP-2B-001 and PRP-2B-002 first**
- EventRSVP and Event type definitions
- EventsService implementation

**Critical Requirements:**
1. **Capacity Management**: Prevent over-registration and handle waitlists
2. **Atomic Operations**: Ensure data consistency during RSVP changes
3. **Subcollection Pattern**: Store RSVPs as subcollections under events
4. **Member Integration**: Link RSVPs to member profiles
5. **Statistics**: Provide RSVP summaries and analytics

## Detailed Procedure

### Step 1: Create RSVP Service Foundation

Create `src/services/firebase/event-rsvp.service.ts`:

```typescript
import { 
  Timestamp,
  orderBy,
  where,
  doc,
  collection,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { BaseFirestoreService } from './base.service';
import { EventRSVP, RSVPFormData, RSVPStatus } from '../../types';
import { eventsService } from './events.service';

export class EventRSVPService extends BaseFirestoreService<EventRSVP, RSVPFormData> {
  constructor() {
    super(
      'eventRSVPs', // This will be overridden for subcollection access
      (client: EventRSVP) => this.clientToDocument(client),
      (doc: any) => this.documentToClient(doc)
    );
  }

  protected clientToDocument(rsvp: EventRSVP): Record<string, any> {
    return {
      ...rsvp,
      responseDate: rsvp.responseDate instanceof Date ? Timestamp.fromDate(rsvp.responseDate) : rsvp.responseDate,
      createdAt: rsvp.createdAt instanceof Date ? Timestamp.fromDate(rsvp.createdAt) : rsvp.createdAt,
      updatedAt: rsvp.updatedAt instanceof Date ? Timestamp.fromDate(rsvp.updatedAt) : rsvp.updatedAt,
    };
  }

  protected documentToClient(doc: any): EventRSVP {
    return {
      ...doc,
      responseDate: doc.responseDate?.toDate() || new Date(),
      createdAt: doc.createdAt?.toDate() || new Date(),
      updatedAt: doc.updatedAt?.toDate() || new Date(),
    } as EventRSVP;
  }

  // Override collection path for subcollection
  private getEventRSVPCollection(eventId: string) {
    return collection(this.db, 'events', eventId, 'rsvps');
  }
}
```

### Step 2: Implement Core RSVP Operations

Add RSVP creation and management:

```typescript
// Add to EventRSVPService class

async createRSVP(eventId: string, memberId: string, rsvpData: RSVPFormData): Promise<EventRSVP> {
  const now = new Date();
  
  // Use transaction for capacity checking
  return runTransaction(this.db, async (transaction) => {
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

    // Check capacity if event has a limit
    if (event.capacity && rsvpData.status === 'yes') {
      const currentRSVPs = await this.getRSVPsByStatus(eventId, 'yes');
      const totalAttending = currentRSVPs.reduce((sum, rsvp) => sum + (rsvp.numberOfGuests + 1), 0);
      const requestedTotal = rsvpData.numberOfGuests + 1;

      if (totalAttending + requestedTotal > event.capacity) {
        if (event.enableWaitlist) {
          rsvpData.status = 'waitlist';
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
      responseDate: now,
      createdAt: now,
      updatedAt: now,
    };

    // Create RSVP in subcollection
    const rsvpCollection = this.getEventRSVPCollection(eventId);
    const docRef = doc(rsvpCollection);
    rsvp.id = docRef.id;
    
    transaction.set(docRef, this.clientToDocument(rsvp));
    return rsvp;
  });
}

async updateRSVP(eventId: string, rsvpId: string, updates: Partial<RSVPFormData>): Promise<void> {
  return runTransaction(this.db, async (transaction) => {
    const rsvpRef = doc(this.getEventRSVPCollection(eventId), rsvpId);
    const rsvpDoc = await transaction.get(rsvpRef);
    
    if (!rsvpDoc.exists()) {
      throw new Error('RSVP not found');
    }

    const currentRSVP = this.documentToClient({ id: rsvpDoc.id, ...rsvpDoc.data() });
    
    // If changing status to 'yes', check capacity
    if (updates.status === 'yes' && currentRSVP.status !== 'yes') {
      const event = await eventsService.getById(eventId);
      if (event?.capacity) {
        const currentRSVPs = await this.getRSVPsByStatus(eventId, 'yes');
        const totalAttending = currentRSVPs
          .filter(rsvp => rsvp.id !== rsvpId)
          .reduce((sum, rsvp) => sum + (rsvp.numberOfGuests + 1), 0);
        const requestedTotal = (updates.numberOfGuests ?? currentRSVP.numberOfGuests) + 1;

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
```

### Step 3: Implement Query Methods

Add methods to retrieve RSVPs:

```typescript
// Add to EventRSVPService class

async getRSVPsByEvent(eventId: string): Promise<EventRSVP[]> {
  const rsvpCollection = this.getEventRSVPCollection(eventId);
  const querySnapshot = await this.db
    .collection(rsvpCollection.path)
    .orderBy('createdAt', 'desc')
    .get();

  return querySnapshot.docs.map(doc => 
    this.documentToClient({ id: doc.id, ...doc.data() })
  );
}

async getRSVPsByStatus(eventId: string, status: RSVPStatus): Promise<EventRSVP[]> {
  const rsvpCollection = this.getEventRSVPCollection(eventId);
  const querySnapshot = await this.db
    .collection(rsvpCollection.path)
    .where('status', '==', status)
    .orderBy('createdAt', 'desc')
    .get();

  return querySnapshot.docs.map(doc => 
    this.documentToClient({ id: doc.id, ...doc.data() })
  );
}

async getRSVPByMember(eventId: string, memberId: string): Promise<EventRSVP | null> {
  const rsvpCollection = this.getEventRSVPCollection(eventId);
  const querySnapshot = await this.db
    .collection(rsvpCollection.path)
    .where('memberId', '==', memberId)
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  return this.documentToClient({ id: doc.id, ...doc.data() });
}

async getRSVPsByMember(memberId: string): Promise<EventRSVP[]> {
  // This requires a collection group query across all event RSVPs
  const querySnapshot = await this.db
    .collectionGroup('rsvps')
    .where('memberId', '==', memberId)
    .orderBy('createdAt', 'desc')
    .get();

  return querySnapshot.docs.map(doc => 
    this.documentToClient({ id: doc.id, ...doc.data() })
  );
}
```

### Step 4: Implement Statistics and Summary Methods

Add RSVP analytics:

```typescript
// Add to EventRSVPService class

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
  
  const statusBreakdown = allRSVPs.reduce((acc, rsvp) => {
    acc[rsvp.status] = (acc[rsvp.status] || 0) + 1;
    return acc;
  }, {} as Record<RSVPStatus, number>);

  const attendingRSVPs = allRSVPs.filter(rsvp => rsvp.status === 'yes');
  const totalPeople = attendingRSVPs.reduce((sum, rsvp) => sum + rsvp.numberOfGuests + 1, 0);

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
    spotsRemaining: event.capacity ? Math.max(0, event.capacity - summary.totalPeople) : undefined,
    isAtCapacity: event.capacity ? summary.totalPeople >= event.capacity : false,
    waitlistEnabled: event.enableWaitlist,
    waitlistCount: summary.waitlistCount,
  };
}
```

### Step 5: Implement Waitlist Management

Add waitlist processing methods:

```typescript
// Add to EventRSVPService class

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
  const sortedWaitlist = waitlistRSVPs.sort((a, b) => 
    a.createdAt.getTime() - b.createdAt.getTime()
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

async getWaitlistPosition(eventId: string, memberId: string): Promise<number | null> {
  const memberRSVP = await this.getRSVPByMember(eventId, memberId);
  if (!memberRSVP || memberRSVP.status !== 'waitlist') {
    return null;
  }

  const waitlistRSVPs = await this.getRSVPsByStatus(eventId, 'waitlist');
  const sortedWaitlist = waitlistRSVPs.sort((a, b) => 
    a.createdAt.getTime() - b.createdAt.getTime()
  );

  const position = sortedWaitlist.findIndex(rsvp => rsvp.memberId === memberId);
  return position >= 0 ? position + 1 : null;
}
```

### Step 6: Export Service Instance

Add at the bottom of the file:

```typescript
// Create and export service instance
export const eventRSVPService = new EventRSVPService();
```

### Step 7: Update Service Index

Update `src/services/firebase/index.ts`:

```typescript
// Add to existing exports
export { eventRSVPService, EventRSVPService } from './event-rsvp.service';
```

### Step 8: Validation & Testing

1. Run TypeScript compilation: `npm run typecheck`
2. Test RSVP creation and capacity checking
3. Verify waitlist functionality
4. Test statistics and summary methods

## Success Criteria

**Technical Validation:**
- [ ] TypeScript compiles without errors
- [ ] Service extends BaseFirestoreService correctly
- [ ] Subcollection pattern implemented properly
- [ ] Atomic operations work correctly
- [ ] Service exports correctly

**Functional Validation:**
- [ ] Can create and update RSVPs
- [ ] Capacity checking prevents over-registration
- [ ] Waitlist functionality works correctly
- [ ] RSVP statistics are accurate
- [ ] Member can have only one RSVP per event

**Integration Readiness:**
- [ ] Service integrates with EventsService
- [ ] Ready for UI component integration
- [ ] Error handling follows project standards
- [ ] Performance optimized for capacity checks

## Files Created/Modified

**New Files:**
- `src/services/firebase/event-rsvp.service.ts`

**Modified Files:**
- `src/services/firebase/index.ts` (add exports)

## Next Task

After completion, proceed to **PRP-2B-004: Firestore Security Rules for Events** which will secure the events and RSVP data with proper role-based access controls.

## Notes

- Uses subcollection pattern for RSVPs under events for better organization
- Implements atomic transactions for capacity management to prevent race conditions
- Waitlist processing is FIFO (first-in, first-out) based on creation time
- Statistics methods support dashboard and analytics features
- Collection group queries enable cross-event RSVP lookups for member profiles