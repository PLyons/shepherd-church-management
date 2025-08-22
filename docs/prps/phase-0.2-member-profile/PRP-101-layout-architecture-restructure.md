# PRP-101: Layout Architecture Restructure

**Phase:** 0.2 - Member Profile UI Corrections  
**Status:** Not Started  
**Priority:** Critical  
**Estimated Effort:** 2 hours  
**Dependencies:** None - This is the foundation fix  

## Purpose

Replace the responsive grid layout that causes compression issues with a fixed desktop-first flexbox structure that maintains proper proportions and readability at all viewport sizes.

## Problem Statement

The current implementation uses CSS Grid with responsive columns (`grid grid-cols-5`) that compress proportionally when the viewport shrinks. This causes:
- Content squashing at smaller viewports (as seen in the half-screen screenshot)
- Loss of readability and usability
- Violation of desktop-first principles
- Poor information hierarchy

## Requirements

### Technical Requirements
- Replace grid layout with flexbox in MemberProfile.tsx
- Implement strict minimum widths for all sections
- Use horizontal scrolling below minimum viewport width
- Maintain proper content/sidebar separation
- Ensure layout doesn't compress below usable dimensions

### Design Requirements
- Main content area: minimum 800px width
- Sidebar: fixed 400px width
- Total minimum viewport: 1200px
- Consistent spacing and alignment
- Clear visual separation between sections

### Constraints
- Must maintain compatibility with existing components
- Cannot break inline editing functionality from PRP-005
- Must work with existing routing structure
- Should not require database changes

## Success Criteria

- [ ] Layout maintains proportions at all viewport sizes
- [ ] Horizontal scroll appears below 1200px width
- [ ] Content remains readable at 50% screen width
- [ ] Sidebar stays fixed at 400px width
- [ ] Main content never shrinks below 800px
- [ ] No responsive breakpoints that change layout structure
- [ ] Clear visual hierarchy maintained
- [ ] All existing functionality preserved

## Implementation Procedure

### Step 1: Restructure MemberProfile Layout

1. **Update MemberProfile.tsx layout structure:**
   ```tsx
   // Replace the current grid layout
   // FROM:
   <div className="grid grid-cols-5 gap-8">
     <div className="col-span-3">...</div>
     <div className="col-span-2">...</div>
   </div>

   // TO:
   <div className="min-w-[1200px] flex gap-8">
     <div className="flex-1 min-w-[800px]">
       {/* Main content */}
     </div>
     <aside className="w-[400px] min-w-[400px] flex-shrink-0">
       {/* Sidebar */}
     </aside>
   </div>
   ```

2. **Add container constraints:**
   ```tsx
   return (
     <MemberContext.Provider value={{ member }}>
       <div className="min-w-[1200px] space-y-6">
         <MemberProfileHeader ... />
         
         {/* Tabs and content layout */}
         <div className="flex gap-8">
           {/* Main content area */}
           <main className="flex-1 min-w-[800px]">
             <MemberProfileTabs memberId={id!} />
             <div className="mt-6">
               <Suspense fallback={<TabLoadingSpinner />}>
                 <Outlet />
               </Suspense>
             </div>
           </main>
           
           {/* Fixed sidebar */}
           <aside className="w-[400px] min-w-[400px] flex-shrink-0">
             <div className="sticky top-6">
               <HouseholdSidebar 
                 memberId={id!}
                 currentHouseholdId={member?.householdId}
               />
             </div>
           </aside>
         </div>
       </div>
     </MemberContext.Provider>
   );
   ```

### Step 2: Update Parent Container Constraints

1. **Ensure Layout.tsx doesn't restrict width:**
   ```tsx
   // In Layout.tsx, ensure no max-width constraints
   <div className="min-h-screen bg-gray-50">
     <Navigation />
     <main className="p-6">
       {/* Remove any max-w-7xl or similar constraints */}
       <div className="min-w-0"> {/* Allow horizontal scroll */}
         {children}
       </div>
     </main>
   </div>
   ```

### Step 3: Adjust Tab Container

1. **Update MemberProfileTabs positioning:**
   ```tsx
   // Ensure tabs span full width of content area
   <div className="border-b border-gray-200">
     <nav className="-mb-px flex space-x-8">
       {/* Tab items */}
     </nav>
   </div>
   ```

### Step 4: Handle Overflow Properly

1. **Add horizontal scroll container:**
   ```tsx
   // In the main layout wrapper
   <div className="overflow-x-auto">
     <div className="min-w-[1200px]">
       {/* All content */}
     </div>
   </div>
   ```

### Step 5: Test Layout Stability

1. **Verify at different viewport widths:**
   - Full screen (1920px+)
   - Standard desktop (1440px)
   - Minimum supported (1200px)
   - Below minimum (test horizontal scroll)
   - Half screen (960px - should show scroll)

## Testing Plan

### Visual Testing
- [ ] Full screen maintains proper proportions
- [ ] Half screen shows horizontal scroll, not compression
- [ ] Content remains readable at all sizes
- [ ] Sidebar stays fixed width
- [ ] No layout shifts during interactions

### Functional Testing
- [ ] Inline editing still works
- [ ] Navigation between tabs works
- [ ] Household sidebar loads correctly
- [ ] All buttons and interactions accessible
- [ ] Scroll behavior works as expected

### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari

## Rollback Plan

If issues arise:
1. Revert MemberProfile.tsx to grid layout
2. Revert Layout.tsx changes
3. Document specific issues for alternative approach

## Notes

### Design Decisions
- Flexbox chosen over grid for more predictable behavior
- Fixed widths ensure consistent experience
- Desktop-first approach prioritizes functionality over responsiveness
- Horizontal scroll acceptable for desktop application

### Trade-offs
- Less responsive at smaller viewports
- Requires horizontal scrolling below 1200px
- May need scrollbar styling for better UX

### Future Considerations
- Could add responsive behavior later for specific use cases
- Consider collapsible sidebar for more content space
- May need print styles for proper output

### Related PRPs
- **PRP-102:** Will organize content within this new layout
- **PRP-103:** Header will be enhanced within this structure
- **PRP-104:** Sidebar implementation depends on this layout
- **PRP-105:** Desktop constraints build on this foundation