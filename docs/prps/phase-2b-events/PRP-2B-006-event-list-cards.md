# PRP-2B-006: Event List & Cards Component Implementation

**Phase**: 2B Event Calendar & Attendance System  
**Task**: 2B.6  
**Priority**: HIGH - Core UI for event browsing and management  
**Estimated Time**: 6-7 hours  

## Purpose

Implement enhanced, reusable EventCard and EventList components for desktop-optimized event browsing, filtering, and administrative management. This provides the primary interface for event discovery and streamlined desktop administrative workflows with comprehensive RSVP management.

## Problem Statement

### Current State
- Basic `Events.tsx` page with embedded event listing functionality
- Single `EventCard.tsx` component with limited administrative features  
- Components are page-bound and not reusable across the application
- Limited desktop workflow optimization for administrative users

### Target State
- **Reusable Components**: EventList component extractable for dashboards, member profiles, and other contexts
- **Enhanced EventCard**: Desktop-optimized with comprehensive administrative features
- **Multiple Display Modes**: Grid, list, agenda views optimized for desktop screens
- **Administrative Efficiency**: Streamlined desktop workflows for pastors and admins
- **Performance Optimization**: Virtual scrolling and efficient rendering for large event datasets

## Context Required

**Essential Files to Read:**
- `CLAUDE.md` - Desktop-first design standards and component patterns
- `src/pages/Events.tsx` - Current event listing implementation
- `src/components/events/EventCard.tsx` - Existing card component
- `src/pages/Members.tsx` - Desktop list/grid layout patterns
- `src/components/households/HouseholdCard.tsx` - Card component patterns
- `docs/prps/phase-2b-events/PRP-2B-001-event-data-model.md` - Event types and data models
- `src/services/firebase/events.service.ts` - Events service operations
- `src/services/firebase/event-rsvp.service.ts` - RSVP service integration

## Requirements

**Dependencies:**
- **MUST complete PRP-2B-001, PRP-2B-002, PRP-2B-003, PRP-2B-005 first**
- Event and RSVP services functional
- EventForm components available
- Desktop-first design patterns established

**Critical Requirements:**
1. **Desktop-Optimized EventCards**: Professional display with comprehensive information density for desktop screens
2. **Reusable EventList Component**: Extractable from current page implementation with configurable display modes
3. **Advanced Filtering**: By event type, date range, RSVP status, and visibility settings
4. **Real-time RSVP Integration**: Live status updates with one-click RSVP functionality
5. **Administrative Controls**: Desktop-optimized bulk operations and quick actions for admin/pastor roles
6. **Performance Optimization**: Virtual scrolling and memoization for large datasets
7. **Multiple Display Modes**: Grid, list, agenda views optimized for desktop administrative workflows

## Technical Specifications

### Component Architecture

#### EventList Component
```typescript
interface EventListProps {
  events: Event[]
  currentMember: Member
  canManageEvents: boolean
  displayMode: 'grid' | 'list' | 'agenda' | 'compact'
  filters?: EventFiltersState
  searchTerm?: string
  onEventUpdate: () => void
  maxEvents?: number
  showFilters?: boolean
  enableVirtualization?: boolean
}
```

#### Enhanced EventCard Component
```typescript
interface EventCardProps {
  event: Event
  currentMember: Member
  canManageEvents: boolean
  displayMode: 'full' | 'compact' | 'minimal'
  showRSVPButton: boolean
  onEventUpdate: () => void
  enableQuickActions?: boolean
}
```

### Desktop Workflow Features

1. **Information Density Optimization**: Leverage desktop screen real estate for comprehensive event information display
2. **Keyboard Navigation**: Full keyboard navigation support for administrative efficiency
3. **Bulk Operations**: Multi-select functionality for administrative batch operations
4. **Quick Actions**: Hover-based and context menu actions for rapid event management
5. **Wide Screen Layouts**: Optimized for desktop monitors and administrative workstations

### Performance Considerations

- **Virtual Scrolling**: React-window implementation for rendering 100+ events efficiently
- **Memoization**: React.memo and useMemo for preventing unnecessary re-renders
- **Lazy Loading**: Progressive loading of event details and RSVP data
- **Real-time Updates**: Optimized Firestore listeners with debouncing

## Files Created/Modified

**Enhanced Files:**
- `src/components/events/EventCard.tsx` - Desktop-optimized with enhanced features
- `src/components/events/EventFilters.tsx` - Advanced filtering capabilities
- `src/pages/Events.tsx` - Refactored to use reusable EventList component

**New Files:**
- `src/components/events/EventList.tsx` - Reusable list component with multiple display modes
- `src/components/events/EventDisplayModeToggle.tsx` - Desktop view mode switcher
- `src/hooks/useEventVirtualization.ts` - Performance optimization hook

## Success Criteria

### Core Functionality
- [ ] EventList component renders events in grid, list, agenda, and compact modes
- [ ] EventCard displays comprehensive event information optimized for desktop viewing
- [ ] Advanced filtering works correctly for all criteria (type, date range, RSVP status, visibility)
- [ ] Real-time RSVP status updates and one-click RSVP functionality
- [ ] Role-based administrative actions appear for admin/pastor users
- [ ] Loading and error states handle gracefully with appropriate feedback

### Desktop Optimization
- [ ] Components utilize full desktop screen width effectively
- [ ] Information density appropriate for desktop administrative workflows
- [ ] Keyboard navigation works throughout all components
- [ ] Quick actions accessible via hover states and context menus
- [ ] Bulk selection and operations functional for administrative users

### Performance
- [ ] Virtual scrolling handles 100+ events without performance degradation
- [ ] Component re-renders minimized through proper memoization
- [ ] Real-time updates don't cause unnecessary re-renders
- [ ] Initial load time optimized for large event datasets

### Reusability
- [ ] EventList component successfully integrates into dashboard views
- [ ] EventCard component reusable across different contexts
- [ ] Props interface supports various use cases and configurations
- [ ] Components maintain consistent behavior across different parent components

## Implementation Challenges & Solutions

### Challenge 1: Performance with Large Event Sets
**Solution**: Implement react-window virtual scrolling with intelligent item sizing based on display mode

### Challenge 2: Complex State Management
**Solution**: Use React Context for RSVP state management across multiple cards with optimistic updates

### Challenge 3: Role-based Feature Complexity
**Solution**: Create role-based hooks that return appropriate action sets and visibility rules

### Challenge 4: Desktop Workflow Efficiency
**Solution**: Implement keyboard shortcuts, bulk operations, and context menus for administrative tasks

## Next Task

After completion, proceed to **PRP-2B-007: Calendar View Component**.

## Notes

- **Desktop-First**: All components optimized for desktop administrative workflows
- Follow established card component patterns from existing codebase
- Implement comprehensive filtering for enhanced event discovery
- Integrate real-time RSVP functionality for immediate member engagement feedback
- Prioritize administrative efficiency with bulk operations and quick actions
- Ensure components are fully reusable across dashboard, profile, and standalone contexts