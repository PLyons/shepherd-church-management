# PRP-001: Header Redesign & Action Management

**Phase:** 0.2 - Member Profile UI Enhancements  
**Status:** Not Started  
**Priority:** High  
**Estimated Effort:** 1 day  
**Dependencies:** None  

## Purpose

Redesign the member profile header to use icon-based actions with tooltips, implementing a professional layout with better visual hierarchy similar to Planning Center's design patterns.

## Requirements

### Technical Requirements
- Use existing `lucide-react` icons
- Maintain role-based permission system
- TypeScript strict typing
- Responsive design for mobile/desktop
- Existing auth patterns from `src/contexts/AuthContext`

### Design Requirements
- Professional icon-based actions
- Tooltip support for accessibility
- Status badges with color coding
- Actions dropdown for secondary operations
- Clean visual hierarchy

### Dependencies
- Current implementation: `src/pages/MemberProfile.tsx`
- Icons from `lucide-react` library
- Tooltip component (create if needed)
- Existing role checking utilities

## Context

### Current State
The member profile currently uses text-based Edit/Delete buttons in the header:
```jsx
<div className="flex gap-2">
  <button onClick={handleEdit}>Edit Profile</button>
  <button onClick={handleDelete}>Delete</button>
</div>
```

### Problems with Current Implementation
- Text buttons take too much space
- No visual hierarchy for different action types
- Limited space for additional actions
- Not following modern UI patterns

### Desired State
- Icon-based primary actions (Edit, More Actions)
- Dropdown menu for secondary actions
- Status badges for member status and role
- Professional visual design
- Better mobile experience

## Success Criteria

- [ ] Header displays member name prominently
- [ ] Edit action uses pencil icon with tooltip
- [ ] Actions dropdown contains Delete and future actions
- [ ] Member status badge shows with appropriate color
- [ ] Role badge displays with appropriate styling
- [ ] All interactions work on mobile (44x44px minimum)
- [ ] Role-based permissions maintained (canEdit, canDelete)
- [ ] Tooltip accessibility works with keyboard navigation
- [ ] Responsive layout works on all screen sizes

## Implementation Procedure

### Step 1: Create Header Component

1. **Create new component file:**
   ```bash
   touch src/components/members/profile/MemberProfileHeader.tsx
   ```

2. **Define component interface:**
   ```typescript
   interface MemberProfileHeaderProps {
     member: Member;
     canEdit: boolean;
     canDelete: boolean;
     onEdit: () => void;
     onDelete: () => void;
   }
   ```

3. **Import required dependencies:**
   ```typescript
   import { Edit, MoreVertical, Trash2, ArrowLeft } from 'lucide-react';
   import { Link } from 'react-router-dom';
   ```

### Step 2: Implement Header Layout

1. **Create responsive header structure:**
   ```jsx
   <div className="flex items-center justify-between mb-6">
     <div className="flex items-center gap-4">
       {/* Back button */}
       <Link to="/members" className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
         <ArrowLeft className="h-5 w-5" />
       </Link>
       
       {/* Member name and badges */}
       <div className="flex flex-col gap-2">
         <h1 className="text-2xl font-bold text-gray-900">
           {member.firstName} {member.lastName}
         </h1>
         <div className="flex items-center gap-2">
           {/* Status badge */}
           {/* Role badge */}
         </div>
       </div>
     </div>
     
     {/* Actions */}
     <div className="flex items-center gap-2">
       {/* Edit button */}
       {/* Actions dropdown */}
     </div>
   </div>
   ```

### Step 3: Implement Status and Role Badges

1. **Move badge logic from current implementation:**
   ```typescript
   const getStatusColor = (status: string) => {
     switch (status) {
       case 'active': return 'bg-green-100 text-green-800';
       case 'inactive': return 'bg-yellow-100 text-yellow-800';
       case 'visitor': return 'bg-blue-100 text-blue-800';
       default: return 'bg-gray-100 text-gray-800';
     }
   };

   const getRoleColor = (role: string) => {
     switch (role) {
       case 'admin': return 'bg-red-100 text-red-800';
       case 'pastor': return 'bg-purple-100 text-purple-800';
       default: return 'bg-gray-100 text-gray-800';
     }
   };
   ```

2. **Render badges:**
   ```jsx
   <div className="flex items-center gap-2">
     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.memberStatus)}`}>
       {member.memberStatus}
     </span>
     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role)}`}>
       {member.role}
     </span>
   </div>
   ```

### Step 4: Create Tooltip Component

1. **Create tooltip if not exists:**
   ```typescript
   // src/components/common/Tooltip.tsx
   interface TooltipProps {
     children: React.ReactNode;
     content: string;
     position?: 'top' | 'bottom' | 'left' | 'right';
   }
   ```

2. **Implement with proper accessibility:**
   ```jsx
   <div className="relative group">
     {children}
     <div className="absolute invisible group-hover:visible bg-gray-900 text-white text-sm rounded py-1 px-2">
       {content}
     </div>
   </div>
   ```

### Step 5: Implement Action Buttons

1. **Create edit button with tooltip:**
   ```jsx
   {canEdit && (
     <Tooltip content="Edit Profile">
       <button
         onClick={onEdit}
         className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
       >
         <Edit className="h-5 w-5" />
       </button>
     </Tooltip>
   )}
   ```

2. **Create actions dropdown:**
   ```jsx
   <Dropdown>
     <DropdownTrigger>
       <button className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
         <MoreVertical className="h-5 w-5" />
       </button>
     </DropdownTrigger>
     <DropdownContent>
       {canDelete && (
         <DropdownItem onClick={onDelete} className="text-red-600">
           <Trash2 className="h-4 w-4 mr-2" />
           Delete Member
         </DropdownItem>
       )}
       {/* Future actions */}
       <DropdownItem disabled>
         Merge Profiles
       </DropdownItem>
       <DropdownItem disabled>
         Export Data
       </DropdownItem>
     </DropdownContent>
   </Dropdown>
   ```

### Step 6: Implement Dropdown Component

1. **Create dropdown if not exists:**
   ```typescript
   // src/components/common/Dropdown.tsx
   // Use existing patterns or implement with focus management
   ```

2. **Ensure keyboard accessibility:**
   - Arrow keys for navigation
   - Enter/Space to select
   - Escape to close

### Step 7: Mobile Responsiveness

1. **Add responsive classes:**
   ```jsx
   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
     {/* Member info */}
     <div className="flex items-center gap-4">
       {/* Content */}
     </div>
     
     {/* Actions - full width on mobile */}
     <div className="flex items-center gap-2 sm:flex-shrink-0">
       {/* Actions */}
     </div>
   </div>
   ```

2. **Ensure minimum touch targets:**
   ```jsx
   // All interactive elements should be at least 44x44px
   className="p-2 min-w-[44px] min-h-[44px]"
   ```

### Step 8: Update MemberProfile.tsx

1. **Import new header component:**
   ```typescript
   import { MemberProfileHeader } from '../components/members/profile/MemberProfileHeader';
   ```

2. **Replace existing header:**
   ```jsx
   // Remove old header div
   // Add new component
   <MemberProfileHeader
     member={member}
     canEdit={canEdit}
     canDelete={canDelete}
     onEdit={handleEdit}
     onDelete={handleDelete}
   />
   ```

3. **Remove duplicate badge helper functions:**
   - Move `getStatusColor` and `getRoleColor` to header component
   - Remove from MemberProfile.tsx

### Step 9: Test Implementation

1. **Test all user roles:**
   - Admin: Should see edit and delete actions
   - Pastor: Should see edit and delete actions
   - Member: Should see edit only for own profile
   - Visitor: Should see no actions

2. **Test responsive behavior:**
   - Desktop: Actions on right side
   - Mobile: Stacked layout, full-width actions

3. **Test accessibility:**
   - Keyboard navigation through actions
   - Screen reader announcements
   - Tooltip visibility on focus

## Testing Plan

### Unit Tests
```typescript
// src/components/members/profile/__tests__/MemberProfileHeader.test.tsx

describe('MemberProfileHeader', () => {
  it('shows edit button when canEdit is true');
  it('shows delete action when canDelete is true');
  it('displays member status badge with correct color');
  it('displays role badge with correct color');
  it('handles edit action click');
  it('handles delete action click');
  it('is accessible via keyboard navigation');
});
```

### Manual Testing Checklist
- [ ] Header displays correctly on desktop
- [ ] Header displays correctly on mobile
- [ ] Edit button works and navigates to edit form
- [ ] Delete action works and shows confirmation
- [ ] Tooltips appear on hover and focus
- [ ] Status badge shows correct color for each status
- [ ] Role badge shows correct color for each role
- [ ] Keyboard navigation works through all actions
- [ ] Screen reader announces all elements properly

### Visual Testing
- [ ] Compare with Planning Center design inspiration
- [ ] Verify consistent spacing and typography
- [ ] Check badge colors match design system
- [ ] Ensure icons are properly sized and aligned

## Rollback Plan

### Immediate Rollback
If issues are discovered during testing:

1. **Revert MemberProfile.tsx changes:**
   ```bash
   git checkout HEAD~1 -- src/pages/MemberProfile.tsx
   ```

2. **Remove new header component:**
   ```bash
   rm src/components/members/profile/MemberProfileHeader.tsx
   ```

3. **Test original functionality**

### Incremental Rollback
If issues are discovered after deployment:

1. **Add feature flag:**
   ```typescript
   const useNewHeader = process.env.VITE_NEW_HEADER_ENABLED === 'true';
   ```

2. **Conditional rendering:**
   ```jsx
   {useNewHeader ? (
     <MemberProfileHeader {...props} />
   ) : (
     <OriginalHeader {...props} />
   )}
   ```

### Data Safety
- No data changes in this PRP
- Only UI components affected
- No migration needed

## Notes

### Design Decisions
- Using `lucide-react` for consistency with existing codebase
- Tooltip pattern for accessibility and space efficiency
- Dropdown for secondary actions to reduce header clutter
- Responsive design prioritizes mobile usability

### Future Enhancements
- Add member photo/avatar placeholder
- Implement keyboard shortcuts for common actions
- Add action history tracking
- Consider breadcrumb navigation for deep linking

### Related PRPs
- **PRP-002:** Will integrate with tab navigation
- **PRP-006:** Will integrate with membership type selector
- **PRP-009:** Will be tested for mobile optimization
- **PRP-010:** Will be audited for accessibility compliance