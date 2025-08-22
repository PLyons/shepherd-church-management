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