# PRP-002: Tabbed Navigation Implementation

**Phase:** 0.2 - Member Profile UI Enhancements  
**Status:** Not Started  
**Priority:** High  
**Estimated Effort:** 1.5 days  
**Dependencies:** PRP-001 (Header Redesign)  

## Purpose

Implement a tabbed navigation system for the member profile page to organize information into logical sections, providing better information architecture and user experience.

## Requirements

### Technical Requirements
- React Router for tab navigation with nested routes
- Lazy loading for tab content components
- Keyboard navigation support (arrow keys)
- URL persistence for tab state
- TypeScript strict typing throughout

### Design Requirements
- Horizontal tab bar below header
- Active tab visual indicator
- Mobile-responsive tab scrolling
- Consistent spacing and typography
- Accessible focus indicators

### Dependencies
- React Router v6 nested routing
- PRP-001 header component completed
- Current MemberProfile.tsx structure
- Existing auth context for role-based tabs

## Context

### Current State
The member profile displays all information in a single long page:
```jsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* All member information mixed together */}
  </div>
</div>
```

### Problems with Current Implementation
- Information overload on single page
- Difficult to find specific information quickly
- No logical grouping of related data
- Poor mobile experience with long scrolling
- No space for future features (notes, activity)

### Desired State
- Clear separation of information types
- Easy navigation between sections
- Better mobile experience with focused views
- Foundation for future feature additions
- URL-based navigation for bookmarking

## Success Criteria

- [ ] Tabs render properly in all browsers
- [ ] Active tab state persists in URL
- [ ] Keyboard navigation works (Tab, Arrow keys)
- [ ] Mobile tabs scroll horizontally when needed
- [ ] Lazy loading prevents unnecessary renders
- [ ] Role-based tabs show appropriately
- [ ] Tab content loads without page refresh
- [ ] Back/forward browser navigation works
- [ ] Focus management works correctly
- [ ] Screen reader announces tab changes

## Implementation Procedure

### Step 1: Update Router Configuration

1. **Modify router structure in `src/router/index.tsx`:**
   ```typescript
   {
     path: 'members/:id',
     element: <MemberProfile />,
     children: [
       {
         index: true,
         element: <Navigate to="overview" replace />
       },
       {
         path: 'overview',
         element: <OverviewTab />
       },
       {
         path: 'activity', 
         element: <ActivityTab />
       },
       {
         path: 'communications',
         element: <CommunicationsTab />
       },
       {
         path: 'notes',
         element: (
           <RoleGuard allowedRoles={['admin', 'pastor']}>
             <NotesTab />
           </RoleGuard>
         )
       },
       {
         path: 'settings',
         element: (
           <RoleGuard allowedRoles={['admin']}>
             <SettingsTab />
           </RoleGuard>
         )
       }
     ]
   }
   ```

2. **Import lazy loading for tabs:**
   ```typescript
   import { lazy, Suspense } from 'react';
   
   const OverviewTab = lazy(() => import('../components/members/profile/tabs/OverviewTab'));
   const ActivityTab = lazy(() => import('../components/members/profile/tabs/ActivityTab'));
   // ... other tabs
   ```

### Step 2: Create Tab Navigation Component

1. **Create tabs component:**
   ```bash
   touch src/components/members/profile/MemberProfileTabs.tsx
   ```

2. **Define tab configuration:**
   ```typescript
   interface TabConfig {
     id: string;
     label: string;
     path: string;
     icon: LucideIcon;
     requiresRole?: string[];
   }

   const tabs: TabConfig[] = [
     {
       id: 'overview',
       label: 'Overview',
       path: 'overview',
       icon: User
     },
     {
       id: 'activity',
       label: 'Activity',
       path: 'activity', 
       icon: Activity
     },
     {
       id: 'communications',
       label: 'Communications',
       path: 'communications',
       icon: MessageSquare
     },
     {
       id: 'notes',
       label: 'Notes',
       path: 'notes',
       icon: FileText,
       requiresRole: ['admin', 'pastor']
     },
     {
       id: 'settings',
       label: 'Settings',
       path: 'settings',
       icon: Settings,
       requiresRole: ['admin']
     }
   ];
   ```

3. **Implement tab navigation:**
   ```jsx
   export function MemberProfileTabs({ memberId }: { memberId: string }) {
     const location = useLocation();
     const { member: currentMember } = useAuth();
     
     const visibleTabs = tabs.filter(tab => {
       if (!tab.requiresRole) return true;
       return tab.requiresRole.includes(currentMember?.role || '');
     });

     const activeTab = location.pathname.split('/').pop() || 'overview';

     return (
       <div className="border-b border-gray-200">
         <nav className="-mb-px flex space-x-8 overflow-x-auto">
           {visibleTabs.map(tab => (
             <NavLink
               key={tab.id}
               to={`/members/${memberId}/${tab.path}`}
               className={({ isActive }) => 
                 `group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                   isActive
                     ? 'border-blue-500 text-blue-600'
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                 }`
               }
             >
               <tab.icon className="w-4 h-4 mr-2" />
               {tab.label}
             </NavLink>
           ))}
         </nav>
       </div>
     );
   }
   ```

### Step 3: Create Tab Content Directory

1. **Create tab components directory:**
   ```bash
   mkdir -p src/components/members/profile/tabs
   ```

2. **Create placeholder tab files:**
   ```bash
   touch src/components/members/profile/tabs/OverviewTab.tsx
   touch src/components/members/profile/tabs/ActivityTab.tsx
   touch src/components/members/profile/tabs/CommunicationsTab.tsx
   touch src/components/members/profile/tabs/NotesTab.tsx
   touch src/components/members/profile/tabs/SettingsTab.tsx
   ```

### Step 4: Implement Overview Tab

1. **Move existing content to OverviewTab:**
   ```typescript
   // src/components/members/profile/tabs/OverviewTab.tsx
   import { Member } from '../../../../types';

   interface OverviewTabProps {
     member: Member;
   }

   export default function OverviewTab({ member }: OverviewTabProps) {
     // Move all existing member display logic from MemberProfile.tsx
     return (
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Existing member information layout */}
       </div>
     );
   }
   ```

2. **Extract helper functions:**
   ```typescript
   // Move these from MemberProfile.tsx to OverviewTab.tsx:
   // - getPrimaryEmail
   // - getPrimaryPhone  
   // - getPrimaryAddress
   // - formatDate
   ```

### Step 5: Create Placeholder Tabs

1. **Activity Tab placeholder:**
   ```tsx
   export default function ActivityTab() {
     return (
       <div className="py-6">
         <div className="text-center">
           <Activity className="mx-auto h-12 w-12 text-gray-400" />
           <h3 className="mt-2 text-sm font-medium text-gray-900">Activity History</h3>
           <p className="mt-1 text-sm text-gray-500">
             Member activity and event history will appear here.
           </p>
         </div>
       </div>
     );
   }
   ```

2. **Communications Tab placeholder:**
   ```tsx
   export default function CommunicationsTab() {
     return (
       <div className="py-6">
         <div className="text-center">
           <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
           <h3 className="mt-2 text-sm font-medium text-gray-900">Communications</h3>
           <p className="mt-1 text-sm text-gray-500">
             Email and message history will appear here.
           </p>
         </div>
       </div>
     );
   }
   ```

3. **Notes Tab placeholder:**
   ```tsx
   export default function NotesTab() {
     return (
       <div className="py-6">
         <div className="text-center">
           <FileText className="mx-auto h-12 w-12 text-gray-400" />
           <h3 className="mt-2 text-sm font-medium text-gray-900">Pastoral Notes</h3>
           <p className="mt-1 text-sm text-gray-500">
             Private notes and pastoral care information.
           </p>
         </div>
       </div>
     );
   }
   ```

4. **Settings Tab placeholder:**
   ```tsx
   export default function SettingsTab() {
     return (
       <div className="py-6">
         <div className="text-center">
           <Settings className="mx-auto h-12 w-12 text-gray-400" />
           <h3 className="mt-2 text-sm font-medium text-gray-900">Member Settings</h3>
           <p className="mt-1 text-sm text-gray-500">
             Permissions and preferences management.
           </p>
         </div>
       </div>
     );
   }
   ```

### Step 6: Update MemberProfile.tsx

1. **Import new components:**
   ```typescript
   import { Outlet } from 'react-router-dom';
   import { MemberProfileTabs } from '../components/members/profile/MemberProfileTabs';
   import { Suspense } from 'react';
   ```

2. **Create member context:**
   ```typescript
   // Create context to pass member data to tabs
   export const MemberContext = createContext<{ member: Member | null }>({ member: null });
   ```

3. **Update component structure:**
   ```jsx
   return (
     <MemberContext.Provider value={{ member }}>
       <div className="space-y-6">
         <MemberProfileHeader {...headerProps} />
         <MemberProfileTabs memberId={id!} />
         
         <Suspense fallback={
           <div className="flex justify-center py-8">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
           </div>
         }>
           <Outlet />
         </Suspense>
       </div>
     </MemberContext.Provider>
   );
   ```

### Step 7: Implement Keyboard Navigation

1. **Add keyboard event handlers:**
   ```typescript
   const handleKeyDown = (event: React.KeyboardEvent) => {
     if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
       event.preventDefault();
       const currentIndex = visibleTabs.findIndex(tab => tab.id === activeTab);
       const newIndex = event.key === 'ArrowLeft' 
         ? Math.max(0, currentIndex - 1)
         : Math.min(visibleTabs.length - 1, currentIndex + 1);
       
       navigate(`/members/${memberId}/${visibleTabs[newIndex].path}`);
     }
   };
   ```

2. **Add to tab navigation:**
   ```jsx
   <nav 
     className="-mb-px flex space-x-8 overflow-x-auto"
     onKeyDown={handleKeyDown}
     role="tablist"
   >
   ```

### Step 8: Mobile Responsive Design

1. **Add horizontal scrolling:**
   ```jsx
   <div className="border-b border-gray-200 overflow-hidden">
     <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide min-w-full">
       {/* Tabs with nowrap to prevent wrapping */}
     </nav>
   </div>
   ```

2. **Add scroll indicators (optional):**
   ```css
   /* Add to global styles if needed */
   .scrollbar-hide {
     -ms-overflow-style: none;
     scrollbar-width: none;
   }
   .scrollbar-hide::-webkit-scrollbar {
     display: none;
   }
   ```

### Step 9: Loading States

1. **Add loading component:**
   ```tsx
   function TabLoadingSpinner() {
     return (
       <div className="flex justify-center items-center py-12">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
       </div>
     );
   }
   ```

2. **Use in Suspense:**
   ```jsx
   <Suspense fallback={<TabLoadingSpinner />}>
     <Outlet />
   </Suspense>
   ```

## Testing Plan

### Unit Tests
```typescript
// src/components/members/profile/__tests__/MemberProfileTabs.test.tsx

describe('MemberProfileTabs', () => {
  it('renders all tabs for admin users');
  it('hides restricted tabs for member users');
  it('shows active tab correctly');
  it('navigates on tab click');
  it('supports keyboard navigation');
  it('handles missing member ID gracefully');
});
```

### Integration Tests
```typescript
// Test router integration
describe('Tab Navigation Integration', () => {
  it('loads correct tab content on URL change');
  it('updates URL when tab is changed');
  it('handles browser back/forward navigation');
  it('redirects to overview for invalid tab');
});
```

### Manual Testing Checklist
- [ ] All tabs render correctly for admin user
- [ ] Pastor user sees appropriate tabs (no settings)
- [ ] Member user sees appropriate tabs (no notes/settings)
- [ ] Active tab highlights correctly
- [ ] Tab content loads when clicked
- [ ] URL updates when tab is changed
- [ ] Browser back/forward works correctly
- [ ] Keyboard arrow navigation works
- [ ] Mobile horizontal scrolling works
- [ ] Lazy loading prevents unnecessary renders

## Rollback Plan

### Immediate Rollback
1. **Revert router changes:**
   ```bash
   git checkout HEAD~1 -- src/router/index.tsx
   ```

2. **Remove tab components:**
   ```bash
   rm -rf src/components/members/profile/tabs/
   rm src/components/members/profile/MemberProfileTabs.tsx
   ```

3. **Restore original MemberProfile.tsx**

### Incremental Rollback
1. **Add feature flag:**
   ```typescript
   const useTabNavigation = process.env.VITE_TAB_NAVIGATION === 'true';
   ```

2. **Conditional routing and rendering**

## Notes

### Design Decisions
- Using React Router nested routes for proper URL handling
- Lazy loading to improve initial page load performance
- Role-based tab visibility for security
- Horizontal scrolling on mobile for better UX

### Future Enhancements
- Tab badges for notifications/counts
- Swipe gestures on mobile
- Tab preloading for better performance
- Customizable tab order per user role

### Related PRPs
- **PRP-001:** Integrates with header component
- **PRP-003:** Overview tab will be enhanced with better layout
- **PRP-007:** Activity tab will be fully implemented
- **PRP-008:** Notes tab will be fully implemented