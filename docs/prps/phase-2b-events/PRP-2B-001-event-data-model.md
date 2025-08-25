# PRP-2B-001: Event Data Model & Types

**Phase**: 2B Event Calendar & Attendance System  
**Task**: 2B.1  
**Priority**: CRITICAL - Foundation for all event functionality  
**Estimated Time**: 2-3 hours  

## Purpose

Establish the TypeScript data model foundation for the Event Calendar & Attendance System. This includes defining Event, EventRSVP, and EventAttendance interfaces that follow Shepherd's existing type patterns and provide comprehensive event management capabilities.

## Context Required

**Essential Files to Read:**
- `CLAUDE.md` - Project standards and type safety requirements
- `src/types/index.ts` - Existing Member and core type patterns
- `src/types/firestore.ts` - Existing Household interface pattern
- `src/utils/firestore-converters.ts` - Type conversion patterns

**Key Patterns to Follow:**
- Strict TypeScript typing (NEVER use `any`)
- camelCase for all TypeScript interfaces
- Firestore Timestamp handling for dates
- Role-based access control fields
- Consistent ID field naming

## Requirements

**Dependencies:**
- No implementation dependencies (foundation task)
- Must align with existing type architecture

**Critical Requirements:**
1. **Type Safety**: All interfaces must be strongly typed
2. **Extensibility**: Design for future enhancements (recurring events, categories)
3. **Role Integration**: Support admin/pastor/member role-based access
4. **Firestore Compatibility**: Types must work with Firebase converters

## Detailed Procedure

### Step 1: Create Event Interface

Create `src/types/events.ts` with comprehensive Event interface:

```typescript
export interface Event {
  // Core identification
  id: string;
  
  // Basic information
  title: string;
  description: string;
  location: string;
  
  // Temporal data
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  
  // Event classification
  eventType: EventType;
  isPublic: boolean;
  requiredRoles: Role[];
  
  // Capacity management
  capacity?: number;
  enableWaitlist: boolean;
  
  // Recurrence (future enhancement foundation)
  recurrence?: RecurrencePattern;
  
  // Administrative
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Member ID
  
  // Status
  isActive: boolean;
  isCancelled: boolean;
  cancellationReason?: string;
}
```

### Step 2: Define Supporting Enums and Types

Add comprehensive enums:

```typescript
export type EventType = 
  | 'service'
  | 'bible_study'
  | 'prayer_meeting'
  | 'youth_group'
  | 'seniors_group'
  | 'womens_ministry'
  | 'mens_ministry'
  | 'special_event'
  | 'outreach'
  | 'volunteer_activity'
  | 'board_meeting'
  | 'training'
  | 'other';

export type Role = 'admin' | 'pastor' | 'member';

export type RecurrencePattern = {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every N days/weeks/months/years
  endDate?: Date;
  maxOccurrences?: number;
};
```

### Step 3: Create RSVP Interface

Define EventRSVP interface:

```typescript
export interface EventRSVP {
  id: string;
  eventId: string;
  memberId: string;
  
  // RSVP details
  status: RSVPStatus;
  responseDate: Date;
  numberOfGuests: number;
  notes?: string;
  
  // Administrative
  createdAt: Date;
  updatedAt: Date;
}

export type RSVPStatus = 'yes' | 'no' | 'maybe' | 'waitlist';
```

### Step 4: Create Attendance Interface

Define EventAttendance interface:

```typescript
export interface EventAttendance {
  id: string;
  eventId: string;
  memberId: string;
  
  // Check-in details
  checkInTime: Date;
  checkInBy: string; // Member ID of person recording attendance
  checkOutTime?: Date;
  
  // Attendance details
  numberOfGuests: number;
  notes?: string;
  
  // Verification
  isVerified: boolean;
  verifiedBy?: string; // Member ID
  
  // Administrative
  createdAt: Date;
  updatedAt: Date;
}
```

### Step 5: Create Form Data Interfaces

Add form-specific interfaces for UI components:

```typescript
export interface EventFormData {
  title: string;
  description: string;
  location: string;
  startDate: string; // ISO string for form handling
  endDate: string;
  isAllDay: boolean;
  eventType: EventType;
  isPublic: boolean;
  requiredRoles: Role[];
  capacity?: number;
  enableWaitlist: boolean;
}

export interface RSVPFormData {
  status: RSVPStatus;
  numberOfGuests: number;
  notes?: string;
}
```

### Step 6: Update Type Exports

Update `src/types/index.ts` to export new types:

```typescript
// Add to existing exports
export * from './events';
```

### Step 7: Validation & Testing

1. Run TypeScript compilation: `npm run typecheck`
2. Verify no errors in type definitions
3. Test import/export chain works correctly

## Success Criteria

**Technical Validation:**
- [ ] TypeScript compiles without errors
- [ ] All interfaces follow camelCase convention
- [ ] No use of `any` types
- [ ] Proper Date type usage for temporal fields
- [ ] Consistent ID field naming

**Architectural Validation:**
- [ ] Types support role-based access control
- [ ] Event capacity management possible
- [ ] RSVP workflow supported
- [ ] Attendance tracking enabled
- [ ] Future recurrence enhancement ready

**Integration Readiness:**
- [ ] Types exported correctly from `src/types/index.ts`
- [ ] Compatible with Firestore converter pattern
- [ ] Form data interfaces ready for React Hook Form

## Files Created/Modified

**New Files:**
- `src/types/events.ts`

**Modified Files:**
- `src/types/index.ts` (add exports)

## Next Task

After completion, proceed to **PRP-2B-002: Events Firebase Service** which will implement the service layer using these type definitions.

## Notes

- This task is foundational - all subsequent Phase 2B tasks depend on these type definitions
- Event types can be expanded based on church needs
- Recurrence pattern is designed for future enhancement
- All timestamps will be converted to Firestore Timestamps in service layer