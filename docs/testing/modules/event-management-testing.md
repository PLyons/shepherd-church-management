# Event Management Testing

## Module Overview

The Event Management module provides comprehensive tools for church event planning, coordination, and attendance tracking. This includes calendar views, event creation and editing, RSVP functionality, attendance management, and visibility controls for public and private events.

### Key Components
- **Event Calendar**: Monthly calendar view with event display
- **Event List**: Chronological listing of upcoming and past events
- **Event Details**: Individual event pages with full information
- **RSVP System**: Member response tracking and management
- **Event Creation**: Admin/Pastor event setup and configuration
- **Attendance Tracking**: Check-in and attendance reporting
- **Visibility Controls**: Public vs private event access

### Permission Levels
- **Admin/Pastor**: Full event management, creation, editing, attendance tracking
- **Member**: View events, RSVP to public events, view own RSVPs
- **Public**: View public events only (if anonymous access enabled)

## Test Scenarios

### TS-EVENT-001: Event Calendar Display

**Objective**: Verify event calendar displays correctly with proper navigation and event visibility

**Preconditions**: 
- User is logged in with appropriate role
- Test events exist across multiple months
- Calendar view is accessible

**Test Steps**:
1. Navigate to Events page (`/events`)
2. Verify calendar view loads with current month
3. Check calendar navigation:
   - Previous month button functions
   - Next month button functions
   - Month/year display is accurate
   - Today's date is highlighted
4. Verify event display on calendar:
   - Events appear on correct dates
   - Event titles are visible
   - Multiple events on same date handled
   - Color coding for event types (if implemented)
5. Test event interaction:
   - Click on event to view details
   - Hover effects show additional info
   - Calendar remains responsive
6. Test calendar on different screen sizes:
   - Desktop calendar layout
   - Tablet responsive design
   - Mobile calendar display

**Expected Results**:
- Calendar displays current month accurately
- Navigation between months works smoothly
- Events appear on correct dates
- Event details accessible from calendar
- Responsive design functions on all devices
- Loading performance is acceptable (< 3 seconds)

**Test Data**:
- Events scheduled across multiple months
- Various event types and durations
- Public and private events (role-dependent visibility)

**Pass Criteria**: Calendar displays accurately with functional navigation and event access

---

### TS-EVENT-002: Event List View and Filtering

**Objective**: Verify event list displays correctly with filtering and search capabilities

**Preconditions**:
- Multiple events exist with different characteristics
- Event list view is accessible
- User has appropriate viewing permissions

**Test Steps**:
1. Navigate to event list view (if separate from calendar)
2. Verify all events display with essential information:
   - Event title
   - Date and time
   - Location
   - RSVP count (if applicable)
   - Public/Private status indicator
3. Test event filtering options:
   - Filter by upcoming events only
   - Filter by past events only
   - Filter by event type (if categories exist)
   - Filter by public/private status
4. Test event search functionality:
   - Search by event title
   - Search by location
   - Search by date range
5. Test sorting options:
   - Sort by date (ascending/descending)
   - Sort by title alphabetically
   - Sort by RSVP count
6. Verify pagination (if applicable):
   - Navigate through event pages
   - Items per page settings
   - Total count display

**Expected Results**:
- All events display with complete information
- Filtering reduces list to matching events
- Search returns relevant results
- Sorting functions correctly
- Pagination works smoothly
- List updates in real-time

**Test Data**:
- Events with various dates (past, present, future)
- Events with different locations and types
- Events with varying RSVP counts

**Pass Criteria**: Event list displays accurately with functional filtering and search

---

### TS-EVENT-003: Event Detail Page Display

**Objective**: Verify individual event pages display complete information and functionality

**Preconditions**:
- Event exists with complete information
- User has access to view event details
- Event detail page is accessible

**Test Steps**:
1. Click on event from calendar or list
2. Verify navigation to event detail page (`/events/{id}`)
3. Check event information display:
   - Event title and description
   - Date and time (formatted properly)
   - Location with map link (if applicable)
   - Event organizer/contact information
   - Event category/type
   - Public/Private status
4. Verify RSVP section:
   - Current RSVP count displayed
   - RSVP options available (Yes/No/Maybe)
   - User's current RSVP status shown
   - RSVP deadline information (if applicable)
5. Check attendee information (role-dependent):
   - List of attendees (Admin/Pastor view)
   - RSVP breakdown by response type
   - Contact information for organizers
6. Test action buttons:
   - RSVP buttons function correctly
   - Edit event (Admin/Pastor only)
   - Share event (if available)
   - Add to calendar (if available)

**Expected Results**:
- All event details display accurately
- RSVP functionality works correctly
- Role-based information access enforced
- Action buttons function properly
- Page loads quickly (< 3 seconds)
- Mobile layout is functional

**Test Data**:
- Event with complete information
- Event with existing RSVPs
- Public and private events

**Pass Criteria**: Event details display completely with functional RSVP system

---

### TS-EVENT-004: RSVP Functionality

**Objective**: Verify RSVP system works correctly for member participation tracking

**Preconditions**:
- User is logged in as Member (or higher role)
- Public event exists accepting RSVPs
- RSVP system is enabled

**Test Steps**:
1. Navigate to event detail page
2. Verify RSVP options are available:
   - "Yes" - Will attend
   - "No" - Will not attend  
   - "Maybe" - Might attend
3. Test RSVP submission:
   - Click "Yes" and verify confirmation
   - Change to "No" and verify update
   - Change to "Maybe" and verify update
4. Verify RSVP persistence:
   - Refresh page and confirm RSVP status
   - Navigate away and return
   - Check RSVP from different device/browser
5. Test RSVP restrictions:
   - Verify only logged-in users can RSVP
   - Confirm private events require access
   - Check RSVP deadline enforcement (if applicable)
6. Test RSVP display updates:
   - Verify total count updates immediately
   - Confirm user appears in attendee list
   - Check RSVP status indicators

**Expected Results**:
- RSVP options clearly available
- RSVP changes save immediately
- Status persists across sessions
- Unauthorized access properly restricted
- RSVP counts update in real-time
- User feedback confirms actions

**Test Data**:
- Public events accepting RSVPs
- Private events with restricted access
- Events with RSVP deadlines

**Pass Criteria**: RSVP system functions reliably with immediate updates and persistence

---

### TS-EVENT-005: Event Creation (Admin/Pastor)

**Objective**: Verify authorized users can create new events with all required information

**Preconditions**:
- User logged in as Admin or Pastor
- Event creation form is accessible
- Calendar system is functional

**Test Steps**:
1. Navigate to Events page
2. Click "Create New Event" or similar button
3. Verify event creation form displays with fields:
   - Event title (required)
   - Event description
   - Start date and time
   - End date and time  
   - Location/venue
   - Event category/type
   - Public/Private visibility
   - RSVP enabled toggle
   - Maximum attendees (if applicable)
4. Fill out complete event information:
   - Title: "Test Community Event"
   - Description: "Testing event creation workflow"
   - Date: [Future date]
   - Time: "7:00 PM - 9:00 PM"
   - Location: "Main Sanctuary"
   - Type: "Community Event"
   - Visibility: "Public"
   - RSVP: "Enabled"
5. Test form validation:
   - Submit with missing required fields
   - Enter invalid date formats
   - Test end time before start time
6. Submit form and verify:
   - Success message displays
   - Event appears in calendar
   - Event detail page accessible
   - All information saves correctly

**Expected Results**:
- Event creation form accessible to authorized roles
- All form fields function properly
- Validation prevents invalid data entry
- New event saves successfully
- Event immediately visible in calendar
- Event details accurate and complete

**Test Data**:
- Complete event information
- Invalid data for validation testing
- Various event types and configurations

**Pass Criteria**: New events created successfully with proper validation and immediate visibility

---

### TS-EVENT-006: Event Editing (Admin/Pastor)

**Objective**: Verify authorized users can edit existing events correctly

**Preconditions**:
- User logged in as Admin or Pastor
- Existing event available for editing
- Event has existing RSVPs (for testing impact)

**Test Steps**:
1. Navigate to existing event detail page
2. Click "Edit Event" button
3. Verify edit form loads with current data:
   - All fields pre-populated with existing values
   - Same form structure as creation
   - Edit-specific options (if any)
4. Test field modifications:
   - Change event title
   - Update description
   - Modify date/time
   - Change location
   - Toggle public/private status
   - Modify RSVP settings
5. Test validation on edits:
   - Invalid date ranges
   - Required field removal
   - Conflicting settings
6. Save changes and verify:
   - Success message displays
   - Changes reflect in event details
   - Calendar updates immediately
   - RSVPs remain intact (if appropriate)
7. Test cancel functionality:
   - Make changes but cancel
   - Verify no changes saved

**Expected Results**:
- Edit form loads with current data
- All fields can be modified appropriately
- Changes save successfully
- Event updates reflect immediately
- Existing RSVPs handled properly
- Cancel function works without saving

**Test Data**:
- Event with complete information
- Event with existing RSVPs
- Various modification scenarios

**Pass Criteria**: Event editing works correctly with proper data persistence and RSVP handling

---

### TS-EVENT-007: Event Deletion and Management (Admin/Pastor)

**Objective**: Verify event deletion and advanced management features work correctly

**Preconditions**:
- User logged in as Admin or Pastor
- Test events available for deletion
- Events with and without RSVPs exist

**Test Steps**:
1. Navigate to event that can be deleted
2. Access deletion option (button or menu)
3. Test deletion warnings:
   - Warning for events with RSVPs
   - Confirmation dialog appears
   - Option to cancel deletion
4. Test deletion scenarios:
   - Delete event without RSVPs
   - Delete event with existing RSVPs
   - Cancel deletion process
5. Verify deletion results:
   - Event removed from calendar
   - Event detail page inaccessible
   - RSVPs properly handled
   - No broken links remain
6. Test bulk operations (if available):
   - Select multiple events
   - Bulk delete functionality
   - Bulk status changes
7. Verify data integrity:
   - Related data cleaned up
   - No orphaned records
   - Audit trail maintained (if applicable)

**Expected Results**:
- Deletion warnings appear appropriately
- Confirmation required for deletion
- Events removed completely from system
- RSVPs handled gracefully
- Data integrity maintained
- No broken references remain

**Test Data**:
- Events with no RSVPs
- Events with multiple RSVPs
- Events with complex relationships

**Pass Criteria**: Event deletion works safely with proper warnings and data cleanup

---

### TS-EVENT-008: Public vs Private Event Access

**Objective**: Verify public and private event visibility controls work correctly

**Preconditions**:
- Both public and private events exist
- Users with different roles available
- Anonymous access scenarios testable

**Test Steps**:
1. Test Admin/Pastor access:
   - Can view all events (public and private)
   - Can edit all events
   - Can see complete attendee lists
2. Test Member access:
   - Can view public events
   - Can view private events they're invited to
   - Cannot access restricted private events
   - Can RSVP to accessible events
3. Test anonymous access (if applicable):
   - Can view public events only
   - Cannot access private events
   - Cannot RSVP without login
   - Prompted to login for restricted actions
4. Test visibility controls:
   - Public events appear in public listings
   - Private events hidden from unauthorized users
   - Event detail pages respect access controls
   - Search results filter by access level
5. Verify access control enforcement:
   - Direct URL access to private events blocked
   - API endpoints respect permissions
   - Role changes reflect immediately

**Expected Results**:
- Public events accessible to all appropriate users
- Private events restricted to authorized users
- Access controls enforced consistently
- Anonymous users handled appropriately
- Role-based access works correctly
- No unauthorized access possible

**Test Data**:
- Public events visible to all
- Private events with restricted access
- Various user roles and permissions

**Pass Criteria**: Event visibility controls work correctly with no unauthorized access

---

### TS-EVENT-009: Event Attendance Tracking (Admin/Pastor)

**Objective**: Verify attendance tracking and reporting functionality

**Preconditions**:
- User logged in as Admin or Pastor
- Events with RSVPs exist
- Attendance tracking is enabled

**Test Steps**:
1. Navigate to event with existing RSVPs
2. Access attendance tracking features:
   - Check-in interface (if available)
   - Attendee management
   - Attendance reporting
3. Test check-in functionality:
   - Mark attendees as present
   - Handle no-shows
   - Add walk-in attendees
4. Test attendance reporting:
   - View attendance statistics
   - Generate attendance reports
   - Export attendee lists
5. Verify data accuracy:
   - RSVP vs actual attendance
   - Attendance counts correct
   - Member attendance history
6. Test attendance modifications:
   - Correct check-in errors
   - Add late arrivals
   - Remove incorrect entries

**Expected Results**:
- Check-in process is intuitive
- Attendance data saves accurately
- Reports generate correctly
- Statistics match actual data
- Modifications work properly
- Data export functions correctly

**Test Data**:
- Events with various RSVP responses
- Mix of members and non-members
- Different attendance scenarios

**Pass Criteria**: Attendance tracking functions accurately with reliable reporting

---

### TS-EVENT-010: Event Search and Discovery

**Objective**: Verify users can effectively find and discover relevant events

**Preconditions**:
- Multiple events with diverse characteristics exist
- Search functionality is available
- Different event categories/types exist

**Test Steps**:
1. Test event search functionality:
   - Search by event title
   - Search by location
   - Search by description keywords
   - Search by date range
2. Test event filtering:
   - Filter by event type/category
   - Filter by upcoming vs past events
   - Filter by RSVP status (user's RSVPs)
   - Filter by public/private events
3. Test event discovery features:
   - Featured events display
   - Recommended events (if applicable)
   - Related events suggestions
   - Popular events ranking
4. Test search performance:
   - Search response time
   - Search result relevance
   - Search result ordering
5. Verify search accessibility:
   - Search available on all event pages
   - Auto-complete functionality (if available)
   - Search history (if applicable)

**Expected Results**:
- Search returns relevant results quickly
- Filtering works accurately
- Discovery features help users find events
- Search performance is acceptable
- Results ordered logically
- Search interface is intuitive

**Test Data**:
- Events with varied titles and descriptions
- Events in different locations
- Events of different types and categories

**Pass Criteria**: Event search and discovery enables users to find relevant events effectively

---

## Cross-Module Integration Tests

### TS-EVENT-INT-001: Event to Member Integration
**Objective**: Verify event data integrates correctly with member management
- Member RSVP tracking in member profiles
- Event attendance history for members
- Member communication about events

### TS-EVENT-INT-002: Event to Volunteer Integration
**Objective**: Verify events integrate with volunteer management
- Volunteer opportunities linked to events
- Event-based volunteer scheduling
- Volunteer check-in during events

### TS-EVENT-INT-003: Event to Dashboard Integration
**Objective**: Verify event data appears correctly in dashboard
- Upcoming events display on dashboard
- Event statistics accurate
- Quick event creation from dashboard

## Performance Benchmarks

- **Calendar Load**: < 3 seconds for month view
- **Event Search**: < 1 second response time
- **Event Detail Load**: < 2 seconds
- **RSVP Response**: < 1 second
- **Event Creation**: < 3 seconds
- **Attendance Check-in**: < 1 second per person

## Business Rules

### Event Scheduling
- **Start Time**: Must be in the future for new events
- **End Time**: Must be after start time
- **Duration**: Reasonable event duration limits

### RSVP Management
- **Deadline**: RSVPs may have cutoff dates
- **Capacity**: Events may have maximum attendance limits
- **Changes**: Users can modify RSVPs until deadline

### Access Control
- **Public Events**: Visible to all users
- **Private Events**: Restricted to invited members
- **Member Events**: Accessible to church members only

## Common Issues and Solutions

### Event Not Appearing in Calendar
- **Check**: Event date and time settings
- **Verify**: Public/Private visibility settings
- **Action**: Refresh calendar or check event status

### Cannot RSVP to Event
- **Check**: User login status
- **Verify**: Event access permissions
- **Action**: Login or contact organizer for access

### RSVP Changes Not Saving
- **Check**: Network connectivity
- **Verify**: RSVP deadline hasn't passed
- **Action**: Retry submission or contact support

### Event Details Not Loading
- **Check**: Event ID and URL validity
- **Verify**: Event still exists and is accessible
- **Action**: Return to event list and try again

---

**Module Testing Status**: ⚠️ In Progress  
**Last Updated**: July 17, 2025  
**Critical Test Count**: 10  
**Integration Test Count**: 3  
**Estimated Testing Time**: 6-8 hours