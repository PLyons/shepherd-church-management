# PRP-103: Enhanced Profile Header

**Phase:** 0.2 - Member Profile UI Corrections  
**Status:** Not Started  
**Priority:** High  
**Estimated Effort:** 1.5 hours  
**Dependencies:** PRP-101 (Layout Architecture)  

## Purpose

Create a prominent, information-rich profile header that follows Planning Center's design patterns, with better visual hierarchy, integrated status badges, and prepared integration points for the membership selector.

## Problem Statement

The current header is minimal and lacks visual prominence:
- Member name is too small and doesn't stand out
- Status badges are disconnected from the header
- No avatar/initials display
- Actions are not well organized
- Lacks the professional polish of Planning Center's headers

## Requirements

### Technical Requirements
- Enhanced MemberProfileHeader component
- Avatar/initials circle generation
- Integrated status badge display
- Prepared slot for membership selector (PRP-006)
- Maintain all existing functionality

### Design Requirements
- Larger, more prominent member name
- Avatar circle with initials (left side)
- Inline status badges (not separate elements)
- Well-organized action buttons (right side)
- Consistent spacing and alignment
- Professional visual design

### Visual Hierarchy
1. Avatar + Name (primary focus)
2. Status badges (secondary)
3. Contact info preview (tertiary)
4. Actions (right-aligned)

## Success Criteria

- [ ] Member name is immediately prominent
- [ ] Avatar/initials circle displays correctly
- [ ] Status badges integrated inline
- [ ] Actions clearly grouped on right
- [ ] Consistent with Planning Center aesthetics
- [ ] Responsive within desktop-first constraints
- [ ] All existing functions preserved
- [ ] Ready for membership selector integration

## Implementation Procedure

### Step 1: Create Avatar Component

1. **Create InitialsAvatar component:**
   ```tsx
   // src/components/common/InitialsAvatar.tsx
   interface InitialsAvatarProps {
     firstName?: string;
     lastName?: string;
     size?: 'sm' | 'md' | 'lg' | 'xl';
     className?: string;
   }

   export function InitialsAvatar({ 
     firstName = '', 
     lastName = '', 
     size = 'md',
     className = '' 
   }: InitialsAvatarProps) {
     const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
     
     const sizeClasses = {
       sm: 'h-8 w-8 text-sm',
       md: 'h-12 w-12 text-lg',
       lg: 'h-16 w-16 text-xl',
       xl: 'h-20 w-20 text-2xl'
     };

     // Generate consistent color from name
     const colorIndex = (firstName + lastName).length % 6;
     const colors = [
       'bg-blue-500',
       'bg-green-500',
       'bg-purple-500',
       'bg-pink-500',
       'bg-indigo-500',
       'bg-teal-500'
     ];

     return (
       <div className={`
         ${sizeClasses[size]} 
         ${colors[colorIndex]}
         rounded-full flex items-center justify-center
         text-white font-semibold
         ${className}
       `}>
         {initials || '??'}
       </div>
     );
   }
   ```

### Step 2: Redesign Header Layout

1. **Update MemberProfileHeader structure:**
   ```tsx
   export default function MemberProfileHeader({
     member,
     canEdit,
     canDelete,
     onEdit,
     onDelete,
   }: MemberProfileHeaderProps) {
     return (
       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
         <div className="flex items-start justify-between">
           {/* Left side - Avatar and member info */}
           <div className="flex items-start gap-4">
             {/* Back button */}
             <Tooltip content="Back to Members">
               <Link
                 to="/members"
                 className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
               >
                 <ArrowLeft className="h-5 w-5" />
               </Link>
             </Tooltip>

             {/* Avatar */}
             <InitialsAvatar
               firstName={member.firstName}
               lastName={member.lastName}
               size="lg"
             />

             {/* Member details */}
             <div className="flex flex-col gap-2">
               {/* Name and badges row */}
               <div className="flex items-center gap-3">
                 <h1 className="text-3xl font-bold text-gray-900">
                   {member.firstName} {member.lastName}
                 </h1>
                 
                 {/* Inline status badges */}
                 <div className="flex items-center gap-2">
                   <StatusBadge status={member.memberStatus} />
                   <RoleBadge role={member.role} />
                 </div>
               </div>

               {/* Contact preview */}
               <div className="flex items-center gap-4 text-sm text-gray-600">
                 {member.email && (
                   <div className="flex items-center gap-1">
                     <Mail className="h-4 w-4" />
                     <span>{member.email}</span>
                   </div>
                 )}
                 {member.phone && (
                   <div className="flex items-center gap-1">
                     <Phone className="h-4 w-4" />
                     <span>{formatPhoneForDisplay(member.phone)}</span>
                   </div>
                 )}
               </div>

               {/* Membership selector slot (for PRP-006) */}
               <div id="membership-selector-slot">
                 {/* Placeholder for membership type selector */}
               </div>
             </div>
           </div>

           {/* Right side - Actions */}
           <div className="flex items-center gap-2">
             {canEdit && (
               <Tooltip content="Edit Member">
                 <button
                   onClick={onEdit}
                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
                 >
                   <Edit className="h-4 w-4" />
                   Edit Profile
                 </button>
               </Tooltip>
             )}

             {canDelete && (
               <Tooltip content="Delete Member">
                 <button
                   onClick={onDelete}
                   className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                 >
                   <Trash2 className="h-4 w-4" />
                 </button>
               </Tooltip>
             )}

             {/* More actions menu */}
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">
                   <MoreVertical className="h-4 w-4" />
                 </button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 <DropdownMenuItem onClick={() => {}}>
                   <FileText className="h-4 w-4 mr-2" />
                   Export Profile
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => {}}>
                   <Printer className="h-4 w-4 mr-2" />
                   Print Profile
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => {}}>
                   <History className="h-4 w-4 mr-2" />
                   View History
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
           </div>
         </div>
       </div>
     );
   }
   ```

### Step 3: Create Status and Role Badge Components

1. **Create badge components:**
   ```tsx
   // src/components/members/profile/StatusBadge.tsx
   export function StatusBadge({ status }: { status?: string }) {
     const getStatusStyle = (status: string) => {
       switch (status) {
         case 'active':
           return 'bg-green-100 text-green-800 border-green-200';
         case 'inactive':
           return 'bg-yellow-100 text-yellow-800 border-yellow-200';
         case 'visitor':
           return 'bg-blue-100 text-blue-800 border-blue-200';
         default:
           return 'bg-gray-100 text-gray-800 border-gray-200';
       }
     };

     return (
       <span className={`
         inline-flex items-center px-2.5 py-0.5 
         rounded-full text-xs font-medium border
         ${getStatusStyle(status || 'active')}
       `}>
         {status || 'active'}
       </span>
     );
   }

   // src/components/members/profile/RoleBadge.tsx
   export function RoleBadge({ role }: { role?: string }) {
     const getRoleStyle = (role: string) => {
       switch (role) {
         case 'admin':
           return 'bg-red-100 text-red-800 border-red-200';
         case 'pastor':
           return 'bg-purple-100 text-purple-800 border-purple-200';
         default:
           return 'bg-gray-100 text-gray-800 border-gray-200';
       }
     };

     const getRoleIcon = (role: string) => {
       switch (role) {
         case 'admin':
           return Shield;
         case 'pastor':
           return Church;
         default:
           return User;
       }
     };

     const Icon = getRoleIcon(role || 'member');

     return (
       <span className={`
         inline-flex items-center gap-1 px-2.5 py-0.5 
         rounded-full text-xs font-medium border
         ${getRoleStyle(role || 'member')}
       `}>
         <Icon className="h-3 w-3" />
         {role || 'member'}
       </span>
     );
   }
   ```

### Step 4: Add Member Metadata

1. **Add metadata section below main header:**
   ```tsx
   {/* Below the main header flex */}
   <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-6 text-sm text-gray-600">
     <div className="flex items-center gap-1">
       <Calendar className="h-4 w-4" />
       <span>Joined {formatDate(member.joinedAt)}</span>
     </div>
     
     {member.birthDate && (
       <div className="flex items-center gap-1">
         <Cake className="h-4 w-4" />
         <span>{calculateAge(member.birthDate)} years old</span>
       </div>
     )}
     
     {member.householdId && (
       <div className="flex items-center gap-1">
         <Home className="h-4 w-4" />
         <span>Part of household</span>
       </div>
     )}
   </div>
   ```

## Testing Plan

### Visual Testing
- [ ] Header is visually prominent
- [ ] Avatar displays correct initials
- [ ] Avatar color is consistent for same member
- [ ] Badges display inline correctly
- [ ] Actions are well-organized
- [ ] Spacing and alignment correct

### Functional Testing
- [ ] All buttons work correctly
- [ ] Tooltips display properly
- [ ] Dropdown menu functions
- [ ] Navigation back works
- [ ] Edit/Delete permissions respected

### Component Testing
- [ ] Avatar handles missing names
- [ ] Badges handle all status types
- [ ] Header handles all member states
- [ ] Responsive within constraints

## Rollback Plan

1. Restore original MemberProfileHeader
2. Remove new badge components
3. Remove InitialsAvatar component
4. Revert any style changes

## Notes

### Design Decisions
- Avatar adds visual interest and personalization
- Inline badges reduce visual clutter
- Larger name improves hierarchy
- Contact preview provides quick reference
- Action grouping improves usability

### Accessibility Considerations
- Proper heading hierarchy (h1 for name)
- Tooltips for icon-only buttons
- Color contrast for badges
- Focus states for all interactive elements

### Future Enhancements
- Photo upload instead of initials
- Status change from header (PRP-006)
- Quick actions in dropdown
- Presence indicators
- Last active timestamp

### Related PRPs
- **PRP-101:** Provides layout for header
- **PRP-006:** Membership selector integrates here
- **PRP-104:** Works with sidebar layout
- **PRP-105:** Desktop constraints apply