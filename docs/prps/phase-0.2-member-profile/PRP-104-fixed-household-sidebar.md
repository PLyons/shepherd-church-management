# PRP-104: Fixed Household Sidebar

**Phase:** 0.2 - Member Profile UI Corrections  
**Status:** Not Started  
**Priority:** High  
**Estimated Effort:** 2 hours  
**Dependencies:** PRP-101 (Layout Architecture)  

## Purpose

Implement a true fixed-width sidebar for household information that maintains its dimensions regardless of viewport size, following Planning Center's household display patterns.

## Problem Statement

The current household sidebar:
- Is part of a responsive grid that compresses
- Lacks proper visual separation from main content
- Doesn't maintain a fixed width
- Has poor visual hierarchy for household members
- Doesn't follow Planning Center's sidebar patterns

## Requirements

### Technical Requirements
- Fixed 400px width that never changes
- Sticky positioning for scroll behavior
- Independent from main content layout
- Proper loading and error states
- Real-time household data updates

### Design Requirements
- Clear visual boundary (border or shadow)
- Member cards with avatars
- Relationship indicators
- Primary contact badges
- "Add to Household" CTA when empty
- Household statistics/summary

### Functional Requirements
- Display all household members
- Show relationships between members
- Quick navigation to member profiles
- Household management actions (admin/pastor)
- Create new household functionality

## Success Criteria

- [ ] Sidebar maintains 400px width at all viewports
- [ ] Sticky positioning works correctly
- [ ] Visual separation from main content
- [ ] All household members display with avatars
- [ ] Relationships clearly indicated
- [ ] Quick actions accessible
- [ ] Loading states display properly
- [ ] Empty state is informative

## Implementation Procedure

### Step 1: Update HouseholdSidebar Structure

1. **Enhance HouseholdSidebar component:**
   ```tsx
   // src/components/members/profile/HouseholdSidebar.tsx
   import { useState, useEffect } from 'react';
   import { Link } from 'react-router-dom';
   import { 
     Users, 
     Plus, 
     Home, 
     User,
     Mail,
     Phone,
     ChevronRight,
     Settings
   } from 'lucide-react';
   import { InitialsAvatar } from '../../common/InitialsAvatar';

   interface HouseholdSidebarProps {
     memberId: string;
     currentHouseholdId?: string;
     className?: string;
   }

   export default function HouseholdSidebar({
     memberId,
     currentHouseholdId,
     className = ''
   }: HouseholdSidebarProps) {
     const [household, setHousehold] = useState<Household | null>(null);
     const [members, setMembers] = useState<Member[]>([]);
     const [loading, setLoading] = useState(true);
     const { member: currentUser } = useAuth();
     
     const canManageHousehold = 
       currentUser?.role === 'admin' || 
       currentUser?.role === 'pastor';

     return (
       <div className={`
         w-[400px] min-w-[400px] 
         bg-white rounded-lg shadow-sm 
         border border-gray-200 
         overflow-hidden
         ${className}
       `}>
         {/* Header */}
         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Home className="h-5 w-5 text-gray-600" />
               <h2 className="text-lg font-semibold text-gray-900">
                 Household
               </h2>
             </div>
             
             {canManageHousehold && household && (
               <button className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded">
                 <Settings className="h-4 w-4" />
               </button>
             )}
           </div>
         </div>

         {/* Content */}
         <div className="p-6">
           {loading ? (
             <LoadingState />
           ) : !household ? (
             <EmptyState 
               memberId={memberId} 
               canManage={canManageHousehold} 
             />
           ) : (
             <HouseholdContent 
               household={household}
               members={members}
               currentMemberId={memberId}
             />
           )}
         </div>
       </div>
     );
   }
   ```

### Step 2: Create Household Content Components

1. **Create member card component:**
   ```tsx
   function HouseholdMemberCard({ 
     member, 
     relationship,
     isCurrentMember 
   }: { 
     member: Member;
     relationship?: string;
     isCurrentMember: boolean;
   }) {
     return (
       <Link
         to={`/members/${member.id}`}
         className={`
           block p-3 rounded-lg transition-colors
           ${isCurrentMember 
             ? 'bg-blue-50 border border-blue-200' 
             : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
           }
         `}
       >
         <div className="flex items-start gap-3">
           <InitialsAvatar
             firstName={member.firstName}
             lastName={member.lastName}
             size="md"
           />
           
           <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2">
               <p className="text-sm font-medium text-gray-900">
                 {member.firstName} {member.lastName}
               </p>
               {isCurrentMember && (
                 <span className="text-xs text-blue-600 font-medium">
                   Current
                 </span>
               )}
             </div>
             
             {relationship && (
               <p className="text-xs text-gray-500 mt-0.5">
                 {relationship}
               </p>
             )}
             
             <div className="flex items-center gap-3 mt-1">
               {member.email && (
                 <div className="flex items-center gap-1">
                   <Mail className="h-3 w-3 text-gray-400" />
                   <span className="text-xs text-gray-600 truncate">
                     {member.email}
                   </span>
                 </div>
               )}
               
               {member.phone && (
                 <div className="flex items-center gap-1">
                   <Phone className="h-3 w-3 text-gray-400" />
                   <span className="text-xs text-gray-600">
                     {formatPhoneForDisplay(member.phone)}
                   </span>
                 </div>
               )}
             </div>
           </div>
           
           <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
         </div>
       </Link>
     );
   }
   ```

2. **Create household statistics:**
   ```tsx
   function HouseholdStats({ household, members }: { 
     household: Household; 
     members: Member[] 
   }) {
     const adults = members.filter(m => calculateAge(m.birthDate) >= 18).length;
     const children = members.length - adults;
     
     return (
       <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
         <div className="text-center">
           <p className="text-2xl font-semibold text-gray-900">
             {members.length}
           </p>
           <p className="text-xs text-gray-600">Total</p>
         </div>
         
         <div className="text-center">
           <p className="text-2xl font-semibold text-gray-900">
             {adults}
           </p>
           <p className="text-xs text-gray-600">Adults</p>
         </div>
         
         <div className="text-center">
           <p className="text-2xl font-semibold text-gray-900">
             {children}
           </p>
           <p className="text-xs text-gray-600">Children</p>
         </div>
       </div>
     );
   }
   ```

### Step 3: Create Empty and Loading States

1. **Create empty state:**
   ```tsx
   function EmptyState({ memberId, canManage }: { 
     memberId: string; 
     canManage: boolean;
   }) {
     return (
       <div className="text-center py-8">
         <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
           <Users className="h-full w-full" />
         </div>
         
         <h3 className="text-sm font-medium text-gray-900 mb-1">
           No Household
         </h3>
         
         <p className="text-sm text-gray-500 mb-4">
           This member is not part of a household.
         </p>
         
         {canManage && (
           <div className="space-y-2">
             <button className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
               <Plus className="h-4 w-4 inline mr-1" />
               Create New Household
             </button>
             
             <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
               Add to Existing Household
             </button>
           </div>
         )}
       </div>
     );
   }
   ```

2. **Create loading state:**
   ```tsx
   function LoadingState() {
     return (
       <div className="space-y-3">
         {[1, 2, 3].map(i => (
           <div key={i} className="animate-pulse">
             <div className="flex items-center gap-3">
               <div className="h-12 w-12 bg-gray-200 rounded-full" />
               <div className="flex-1">
                 <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                 <div className="h-3 bg-gray-200 rounded w-1/2" />
               </div>
             </div>
           </div>
         ))}
       </div>
     );
   }
   ```

### Step 4: Add Household Actions

1. **Add action buttons for admins:**
   ```tsx
   function HouseholdActions({ householdId }: { householdId: string }) {
     return (
       <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
         <Link
           to={`/households/${householdId}`}
           className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
         >
           <Users className="h-4 w-4" />
           View Household Details
         </Link>
         
         <button 
           className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
           onClick={() => {/* Add member logic */}}
         >
           <Plus className="h-4 w-4" />
           Add Family Member
         </button>
       </div>
     );
   }
   ```

### Step 5: Style Adjustments

1. **Ensure proper separation and sizing:**
   ```css
   /* In global styles or Tailwind config */
   .household-sidebar {
     width: 400px;
     min-width: 400px;
     max-width: 400px;
     flex-shrink: 0;
   }
   
   /* Sticky positioning */
   .household-sidebar-sticky {
     position: sticky;
     top: 1.5rem; /* Adjust based on header */
     max-height: calc(100vh - 3rem);
     overflow-y: auto;
   }
   ```

## Testing Plan

### Visual Testing
- [ ] Sidebar maintains 400px at all viewports
- [ ] No compression when viewport shrinks
- [ ] Sticky positioning works on scroll
- [ ] Visual separation clear
- [ ] Member cards display correctly

### Functional Testing
- [ ] Household data loads correctly
- [ ] Navigation to member profiles works
- [ ] Actions display for authorized users
- [ ] Empty state shows correct options
- [ ] Real-time updates work

### Performance Testing
- [ ] Fast initial load
- [ ] Smooth scrolling
- [ ] No layout shift
- [ ] Efficient re-renders

## Rollback Plan

1. Restore original HouseholdSidebar
2. Remove new components
3. Revert layout changes
4. Clear any cached data

## Notes

### Design Decisions
- Fixed width ensures consistency
- Sticky positioning keeps context visible
- Avatar cards improve visual appeal
- Statistics provide quick overview
- Actions grouped for clarity

### Performance Considerations
- Lazy load household data
- Cache household information
- Minimize re-renders
- Virtual scrolling for large households

### Future Enhancements
- Drag-to-reorder members
- Quick edit capabilities
- Household photo gallery
- Family tree visualization
- Household timeline

### Related PRPs
- **PRP-101:** Provides layout structure
- **PRP-102:** Works alongside vertical content
- **PRP-103:** Complements enhanced header
- **PRP-105:** Desktop constraints apply