# PRP-2B-006: Event List & Cards

**Phase**: 2B Event Calendar & Attendance System  
**Task**: 2B.6  
**Priority**: HIGH - Core UI for event browsing and management  
**Estimated Time**: 4-5 hours  

## Purpose

Implement EventCard and EventList components for browsing, filtering, and managing events. This will provide the primary interface for users to discover events and for admin/pastor users to manage event listings with RSVP status and quick actions.

## Context Required

**Essential Files to Read:**
- `CLAUDE.md` - Component patterns and responsive design standards
- `src/pages/Members.tsx` - List/grid layout patterns
- `src/components/households/HouseholdCard.tsx` - Card component patterns
- `docs/prps/phase-2b-events/PRP-2B-001-event-data-model.md` - Event types
- Output from PRP-2B-002 (`src/services/firebase/events.service.ts`) - Events service
- Output from PRP-2B-003 (`src/services/firebase/event-rsvp.service.ts`) - RSVP service

## Requirements

**Dependencies:**
- **MUST complete PRP-2B-001, PRP-2B-002, PRP-2B-003, PRP-2B-005 first**
- Event and RSVP services functional
- Event form components available

**Critical Requirements:**
1. **Event Cards**: Professional display with key information and actions
2. **Filtering**: By event type, date range, and attendance status
3. **RSVP Integration**: Show user's RSVP status and quick RSVP actions
4. **Role-Based Actions**: Admin/pastor management controls
5. **Responsive Design**: Works across all device sizes

## Files Created/Modified

**New Files:**
- `src/components/events/EventCard.tsx`
- `src/components/events/EventList.tsx`
- `src/components/events/EventFilters.tsx`
- `src/pages/Events.tsx`

## Success Criteria

- [ ] Events display in responsive card layout
- [ ] Filtering works correctly for all criteria
- [ ] RSVP status shows and updates in real-time
- [ ] Role-based actions appear for admin/pastor users
- [ ] Loading and error states handle gracefully

## Next Task

After completion, proceed to **PRP-2B-007: Calendar View Component**.

## Notes

- Follow established card component patterns
- Implement comprehensive filtering for event discovery
- Integrate RSVP functionality for member engagement
- Ensure responsive design for all screen sizes