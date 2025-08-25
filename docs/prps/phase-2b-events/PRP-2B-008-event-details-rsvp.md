# PRP-2B-008: Event Details & RSVP Modal

**Phase**: 2B Event Calendar & Attendance System  
**Task**: 2B.8  
**Priority**: HIGH - Core user interaction for event engagement  
**Estimated Time**: 4-5 hours  

## Purpose

Implement EventDetailsModal, RSVPForm, and RSVPList components to provide comprehensive event information display and RSVP functionality. This is the primary interface for members to engage with events and for admin/pastor users to manage event details.

## Context Required

**Essential Files to Read:**
- `CLAUDE.md` - Modal patterns and form standards
- `src/components/members/profile/components/NoteEditor.tsx` - Modal pattern reference
- `docs/prps/phase-2b-events/PRP-2B-001-event-data-model.md` - RSVP types
- Output from PRP-2B-003 (`src/services/firebase/event-rsvp.service.ts`) - RSVP service

## Requirements

**Dependencies:**
- **MUST complete PRP-2B-001, PRP-2B-002, PRP-2B-003, PRP-2B-007 first**
- RSVP service functionality
- Event details display patterns

**Critical Requirements:**
1. **Event Details**: Complete event information display
2. **RSVP Form**: Member RSVP submission with guest count
3. **RSVP List**: Display of attendees (role-based visibility)
4. **Capacity Display**: Show availability and waitlist status
5. **Admin Controls**: Edit/delete actions for admin/pastor users

## Files Created/Modified

**New Files:**
- `src/components/events/EventDetailsModal.tsx`
- `src/components/events/RSVPForm.tsx`
- `src/components/events/RSVPList.tsx`
- `src/components/events/CapacityIndicator.tsx`

## Success Criteria

- [ ] Event details display correctly with all information
- [ ] RSVP form submits and updates status immediately
- [ ] Capacity limits prevent over-registration
- [ ] Waitlist functionality works when capacity reached
- [ ] Role-based controls appear appropriately

## Next Task

After completion, proceed to **PRP-2B-009: Attendance Tracking System**.

## Notes

- Follow established modal patterns for consistency
- Implement real-time RSVP updates
- Handle capacity limits gracefully with clear messaging
- Ensure accessibility for modal interactions