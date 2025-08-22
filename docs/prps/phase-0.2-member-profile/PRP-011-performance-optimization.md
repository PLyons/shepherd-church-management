# PRP-011: Performance Optimization

**Last Updated:** 2025-08-21  
**Status:** Ready for Implementation  
**Phase:** 0.2 - Member Profile Enhancement  
**Related PRPs:** All previous PRPs (001-010)

## Purpose

Optimize the enhanced member profile system for maximum performance, ensuring fast load times, smooth interactions, and efficient resource utilization across all devices and network conditions. Focus on Core Web Vitals compliance and exceptional user experience.

## Requirements

### Performance Requirements
- First Contentful Paint (FCP) < 1.5 seconds
- Largest Contentful Paint (LCP) < 2.5 seconds
- Cumulative Layout Shift (CLS) < 0.1
- First Input Delay (FID) < 100ms
- Time to Interactive (TTI) < 3.5 seconds
- Bundle size increase < 50KB from baseline

### Technical Requirements
- Code splitting for tab components
- Lazy loading for non-critical content
- Image optimization and lazy loading
- Firebase query optimization
- Memory leak prevention
- Efficient state management
- Progressive loading strategies

### Device Requirements
- Smooth performance on standard desktop computers
- Network-resilient design for slow connections
- Offline capability for cached data
- Battery-efficient implementations

### Dependencies
- All PRPs 001-010 implemented
- React.lazy and Suspense
- Firebase performance monitoring
- Web Vitals measurement tools
- Bundle analyzer for optimization tracking

## Context

With all enhanced member profile features implemented, performance optimization ensures the system remains fast and responsive. The addition of rich features like inline editing, activity history, and notes management requires careful optimization to maintain excellent user experience.

**Current Performance Challenges:**
- Increased bundle size from new components
- Multiple simultaneous Firebase queries
- Rich text editor overhead
- Complex state management in inline editing
- Image loading without optimization
- Potential memory leaks in real-time listeners

**Target Performance:** Best-in-class performance metrics meeting Google's Core Web Vitals thresholds with room for future feature additions.

## Success Criteria

### Primary Success Criteria
- [ ] All Core Web Vitals metrics in "Good" range
- [ ] Tab switching completes in < 200ms
- [ ] Inline editing response time < 100ms
- [ ] Member profile load time < 2 seconds on broadband
- [ ] Bundle size optimized with effective code splitting
- [ ] Zero memory leaks detected in 24-hour test

### Secondary Success Criteria
- [ ] Image loading optimized with lazy loading
- [ ] Firebase query count minimized through batching
- [ ] Smooth 60fps animations and transitions
- [ ] Offline functionality for cached data
- [ ] Progressive loading for slow networks

### Quality Metrics
- Lighthouse Performance Score > 90
- Real User Monitoring (RUM) confirms lab metrics
- Memory usage stable over extended use
- Network requests optimized and cached appropriately

## Implementation Procedure

### Step 1: Performance Monitoring Setup
```bash
# Install performance monitoring tools
npm install --save-dev webpack-bundle-analyzer lighthouse @vitejs/plugin-legacy
npm install web-vitals firebase/performance
```

Create performance monitoring utilities:
```typescript
// src/utils/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export const initPerformanceMonitoring = () => {
  getCLS(onPerfEntry);
  getFID(onPerfEntry);
  getFCP(onPerfEntry);
  getLCP(onPerfEntry);
  getTTFB(onPerfEntry);
};

function onPerfEntry(metric: any) {
  console.log(`${metric.name}: ${metric.value}`);
  
  // Send to Firebase Performance Monitoring
  const perf = getPerformance(app);
  const trace = trace(perf, `web-vital-${metric.name.toLowerCase()}`);
  trace.putMetric(metric.name, metric.value);
  trace.stop();
}

export const measureComponentRender = (componentName: string) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const start = performance.now();
      const result = method.apply(this, args);
      const end = performance.now();
      
      console.log(`${componentName}.${propertyName} took ${end - start} ms`);
      return result;
    };
    
    return descriptor;
  };
};
```

### Step 2: Code Splitting Implementation
Update router with lazy loading:
```typescript
// src/router/index.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Lazy load tab components
const MemberOverviewTab = lazy(() => import('../components/members/tabs/MemberOverviewTab'));
const ActivityTab = lazy(() => import('../components/members/tabs/ActivityTab'));
const NotesTab = lazy(() => import('../components/members/tabs/NotesTab'));
const HouseholdTab = lazy(() => import('../components/members/tabs/HouseholdTab'));

const MemberProfile = lazy(() => import('../pages/MemberProfile'));

// Performance-optimized routing
const router = createBrowserRouter([
  {
    path: '/members/:id',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <MemberProfile />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded" />}>
            <MemberOverviewTab />
          </Suspense>
        ),
      },
      {
        path: 'activity',
        element: (
          <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded" />}>
            <ActivityTab />
          </Suspense>
        ),
      },
      // ... other routes
    ],
  },
]);
```

### Step 3: Firebase Query Optimization
Create optimized member service:
```typescript
// src/services/firebase/optimized-members.service.ts
import { doc, getDoc, onSnapshot, collection, query, where, limit, writeBatch } from 'firebase/firestore';
import { LRUCache } from 'lru-cache';

class OptimizedMemberService {
  private cache = new LRUCache<string, any>({ max: 100, ttl: 5 * 60 * 1000 }); // 5min TTL
  private activeListeners = new Map<string, () => void>();

  // Batch multiple member requests
  async getMembersBatch(memberIds: string[]): Promise<Member[]> {
    const cacheKey = memberIds.sort().join(',');
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Optimize: Single query vs multiple queries
    const batch = writeBatch(db);
    const promises = memberIds.map(id => 
      getDoc(doc(db, 'members', id))
    );
    
    const results = await Promise.all(promises);
    const members = results
      .filter(doc => doc.exists())
      .map(doc => memberDocumentToMember({ id: doc.id, ...doc.data() }));
    
    this.cache.set(cacheKey, members);
    return members;
  }

  // Optimized real-time subscription with cleanup
  subscribeMemberProfile(memberId: string, onUpdate: (member: Member) => void) {
    // Cleanup existing listener
    this.unsubscribeMember(memberId);
    
    const memberRef = doc(db, 'members', memberId);
    const unsubscribe = onSnapshot(memberRef, (doc) => {
      if (doc.exists()) {
        const member = memberDocumentToMember({ id: doc.id, ...doc.data() });
        this.cache.set(memberId, member);
        onUpdate(member);
      }
    }, (error) => {
      console.error('Member subscription error:', error);
    });

    this.activeListeners.set(memberId, unsubscribe);
    return unsubscribe;
  }

  // Cleanup listener to prevent memory leaks
  unsubscribeMember(memberId: string) {
    const unsubscribe = this.activeListeners.get(memberId);
    if (unsubscribe) {
      unsubscribe();
      this.activeListeners.delete(memberId);
    }
  }

  // Optimized activity query with pagination
  getActivityHistory(memberId: string, pageSize = 20, cursor?: string) {
    let q = query(
      collection(db, 'members', memberId, 'activities'),
      orderBy('timestamp', 'desc'),
      limit(pageSize)
    );

    if (cursor) {
      q = query(q, startAfter(cursor));
    }

    return getDocs(q);
  }

  // Cleanup all listeners on component unmount
  cleanup() {
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners.clear();
    this.cache.clear();
  }
}

export const optimizedMemberService = new OptimizedMemberService();
```

### Step 4: Component Performance Optimization
Create performance-optimized components:
```typescript
// src/components/members/OptimizedMemberProfile.tsx
import { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

const MemberProfile = memo(() => {
  const { id: memberId } = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoized member data processing
  const processedMember = useMemo(() => {
    if (!member) return null;
    
    return {
      ...member,
      displayName: `${member.firstName} ${member.lastName}`,
      primaryEmail: member.emails?.find(e => e.isPrimary)?.address || member.emails?.[0]?.address,
      primaryPhone: member.phones?.find(p => p.isPrimary)?.number || member.phones?.[0]?.number,
    };
  }, [member]);

  // Optimized member loading with cleanup
  useEffect(() => {
    if (!memberId) return;

    setLoading(true);
    const unsubscribe = optimizedMemberService.subscribeMemberProfile(
      memberId,
      (updatedMember) => {
        setMember(updatedMember);
        setLoading(false);
      }
    );

    return () => {
      optimizedMemberService.unsubscribeMember(memberId);
    };
  }, [memberId]);

  // Memoized tab change handler
  const handleTabChange = useCallback((tabId: string) => {
    // Preload tab content if not already loaded
    if (tabId === 'activity' && !member?.activityCache) {
      optimizedMemberService.getActivityHistory(memberId!, 20);
    }
  }, [memberId, member?.activityCache]);

  if (loading) {
    return <MemberProfileSkeleton />;
  }

  if (!processedMember) {
    return <MemberNotFound />;
  }

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <div className="min-h-screen bg-gray-50">
        <MemberProfileHeader member={processedMember} />
        <MemberProfileTabs 
          member={processedMember} 
          onTabChange={handleTabChange}
        />
      </div>
    </ErrorBoundary>
  );
});

MemberProfile.displayName = 'MemberProfile';
export default MemberProfile;
```

### Step 5: Image Optimization
Create optimized image component:
```typescript
// src/components/common/OptimizedImage.tsx
import { useState, useRef, useEffect, memo } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  sizes?: string;
}

const OptimizedImage = memo(({ 
  src, 
  alt, 
  className = '', 
  placeholder = '/placeholder-avatar.svg',
  sizes = '(max-width: 1200px) 50vw, 33vw'
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
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

  // Generate responsive image URLs (if using image service)
  const generateSrcSet = (baseSrc: string) => {
    const sizes = [300, 600, 1200];
    return sizes
      .map(size => `${baseSrc}?w=${size}&q=80 ${size}w`)
      .join(', ');
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <img
            src={placeholder}
            alt=""
            className="w-8 h-8 opacity-50"
          />
        </div>
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={isInView && !hasError ? src : placeholder}
        srcSet={isInView ? generateSrcSet(src) : undefined}
        sizes={sizes}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';
export default OptimizedImage;
```

### Step 6: State Management Optimization
Create optimized context with selective subscriptions:
```typescript
// src/contexts/OptimizedMemberContext.tsx
import { createContext, useContext, useMemo, useReducer, ReactNode } from 'react';

interface MemberState {
  members: Map<string, Member>;
  loading: Map<string, boolean>;
  errors: Map<string, string>;
}

type MemberAction = 
  | { type: 'MEMBER_LOADING'; id: string }
  | { type: 'MEMBER_LOADED'; id: string; member: Member }
  | { type: 'MEMBER_ERROR'; id: string; error: string }
  | { type: 'MEMBER_UPDATED'; id: string; updates: Partial<Member> };

const memberReducer = (state: MemberState, action: MemberAction): MemberState => {
  switch (action.type) {
    case 'MEMBER_LOADING':
      return {
        ...state,
        loading: new Map(state.loading).set(action.id, true),
        errors: new Map(state.errors).delete(action.id) && state.errors,
      };
    
    case 'MEMBER_LOADED':
      return {
        ...state,
        members: new Map(state.members).set(action.id, action.member),
        loading: new Map(state.loading).set(action.id, false),
      };
    
    case 'MEMBER_UPDATED':
      const currentMember = state.members.get(action.id);
      if (!currentMember) return state;
      
      return {
        ...state,
        members: new Map(state.members).set(action.id, {
          ...currentMember,
          ...action.updates,
        }),
      };
    
    default:
      return state;
  }
};

const OptimizedMemberContext = createContext<{
  state: MemberState;
  dispatch: React.Dispatch<MemberAction>;
  getMember: (id: string) => Member | undefined;
  isMemberLoading: (id: string) => boolean;
} | null>(null);

export const OptimizedMemberProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(memberReducer, {
    members: new Map(),
    loading: new Map(),
    errors: new Map(),
  });

  // Memoized selectors
  const contextValue = useMemo(() => ({
    state,
    dispatch,
    getMember: (id: string) => state.members.get(id),
    isMemberLoading: (id: string) => state.loading.get(id) || false,
  }), [state]);

  return (
    <OptimizedMemberContext.Provider value={contextValue}>
      {children}
    </OptimizedMemberContext.Provider>
  );
};

export const useOptimizedMember = (id: string) => {
  const context = useContext(OptimizedMemberContext);
  if (!context) throw new Error('useOptimizedMember must be used within OptimizedMemberProvider');
  
  return useMemo(() => ({
    member: context.getMember(id),
    loading: context.isMemberLoading(id),
    dispatch: context.dispatch,
  }), [id, context]);
};
```

### Step 7: Bundle Optimization
Update Vite configuration for optimal bundling:
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11']
    }),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
          
          // Feature chunks
          'member-profile': [
            './src/components/members/MemberProfile.tsx',
            './src/components/members/MemberProfileHeader.tsx',
            './src/components/members/MemberProfileTabs.tsx',
          ],
          'inline-editing': [
            './src/components/members/InlineEditField.tsx',
            './src/components/members/forms/MemberFormEnhanced.tsx',
          ],
          'notes-activity': [
            './src/components/members/tabs/NotesTab.tsx',
            './src/components/members/tabs/ActivityTab.tsx',
          ],
        },
      },
    },
    // Optimize bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Enable source maps for production debugging
    sourcemap: true,
  },
  // Performance optimizations
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
});
```

### Step 8: Progressive Loading Implementation
Create progressive loading strategy:
```typescript
// src/components/common/ProgressiveLoader.tsx
import { useState, useEffect, memo } from 'react';

interface ProgressiveLoaderProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  delay?: number;
  priority?: 'high' | 'medium' | 'low';
}

const ProgressiveLoader = memo(({ 
  children, 
  fallback, 
  delay = 0,
  priority = 'medium' 
}: ProgressiveLoaderProps) => {
  const [shouldRender, setShouldRender] = useState(priority === 'high');

  useEffect(() => {
    if (priority === 'high') return;

    // Progressive loading based on priority and network conditions
    const loadDelay = priority === 'medium' ? delay : delay * 2;
    
    // Adjust delay based on connection quality
    const connection = (navigator as any).connection;
    const multiplier = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g' ? 2 : 1;

    const timer = setTimeout(() => {
      setShouldRender(true);
    }, loadDelay * multiplier);

    return () => clearTimeout(timer);
  }, [priority, delay]);

  // Use requestIdleCallback for low priority content
  useEffect(() => {
    if (priority !== 'low' || shouldRender) return;

    const idleCallback = (deadline: IdleDeadline) => {
      if (deadline.timeRemaining() > 0) {
        setShouldRender(true);
      }
    };

    const handle = requestIdleCallback(idleCallback);
    return () => cancelIdleCallback(handle);
  }, [priority, shouldRender]);

  return shouldRender ? <>{children}</> : <>{fallback}</>;
});

ProgressiveLoader.displayName = 'ProgressiveLoader';
export default ProgressiveLoader;
```

### Step 9: Performance Monitoring Dashboard
Create performance monitoring component:
```typescript
// src/components/admin/PerformanceMonitor.tsx (Development only)
import { useState, useEffect } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({});
  const [bundleInfo, setBundleInfo] = useState({});

  useEffect(() => {
    // Collect Core Web Vitals
    getCLS((metric) => setMetrics(prev => ({ ...prev, cls: metric.value })));
    getFID((metric) => setMetrics(prev => ({ ...prev, fid: metric.value })));
    getFCP((metric) => setMetrics(prev => ({ ...prev, fcp: metric.value })));
    getLCP((metric) => setMetrics(prev => ({ ...prev, lcp: metric.value })));
    getTTFB((metric) => setMetrics(prev => ({ ...prev, ttfb: metric.value })));

    // Monitor memory usage
    const memoryMonitor = setInterval(() => {
      if ((performance as any).memory) {
        setBundleInfo({
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        });
      }
    }, 5000);

    return () => clearInterval(memoryMonitor);
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs font-mono">
      <h3 className="font-bold mb-2">Performance Metrics</h3>
      {Object.entries(metrics).map(([key, value]) => (
        <div key={key} className="flex justify-between">
          <span>{key.toUpperCase()}:</span>
          <span className={getMetricColor(key, value)}>{value}ms</span>
        </div>
      ))}
      <div className="mt-2 border-t pt-2">
        <div>Memory: {(bundleInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB</div>
      </div>
    </div>
  );
};

const getMetricColor = (metric: string, value: number) => {
  const thresholds = {
    fcp: { good: 1500, needs: 3000 },
    lcp: { good: 2500, needs: 4000 },
    fid: { good: 100, needs: 300 },
    cls: { good: 0.1, needs: 0.25 },
    ttfb: { good: 800, needs: 1800 },
  };

  const threshold = thresholds[metric];
  if (!threshold) return '';

  if (value <= threshold.good) return 'text-green-400';
  if (value <= threshold.needs) return 'text-yellow-400';
  return 'text-red-400';
};
```

## Testing Plan

### Performance Testing Suite
```bash
# Add to package.json scripts
"test:performance": "lighthouse http://localhost:5173 --output=json --output-path=./performance-report.json",
"test:bundle": "npm run build && bundlesize",
"test:memory": "jest --testPathPattern=memory-leak",
"analyze:bundle": "npm run build && npx vite-bundle-analyzer dist/stats.html"
```

### Performance Test Cases
```typescript
// src/tests/performance.test.ts
describe('Member Profile Performance', () => {
  it('should load member profile within 2 seconds', async () => {
    const start = performance.now();
    render(<MemberProfile memberId="test-id" />);
    
    await waitFor(() => {
      expect(screen.getByText(/profile loaded/i)).toBeInTheDocument();
    });
    
    const loadTime = performance.now() - start;
    expect(loadTime).toBeLessThan(2000);
  });

  it('should not have memory leaks after 100 profile loads', async () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<MemberProfile memberId={`test-${i}`} />);
      unmount();
    }
    
    // Force garbage collection if available
    if (global.gc) global.gc();
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Allow for reasonable memory increase
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
  });

  it('should batch Firebase queries efficiently', async () => {
    const mockBatch = jest.fn();
    jest.spyOn(optimizedMemberService, 'getMembersBatch').mockImplementation(mockBatch);
    
    render(<MemberProfile memberId="test-id" />);
    
    // Should use single batched query instead of multiple individual queries
    expect(mockBatch).toHaveBeenCalledTimes(1);
  });
});
```

### Bundle Size Testing
```json
// bundlesize.config.json
{
  "files": [
    {
      "path": "dist/assets/index-*.js",
      "maxSize": "250kb",
      "compression": "gzip"
    },
    {
      "path": "dist/assets/vendor-*.js",
      "maxSize": "150kb",
      "compression": "gzip"
    }
  ]
}
```

## Rollback Plan

### If Performance Optimizations Cause Issues:
1. **Immediate Action:**
   - Disable code splitting and return to single bundle
   - Remove lazy loading that causes loading issues
   - Revert to previous Firebase query patterns

2. **Component-by-Component Rollback:**
   - Disable progressive loading for critical components
   - Remove image optimization that causes display issues
   - Restore previous state management patterns

3. **Monitoring and Analysis:**
   - Use performance monitoring to identify specific issues
   - A/B test optimizations to measure actual impact
   - Gradual re-implementation of successful optimizations

### Rollback Commands:
```bash
# Revert performance optimizations
git revert HEAD~n  # where n is number of performance commits

# Remove performance dependencies
npm uninstall webpack-bundle-analyzer lru-cache web-vitals

# Restore previous bundle configuration
git checkout HEAD~n -- vite.config.ts

# Remove performance monitoring
rm -rf src/utils/performance.ts src/components/admin/PerformanceMonitor.tsx
```

## Notes

- Performance optimization should be measured, not assumed
- Focus on real-world performance metrics over synthetic benchmarks
- Consider network conditions and device capabilities of target users
- Implement monitoring to track performance regressions
- Balance optimization complexity with maintainability
- Test performance optimizations thoroughly before deployment
- Consider performance budget for future feature additions