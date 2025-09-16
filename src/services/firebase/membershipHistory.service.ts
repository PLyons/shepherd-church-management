import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MembershipStatusChange } from '../../types';

class MembershipHistoryService {
  private getHistoryCollection(memberId: string) {
    return collection(db, 'members', memberId, 'statusHistory');
  }

  async addStatusChange(
    change: Omit<MembershipStatusChange, 'id' | 'changedAt'>
  ): Promise<void> {
    try {
      const historyRef = this.getHistoryCollection(change.memberId);

      // Clean the data to ensure no undefined values are passed to Firestore
      const cleanData = {
        memberId: change.memberId,
        previousStatus: change.previousStatus,
        newStatus: change.newStatus,
        reason: change.reason || null,
        changedBy: change.changedBy,
        changedByName: change.changedByName,
        changedAt: Timestamp.now(),
        metadata: change.metadata
          ? {
              source: change.metadata.source,
              userAgent: change.metadata.userAgent || null,
              ipAddress: change.metadata.ipAddress || null,
            }
          : null,
      };

      await addDoc(historyRef, cleanData);
    } catch (error) {
      console.error('Error adding status change:', error);
      throw new Error('Failed to record status change');
    }
  }

  async getStatusHistory(memberId: string): Promise<MembershipStatusChange[]> {
    try {
      const historyRef = this.getHistoryCollection(memberId);
      const q = query(historyRef, orderBy('changedAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        changedAt: doc.data().changedAt.toDate(),
      })) as MembershipStatusChange[];
    } catch (error) {
      console.error('Error fetching status history:', error);
      throw new Error('Failed to load status history');
    }
  }
}

export const membershipHistoryService = new MembershipHistoryService();
