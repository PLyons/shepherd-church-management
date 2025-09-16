import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  Timestamp,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  MemberActivity,
  ActivityType,
  ActivityFilter,
} from '../../types/activity';

class ActivityService {
  private readonly collectionName = 'memberActivities';

  async addActivity(
    activity: Omit<MemberActivity, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      await addDoc(collection(db, this.collectionName), {
        ...activity,
        timestamp: Timestamp.now(),
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
    lastDoc?: QueryDocumentSnapshot
  ): Promise<{
    activities: MemberActivity[];
    hasMore: boolean;
    lastDoc: QueryDocumentSnapshot | undefined;
  }> {
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
        q = query(
          q,
          where('timestamp', '>=', Timestamp.fromDate(filters.dateRange.start))
        );
      }

      if (filters.dateRange?.end) {
        q = query(
          q,
          where('timestamp', '<=', Timestamp.fromDate(filters.dateRange.end))
        );
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

      const activities = docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as MemberActivity[];

      // Apply text search filter (client-side for now)
      let filteredActivities = activities;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredActivities = activities.filter(
          (activity) =>
            activity.title.toLowerCase().includes(searchLower) ||
            activity.description?.toLowerCase().includes(searchLower)
        );
      }

      return {
        activities: filteredActivities,
        hasMore,
        lastDoc: docs[docs.length - 1],
      };
    } catch (error) {
      console.error('Error fetching member activities:', error);
      throw new Error('Failed to load activity history');
    }
  }

  async getActivitySummary(
    memberId: string,
    days: number = 30
  ): Promise<Record<ActivityType, number>> {
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

      snapshot.docs.forEach((doc) => {
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
