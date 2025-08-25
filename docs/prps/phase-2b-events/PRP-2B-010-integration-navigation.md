# PRP-2B-010: Integration & Navigation

**Phase**: 2B Event Calendar & Attendance System  
**Task**: 2B.10  
**Priority**: CRITICAL - Final integration for complete system  
**Estimated Time**: 3-4 hours  

## Purpose

Complete the Event Calendar & Attendance System integration by adding navigation, routing, dashboard widgets, and member profile integration. This final task brings together all event system components into a cohesive, fully-integrated feature.

## Context Required

**Essential Files to Read:**
- `CLAUDE.md` - Navigation and routing patterns
- `src/components/common/Navigation.tsx` - Main navigation component
- `src/router/index.tsx` - Routing configuration
- `src/pages/Dashboard.tsx` - Dashboard widget patterns
- `src/pages/MemberProfile.tsx` - Profile integration patterns
- All previous PRP outputs (2B.001-2B.009)

## Requirements

**Dependencies:**
- **MUST complete ALL previous Phase 2B PRPs (2B.001-2B.009)**
- All event system components implemented
- Navigation and routing infrastructure

**Critical Requirements:**
1. **Navigation Integration**: Add "Events" to main navigation menu
2. **Routing Setup**: Configure all event-related routes
3. **Dashboard Widgets**: Add upcoming events to role-based dashboards
4. **Member Profile Integration**: Add "My Events" section to member profiles
5. **Activity History**: Include event attendance in member activity timelines

## Detailed Procedure

### Step 1: Update Main Navigation

Modify `src/components/common/Navigation.tsx`:

```typescript
// Add to navigation items array
{
  name: 'Events',
  href: '/events',
  icon: CalendarIcon,
  roles: ['admin', 'pastor', 'member'], // All authenticated users
},
```

### Step 2: Configure Event Routes  

Update `src/router/index.tsx`:

```typescript
// Add event-related routes
{
  path: '/events',
  element: <Events />,
  meta: { requiresAuth: true }
},
{
  path: '/events/create',
  element: <CreateEvent />,
  meta: { requiresAuth: true, allowedRoles: ['admin', 'pastor'] }
},
{
  path: '/events/:id/edit',
  element: <EditEvent />,
  meta: { requiresAuth: true, allowedRoles: ['admin', 'pastor'] }
},
{
  path: '/events/:id',
  element: <EventDetails />,
  meta: { requiresAuth: true }
},
{
  path: '/events/:id/attendance',
  element: <AttendanceTracker />,
  meta: { requiresAuth: true, allowedRoles: ['admin', 'pastor'] }
},
```

### Step 3: Add Dashboard Event Widgets

Update dashboard components to include event widgets:

```typescript
// For admin/pastor dashboards
<EventsWidget
  title="Upcoming Events"
  events={upcomingEvents}
  showManagementActions={true}
/>

// For member dashboards  
<EventsWidget
  title="My Upcoming Events"
  events={myEvents}
  showRSVPActions={true}
/>
```

### Step 4: Integrate with Member Profiles

Add event sections to member profile:

```typescript
// Add to MemberProfileTabs
<Tab key="events" title="Events">
  <MemberEventsTab memberId={member.id} />
</Tab>
```

### Step 5: Update Activity History

Integrate event attendance into activity timeline:

```typescript
// Add to activity service
async getMemberEventHistory(memberId: string): Promise<Activity[]> {
  // Fetch RSVPs and attendance records for member
  // Convert to Activity format for timeline display
}
```

## Success Criteria

**Navigation Integration:**
- [ ] "Events" menu item appears for all authenticated users
- [ ] Event navigation works from all main pages
- [ ] Breadcrumb navigation functions correctly
- [ ] Role-based menu items display appropriately

**Routing Integration:**
- [ ] All event routes function correctly
- [ ] Route protection works for admin/pastor routes
- [ ] URL patterns are consistent and intuitive
- [ ] Navigation between event pages is seamless

**Dashboard Integration:**
- [ ] Upcoming events widget displays on dashboards
- [ ] Role-specific event widgets show appropriate content
- [ ] Dashboard event actions work correctly
- [ ] Event statistics display accurately

**Member Profile Integration:**
- [ ] "My Events" section shows member's RSVPs and attendance
- [ ] Event attendance appears in activity timeline
- [ ] RSVP history is accessible from member profiles
- [ ] Event engagement metrics are available

**System Integration:**
- [ ] Event system works cohesively with existing features
- [ ] Performance is acceptable with event data loaded
- [ ] Error handling works across all integration points
- [ ] User experience is smooth and intuitive

## Files Created/Modified

**Modified Files:**
- `src/components/common/Navigation.tsx` (add Events menu)
- `src/router/index.tsx` (add event routes)
- `src/pages/Dashboard.tsx` (add event widgets)
- `src/pages/MemberProfile.tsx` (add events integration)
- `src/services/firebase/activity.service.ts` (add event activities)

**New Files:**
- `src/components/events/EventsWidget.tsx`
- `src/components/members/profile/tabs/MemberEventsTab.tsx`
- `src/pages/EventDetails.tsx` (if not created in previous PRPs)

## Final Validation

After completing this task, perform comprehensive testing:

1. **Create a test event** through the form interface
2. **RSVP to the event** as different user roles  
3. **View the event** in calendar and list views
4. **Record attendance** as admin/pastor
5. **Verify dashboard** widgets display correctly
6. **Check member profile** integration works
7. **Test navigation** flows between all event pages

## Phase 2B Completion

Upon successful completion of this PRP:
- ✅ **Phase 2B Event Calendar & Attendance System** - COMPLETE
- ✅ **MVP Progress**: Advanced from 50% to 66.7% completion
- ✅ **Next Phase**: Ready to begin Phase 2C (Donation Tracking & Reporting)

## Notes

- This task completes the entire Event Calendar & Attendance System
- Focus on seamless integration with existing Shepherd features
- Ensure consistent user experience across all touchpoints
- Document any discovered integration issues for future phases
- Celebrate completion of major MVP milestone!