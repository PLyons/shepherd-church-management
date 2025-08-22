# PRP-102: Vertical Content Organization

**Phase:** 0.2 - Member Profile UI Corrections  
**Status:** Not Started  
**Priority:** Critical  
**Estimated Effort:** 2 hours  
**Dependencies:** PRP-101 (Layout Architecture)  

## Purpose

Convert the horizontal three-card grid layout to a vertical section stack that follows Planning Center's information architecture patterns, improving readability and information hierarchy.

## Problem Statement

The current OverviewTab uses a 3-column grid (`grid grid-cols-3`) that:
- Distributes information horizontally, making scanning difficult
- Creates competing visual elements
- Compresses poorly at smaller viewports
- Violates the single-column content pattern used by Planning Center
- Makes related information appear disconnected

## Requirements

### Technical Requirements
- Replace grid layout in OverviewTab with vertical sections
- Convert InfoCard components to expandable sections
- Implement consistent section styling
- Maintain inline editing functionality
- Preserve all existing data display

### Design Requirements
- Stack sections vertically in logical order
- Full width sections within content area
- Subtle visual separators between sections
- Consistent spacing and typography
- Clear section headers with icons
- Expandable/collapsible sections for better navigation

### Information Architecture
1. Personal Information (top)
2. Contact Information (middle)
3. Church Information (bottom)

## Success Criteria

- [ ] All sections stack vertically
- [ ] Sections span full width of content area
- [ ] Clear visual hierarchy established
- [ ] Improved readability and scanability
- [ ] Sections can expand/collapse
- [ ] Inline editing works in new layout
- [ ] Consistent spacing throughout
- [ ] No horizontal scrolling within sections

## Implementation Procedure

### Step 1: Create Section Component

1. **Create new ProfileSection component:**
   ```tsx
   // src/components/members/profile/common/ProfileSection.tsx
   import { useState } from 'react';
   import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react';

   interface ProfileSectionProps {
     title: string;
     icon: LucideIcon;
     children: React.ReactNode;
     defaultExpanded?: boolean;
     className?: string;
   }

   export function ProfileSection({ 
     title, 
     icon: Icon, 
     children, 
     defaultExpanded = true,
     className = '' 
   }: ProfileSectionProps) {
     const [isExpanded, setIsExpanded] = useState(defaultExpanded);

     return (
       <div className={`border-b border-gray-200 last:border-b-0 ${className}`}>
         <button
           onClick={() => setIsExpanded(!isExpanded)}
           className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
         >
           <div className="flex items-center gap-3">
             <Icon className="h-5 w-5 text-gray-500" />
             <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
           </div>
           {isExpanded ? (
             <ChevronDown className="h-5 w-5 text-gray-400" />
           ) : (
             <ChevronRight className="h-5 w-5 text-gray-400" />
           )}
         </button>
         
         {isExpanded && (
           <div className="px-6 pb-6 space-y-4">
             {children}
           </div>
         )}
       </div>
     );
   }
   ```

### Step 2: Restructure OverviewTab Layout

1. **Replace grid with vertical layout:**
   ```tsx
   // In OverviewTab.tsx
   return (
     <div className="bg-white rounded-lg shadow-sm">
       {/* Personal Information Section */}
       <ProfileSection 
         title="Personal Information" 
         icon={User}
         defaultExpanded={true}
       >
         <div className="grid grid-cols-2 gap-x-8 gap-y-4">
           <InlineEditText
             value={member.firstName || ''}
             onSave={(value) => handleFieldSave('firstName', value)}
             label="First Name"
             icon={User}
             canEdit={permissions.canEditPersonalInfo}
             validation={validateName}
           />
           
           <InlineEditText
             value={member.lastName || ''}
             onSave={(value) => handleFieldSave('lastName', value)}
             label="Last Name"
             icon={User}
             canEdit={permissions.canEditPersonalInfo}
             validation={validateName}
           />
           
           {/* Other personal fields in 2-column grid */}
         </div>
       </ProfileSection>

       {/* Contact Information Section */}
       <ProfileSection 
         title="Contact Information" 
         icon={Mail}
         defaultExpanded={true}
       >
         <div className="space-y-4">
           <div>
             <h3 className="text-sm font-medium text-gray-700 mb-2">Email Addresses</h3>
             <ContactList 
               contacts={processedContacts.emailContacts}
               icon={Mail}
               emptyText="No email addresses"
             />
           </div>
           
           <div>
             <h3 className="text-sm font-medium text-gray-700 mb-2">Phone Numbers</h3>
             <ContactList 
               contacts={processedContacts.phoneContacts}
               icon={Phone}
               emptyText="No phone numbers"
             />
           </div>
           
           <div>
             <h3 className="text-sm font-medium text-gray-700 mb-2">Addresses</h3>
             <ContactList 
               contacts={processedContacts.addressContacts}
               icon={MapPin}
               emptyText="No addresses"
             />
           </div>
         </div>
       </ProfileSection>

       {/* Church Information Section */}
       <ProfileSection 
         title="Church Information" 
         icon={Badge}
         defaultExpanded={true}
       >
         <div className="grid grid-cols-2 gap-x-8 gap-y-4">
           {/* Member Status - kept as InfoField for PRP-006 */}
           <div>
             <InfoField 
               label="Member Status"
               value={
                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.memberStatus || 'active')}`}>
                   {member.memberStatus || 'active'}
                 </span>
               }
               icon={Badge}
             />
           </div>
           
           <InlineEditSelect
             value={member.role || 'member'}
             onSave={(value) => handleFieldSave('role', value)}
             options={roleOptions}
             label="Role"
             icon={Shield}
             canEdit={permissions.canEditRole}
           />
           
           <InlineEditDate
             value={member.joinedAt || ''}
             onSave={(value) => handleFieldSave('joinedAt', value)}
             label="Joined Date"
             icon={Clock}
             canEdit={permissions.canEditChurchInfo}
             formatDisplay={formatDate}
           />
         </div>
       </ProfileSection>
     </div>
   );
   ```

### Step 3: Remove InfoCard Component Usage

1. **Remove InfoCard imports and usage:**
   ```tsx
   // Remove: import InfoCard from '../common/InfoCard';
   // Replace all InfoCard usage with ProfileSection
   ```

### Step 4: Optimize Field Layout Within Sections

1. **Use appropriate grid layouts within sections:**
   ```tsx
   // For field pairs (First/Last Name, etc.)
   <div className="grid grid-cols-2 gap-x-8 gap-y-4">
     {/* Fields */}
   </div>

   // For single column lists
   <div className="space-y-4">
     {/* List items */}
   </div>

   // For complex layouts
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     {/* Responsive within section */}
   </div>
   ```

### Step 5: Add Section Persistence

1. **Store section expansion state:**
   ```tsx
   // Use localStorage to remember section states
   const [sectionStates, setSectionStates] = useState(() => {
     const saved = localStorage.getItem('profileSectionStates');
     return saved ? JSON.parse(saved) : {
       personal: true,
       contact: true,
       church: true
     };
   });

   const toggleSection = (section: string) => {
     const newStates = {
       ...sectionStates,
       [section]: !sectionStates[section]
     };
     setSectionStates(newStates);
     localStorage.setItem('profileSectionStates', JSON.stringify(newStates));
   };
   ```

## Testing Plan

### Visual Testing
- [ ] Sections stack vertically without gaps
- [ ] Consistent spacing between sections
- [ ] Section headers clearly visible
- [ ] Expand/collapse animations smooth
- [ ] No horizontal overflow

### Functional Testing
- [ ] All sections expand/collapse correctly
- [ ] State persists across page refreshes
- [ ] Inline editing works in all sections
- [ ] Data displays correctly in new layout
- [ ] No data loss during restructure

### Accessibility Testing
- [ ] Keyboard navigation through sections
- [ ] Screen reader announces sections
- [ ] Focus management on expand/collapse
- [ ] Proper ARIA attributes

## Rollback Plan

1. Restore InfoCard component usage
2. Restore grid layout in OverviewTab
3. Remove ProfileSection component
4. Clear localStorage for section states

## Notes

### Design Decisions
- Vertical stacking improves information flow
- Expandable sections reduce cognitive load
- Full-width sections maximize content space
- Two-column grids within sections for related fields

### Performance Considerations
- Section state stored in localStorage
- Lazy rendering of collapsed sections possible
- Minimal re-renders on expand/collapse

### Future Enhancements
- Drag-to-reorder sections
- Custom section visibility preferences
- Print-friendly collapsed view
- Quick expand/collapse all

### Related PRPs
- **PRP-101:** Provides the layout structure for this content
- **PRP-103:** Header works with this vertical layout
- **PRP-104:** Sidebar complements this content organization
- **PRP-106:** Information density applies to these sections