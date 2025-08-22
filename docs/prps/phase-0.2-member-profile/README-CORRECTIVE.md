# Phase 0.2 Corrective PRPs (101-106)

**Created:** 2025-08-22  
**Status:** Ready for Implementation  
**Priority:** CRITICAL - Must complete before continuing with original PRPs  

## Background

After implementing PRP-005 (Inline Editing Foundation), testing revealed fundamental layout architecture issues that prevent the proper implementation of the Planning Center-inspired design. Screenshots showed:

1. **Responsive grid compression** - Content squashing at smaller viewports instead of maintaining proportions
2. **Horizontal card layout** - Three-column grid violating Planning Center's vertical content pattern
3. **Missing desktop constraints** - No minimum widths enforced, allowing unwanted responsive behavior
4. **Improper sidebar implementation** - Household info as grid column instead of fixed sidebar
5. **Excessive spacing** - Too much whitespace reducing information density

## Corrective PRP Suite

These PRPs must be implemented sequentially to fix the foundation before continuing with the original Phase 0.2 PRPs:

### PRP-101: Layout Architecture Restructure
**Purpose:** Replace responsive grid with fixed desktop-first flexbox structure  
**Key Changes:**
- Replace `grid grid-cols-5` with flexbox layout
- Implement strict minimum widths (main: 800px, sidebar: 400px)
- Enable horizontal scroll below 1200px viewport
- Prevent content compression

### PRP-102: Vertical Content Organization  
**Purpose:** Convert horizontal card grid to vertical section stack
**Key Changes:**
- Replace 3-column grid with vertical sections
- Full-width sections within content area
- Collapsible/expandable sections
- Order: Personal → Contact → Church Information

### PRP-103: Enhanced Profile Header
**Purpose:** Create prominent header with Planning Center aesthetics
**Key Changes:**
- Larger member name display
- Avatar/initials circle
- Integrated status badges
- Organized action buttons
- Prepared slot for membership selector

### PRP-104: Fixed Household Sidebar
**Purpose:** Implement true fixed-width sidebar
**Key Changes:**
- Fixed 400px width that never changes
- Sticky positioning
- Enhanced member cards with avatars
- Proper visual separation

### PRP-105: Desktop-First Constraints
**Purpose:** Enforce desktop-first throughout application
**Key Changes:**
- Remove all responsive breakpoint classes
- Enforce 1200px minimum application width
- Horizontal scroll below minimum
- Consistent desktop experience

### PRP-106: Information Density Optimization
**Purpose:** Match Planning Center's efficient spacing
**Key Changes:**
- Reduce padding systematically
- Tighten line heights
- Optimize font sizes
- Increase information per screen

## Implementation Order

⚠️ **CRITICAL: These PRPs must be implemented in exact order:**

1. **PRP-101** - Fix core layout (foundation for all others)
2. **PRP-102** - Reorganize content within new layout
3. **PRP-103** - Enhance header in new structure
4. **PRP-104** - Implement proper sidebar
5. **PRP-105** - Apply global constraints
6. **PRP-106** - Fine-tune spacing

## Success Metrics

After completing all corrective PRPs:
- ✅ No content compression at any viewport size
- ✅ Horizontal scroll appears below 1200px
- ✅ Information organized vertically
- ✅ Sidebar maintains 400px width
- ✅ Header is visually prominent
- ✅ Matches Planning Center density
- ✅ Desktop-first constraints enforced

## Next Steps

After successful implementation of PRPs 101-106:
1. Test thoroughly to ensure layout issues resolved
2. Resume PRP-006 (Membership Type Selector)
3. Continue with PRPs 007-011 as originally planned
4. Skip PRP-012 (Testing) as requested by user

## Testing Checkpoints

After each PRP:
- Verify at full screen (1920px)
- Test at half screen (960px) - should show horizontal scroll
- Check that previous fixes still work
- Ensure inline editing from PRP-005 still functions

## Notes

- These corrective PRPs do not add new features, they fix the foundation
- Inline editing from PRP-005 must continue working throughout
- All existing functionality must be preserved
- Focus is on layout structure, not new capabilities

## Related Documentation

- [Original Phase 0.2 PRPs](README.md) - PRPs 005-012
- [CLAUDE.md](../../../CLAUDE.md) - Updated with corrective implementation status
- [Project Screenshots] - Evidence of layout issues requiring correction