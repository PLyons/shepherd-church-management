# Spec Tasks

These are the tasks to be completed for PRP-2B-005: Event Form Component Implementation

> Created: 2025-08-28
> Status: Ready for Implementation

## Tasks

- [ ] 1. Event Form Component Implementation
  - [ ] 1.1 Write tests for EventForm component with React Hook Form integration
  - [ ] 1.2 Create EventForm component with comprehensive validation system
  - [ ] 1.3 Implement date/time handling with all-day event support
  - [ ] 1.4 Add event type dropdown with all categories from spec
  - [ ] 1.5 Implement capacity management with optional waitlist controls
  - [ ] 1.6 Add form sections for Basic Information, Date & Time, Visibility & Access
  - [ ] 1.7 Integrate with EventsService for create/update operations
  - [ ] 1.8 Verify all EventForm tests pass and component renders correctly

- [ ] 2. Event Pages Implementation
  - [ ] 2.1 Write tests for CreateEvent and EditEvent pages with role guards
  - [ ] 2.2 Create CreateEvent page with RequireRole wrapper for admin/pastor only
  - [ ] 2.3 Create EditEvent page with event ID parameter handling
  - [ ] 2.4 Implement proper navigation and routing integration
  - [ ] 2.5 Add loading states for event data fetching in EditEvent
  - [ ] 2.6 Test role-based access restrictions work correctly
  - [ ] 2.7 Verify all page tests pass and components integrate properly

- [ ] 3. Form Utilities & Validation System
  - [ ] 3.1 Write tests for event validation utilities
  - [ ] 3.2 Create event-validation.ts with comprehensive date validation
  - [ ] 3.3 Implement future date validation (no past events)
  - [ ] 3.4 Add end-after-start date validation logic
  - [ ] 3.5 Implement one-year future limit validation
  - [ ] 3.6 Add capacity validation for positive numbers
  - [ ] 3.7 Create helper functions for date formatting and input handling
  - [ ] 3.8 Verify all validation tests pass and edge cases are covered

- [ ] 4. Integration Testing & End-to-End Validation
  - [ ] 4.1 Write integration tests for complete form submission flow
  - [ ] 4.2 Test event creation with EventsService integration
  - [ ] 4.3 Test event editing and update operations
  - [ ] 4.4 Validate form error handling and toast notifications
  - [ ] 4.5 Test responsive design across different screen sizes
  - [ ] 4.6 Verify accessibility features and keyboard navigation
  - [ ] 4.7 Test all form validation scenarios (required fields, date logic, capacity)
  - [ ] 4.8 Validate complete user journey from form to event creation/update