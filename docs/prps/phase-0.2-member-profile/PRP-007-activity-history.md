# PRP-007: Activity History Tab

**Phase:** 0.2 - Member Profile UI Enhancements  
**Status:** Not Started  
**Priority:** Medium  
**Estimated Effort:** 1.5 days  
**Dependencies:** PRP-002 (Tabbed Navigation)  

## Purpose

Implement the Activity tab showing a comprehensive timeline of member's event attendance, volunteer service, profile updates, and interactions, providing pastoral and administrative insights into member engagement.

## Requirements

### Technical Requirements
- Timeline-based activity display with chronological ordering
- Filter system by activity type and date range
- Lazy loading for performance with large activity sets
- Export functionality for reports
- Integration with future event and volunteer systems
- TypeScript interfaces for different activity types

### Design Requirements
- Clean timeline layout with activity cards
- Icons and color coding for different activity types
- Date grouping and search functionality
- Empty states and loading indicators
- Desktop-optimized design
- Filter chips and date range picker

### Dependencies
- PRP-002 tab navigation system
- Member context from profile page
- Future integration points for events/volunteers
- Existing profile update tracking
- Auth context for permission-based views

## Context

### Current State
No activity tracking exists in the current system:
- No event attendance records
- No volunteer service tracking
- No profile change history
- No member interaction logs
- No engagement analytics

### Problems with Current Implementation
- No visibility into member engagement patterns
- Cannot track member involvement over time
- No data for pastoral care decisions
- Missing audit trail for profile changes
- No way to identify inactive members

### Desired State
- Comprehensive activity timeline
- Multiple activity types tracked
- Filterable and searchable history
- Export capabilities for reports
- Foundation for future engagement features
- Privacy-respecting activity tracking

## Success Criteria

- [ ] Activity tab loads with timeline view
- [ ] Different activity types display with appropriate icons
- [ ] Date-based grouping shows chronological order
- [ ] Filter system works for type and date range
- [ ] Export functionality generates reports
- [ ] Empty state shows helpful message
- [ ] Loading states display during data fetch
- [ ] Mobile view maintains usability
- [ ] Permission system controls visibility
- [ ] Performance remains good with large datasets

## Implementation Procedure

### Step 1: Define Activity Types and Interfaces

1. **Create activity type definitions:**
   ```bash
   touch src/types/activity.ts
   ```

   ```typescript
   export interface BaseActivity {
     id: string;
     memberId: string;
     type: ActivityType;
     title: string;
     description?: string;
     timestamp: Date;
     metadata?: Record<string, any>;
     createdBy?: string;
     source: 'system' | 'manual' | 'import';
   }

   export type ActivityType = 
     | 'profile_update'
     | 'status_change'
     | 'event_attendance'
     | 'volunteer_service'
     | 'donation'
     | 'communication'
     | 'note_added'
     | 'household_change'
     | 'login'
     | 'registration';

   export interface ProfileUpdateActivity extends BaseActivity {
     type: 'profile_update';
     metadata: {
       field: string;
       oldValue?: any;
       newValue: any;
       updatedBy: string;
     };
   }

   export interface StatusChangeActivity extends BaseActivity {
     type: 'status_change';
     metadata: {
       previousStatus: string;
       newStatus: string;
       reason?: string;
       changedBy: string;
     };
   }

   export interface EventAttendanceActivity extends BaseActivity {
     type: 'event_attendance';
     metadata: {
       eventId: string;
       eventName: string;
       eventDate: Date;
       attendanceStatus: 'attended' | 'absent' | 'late';
       checkedInBy?: string;
     };
   }

   export interface VolunteerServiceActivity extends BaseActivity {
     type: 'volunteer_service';
     metadata: {
       serviceId: string;
       serviceName: string;
       hours: number;
       role: string;
       department: string;
     };
   }

   export interface CommunicationActivity extends BaseActivity {
     type: 'communication';
     metadata: {
       method: 'email' | 'phone' | 'text' | 'in_person';
       subject?: string;
       initiatedBy: string;
       direction: 'incoming' | 'outgoing';
     };
   }

   export type MemberActivity = 
     | ProfileUpdateActivity
     | StatusChangeActivity
     | EventAttendanceActivity
     | VolunteerServiceActivity
     | CommunicationActivity
     | BaseActivity;

   export interface ActivityFilter {
     types: ActivityType[];
     dateRange: {
       start: Date | null;
       end: Date | null;
     };
     search: string;
   }
   ```

2. **Create activity configuration:**
   ```typescript
   export const ACTIVITY_CONFIG: Record<ActivityType, {
     label: string;
     icon: string;
     color: string;
     bgColor: string;
     description: string;
     requiresPermission?: string[];
   }> = {
     profile_update: {
       label: 'Profile Update',
       icon: '👤',
       color: 'text-blue-600',
       bgColor: 'bg-blue-100',
       description: 'Member information was updated'
     },
     status_change: {
       label: 'Status Change',
       icon: '🔄',
       color: 'text-purple-600',
       bgColor: 'bg-purple-100',
       description: 'Membership status was changed'
     },
     event_attendance: {
       label: 'Event Attendance',
       icon: '📅',
       color: 'text-green-600',
       bgColor: 'bg-green-100',
       description: 'Attended or registered for an event'
     },
     volunteer_service: {
       label: 'Volunteer Service',
       icon: '🤝',
       color: 'text-orange-600',
       bgColor: 'bg-orange-100',
       description: 'Volunteered for church activities'
     },
     donation: {
       label: 'Donation',
       icon: '💝',
       color: 'text-emerald-600',
       bgColor: 'bg-emerald-100',
       description: 'Made a financial contribution',
       requiresPermission: ['admin', 'pastor']
     },
     communication: {
       label: 'Communication',
       icon: '💬',
       color: 'text-indigo-600',
       bgColor: 'bg-indigo-100',
       description: 'Communication or interaction',
       requiresPermission: ['admin', 'pastor']
     },
     note_added: {
       label: 'Note Added',
       icon: '📝',
       color: 'text-gray-600',
       bgColor: 'bg-gray-100',
       description: 'Pastoral or administrative note added',
       requiresPermission: ['admin', 'pastor']
     },
     household_change: {
       label: 'Household Change',
       icon: '🏠',
       color: 'text-cyan-600',
       bgColor: 'bg-cyan-100',
       description: 'Household membership changed'
     },
     login: {
       label: 'Login',
       icon: '🔐',
       color: 'text-slate-600',
       bgColor: 'bg-slate-100',
       description: 'Logged into the system'
     },
     registration: {
       label: 'Registration',
       icon: '🎯',
       color: 'text-rose-600',
       bgColor: 'bg-rose-100',
       description: 'Registered or joined the church'
     }
   };
   ```

### Step 2: Create Activity Service

1. **Create activity service:**
   ```bash
   touch src/services/firebase/activity.service.ts
   ```

   ```typescript
   import { 
     collection, 
     addDoc, 
     query, 
     where, 
     orderBy, 
     limit, 
     startAfter,
     getDocs, 
     Timestamp 
   } from 'firebase/firestore';
   import { db } from '../../lib/firebase';
   import { MemberActivity, ActivityType, ActivityFilter } from '../../types/activity';

   class ActivityService {
     private readonly collectionName = 'memberActivities';

     async addActivity(activity: Omit<MemberActivity, 'id' | 'timestamp'>): Promise<void> {
       try {
         await addDoc(collection(db, this.collectionName), {
           ...activity,
           timestamp: Timestamp.now()
         });
       } catch (error) {
         console.error('Error adding activity:', error);
         throw new Error('Failed to record activity');
       }
     }

     async getMemberActivities(
       memberId: string, 
       filters: Partial<ActivityFilter> = {},
       pageSize: number = 20,
       lastDoc?: any
     ): Promise<{ activities: MemberActivity[]; hasMore: boolean; lastDoc: any }> {
       try {
         let q = query(
           collection(db, this.collectionName),
           where('memberId', '==', memberId),
           orderBy('timestamp', 'desc')
         );

         // Apply filters
         if (filters.types?.length) {
           q = query(q, where('type', 'in', filters.types));
         }

         if (filters.dateRange?.start) {
           q = query(q, where('timestamp', '>=', Timestamp.fromDate(filters.dateRange.start)));
         }

         if (filters.dateRange?.end) {
           q = query(q, where('timestamp', '<=', Timestamp.fromDate(filters.dateRange.end)));
         }

         // Pagination
         q = query(q, limit(pageSize + 1));
         if (lastDoc) {
           q = query(q, startAfter(lastDoc));
         }

         const snapshot = await getDocs(q);
         const docs = snapshot.docs;
         const hasMore = docs.length > pageSize;
         
         if (hasMore) {
           docs.pop(); // Remove extra doc used for pagination check
         }

         const activities = docs.map(doc => ({
           id: doc.id,
           ...doc.data(),
           timestamp: doc.data().timestamp.toDate()
         })) as MemberActivity[];

         // Apply text search filter (client-side for now)
         let filteredActivities = activities;
         if (filters.search) {
           const searchLower = filters.search.toLowerCase();
           filteredActivities = activities.filter(activity => 
             activity.title.toLowerCase().includes(searchLower) ||
             activity.description?.toLowerCase().includes(searchLower)
           );
         }

         return {
           activities: filteredActivities,
           hasMore,
           lastDoc: docs[docs.length - 1]
         };
       } catch (error) {
         console.error('Error fetching member activities:', error);
         throw new Error('Failed to load activity history');
       }
     }

     async getActivitySummary(memberId: string, days: number = 30): Promise<Record<ActivityType, number>> {
       try {
         const cutoffDate = new Date();
         cutoffDate.setDate(cutoffDate.getDate() - days);

         const q = query(
           collection(db, this.collectionName),
           where('memberId', '==', memberId),
           where('timestamp', '>=', Timestamp.fromDate(cutoffDate))
         );

         const snapshot = await getDocs(q);
         const summary: Record<string, number> = {};

         snapshot.docs.forEach(doc => {
           const activity = doc.data();
           summary[activity.type] = (summary[activity.type] || 0) + 1;
         });

         return summary as Record<ActivityType, number>;
       } catch (error) {
         console.error('Error fetching activity summary:', error);
         return {} as Record<ActivityType, number>;
       }
     }
   }

   export const activityService = new ActivityService();
   ```

### Step 3: Create Activity Tab Component

1. **Create the main tab component:**
   ```bash
   touch src/components/members/profile/tabs/ActivityTab.tsx
   ```

   ```typescript
   import { useState, useEffect, useContext, useMemo } from 'react';
   import { Filter, Download, Search, Calendar } from 'lucide-react';
   import { MemberContext } from '../../../../pages/MemberProfile';
   import { useAuth } from '../../../../contexts/AuthContext';
   import { activityService } from '../../../../services/firebase/activity.service';
   import { MemberActivity, ActivityFilter, ActivityType } from '../../../../types/activity';
   import { ACTIVITY_CONFIG } from '../../../../types/activity';
   import { ActivityTimeline } from '../components/ActivityTimeline';
   import { ActivityFilters } from '../components/ActivityFilters';
   import { ActivitySummary } from '../components/ActivitySummary';

   export default function ActivityTab() {
     const { member } = useContext(MemberContext);
     const { member: currentUser } = useAuth();
     
     const [activities, setActivities] = useState<MemberActivity[]>([]);
     const [loading, setLoading] = useState(true);
     const [loadingMore, setLoadingMore] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const [hasMore, setHasMore] = useState(false);
     const [lastDoc, setLastDoc] = useState<any>(null);
     const [showFilters, setShowFilters] = useState(false);
     
     const [filters, setFilters] = useState<ActivityFilter>({
       types: [],
       dateRange: { start: null, end: null },
       search: ''
     });

     const canViewSensitiveActivities = currentUser?.role === 'admin' || currentUser?.role === 'pastor';
     
     const availableActivityTypes = useMemo(() => {
       return Object.entries(ACTIVITY_CONFIG).filter(([type, config]) => {
         if (!config.requiresPermission) return true;
         return canViewSensitiveActivities;
       }).map(([type]) => type as ActivityType);
     }, [canViewSensitiveActivities]);

     // Load initial activities
     useEffect(() => {
       if (!member?.id) return;
       loadActivities(true);
     }, [member?.id, filters]);

     const loadActivities = async (reset = false) => {
       if (!member?.id) return;

       try {
         if (reset) {
           setLoading(true);
           setActivities([]);
           setLastDoc(null);
         } else {
           setLoadingMore(true);
         }

         const result = await activityService.getMemberActivities(
           member.id,
           filters,
           20,
           reset ? undefined : lastDoc
         );

         if (reset) {
           setActivities(result.activities);
         } else {
           setActivities(prev => [...prev, ...result.activities]);
         }

         setHasMore(result.hasMore);
         setLastDoc(result.lastDoc);
         setError(null);
       } catch (err) {
         setError('Failed to load activity history');
         console.error('Error loading activities:', err);
       } finally {
         setLoading(false);
         setLoadingMore(false);
       }
     };

     const handleExport = async () => {
       // Export functionality will be implemented
       console.log('Export activities for member:', member?.id);
     };

     if (!member) {
       return <div>Loading member data...</div>;
     }

     return (
       <div className="space-y-6">
         {/* Header with actions */}
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <div>
             <h2 className="text-lg font-medium text-gray-900">Activity History</h2>
             <p className="text-sm text-gray-500">
               Track member engagement and interactions over time
             </p>
           </div>
           
           <div className="flex items-center gap-2">
             <button
               onClick={() => setShowFilters(!showFilters)}
               className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
             >
               <Filter className="h-4 w-4" />
               Filters
             </button>
             
             <button
               onClick={handleExport}
               className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
             >
               <Download className="h-4 w-4" />
               Export
             </button>
           </div>
         </div>

         {/* Activity Summary */}
         <ActivitySummary memberId={member.id} />

         {/* Filters */}
         {showFilters && (
           <ActivityFilters
             filters={filters}
             onFiltersChange={setFilters}
             availableTypes={availableActivityTypes}
           />
         )}

         {/* Activity Timeline */}
         {loading ? (
           <ActivityLoadingState />
         ) : error ? (
           <ActivityErrorState error={error} onRetry={() => loadActivities(true)} />
         ) : activities.length === 0 ? (
           <ActivityEmptyState />
         ) : (
           <ActivityTimeline
             activities={activities}
             hasMore={hasMore}
             loadingMore={loadingMore}
             onLoadMore={() => loadActivities(false)}
           />
         )}
       </div>
     );
   }
   ```

### Step 4: Create Activity Timeline Component

1. **Create timeline component:**
   ```bash
   mkdir -p src/components/members/profile/components
   touch src/components/members/profile/components/ActivityTimeline.tsx
   ```

   ```typescript
   import { useMemo } from 'react';
   import { format, isToday, isYesterday, startOfDay, isSameDay } from 'date-fns';
   import { MemberActivity } from '../../../../types/activity';
   import { ActivityCard } from './ActivityCard';

   interface ActivityTimelineProps {
     activities: MemberActivity[];
     hasMore: boolean;
     loadingMore: boolean;
     onLoadMore: () => void;
   }

   export function ActivityTimeline({ activities, hasMore, loadingMore, onLoadMore }: ActivityTimelineProps) {
     // Group activities by date
     const groupedActivities = useMemo(() => {
       const groups: Record<string, MemberActivity[]> = {};
       
       activities.forEach(activity => {
         const date = startOfDay(activity.timestamp);
         const dateKey = date.toISOString();
         
         if (!groups[dateKey]) {
           groups[dateKey] = [];
         }
         groups[dateKey].push(activity);
       });

       // Sort groups by date (newest first)
       return Object.entries(groups)
         .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
         .map(([dateKey, activities]) => ({
           date: new Date(dateKey),
           activities: activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
         }));
     }, [activities]);

     const formatDateHeader = (date: Date) => {
       if (isToday(date)) return 'Today';
       if (isYesterday(date)) return 'Yesterday';
       return format(date, 'EEEE, MMMM d, yyyy');
     };

     return (
       <div className="space-y-6">
         {groupedActivities.map(({ date, activities }) => (
           <div key={date.toISOString()} className="space-y-4">
             {/* Date Header */}
             <div className="flex items-center gap-4">
               <h3 className="text-sm font-medium text-gray-900">
                 {formatDateHeader(date)}
               </h3>
               <div className="flex-1 h-px bg-gray-200" />
               <span className="text-xs text-gray-500">
                 {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
               </span>
             </div>

             {/* Activities for this date */}
             <div className="space-y-3 pl-4">
               {activities.map(activity => (
                 <ActivityCard key={activity.id} activity={activity} />
               ))}
             </div>
           </div>
         ))}

         {/* Load More Button */}
         {hasMore && (
           <div className="text-center py-4">
             <button
               onClick={onLoadMore}
               disabled={loadingMore}
               className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
             >
               {loadingMore ? (
                 <>
                   <div className="h-4 w-4 animate-spin rounded-full border border-gray-600 border-t-transparent" />
                   Loading...
                 </>
               ) : (
                 'Load More Activities'
               )}
             </button>
           </div>
         )}
       </div>
     );
   }
   ```

### Step 5: Create Activity Card Component

1. **Create activity card:**
   ```bash
   touch src/components/members/profile/components/ActivityCard.tsx
   ```

   ```typescript
   import { format } from 'date-fns';
   import { MemberActivity } from '../../../../types/activity';
   import { ACTIVITY_CONFIG } from '../../../../types/activity';

   interface ActivityCardProps {
     activity: MemberActivity;
   }

   export function ActivityCard({ activity }: ActivityCardProps) {
     const config = ACTIVITY_CONFIG[activity.type];
     
     const renderActivityContent = () => {
       switch (activity.type) {
         case 'profile_update':
           return (
             <div className="text-sm text-gray-600">
               Updated <span className="font-medium">{activity.metadata?.field}</span>
               {activity.metadata?.oldValue && activity.metadata?.newValue && (
                 <div className="mt-1 text-xs text-gray-500">
                   "{activity.metadata.oldValue}" → "{activity.metadata.newValue}"
                 </div>
               )}
             </div>
           );

         case 'status_change':
           return (
             <div className="text-sm text-gray-600">
               Changed from <span className="font-medium">{activity.metadata?.previousStatus}</span> to{' '}
               <span className="font-medium">{activity.metadata?.newStatus}</span>
               {activity.metadata?.reason && (
                 <div className="mt-1 text-xs text-gray-500 italic">
                   "{activity.metadata.reason}"
                 </div>
               )}
             </div>
           );

         case 'event_attendance':
           return (
             <div className="text-sm text-gray-600">
               {activity.metadata?.attendanceStatus === 'attended' ? 'Attended' : 'Registered for'}{' '}
               <span className="font-medium">{activity.metadata?.eventName}</span>
               {activity.metadata?.eventDate && (
                 <div className="mt-1 text-xs text-gray-500">
                   {format(new Date(activity.metadata.eventDate), 'PPP')}
                 </div>
               )}
             </div>
           );

         case 'volunteer_service':
           return (
             <div className="text-sm text-gray-600">
               Volunteered as <span className="font-medium">{activity.metadata?.role}</span>{' '}
               in {activity.metadata?.department}
               {activity.metadata?.hours && (
                 <div className="mt-1 text-xs text-gray-500">
                   {activity.metadata.hours} hours of service
                 </div>
               )}
             </div>
           );

         case 'communication':
           return (
             <div className="text-sm text-gray-600">
               {activity.metadata?.direction === 'outgoing' ? 'Sent' : 'Received'}{' '}
               {activity.metadata?.method} communication
               {activity.metadata?.subject && (
                 <div className="mt-1 text-xs text-gray-500 italic">
                   "{activity.metadata.subject}"
                 </div>
               )}
             </div>
           );

         default:
           return (
             <div className="text-sm text-gray-600">
               {activity.description || 'Activity recorded'}
             </div>
           );
       }
     };

     return (
       <div className="flex gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
         {/* Activity Icon */}
         <div className={`flex-shrink-0 h-8 w-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
           <span className="text-sm">{config.icon}</span>
         </div>

         {/* Activity Content */}
         <div className="flex-1 min-w-0">
           <div className="flex items-start justify-between">
             <div className="flex-1">
               <h4 className="text-sm font-medium text-gray-900">
                 {activity.title}
               </h4>
               {renderActivityContent()}
             </div>
             
             <div className="flex-shrink-0 ml-4">
               <time className="text-xs text-gray-500">
                 {format(activity.timestamp, 'h:mm a')}
               </time>
             </div>
           </div>

           {/* Source indicator */}
           {activity.source !== 'system' && (
             <div className="mt-2">
               <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                 {activity.source === 'manual' ? 'Manually added' : 'Imported'}
               </span>
             </div>
           )}
         </div>
       </div>
     );
   }
   ```

### Step 6: Create Activity Filters Component

1. **Create filters component:**
   ```bash
   touch src/components/members/profile/components/ActivityFilters.tsx
   ```

   ```typescript
   import { useState } from 'react';
   import { Search, Calendar, X } from 'lucide-react';
   import { ActivityFilter, ActivityType } from '../../../../types/activity';
   import { ACTIVITY_CONFIG } from '../../../../types/activity';

   interface ActivityFiltersProps {
     filters: ActivityFilter;
     onFiltersChange: (filters: ActivityFilter) => void;
     availableTypes: ActivityType[];
   }

   export function ActivityFilters({ filters, onFiltersChange, availableTypes }: ActivityFiltersProps) {
     const [localSearch, setLocalSearch] = useState(filters.search);

     const updateFilters = (updates: Partial<ActivityFilter>) => {
       onFiltersChange({ ...filters, ...updates });
     };

     const toggleActivityType = (type: ActivityType) => {
       const newTypes = filters.types.includes(type)
         ? filters.types.filter(t => t !== type)
         : [...filters.types, type];
       updateFilters({ types: newTypes });
     };

     const clearAllFilters = () => {
       setLocalSearch('');
       onFiltersChange({
         types: [],
         dateRange: { start: null, end: null },
         search: ''
       });
     };

     const hasActiveFilters = filters.types.length > 0 || 
                             filters.dateRange.start || 
                             filters.dateRange.end || 
                             filters.search;

     return (
       <div className="bg-gray-50 rounded-lg p-4 space-y-4">
         {/* Search */}
         <div className="relative">
           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
           <input
             type="text"
             placeholder="Search activities..."
             value={localSearch}
             onChange={(e) => setLocalSearch(e.target.value)}
             onBlur={() => updateFilters({ search: localSearch })}
             onKeyDown={(e) => e.key === 'Enter' && updateFilters({ search: localSearch })}
             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
           />
         </div>

         {/* Date Range */}
         <div className="grid grid-cols-2 gap-3">
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">
               From Date
             </label>
             <input
               type="date"
               value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
               onChange={(e) => updateFilters({
                 dateRange: {
                   ...filters.dateRange,
                   start: e.target.value ? new Date(e.target.value) : null
                 }
               })}
               className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">
               To Date
             </label>
             <input
               type="date"
               value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
               onChange={(e) => updateFilters({
                 dateRange: {
                   ...filters.dateRange,
                   end: e.target.value ? new Date(e.target.value) : null
                 }
               })}
               className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
           </div>
         </div>

         {/* Activity Types */}
         <div>
           <label className="block text-xs font-medium text-gray-700 mb-2">
             Activity Types
           </label>
           <div className="flex flex-wrap gap-2">
             {availableTypes.map(type => {
               const config = ACTIVITY_CONFIG[type];
               const isSelected = filters.types.includes(type);
               
               return (
                 <button
                   key={type}
                   onClick={() => toggleActivityType(type)}
                   className={`
                     inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors
                     ${isSelected 
                       ? `${config.bgColor} ${config.color} ring-1 ring-inset ring-current` 
                       : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                     }
                   `}
                 >
                   <span>{config.icon}</span>
                   {config.label}
                 </button>
               );
             })}
           </div>
         </div>

         {/* Clear Filters */}
         {hasActiveFilters && (
           <div className="flex justify-between items-center pt-2 border-t border-gray-200">
             <span className="text-xs text-gray-500">
               {filters.types.length > 0 && `${filters.types.length} type filter(s)`}
               {filters.dateRange.start && `, date range`}
               {filters.search && `, search: "${filters.search}"`}
             </span>
             <button
               onClick={clearAllFilters}
               className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
             >
               <X className="h-3 w-3" />
               Clear All
             </button>
           </div>
         )}
       </div>
     );
   }
   ```

### Step 7: Create Activity Summary Component

1. **Create summary component:**
   ```bash
   touch src/components/members/profile/components/ActivitySummary.tsx
   ```

   ```typescript
   import { useState, useEffect } from 'react';
   import { TrendingUp, Calendar } from 'lucide-react';
   import { activityService } from '../../../../services/firebase/activity.service';
   import { ActivityType } from '../../../../types/activity';
   import { ACTIVITY_CONFIG } from '../../../../types/activity';

   interface ActivitySummaryProps {
     memberId: string;
   }

   export function ActivitySummary({ memberId }: ActivitySummaryProps) {
     const [summary, setSummary] = useState<Record<ActivityType, number>>({} as Record<ActivityType, number>);
     const [loading, setLoading] = useState(true);
     const [timeRange, setTimeRange] = useState<30 | 90 | 365>(30);

     useEffect(() => {
       loadSummary();
     }, [memberId, timeRange]);

     const loadSummary = async () => {
       try {
         setLoading(true);
         const summaryData = await activityService.getActivitySummary(memberId, timeRange);
         setSummary(summaryData);
       } catch (error) {
         console.error('Error loading activity summary:', error);
       } finally {
         setLoading(false);
       }
     };

     const totalActivities = Object.values(summary).reduce((sum, count) => sum + count, 0);
     const topActivityTypes = Object.entries(summary)
       .sort(([, a], [, b]) => b - a)
       .slice(0, 3);

     if (loading) {
       return (
         <div className="bg-white rounded-lg border border-gray-200 p-6">
           <div className="animate-pulse">
             <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
             <div className="grid grid-cols-3 gap-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="text-center">
                   <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2"></div>
                   <div className="h-3 w-16 bg-gray-200 rounded mx-auto"></div>
                 </div>
               ))}
             </div>
           </div>
         </div>
       );
     }

     return (
       <div className="bg-white rounded-lg border border-gray-200 p-6">
         <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
             <TrendingUp className="h-5 w-5 text-gray-600" />
             <h3 className="text-lg font-medium text-gray-900">Activity Summary</h3>
           </div>
           
           <div className="flex items-center gap-2">
             <Calendar className="h-4 w-4 text-gray-500" />
             <select
               value={timeRange}
               onChange={(e) => setTimeRange(Number(e.target.value) as 30 | 90 | 365)}
               className="text-sm border-0 bg-transparent text-gray-600 focus:outline-none focus:ring-0"
             >
               <option value={30}>Last 30 days</option>
               <option value={90}>Last 3 months</option>
               <option value={365}>Last year</option>
             </select>
           </div>
         </div>

         {totalActivities === 0 ? (
           <div className="text-center py-8 text-gray-500">
             <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
             <p className="text-sm">No activities in the selected time period</p>
           </div>
         ) : (
           <div className="space-y-4">
             {/* Total Activities */}
             <div className="text-center">
               <div className="text-3xl font-bold text-gray-900">{totalActivities}</div>
               <div className="text-sm text-gray-500">
                 Total activities in last {timeRange} days
               </div>
             </div>

             {/* Top Activity Types */}
             {topActivityTypes.length > 0 && (
               <div>
                 <h4 className="text-sm font-medium text-gray-700 mb-3">Most Common Activities</h4>
                 <div className="grid grid-cols-3 gap-4">
                   {topActivityTypes.map(([type, count]) => {
                     const config = ACTIVITY_CONFIG[type as ActivityType];
                     return (
                       <div key={type} className="text-center">
                         <div className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${config.bgColor} mb-2`}>
                           <span className="text-sm">{config.icon}</span>
                         </div>
                         <div className="text-lg font-semibold text-gray-900">{count}</div>
                         <div className="text-xs text-gray-500">{config.label}</div>
                       </div>
                     );
                   })}
                 </div>
               </div>
             )}
           </div>
         )}
       </div>
     );
   }
   ```

### Step 8: Create State Components

1. **Create loading, error, and empty states:**
   ```typescript
   // Add to ActivityTab.tsx

   function ActivityLoadingState() {
     return (
       <div className="space-y-6">
         {/* Summary skeleton */}
         <div className="bg-white rounded-lg border border-gray-200 p-6">
           <div className="animate-pulse">
             <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
             <div className="h-12 w-24 bg-gray-200 rounded mx-auto mb-2"></div>
             <div className="h-3 w-20 bg-gray-200 rounded mx-auto"></div>
           </div>
         </div>

         {/* Activity list skeleton */}
         <div className="space-y-4">
           {[1, 2, 3].map(i => (
             <div key={i} className="flex gap-3 p-4 bg-white rounded-lg border border-gray-200">
               <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
               <div className="flex-1 space-y-2">
                 <div className="h-4 w-48 bg-gray-200 rounded"></div>
                 <div className="h-3 w-64 bg-gray-200 rounded"></div>
               </div>
               <div className="h-3 w-12 bg-gray-200 rounded"></div>
             </div>
           ))}
         </div>
       </div>
     );
   }

   function ActivityErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
     return (
       <div className="text-center py-12">
         <div className="text-red-600 mb-4">⚠️</div>
         <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Activities</h3>
         <p className="text-sm text-gray-600 mb-4">{error}</p>
         <button
           onClick={onRetry}
           className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
         >
           Try Again
         </button>
       </div>
     );
   }

   function ActivityEmptyState() {
     return (
       <div className="text-center py-12">
         <Calendar className="mx-auto h-12 w-12 text-gray-400" />
         <h3 className="mt-2 text-sm font-medium text-gray-900">No Activities Yet</h3>
         <p className="mt-1 text-sm text-gray-500">
           Activity history will appear here as the member engages with church programs.
         </p>
       </div>
     );
   }
   ```

### Step 9: Add Mock Data Generation

1. **Create mock data for development:**
   ```bash
   touch src/utils/mockActivityData.ts
   ```

   ```typescript
   import { MemberActivity, ActivityType } from '../types/activity';

   export function generateMockActivities(memberId: string, count: number = 20): Omit<MemberActivity, 'id'>[] {
     const activities: Omit<MemberActivity, 'id'>[] = [];
     const now = new Date();

     for (let i = 0; i < count; i++) {
       const daysAgo = Math.floor(Math.random() * 90);
       const timestamp = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
       
       const activityTypes: ActivityType[] = ['profile_update', 'status_change', 'event_attendance', 'volunteer_service'];
       const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];

       let activity: Omit<MemberActivity, 'id'>;

       switch (type) {
         case 'profile_update':
           activity = {
             memberId,
             type,
             title: 'Profile Updated',
             description: 'Member information was updated',
             timestamp,
             metadata: {
               field: 'phone',
               oldValue: '(555) 123-4567',
               newValue: '(555) 987-6543',
               updatedBy: 'self'
             },
             source: 'system'
           };
           break;

         case 'event_attendance':
           activity = {
             memberId,
             type,
             title: 'Sunday Service Attendance',
             description: 'Attended Sunday morning service',
             timestamp,
             metadata: {
               eventId: 'event-123',
               eventName: 'Sunday Morning Service',
               eventDate: timestamp,
               attendanceStatus: 'attended'
             },
             source: 'system'
           };
           break;

         default:
           activity = {
             memberId,
             type,
             title: 'Activity Recorded',
             timestamp,
             source: 'system'
           };
       }

       activities.push(activity);
     }

     return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
   }
   ```

## Testing Plan

### Unit Tests
```typescript
// src/components/members/profile/tabs/__tests__/ActivityTab.test.tsx

describe('ActivityTab', () => {
  it('loads activity history on mount');
  it('filters activities by type');
  it('filters activities by date range');
  it('searches activities by text');
  it('loads more activities on scroll');
  it('displays empty state when no activities');
  it('handles loading and error states');
  it('respects permission-based activity visibility');
});
```

### Integration Tests
```typescript
describe('Activity History Integration', () => {
  it('fetches activities from Firebase');
  it('creates new activities when events occur');
  it('maintains activity timeline order');
  it('handles pagination correctly');
});
```

### Manual Testing Checklist
- [ ] Activity tab loads with timeline view
- [ ] Activities display with correct icons and formatting
- [ ] Date grouping works correctly
- [ ] Filter system works for all filter types
- [ ] Search functionality works across titles and descriptions
- [ ] Load more button works for pagination
- [ ] Empty state shows for members with no activities
- [ ] Loading states display during data fetch
- [ ] Error handling works for failed requests
- [ ] Permission system hides sensitive activities

## Rollback Plan

### Immediate Rollback
1. **Remove activity tab:**
   ```bash
   rm src/components/members/profile/tabs/ActivityTab.tsx
   rm -rf src/components/members/profile/components/
   ```

2. **Remove activity types:**
   ```bash
   rm src/types/activity.ts
   rm src/services/firebase/activity.service.ts
   ```

3. **Revert tab navigation:**
   ```bash
   git checkout HEAD~1 -- src/router/index.tsx
   ```

### Data Safety
- No existing data affected
- Activity collection can remain in Firebase
- Feature can be re-enabled without data loss

## Notes

### Design Decisions
- Timeline view provides chronological context
- Activity grouping by date improves readability
- Filter system enables targeted activity searches
- Permission-based visibility protects sensitive information

### Future Enhancements
- Real-time activity updates via Firestore listeners
- Activity export to PDF/CSV formats
- Bulk activity creation and management
- Integration with calendar events and volunteer scheduling
- Activity analytics and engagement scoring

### Related PRPs
- **PRP-002:** Integrates with tab navigation system
- **PRP-006:** Will track membership status changes
- **PRP-008:** Will track note additions and communications
- **PRP-010:** Will be tested for accessibility compliance