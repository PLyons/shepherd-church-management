import { useState, useEffect, useContext, useMemo } from 'react';
import { Filter, Download, Calendar } from 'lucide-react';
import { MemberContext } from '../../../../pages/MemberProfile';
import { useAuth } from '../../../../hooks/useUnifiedAuth';
import { activityService } from '../../../../services/firebase/activity.service';
import { MemberActivity, ActivityFilter, ActivityType } from '../../../../types/activity';
import { ACTIVITY_CONFIG } from '../../../../types/activity';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { ActivityFilters } from '../components/ActivityFilters';
import { ActivitySummary } from '../components/ActivitySummary';
import { generateMockActivities } from '../../../../utils/mockActivityData';

// State components
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
      <div className="mt-4">
        <button
          onClick={() => {
            // For development: add mock data
            const mockData = generateMockActivities('demo-member-id', 10);
            console.log('Mock activities generated:', mockData);
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Generate Sample Data (Dev)
        </button>
      </div>
    </div>
  );
}

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

      // For now, use mock data for development
      // In production, this would call activityService.getMemberActivities
      const mockData = generateMockActivities(member.id, 15);
      const mockActivities: MemberActivity[] = mockData.map((activity, index) => ({
        ...activity,
        id: `activity-${index}`
      }));

      // Filter sensitive activities based on permissions
      const filteredActivities = mockActivities.filter(activity => {
        const config = ACTIVITY_CONFIG[activity.type];
        if (!config.requiresPermission) return true;
        return canViewSensitiveActivities;
      });

      // Apply client-side filters
      let finalActivities = filteredActivities;
      
      if (filters.types.length > 0) {
        finalActivities = finalActivities.filter(a => filters.types.includes(a.type));
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        finalActivities = finalActivities.filter(a => 
          a.title.toLowerCase().includes(searchLower) ||
          a.description?.toLowerCase().includes(searchLower)
        );
      }

      if (filters.dateRange.start) {
        finalActivities = finalActivities.filter(a => 
          a.timestamp >= filters.dateRange.start!
        );
      }

      if (filters.dateRange.end) {
        finalActivities = finalActivities.filter(a => 
          a.timestamp <= filters.dateRange.end!
        );
      }

      if (reset) {
        setActivities(finalActivities);
      } else {
        setActivities(prev => [...prev, ...finalActivities]);
      }

      setHasMore(false); // Mock data doesn't support pagination
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
    alert('Export functionality coming soon!');
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
