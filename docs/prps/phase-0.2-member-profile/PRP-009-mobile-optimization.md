# PRP-009: Mobile Optimization

**Phase:** 0.2 - Member Profile UI Enhancements  
**Status:** Not Started  
**Priority:** High  
**Estimated Effort:** 2 days  
**Dependencies:** All UI PRPs (001-008)  

## Purpose

Ensure all enhanced member profile features work excellently on mobile devices with appropriate touch interactions, responsive design patterns, and optimal performance for low-end devices.

## Requirements

### Technical Requirements
- Minimum 44x44px touch targets for all interactive elements
- Smooth scrolling and gesture support
- Optimized for screens as small as 375px wide
- Performance optimization for low-end mobile devices
- Touch-friendly interaction patterns
- Offline capability considerations

### Design Requirements
- Mobile-first responsive design principles
- Appropriate mobile navigation patterns
- Touch-optimized controls and inputs
- Bottom sheet/drawer patterns for secondary content
- Swipe gestures where appropriate
- Visual feedback for touch interactions

### Dependencies
- All previous UI PRPs (001-008) completed
- TailwindCSS responsive utilities
- React touch gesture libraries
- Mobile browser compatibility testing

## Context

### Current State
The enhanced profile features were designed desktop-first:
- Complex layouts may not translate well to mobile
- Touch targets may be too small
- Navigation patterns may be desktop-centric
- Performance may not be optimized for mobile

### Problems with Current Implementation
- Household sidebar takes up valuable mobile screen space
- Tab navigation may be cramped on small screens
- Inline editing may be difficult with touch keyboards
- Dropdown menus may not be touch-friendly
- Complex interactions may be hard to discover on mobile

### Desired State
- All profile features work excellently on mobile
- Touch interactions feel natural and responsive
- Navigation is intuitive on small screens
- Performance is optimized for mobile devices
- Progressive enhancement from mobile to desktop

## Success Criteria

- [ ] All interactive elements meet 44x44px minimum touch target
- [ ] Tab navigation works smoothly on mobile with horizontal scroll
- [ ] Household sidebar converts to bottom drawer on mobile
- [ ] Inline editing works well with mobile keyboards
- [ ] All dropdowns and modals are touch-optimized
- [ ] Performance metrics meet mobile standards (LCP < 2.5s)
- [ ] Swipe gestures work where implemented
- [ ] Touch feedback provides clear visual response
- [ ] Works on iOS Safari and Android Chrome
- [ ] Maintains accessibility on mobile screen readers

## Implementation Procedure

### Step 1: Audit Current Mobile Experience

1. **Create mobile testing utility:**
   ```bash
   touch src/utils/mobileTestingUtils.ts
   ```

   ```typescript
   export const MOBILE_BREAKPOINTS = {
     xs: '375px',  // iPhone SE
     sm: '414px',  // iPhone 12/13
     md: '768px',  // iPad Mini
     lg: '1024px', // iPad
   } as const;

   export const TOUCH_TARGET_SIZE = {
     minimum: '44px',
     comfortable: '48px',
     large: '56px'
   } as const;

   export const isMobile = () => {
     return window.innerWidth < 768;
   };

   export const isTouchDevice = () => {
     return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
   };

   export const getViewportSize = () => ({
     width: window.innerWidth,
     height: window.innerHeight,
     ratio: window.devicePixelRatio
   });

   export const measureTouchTarget = (element: HTMLElement) => {
     const rect = element.getBoundingClientRect();
     return {
       width: rect.width,
     height: rect.height,
       area: rect.width * rect.height,
       meetsMinimum: rect.width >= 44 && rect.height >= 44
     };
   };
   ```

2. **Create mobile compatibility checker:**
   ```typescript
   export const auditMobileCompatibility = () => {
     const issues: string[] = [];
     const touchTargets = document.querySelectorAll('button, a, input, select, textarea');
     
     touchTargets.forEach((element, index) => {
       const rect = element.getBoundingClientRect();
       if (rect.width < 44 || rect.height < 44) {
         issues.push(`Touch target ${index} is too small: ${rect.width}x${rect.height}px`);
       }
     });

     // Check for horizontal scrolling
     if (document.documentElement.scrollWidth > window.innerWidth) {
       issues.push('Horizontal scrolling detected on mobile');
     }

     // Check for viewport meta tag
     const viewport = document.querySelector('meta[name="viewport"]');
     if (!viewport) {
       issues.push('Missing viewport meta tag');
     }

     return issues;
   };
   ```

### Step 2: Optimize Tab Navigation for Mobile

1. **Update MemberProfileTabs for mobile:**
   ```typescript
   // In MemberProfileTabs.tsx
   import { useState, useRef, useEffect } from 'react';
   import { ChevronLeft, ChevronRight } from 'lucide-react';

   export function MemberProfileTabs({ memberId }: { memberId: string }) {
     const [showScrollButtons, setShowScrollButtons] = useState(false);
     const [canScrollLeft, setCanScrollLeft] = useState(false);
     const [canScrollRight, setCanScrollRight] = useState(false);
     const scrollContainerRef = useRef<HTMLDivElement>(null);

     const checkScrollability = () => {
       const container = scrollContainerRef.current;
       if (!container) return;

       const { scrollLeft, scrollWidth, clientWidth } = container;
       setCanScrollLeft(scrollLeft > 0);
       setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
       setShowScrollButtons(scrollWidth > clientWidth);
     };

     useEffect(() => {
       checkScrollability();
       window.addEventListener('resize', checkScrollability);
       return () => window.removeEventListener('resize', checkScrollability);
     }, []);

     const scroll = (direction: 'left' | 'right') => {
       const container = scrollContainerRef.current;
       if (!container) return;

       const scrollAmount = 200;
       const newScrollLeft = direction === 'left' 
         ? container.scrollLeft - scrollAmount
         : container.scrollLeft + scrollAmount;

       container.scrollTo({
         left: newScrollLeft,
         behavior: 'smooth'
       });
     };

     return (
       <div className="relative border-b border-gray-200">
         {/* Mobile scroll buttons */}
         {showScrollButtons && (
           <>
             <button
               onClick={() => scroll('left')}
               className={`absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-white to-transparent flex items-center justify-start pl-1 md:hidden ${
                 canScrollLeft ? 'visible' : 'invisible'
               }`}
             >
               <ChevronLeft className="h-4 w-4 text-gray-600" />
             </button>

             <button
               onClick={() => scroll('right')}
               className={`absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-white to-transparent flex items-center justify-end pr-1 md:hidden ${
                 canScrollRight ? 'visible' : 'invisible'
               }`}
             >
               <ChevronRight className="h-4 w-4 text-gray-600" />
             </button>
           </>
         )}

         {/* Tab container */}
         <div
           ref={scrollContainerRef}
           className="overflow-x-auto scrollbar-hide"
           onScroll={checkScrollability}
         >
           <nav className="flex space-x-0 min-w-max px-4 md:px-0">
             {visibleTabs.map(tab => (
               <NavLink
                 key={tab.id}
                 to={`/members/${memberId}/${tab.path}`}
                 className={({ isActive }) => 
                   `group inline-flex items-center py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap min-w-[120px] justify-center md:min-w-0 md:justify-start ${
                     isActive
                       ? 'border-blue-500 text-blue-600'
                       : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                   }`
                 }
               >
                 <tab.icon className="w-4 h-4 mr-2" />
                 <span className="hidden sm:inline">{tab.label}</span>
                 <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
               </NavLink>
             ))}
           </nav>
         </div>
       </div>
     );
   }
   ```

2. **Add swipe gesture support:**
   ```bash
   npm install react-swipeable
   ```

   ```typescript
   import { useSwipeable } from 'react-swipeable';

   // In MemberProfile.tsx
   const swipeHandlers = useSwipeable({
     onSwipedLeft: () => {
       // Navigate to next tab
       const currentIndex = visibleTabs.findIndex(tab => tab.id === activeTab);
       if (currentIndex < visibleTabs.length - 1) {
         navigate(`/members/${id}/${visibleTabs[currentIndex + 1].path}`);
       }
     },
     onSwipedRight: () => {
       // Navigate to previous tab
       const currentIndex = visibleTabs.findIndex(tab => tab.id === activeTab);
       if (currentIndex > 0) {
         navigate(`/members/${id}/${visibleTabs[currentIndex - 1].path}`);
       }
     },
     trackMouse: false,
     trackTouch: true
   });

   return (
     <div {...swipeHandlers} className="space-y-6">
       {/* Profile content */}
     </div>
   );
   ```

### Step 3: Convert Household Sidebar to Mobile Drawer

1. **Update HouseholdSidebar for mobile:**
   ```typescript
   // In HouseholdSidebar.tsx
   import { useState, useEffect } from 'react';
   import { X, Users, ChevronUp } from 'lucide-react';
   import { isMobile } from '../../../utils/mobileTestingUtils';

   export function HouseholdSidebar({ memberId, currentHouseholdId }: HouseholdSidebarProps) {
     const [isMobileView, setIsMobileView] = useState(false);
     const [showDrawer, setShowDrawer] = useState(false);

     useEffect(() => {
       const checkMobile = () => setIsMobileView(isMobile());
       checkMobile();
       window.addEventListener('resize', checkMobile);
       return () => window.removeEventListener('resize', checkMobile);
     }, []);

     if (isMobileView) {
       return (
         <>
           {/* Mobile Trigger Button */}
           <button
             onClick={() => setShowDrawer(true)}
             className="w-full flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 bg-white shadow-sm"
           >
             <Users className="h-5 w-5" />
             <span className="font-medium">View Household</span>
             {household?.members?.length && (
               <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                 {household.members.length}
               </span>
             )}
           </button>

           {/* Mobile Drawer */}
           {showDrawer && (
             <div className="fixed inset-0 z-50 md:hidden">
               {/* Backdrop */}
               <div 
                 className="fixed inset-0 bg-black bg-opacity-25"
                 onClick={() => setShowDrawer(false)}
               />
               
               {/* Drawer */}
               <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-xl max-h-[80vh] overflow-hidden">
                 {/* Handle */}
                 <div className="flex items-center justify-center py-3 border-b border-gray-200">
                   <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                 </div>

                 {/* Header */}
                 <div className="flex items-center justify-between p-4 border-b border-gray-200">
                   <h3 className="text-lg font-medium text-gray-900">
                     {household?.name || 'Household'}
                   </h3>
                   <button
                     onClick={() => setShowDrawer(false)}
                     className="p-1 text-gray-400 hover:text-gray-600 rounded"
                   >
                     <X className="h-5 w-5" />
                   </button>
                 </div>

                 {/* Content */}
                 <div className="p-4 overflow-y-auto max-h-[60vh]">
                   <HouseholdContent 
                     household={household}
                     members={members}
                     currentMemberId={memberId}
                     onMemberClick={() => setShowDrawer(false)}
                   />
                 </div>
               </div>
             </div>
           )}
         </>
       );
     }

     // Desktop sidebar (existing implementation)
     return (
       <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
         <HouseholdContent 
           household={household}
           members={members}
           currentMemberId={memberId}
         />
       </div>
     );
   }
   ```

### Step 4: Optimize Touch Targets and Interactions

1. **Create touch-optimized button components:**
   ```bash
   touch src/components/common/TouchButton.tsx
   ```

   ```typescript
   import { forwardRef, ButtonHTMLAttributes } from 'react';

   interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
     size?: 'sm' | 'md' | 'lg';
     variant?: 'primary' | 'secondary' | 'ghost';
     children: React.ReactNode;
   }

   export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
     ({ size = 'md', variant = 'secondary', className = '', children, ...props }, ref) => {
       const sizeClasses = {
         sm: 'min-h-[44px] min-w-[44px] px-3 py-2 text-sm',
         md: 'min-h-[48px] min-w-[48px] px-4 py-3 text-base',
         lg: 'min-h-[56px] min-w-[56px] px-6 py-4 text-lg'
       };

       const variantClasses = {
         primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
         secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300',
         ghost: 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
       };

       return (
         <button
           ref={ref}
           className={`
             ${sizeClasses[size]}
             ${variantClasses[variant]}
             inline-flex items-center justify-center
             font-medium rounded-md
             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
             transition-colors duration-150
             touch-manipulation
             select-none
             ${className}
           `}
           {...props}
         >
           {children}
         </button>
       );
     }
   );
   ```

2. **Update all interactive elements:**
   ```typescript
   // Replace small buttons throughout the codebase
   
   // Before:
   <button className="p-1 text-gray-400 hover:text-gray-600">
     <Edit className="h-4 w-4" />
   </button>

   // After:
   <TouchButton size="sm" variant="ghost">
     <Edit className="h-4 w-4" />
   </TouchButton>
   ```

### Step 5: Optimize Mobile Forms and Inputs

1. **Update inline editing for mobile:**
   ```typescript
   // In InlineEditField.tsx
   const [isMobileEdit, setIsMobileEdit] = useState(false);

   useEffect(() => {
     setIsMobileEdit(isMobile());
   }, []);

   const renderMobileInput = () => (
     <div className="fixed inset-0 z-50 bg-white md:hidden">
       {/* Mobile editing overlay */}
       <div className="flex flex-col h-full">
         {/* Header */}
         <div className="flex items-center justify-between p-4 border-b border-gray-200">
           <h3 className="text-lg font-medium text-gray-900">
             Edit {label}
           </h3>
           <div className="flex gap-2">
             <TouchButton variant="ghost" onClick={cancelEditing}>
               <X className="h-4 w-4" />
             </TouchButton>
             <TouchButton variant="primary" onClick={() => handleSave(state.currentValue)}>
               <Check className="h-4 w-4" />
             </TouchButton>
           </div>
         </div>

         {/* Input */}
         <div className="flex-1 p-4">
           <label className="block text-sm font-medium text-gray-700 mb-2">
             {label}
           </label>
           {renderInput()}
           {state.error && (
             <div className="mt-2 text-sm text-red-600">
               {state.error}
             </div>
           )}
         </div>
       </div>
     </div>
   );

   if (state.isEditing && isMobileEdit) {
     return renderMobileInput();
   }
   ```

2. **Optimize form inputs for mobile:**
   ```typescript
   const mobileInputClasses = `
     min-h-[48px] px-4 py-3 text-base
     border border-gray-300 rounded-md
     focus:outline-none focus:ring-2 focus:ring-blue-500
     ${isMobile() ? 'text-base' : 'text-sm'}
   `;
   ```

### Step 6: Implement Mobile-Specific Navigation Patterns

1. **Add bottom navigation for mobile:**
   ```bash
   touch src/components/mobile/BottomNavigation.tsx
   ```

   ```typescript
   import { useLocation, useNavigate } from 'react-router-dom';
   import { User, Activity, MessageSquare, Settings } from 'lucide-react';

   interface BottomNavigationProps {
     memberId: string;
   }

   export function BottomNavigation({ memberId }: BottomNavigationProps) {
     const location = useLocation();
     const navigate = useNavigate();

     const tabs = [
       { id: 'overview', label: 'Profile', icon: User, path: 'overview' },
       { id: 'activity', label: 'Activity', icon: Activity, path: 'activity' },
       { id: 'communications', label: 'Notes', icon: MessageSquare, path: 'communications' },
       { id: 'settings', label: 'Settings', icon: Settings, path: 'settings' }
     ];

     const activeTab = location.pathname.split('/').pop();

     return (
       <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
         <nav className="grid grid-cols-4">
           {tabs.map(tab => (
             <button
               key={tab.id}
               onClick={() => navigate(`/members/${memberId}/${tab.path}`)}
               className={`flex flex-col items-center py-2 px-1 min-h-[60px] ${
                 activeTab === tab.path
                   ? 'text-blue-600'
                   : 'text-gray-500'
               }`}
             >
               <tab.icon className="h-5 w-5 mb-1" />
               <span className="text-xs font-medium">{tab.label}</span>
             </button>
           ))}
         </nav>
       </div>
     );
   }
   ```

2. **Add mobile-specific layout:**
   ```typescript
   // In MemberProfile.tsx
   return (
     <div className="pb-16 md:pb-0"> {/* Add bottom padding for mobile nav */}
       <MemberContext.Provider value={{ member }}>
         <div className="space-y-6">
           <MemberProfileHeader {...headerProps} />
           
           {/* Desktop tabs */}
           <div className="hidden md:block">
             <MemberProfileTabs memberId={id!} />
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
             <div className="lg:col-span-3">
               <Suspense fallback={<TabLoadingSpinner />}>
                 <Outlet />
               </Suspense>
             </div>
             
             <div className="hidden lg:block lg:col-span-1">
               <HouseholdSidebar 
                 memberId={id!}
                 currentHouseholdId={member?.householdId}
               />
             </div>
           </div>

           {/* Mobile household trigger */}
           <div className="lg:hidden">
             <HouseholdSidebar 
               memberId={id!}
               currentHouseholdId={member?.householdId}
             />
           </div>
         </div>

         {/* Mobile bottom navigation */}
         <div className="md:hidden">
           <BottomNavigation memberId={id!} />
         </div>
       </MemberContext.Provider>
     </div>
   );
   ```

### Step 7: Optimize Performance for Mobile

1. **Implement lazy loading for images:**
   ```typescript
   // Create lazy image component
   export function LazyImage({ src, alt, className = '', ...props }: ImageProps) {
     const [isLoaded, setIsLoaded] = useState(false);
     const [isInView, setIsInView] = useState(false);
     const imgRef = useRef<HTMLImageElement>(null);

     useEffect(() => {
       const observer = new IntersectionObserver(
         ([entry]) => {
           if (entry.isIntersecting) {
             setIsInView(true);
             observer.disconnect();
           }
         },
         { threshold: 0.1 }
       );

       if (imgRef.current) {
         observer.observe(imgRef.current);
       }

       return () => observer.disconnect();
     }, []);

     return (
       <div ref={imgRef} className={`bg-gray-200 ${className}`} {...props}>
         {isInView && (
           <img
             src={src}
             alt={alt}
             className={`w-full h-full object-cover transition-opacity duration-300 ${
               isLoaded ? 'opacity-100' : 'opacity-0'
             }`}
             onLoad={() => setIsLoaded(true)}
           />
         )}
       </div>
     );
   }
   ```

2. **Add performance monitoring:**
   ```typescript
   // Create performance hooks
   export const usePerformanceMonitor = () => {
     useEffect(() => {
       // Monitor Core Web Vitals
       const observer = new PerformanceObserver((list) => {
         for (const entry of list.getEntries()) {
           if (entry.entryType === 'navigation') {
             console.log('Navigation timing:', entry);
           }
           if (entry.entryType === 'paint') {
             console.log('Paint timing:', entry);
           }
         }
       });

       observer.observe({ entryTypes: ['navigation', 'paint'] });
       return () => observer.disconnect();
     }, []);
   };
   ```

### Step 8: Add Touch Feedback and Animations

1. **Create touch feedback system:**
   ```typescript
   // Add to TouchButton component
   const [isPressed, setIsPressed] = useState(false);

   const handleTouchStart = () => setIsPressed(true);
   const handleTouchEnd = () => setIsPressed(false);

   return (
     <button
       onTouchStart={handleTouchStart}
       onTouchEnd={handleTouchEnd}
       onMouseDown={handleTouchStart}
       onMouseUp={handleTouchEnd}
       className={`
         ${baseClasses}
         ${isPressed ? 'scale-95 brightness-90' : ''}
         transition-all duration-75
       `}
     >
       {children}
     </button>
   );
   ```

2. **Add haptic feedback (where supported):**
   ```typescript
   export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
     if ('vibrate' in navigator) {
       const patterns = {
         light: [10],
         medium: [20],
         heavy: [30]
       };
       navigator.vibrate(patterns[type]);
     }
   };
   ```

### Step 9: Mobile Testing and Validation

1. **Create mobile testing suite:**
   ```bash
   touch src/utils/mobileTestSuite.ts
   ```

   ```typescript
   export const runMobileAudit = () => {
     const results = {
       touchTargets: auditTouchTargets(),
       performance: auditPerformance(),
       accessibility: auditMobileAccessibility(),
       responsiveness: auditResponsiveness()
     };

     console.table(results);
     return results;
   };

   const auditTouchTargets = () => {
     const interactive = document.querySelectorAll('button, a, input, select');
     const violations = Array.from(interactive).filter(el => {
       const rect = el.getBoundingClientRect();
       return rect.width < 44 || rect.height < 44;
     });

     return {
       total: interactive.length,
       violations: violations.length,
       compliance: ((interactive.length - violations.length) / interactive.length * 100).toFixed(1) + '%'
     };
   };

   const auditPerformance = () => {
     const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
     return {
       domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart),
       load: Math.round(navigation.loadEventEnd - navigation.navigationStart),
       firstPaint: Math.round(performance.getEntriesByName('first-paint')[0]?.startTime || 0)
     };
   };
   ```

2. **Add responsive design validation:**
   ```typescript
   export const validateResponsiveDesign = () => {
     const breakpoints = [375, 414, 768, 1024, 1280];
     const issues: string[] = [];

     breakpoints.forEach(width => {
       // Simulate viewport width
       Object.defineProperty(window, 'innerWidth', {
         writable: true,
         configurable: true,
         value: width
       });

       window.dispatchEvent(new Event('resize'));

       // Check for horizontal overflow
       if (document.documentElement.scrollWidth > width) {
         issues.push(`Horizontal overflow at ${width}px`);
       }

       // Check for touch target sizes
       const violations = auditTouchTargets();
       if (violations.violations > 0) {
         issues.push(`${violations.violations} touch target violations at ${width}px`);
       }
     });

     return issues;
   };
   ```

### Step 10: Add Mobile-Specific Features

1. **Implement pull-to-refresh:**
   ```bash
   npm install react-pull-to-refresh
   ```

   ```typescript
   import PullToRefresh from 'react-pull-to-refresh';

   // In ActivityTab or NotesTab
   const handleRefresh = async () => {
     await loadData();
   };

   return (
     <PullToRefresh onRefresh={handleRefresh}>
       <div className="space-y-6">
         {/* Tab content */}
       </div>
     </PullToRefresh>
   );
   ```

2. **Add mobile share functionality:**
   ```typescript
   export const shareMemberProfile = async (member: Member) => {
     if (navigator.share) {
       try {
         await navigator.share({
           title: `${member.firstName} ${member.lastName} - Profile`,
           text: `View ${member.firstName}'s church member profile`,
           url: window.location.href
         });
       } catch (error) {
         console.log('Share cancelled');
       }
     } else {
       // Fallback to clipboard
       await navigator.clipboard.writeText(window.location.href);
       // Show toast notification
     }
   };
   ```

## Testing Plan

### Mobile Device Testing
```typescript
// Manual testing checklist for real devices
const MOBILE_TEST_DEVICES = [
  'iPhone SE (375px)',
  'iPhone 12 (390px)', 
  'iPhone 12 Pro Max (428px)',
  'Samsung Galaxy S21 (360px)',
  'iPad Mini (768px)',
  'iPad Pro (1024px)'
];

const MOBILE_TEST_SCENARIOS = [
  'Tab navigation with touch',
  'Household drawer interaction',
  'Inline editing with virtual keyboard',
  'Note creation with rich text editor',
  'Filter dropdown usage',
  'Swipe gestures between tabs',
  'Pull-to-refresh functionality',
  'Performance under slow network'
];
```

### Automated Mobile Tests
```typescript
// src/tests/mobile.test.tsx
describe('Mobile Optimization', () => {
  it('meets touch target size requirements');
  it('handles viewport changes correctly');
  it('maintains performance under mobile conditions');
  it('provides proper touch feedback');
  it('works with virtual keyboards');
  it('handles orientation changes');
  it('supports mobile gestures');
});
```

### Performance Testing
```typescript
describe('Mobile Performance', () => {
  it('loads initial content under 2.5 seconds on 3G');
  it('maintains 60fps scrolling');
  it('optimizes bundle size for mobile');
  it('handles memory constraints');
  it('works offline where appropriate');
});
```

### Manual Testing Checklist
- [ ] All touch targets meet 44x44px minimum
- [ ] Tab navigation scrolls smoothly on mobile
- [ ] Household drawer opens/closes properly
- [ ] Inline editing works with mobile keyboards
- [ ] All modals are touch-friendly
- [ ] Swipe gestures work between tabs
- [ ] Performance is acceptable on low-end devices
- [ ] Pull-to-refresh works where implemented
- [ ] Bottom navigation is accessible
- [ ] Works in both portrait and landscape orientations

## Rollback Plan

### Immediate Rollback
1. **Revert mobile-specific components:**
   ```bash
   rm src/components/mobile/
   rm src/components/common/TouchButton.tsx
   ```

2. **Restore original layouts:**
   ```bash
   git checkout HEAD~1 -- src/components/members/profile/
   ```

3. **Remove mobile dependencies:**
   ```bash
   npm uninstall react-swipeable react-pull-to-refresh
   ```

### Feature Flag Rollback
```typescript
const useMobileOptimizations = process.env.VITE_MOBILE_OPTIMIZATIONS === 'true';

// Conditional rendering for mobile features
{useMobileOptimizations ? <MobileComponent /> : <DesktopComponent />}
```

## Notes

### Design Decisions
- Bottom navigation for primary mobile navigation
- Drawer pattern for secondary content (household)
- Full-screen modals for complex interactions
- Touch-first interaction design
- Progressive enhancement approach

### Performance Considerations
- Lazy loading for non-critical components
- Image optimization and lazy loading
- Bundle splitting for mobile-specific code
- Memory management for low-end devices
- Network optimization for slow connections

### Accessibility on Mobile
- Larger touch targets for easier interaction
- Proper focus management with virtual keyboards
- Screen reader compatibility on mobile
- High contrast support
- Voice control compatibility

### Future Enhancements
- Native app integration via PWA
- Advanced gesture recognition
- Voice commands for common actions
- Camera integration for profile photos
- GPS integration for location services

### Related PRPs
- **All previous PRPs:** Mobile optimization builds on all enhanced features
- **PRP-010:** Will be tested for mobile accessibility compliance
- **PRP-011:** Will include mobile performance optimizations
- **PRP-012:** Will include comprehensive mobile testing scenarios