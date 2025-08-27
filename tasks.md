# Spec Tasks

These are the tasks to implement an enhanced RSVP modal system that will replace or enhance the current inline RSVP buttons in EventCard with a comprehensive modal interface.

> Created: 2025-08-27
> Status: Ready for Implementation

## Tasks

- [x] 1. RSVP Modal Component Foundation
  - [x] 1.1 Write tests for RSVPModal component structure and props
  - [x] 1.2 Create RSVPModal component in `/src/components/events/RSVPModal.tsx`
  - [x] 1.3 Implement modal base structure with proper accessibility (ARIA labels, focus management)
  - [x] 1.4 Add responsive design for desktop-first approach
  - [x] 1.5 Integrate with existing modal/overlay system or create one if needed
  - [x] 1.6 Add proper TypeScript interfaces for RSVPModalProps
  - [x] 1.7 Implement modal open/close states with proper escape key and backdrop handling
  - [x] 1.8 Verify all RSVPModal foundation tests pass

- [x] 2. RSVP Form Implementation
  - [x] 2.1 Write tests for RSVP form validation and submission logic
  - [x] 2.2 Create form using React Hook Form following existing patterns
  - [x] 2.3 Implement RSVP status selection (Yes/No/Maybe) with enhanced UI
  - [x] 2.4 Add guest count input field with validation (min: 0, max: reasonable limit)
  - [x] 2.5 Implement notes/comments textarea for additional information
  - [x] 2.6 Add dietary restrictions or special needs field
  - [x] 2.7 Create form validation rules following project patterns
  - [x] 2.8 Implement proper error handling and display
  - [x] 2.9 Verify all RSVP form tests pass

- [x] 3. EventRSVPService Integration
  - [x] 3.1 Write tests for modal service integration and capacity handling
  - [x] 3.2 Integrate modal with existing EventRSVPService methods
  - [x] 3.3 Implement capacity checking and waitlist logic in modal
  - [x] 3.4 Add real-time capacity updates and availability display
  - [x] 3.5 Implement waitlist position display when applicable
  - [x] 3.6 Add loading states during RSVP operations
  - [x] 3.7 Implement optimistic UI updates with rollback on error
  - [x] 3.8 Add proper toast notifications following existing patterns
  - [x] 3.9 Verify all service integration tests pass

- [x] 4. EventCard Modal Integration
  - [x] 4.1 Write tests for EventCard modal trigger and state management
  - [x] 4.2 Replace inline RSVP buttons with "RSVP" button that opens modal
  - [x] 4.3 Maintain existing RSVP status display for quick reference
  - [x] 4.4 Add modal trigger state management in EventCard
  - [x] 4.5 Implement proper props passing between EventCard and RSVPModal
  - [x] 4.6 Preserve existing EventCard functionality for past events
  - [x] 4.7 Update EventCard styling to accommodate new RSVP button
  - [x] 4.8 Ensure proper cleanup and state management
  - [x] 4.9 Verify all EventCard integration tests pass

- [ ] 5. Enhanced UX Features and Polish
  - [ ] 5.1 Write tests for advanced modal features and edge cases
  - [ ] 5.2 Add event details display within modal (date, time, location, capacity)
  - [ ] 5.3 Implement RSVP history/previous responses if changing status
  - [ ] 5.4 Add confirmation dialog for changing from "Yes" to "No" if event is soon
  - [ ] 5.5 Implement smart defaults (pre-fill guest count from previous RSVPs)
  - [ ] 5.6 Add keyboard navigation and improved accessibility
  - [ ] 5.7 Implement modal animations and transitions
  - [ ] 5.8 Add mobile responsiveness optimization
  - [ ] 5.9 Perform comprehensive testing across all user roles (admin/pastor/member)
  - [ ] 5.10 Verify all enhanced UX tests pass and system integration works end-to-end