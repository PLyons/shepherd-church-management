# PRP-106: Information Density Optimization

**Phase:** 0.2 - Member Profile UI Corrections  
**Status:** Not Started  
**Priority:** Medium  
**Estimated Effort:** 1.5 hours  
**Dependencies:** PRP-101, PRP-102, PRP-103, PRP-104, PRP-105  

## Purpose

Optimize information density throughout the member profile to match Planning Center's efficient use of space, reducing unnecessary whitespace and increasing the amount of visible information.

## Problem Statement

The current implementation has excessive spacing:
- Too much padding around elements
- Oversized margins between sections
- Inefficient use of vertical space
- Large gaps that reduce information density
- Doesn't match Planning Center's compact design

## Requirements

### Technical Requirements
- Reduce padding and margins systematically
- Tighten line heights appropriately
- Optimize font sizes for density
- Maintain readability standards
- Preserve accessibility requirements

### Design Requirements
- Match Planning Center's spacing patterns
- Increase information per screen
- Maintain visual hierarchy
- Keep clear section separation
- Ensure professional appearance

### Spacing Standards
- Section padding: 16px (down from 24px)
- Card padding: 12px (down from 24px)
- Field spacing: 8px (down from 16px)
- Line height: 1.4 (down from 1.5-1.75)
- Section gaps: 16px (down from 24px)

## Success Criteria

- [ ] 30% more information visible per screen
- [ ] Maintains readability and clarity
- [ ] Consistent spacing throughout
- [ ] Matches Planning Center density
- [ ] No accessibility issues
- [ ] Professional appearance preserved
- [ ] Clear visual hierarchy maintained

## Implementation Procedure

### Step 1: Update Global Spacing Variables

1. **Define spacing scale:**
   ```css
   /* tailwind.config.js or global CSS */
   :root {
     --spacing-xs: 4px;   /* 0.25rem */
     --spacing-sm: 8px;   /* 0.5rem */
     --spacing-md: 12px;  /* 0.75rem */
     --spacing-lg: 16px;  /* 1rem */
     --spacing-xl: 24px;  /* 1.5rem */
     --spacing-2xl: 32px; /* 2rem */
   }
   ```

2. **Update default component spacing:**
   ```tsx
   // Compact spacing utilities
   const spacing = {
     section: 'p-4',      // was p-6
     card: 'p-3',         // was p-6
     fieldGroup: 'space-y-2', // was space-y-4
     buttonGroup: 'gap-2',    // was gap-4
     listItem: 'py-2',    // was py-3
   };
   ```

### Step 2: Optimize Section Components

1. **Update ProfileSection spacing:**
   ```tsx
   // Reduce padding in section headers
   <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50">
     {/* Was px-6 py-4 */}
   </button>
   
   // Reduce content padding
   <div className="px-4 pb-4 space-y-3">
     {/* Was px-6 pb-6 space-y-4 */}
   </div>
   ```

2. **Optimize section gaps:**
   ```tsx
   // Main layout spacing
   <div className="space-y-4"> {/* Was space-y-6 */}
     <MemberProfileHeader />
     <div className="flex gap-6"> {/* Was gap-8 */}
       {/* Content and sidebar */}
     </div>
   </div>
   ```

### Step 3: Compress Form Fields

1. **Tighten field spacing:**
   ```tsx
   // Inline edit fields
   <div className="flex items-center gap-2 p-2 rounded-md">
     {/* Was gap-3 p-3 */}
   </div>
   
   // Form labels
   <label className="text-xs font-medium text-gray-700 mb-1">
     {/* Was text-sm mb-2 */}
   </label>
   
   // Input fields
   <input className="px-2 py-1.5 text-sm">
     {/* Was px-3 py-2 */}
   </input>
   ```

2. **Optimize field groups:**
   ```tsx
   // Two-column field layout
   <div className="grid grid-cols-2 gap-4">
     {/* Was gap-6 or gap-8 */}
   </div>
   
   // Vertical field stacks
   <div className="space-y-3">
     {/* Was space-y-4 or space-y-6 */}
   </div>
   ```

### Step 4: Condense Typography

1. **Adjust line heights:**
   ```tsx
   // Headings
   <h1 className="text-2xl font-bold leading-tight">
     {/* Was text-3xl with default line height */}
   </h1>
   
   <h2 className="text-lg font-semibold leading-snug">
     {/* Was text-xl with default line height */}
   </h2>
   
   // Body text
   <p className="text-sm leading-snug">
     {/* Was text-base with relaxed line height */}
   </p>
   ```

2. **Optimize font sizes:**
   ```tsx
   const typography = {
     h1: 'text-2xl',     // was text-3xl
     h2: 'text-lg',      // was text-xl
     h3: 'text-base',    // was text-lg
     body: 'text-sm',    // was text-base
     small: 'text-xs',   // was text-sm
     tiny: 'text-[10px]' // was text-xs
   };
   ```

### Step 5: Compact Header Design

1. **Reduce header padding:**
   ```tsx
   // MemberProfileHeader
   <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
     {/* Was p-6 */}
     
     {/* Avatar and info spacing */}
     <div className="flex items-start gap-3">
       {/* Was gap-4 */}
       
       {/* Name and details */}
       <div className="flex flex-col gap-1">
         {/* Was gap-2 */}
       </div>
     </div>
   </div>
   ```

### Step 6: Optimize Sidebar Density

1. **Compress member cards:**
   ```tsx
   // Household member card
   <div className="p-2.5 rounded-lg">
     {/* Was p-3 or p-4 */}
     
     <div className="flex items-start gap-2.5">
       {/* Was gap-3 */}
       
       {/* Avatar size */}
       <InitialsAvatar size="sm" />
       {/* Was size="md" */}
       
       {/* Text spacing */}
       <div className="space-y-0.5">
         {/* Was space-y-1 */}
       </div>
     </div>
   </div>
   ```

2. **Reduce sidebar sections:**
   ```tsx
   // Sidebar header
   <div className="px-4 py-3 border-b">
     {/* Was px-6 py-4 */}
   </div>
   
   // Sidebar content
   <div className="p-4 space-y-3">
     {/* Was p-6 space-y-4 */}
   </div>
   ```

### Step 7: Compact Table Layouts

1. **Reduce table padding:**
   ```tsx
   // Table cells
   <td className="px-3 py-2 text-sm">
     {/* Was px-6 py-4 */}
   </td>
   
   // Table headers
   <th className="px-3 py-2 text-xs font-medium">
     {/* Was px-6 py-3 text-sm */}
   </th>
   ```

### Step 8: Optimize Button Sizes

1. **Compact button styles:**
   ```tsx
   // Primary buttons
   <button className="px-3 py-1.5 text-sm">
     {/* Was px-4 py-2 */}
   </button>
   
   // Icon buttons
   <button className="p-1.5">
     {/* Was p-2 */}
     <Icon className="h-4 w-4" />
     {/* Icon size unchanged */}
   </button>
   ```

## Testing Plan

### Visual Testing
- [ ] Information density increased
- [ ] Readability maintained
- [ ] Hierarchy still clear
- [ ] No overlapping elements
- [ ] Consistent spacing

### Usability Testing
- [ ] Clickable areas adequate
- [ ] Form fields usable
- [ ] No accidental clicks
- [ ] Scrolling reduced
- [ ] More content visible

### Accessibility Testing
- [ ] Touch targets adequate (44px minimum)
- [ ] Text remains readable
- [ ] Contrast ratios maintained
- [ ] Focus states visible
- [ ] Screen reader compatible

## Rollback Plan

1. Restore original spacing values
2. Revert typography changes
3. Reset component padding
4. Restore button sizes
5. Document issues for revision

## Notes

### Design Decisions
- Prioritize vertical density
- Maintain minimum touch targets
- Keep clear visual hierarchy
- Preserve readability
- Match Planning Center patterns

### Trade-offs
- Density vs. whitespace
- Compactness vs. clarity
- Information vs. breathing room
- Efficiency vs. aesthetics

### Accessibility Considerations
- Maintain WCAG AA standards
- Keep 44px touch targets
- Ensure readable font sizes
- Preserve focus indicators
- Support zoom to 200%

### Future Enhancements
- User-adjustable density
- Compact/comfortable/spacious modes
- Remember density preference
- Print-optimized layouts
- Mobile-specific density

### Related PRPs
- **PRP-101:** Dense within new layout
- **PRP-102:** Sections use compact spacing
- **PRP-103:** Header uses less space
- **PRP-104:** Sidebar optimized
- **PRP-105:** Density within constraints