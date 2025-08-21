# PRP-004: Household Sidebar Implementation

**Phase:** 0.2 - Member Profile UI Enhancements  
**Status:** Not Started  
**Priority:** High  
**Estimated Effort:** 1 day  
**Dependencies:** PRP-003 (Information Layout)  

## Purpose

Re-enable and enhance the household sidebar to display family members with relationships, quick navigation between members, and household management capabilities, providing better context for family connections.

## Requirements

### Technical Requirements
- Fetch household data using existing `households.service.ts`
- Display member avatars with initials fallback
- Enable quick navigation between household members
- Role-based household management actions
- Responsive design (sidebar → drawer on mobile)
- Performance optimization with React.memo

### Design Requirements
- Fixed right sidebar on desktop (300px width)
- Collapsible drawer on tablet/mobile
- Member cards with avatar, name, and relationship
- Primary contact indicator
- Household actions for authorized users
- Loading and empty states

### Dependencies
- Enhanced Member interface with `householdId`
- Existing `households.service.ts`
- Current auth context for permissions
- PRP-003 layout structure for integration

## Context

### Current State
Household functionality was temporarily disabled in MemberProfile.tsx:
```jsx
{/* Household functionality temporarily removed for simplified CRUD */}
```

The Member interface includes `householdId` field, and `households.service.ts` exists but isn't being used in the profile view.

### Problems with Current Implementation
- No visibility into family relationships
- Cannot navigate between family members easily
- Missing context about household structure
- No way to manage household connections
- Isolated member view without family context

### Desired State
- Clear visualization of household structure
- Quick navigation between family members
- Relationship indicators (Head, Spouse, Child, etc.)
- Primary contact designation
- Household management for authorized users
- Responsive design for all devices

## Success Criteria

- [ ] Sidebar displays on desktop (fixed 300px width)
- [ ] Converts to drawer/sheet on mobile devices
- [ ] Shows all household members with avatars
- [ ] Displays relationship types correctly
- [ ] Enables navigation between family members
- [ ] Shows primary contact indicator
- [ ] Loads household data without affecting performance
- [ ] Handles households with single members
- [ ] Works for members without households
- [ ] Provides management actions for authorized users

## Implementation Procedure

### Step 1: Create Household Sidebar Component

1. **Create the component file:**
   ```bash
   touch src/components/members/profile/HouseholdSidebar.tsx
   ```

2. **Define component interface:**
   ```typescript
   interface HouseholdSidebarProps {
     memberId: string;
     currentHouseholdId?: string;
     className?: string;
   }

   interface HouseholdMember {
     id: string;
     firstName: string;
     lastName: string;
     relationship?: string;
     isPrimaryContact?: boolean;
     memberStatus: string;
     role: string;
   }
   ```

3. **Import required dependencies:**
   ```typescript
   import { useState, useEffect, memo } from 'react';
   import { Link, useNavigate } from 'react-router-dom';
   import { Users, Plus, Settings, Phone, Mail } from 'lucide-react';
   import { householdsService } from '../../../services/firebase/households.service';
   import { useAuth } from '../../../contexts/AuthContext';
   ```

### Step 2: Implement Data Fetching

1. **Create household data hook:**
   ```typescript
   const useHouseholdData = (householdId?: string) => {
     const [household, setHousehold] = useState<any>(null);
     const [members, setMembers] = useState<HouseholdMember[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
       if (!householdId) {
         setLoading(false);
         return;
       }

       const fetchHouseholdData = async () => {
         try {
           setLoading(true);
           const [householdData, householdMembers] = await Promise.all([
             householdsService.getById(householdId),
             householdsService.getMembers(householdId)
           ]);
           
           setHousehold(householdData);
           setMembers(householdMembers || []);
         } catch (err) {
           console.error('Error fetching household data:', err);
           setError('Failed to load household information');
         } finally {
           setLoading(false);
         }
       };

       fetchHouseholdData();
     }, [householdId]);

     return { household, members, loading, error };
   };
   ```

2. **Implement the main component:**
   ```typescript
   const HouseholdSidebar = memo(({ memberId, currentHouseholdId, className = '' }: HouseholdSidebarProps) => {
     const { member: currentUser } = useAuth();
     const { household, members, loading, error } = useHouseholdData(currentHouseholdId);
     
     const canManageHousehold = currentUser?.role === 'admin' || currentUser?.role === 'pastor';

     if (!currentHouseholdId) {
       return <NoHouseholdState memberId={memberId} canManage={canManageHousehold} />;
     }

     if (loading) {
       return <HouseholdLoadingState />;
     }

     if (error) {
       return <HouseholdErrorState error={error} />;
     }

     return (
       <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
         <HouseholdHeader household={household} canManage={canManageHousehold} />
         <HouseholdMemberList members={members} currentMemberId={memberId} />
         {canManageHousehold && (
           <HouseholdActions householdId={currentHouseholdId} />
         )}
       </div>
     );
   });
   ```

### Step 3: Create Avatar Component

1. **Create avatar component:**
   ```typescript
   interface AvatarProps {
     firstName: string;
     lastName: string;
     size?: 'sm' | 'md' | 'lg';
     className?: string;
   }

   function Avatar({ firstName, lastName, size = 'md', className = '' }: AvatarProps) {
     const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
     
     const sizeClasses = {
       sm: 'h-8 w-8 text-sm',
       md: 'h-10 w-10 text-base',
       lg: 'h-12 w-12 text-lg'
     };

     return (
       <div className={`
         ${sizeClasses[size]} 
         bg-blue-100 text-blue-800 rounded-full 
         flex items-center justify-center font-medium
         ${className}
       `}>
         {initials}
       </div>
     );
   }
   ```

### Step 4: Implement Household Header

1. **Create household header:**
   ```typescript
   function HouseholdHeader({ household, canManage }: { household: any; canManage: boolean }) {
     return (
       <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-2">
           <Users className="h-5 w-5 text-gray-600" />
           <h3 className="text-lg font-medium text-gray-900">
             {household?.name || 'Household'}
           </h3>
         </div>
         {canManage && (
           <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
             <Settings className="h-4 w-4" />
           </button>
         )}
       </div>
     );
   }
   ```

### Step 5: Create Member List Component

1. **Implement member list:**
   ```typescript
   function HouseholdMemberList({ members, currentMemberId }: { 
     members: HouseholdMember[]; 
     currentMemberId: string; 
   }) {
     return (
       <div className="space-y-3">
         {members.map(member => (
           <HouseholdMemberCard 
             key={member.id}
             member={member}
             isCurrentMember={member.id === currentMemberId}
           />
         ))}
       </div>
     );
   }
   ```

2. **Create member card:**
   ```typescript
   function HouseholdMemberCard({ 
     member, 
     isCurrentMember 
   }: { 
     member: HouseholdMember; 
     isCurrentMember: boolean; 
   }) {
     const CardComponent = isCurrentMember ? 'div' : Link;
     const cardProps = isCurrentMember ? {} : { to: `/members/${member.id}` };

     return (
       <CardComponent
         {...cardProps}
         className={`
           flex items-center gap-3 p-3 rounded-lg border transition-colors
           ${isCurrentMember 
             ? 'border-blue-200 bg-blue-50' 
             : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
           }
         `}
       >
         <Avatar 
           firstName={member.firstName} 
           lastName={member.lastName}
           size="sm"
         />
         
         <div className="flex-1 min-w-0">
           <div className="flex items-center gap-2">
             <p className="text-sm font-medium text-gray-900 truncate">
               {member.firstName} {member.lastName}
             </p>
             {member.isPrimaryContact && (
               <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                 Primary
               </span>
             )}
           </div>
           
           {member.relationship && (
             <p className="text-xs text-gray-500 capitalize">
               {member.relationship}
             </p>
           )}
         </div>

         {isCurrentMember && (
           <div className="text-blue-600">
             <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
           </div>
         )}
       </CardComponent>
     );
   }
   ```

### Step 6: Create State Components

1. **No household state:**
   ```typescript
   function NoHouseholdState({ memberId, canManage }: { memberId: string; canManage: boolean }) {
     return (
       <div className="bg-white rounded-lg border border-gray-200 p-6">
         <div className="text-center">
           <Users className="mx-auto h-8 w-8 text-gray-400" />
           <h3 className="mt-2 text-sm font-medium text-gray-900">No Household</h3>
           <p className="mt-1 text-sm text-gray-500">
             This member is not part of a household.
           </p>
           {canManage && (
             <button className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200">
               <Plus className="h-4 w-4 mr-1" />
               Add to Household
             </button>
           )}
         </div>
       </div>
     );
   }
   ```

2. **Loading state:**
   ```typescript
   function HouseholdLoadingState() {
     return (
       <div className="bg-white rounded-lg border border-gray-200 p-6">
         <div className="animate-pulse">
           <div className="flex items-center gap-2 mb-4">
             <div className="h-5 w-5 bg-gray-200 rounded"></div>
             <div className="h-4 w-24 bg-gray-200 rounded"></div>
           </div>
           <div className="space-y-3">
             {[1, 2, 3].map(i => (
               <div key={i} className="flex items-center gap-3">
                 <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                 <div className="flex-1">
                   <div className="h-4 w-20 bg-gray-200 rounded mb-1"></div>
                   <div className="h-3 w-16 bg-gray-200 rounded"></div>
                 </div>
               </div>
             ))}
           </div>
         </div>
       </div>
     );
   }
   ```

3. **Error state:**
   ```typescript
   function HouseholdErrorState({ error }: { error: string }) {
     return (
       <div className="bg-white rounded-lg border border-red-200 p-6">
         <div className="text-center">
           <div className="text-red-600 mb-2">⚠️</div>
           <h3 className="text-sm font-medium text-gray-900">Error Loading Household</h3>
           <p className="mt-1 text-sm text-red-600">{error}</p>
         </div>
       </div>
     );
   }
   ```

### Step 7: Add Household Actions

1. **Create actions component:**
   ```typescript
   function HouseholdActions({ householdId }: { householdId: string }) {
     return (
       <div className="mt-4 pt-4 border-t border-gray-200">
         <div className="space-y-2">
           <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
             <Plus className="inline h-4 w-4 mr-2" />
             Add Member
           </button>
           <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
             <Settings className="inline h-4 w-4 mr-2" />
             Manage Household
           </button>
         </div>
       </div>
     );
   }
   ```

### Step 8: Integrate with MemberProfile

1. **Update MemberProfile.tsx layout:**
   ```jsx
   return (
     <MemberContext.Provider value={{ member }}>
       <div className="space-y-6">
         <MemberProfileHeader {...headerProps} />
         <MemberProfileTabs memberId={id!} />
         
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           {/* Main content */}
           <div className="lg:col-span-3">
             <Suspense fallback={<TabLoadingSpinner />}>
               <Outlet />
             </Suspense>
           </div>
           
           {/* Household sidebar */}
           <div className="lg:col-span-1">
             <HouseholdSidebar 
               memberId={id!}
               currentHouseholdId={member?.householdId}
             />
           </div>
         </div>
       </div>
     </MemberContext.Provider>
   );
   ```

### Step 9: Mobile Responsive Design

1. **Add responsive behavior:**
   ```jsx
   // Hide sidebar on mobile initially, show as drawer
   <div className="hidden lg:block lg:col-span-1">
     <HouseholdSidebar 
       memberId={id!}
       currentHouseholdId={member?.householdId}
       className="sticky top-6"
     />
   </div>

   {/* Mobile household button */}
   <div className="lg:hidden">
     <button 
       onClick={() => setShowHouseholdDrawer(true)}
       className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
     >
       <Users className="h-4 w-4" />
       View Household ({members.length})
     </button>
   </div>
   ```

2. **Add drawer/modal for mobile:**
   ```jsx
   {/* Mobile drawer */}
   {showHouseholdDrawer && (
     <div className="fixed inset-0 z-50 lg:hidden">
       <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowHouseholdDrawer(false)} />
       <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg p-6 max-h-96 overflow-y-auto">
         <HouseholdSidebar 
           memberId={id!}
           currentHouseholdId={member?.householdId}
         />
       </div>
     </div>
   )}
   ```

### Step 10: Performance Optimization

1. **Memoize the sidebar component:**
   ```typescript
   export const HouseholdSidebar = memo(HouseholdSidebarComponent);
   ```

2. **Optimize member list rendering:**
   ```typescript
   const MemoizedMemberCard = memo(HouseholdMemberCard);
   ```

3. **Add error boundaries:**
   ```jsx
   <ErrorBoundary fallback={<HouseholdErrorState error="Something went wrong" />}>
     <HouseholdSidebar {...props} />
   </ErrorBoundary>
   ```

## Testing Plan

### Unit Tests
```typescript
// src/components/members/profile/__tests__/HouseholdSidebar.test.tsx

describe('HouseholdSidebar', () => {
  it('displays household members correctly');
  it('shows current member with different styling');
  it('handles households with single member');
  it('displays no household state appropriately');
  it('shows management actions for authorized users');
  it('hides restricted actions for members');
  it('handles loading and error states');
  it('navigates to member profiles on click');
});
```

### Integration Tests
```typescript
describe('Household Navigation', () => {
  it('loads household data when member has householdId');
  it('updates when navigating between household members');
  it('maintains sidebar state during tab navigation');
});
```

### Manual Testing Checklist
- [ ] Sidebar loads household data correctly
- [ ] Member avatars display with proper initials
- [ ] Current member highlighted appropriately
- [ ] Navigation between members works
- [ ] Management actions show for admin/pastor only
- [ ] Mobile drawer opens and closes properly
- [ ] Loading states display during data fetch
- [ ] Error states handle failures gracefully
- [ ] No household state shows appropriate message

### Performance Testing
- [ ] Sidebar doesn't re-render on tab changes
- [ ] Member list handles large households efficiently
- [ ] Avatar components render quickly
- [ ] Data fetching doesn't block main profile rendering

## Rollback Plan

### Immediate Rollback
1. **Remove household integration:**
   ```bash
   rm src/components/members/profile/HouseholdSidebar.tsx
   ```

2. **Revert MemberProfile.tsx layout:**
   ```bash
   git checkout HEAD~1 -- src/pages/MemberProfile.tsx
   ```

### Data Safety
- Only affects UI display, no data changes
- Existing household relationships preserved
- Can re-enable without data loss

## Notes

### Design Decisions
- Sticky positioning for desktop sidebar
- Mobile drawer pattern for better mobile UX
- Avatar with initials for visual member identification
- Memoization for performance with larger households

### Future Enhancements
- Drag and drop to reorder household members
- Quick actions (call, email) from member cards
- Household relationship editing
- Member photo support when available

### Related PRPs
- **PRP-002:** Integrates with tab navigation layout
- **PRP-003:** Complements information layout design
- **PRP-009:** Will be optimized for mobile interactions
- **PRP-010:** Will be tested for accessibility compliance