import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MemberNote, Communication, NoteFilter } from '../../types/notes';

class NotesService {
  private getNotesCollection(memberId: string) {
    return collection(db, 'members', memberId, 'notes');
  }

  private getCommunicationsCollection(memberId: string) {
    return collection(db, 'members', memberId, 'communications');
  }

  // Note operations
  async createNote(
    memberId: string,
    note: Omit<MemberNote, 'id' | 'createdAt' | 'accessCount'>
  ): Promise<string> {
    try {
      const notesRef = this.getNotesCollection(memberId);
      const docRef = await addDoc(notesRef, {
        ...note,
        createdAt: Timestamp.now(),
        accessCount: 0,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating note:', error);
      throw new Error('Failed to create note');
    }
  }

  async updateNote(
    memberId: string,
    noteId: string,
    updates: Partial<MemberNote>
  ): Promise<void> {
    try {
      const noteRef = doc(this.getNotesCollection(memberId), noteId);
      await updateDoc(noteRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating note:', error);
      throw new Error('Failed to update note');
    }
  }

  async deleteNote(memberId: string, noteId: string): Promise<void> {
    try {
      const noteRef = doc(this.getNotesCollection(memberId), noteId);
      await deleteDoc(noteRef);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw new Error('Failed to delete note');
    }
  }

  async getNotes(
    memberId: string,
    filters: Partial<NoteFilter> = {},
    pageSize: number = 20,
    lastDoc?: any
  ): Promise<{ notes: MemberNote[]; hasMore: boolean; lastDoc: any }> {
    try {
      let q = query(
        this.getNotesCollection(memberId),
        orderBy('createdAt', 'desc')
      );

      // Apply filters
      if (filters.categories?.length) {
        q = query(q, where('category', 'in', filters.categories));
      }

      if (filters.priorities?.length) {
        q = query(q, where('priority', 'in', filters.priorities));
      }

      if (filters.createdBy?.length) {
        q = query(q, where('createdBy', 'in', filters.createdBy));
      }

      if (filters.dateRange?.start) {
        q = query(
          q,
          where('createdAt', '>=', Timestamp.fromDate(filters.dateRange.start))
        );
      }

      if (filters.dateRange?.end) {
        q = query(
          q,
          where('createdAt', '<=', Timestamp.fromDate(filters.dateRange.end))
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
        docs.pop();
      }

      let notes = docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastAccessedAt: doc.data().lastAccessedAt?.toDate(),
      })) as MemberNote[];

      // Apply client-side filters
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        notes = notes.filter(
          (note) =>
            note.title.toLowerCase().includes(searchLower) ||
            note.plainTextContent.toLowerCase().includes(searchLower) ||
            note.tags.some((tag) => tag.toLowerCase().includes(searchLower))
        );
      }

      if (filters.tags?.length) {
        notes = notes.filter((note) =>
          filters.tags!.some((tag) => note.tags.includes(tag))
        );
      }

      return { notes, hasMore, lastDoc: docs[docs.length - 1] };
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw new Error('Failed to load notes');
    }
  }

  async trackNoteAccess(
    memberId: string,
    noteId: string,
    accessedBy: string
  ): Promise<void> {
    try {
      const noteRef = doc(this.getNotesCollection(memberId), noteId);
      await updateDoc(noteRef, {
        lastAccessedBy: accessedBy,
        lastAccessedAt: Timestamp.now(),
        accessCount: increment(1),
      });
    } catch (error) {
      console.error('Error tracking note access:', error);
      // Don't throw error for access tracking failures
    }
  }

  // Communication operations
  async logCommunication(
    memberId: string,
    communication: Omit<Communication, 'id' | 'timestamp'>
  ): Promise<string> {
    try {
      const communicationsRef = this.getCommunicationsCollection(memberId);

      // Convert Date objects to Firestore Timestamps and remove undefined values
      const firestoreData: Record<string, any> = {
        ...communication,
        timestamp: Timestamp.now(),
      };

      // Only add followUpDate if it exists
      if (communication.followUpDate) {
        firestoreData.followUpDate = Timestamp.fromDate(
          communication.followUpDate
        );
      }

      // Remove any undefined values that Firestore doesn't allow
      Object.keys(firestoreData).forEach((key) => {
        if (firestoreData[key] === undefined) {
          delete firestoreData[key];
        }
      });

      console.log('Attempting to save communication data:');
      console.log('- memberId:', memberId);
      console.log('- type:', communication.type);
      console.log('- direction:', communication.direction);
      console.log('- method:', communication.method);
      console.log('- summary:', communication.summary);
      console.log('- recordedBy:', communication.recordedBy);
      console.log('- recordedByName:', communication.recordedByName);
      console.log('- requiresFollowUp:', communication.requiresFollowUp);
      console.log('- followUpCompleted:', communication.followUpCompleted);
      console.log('- followUpDate (original):', communication.followUpDate);
      console.log('- followUpDate (converted):', firestoreData.followUpDate);
      console.log('- Full firestoreData:', firestoreData);

      const docRef = await addDoc(communicationsRef, firestoreData);
      console.log('Successfully saved communication with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Detailed error logging communication:');
      console.error('- Error object:', error);
      console.error(
        '- Error message:',
        error instanceof Error ? error.message : String(error)
      );
      console.error(
        '- Error stack:',
        error instanceof Error ? error.stack : 'No stack trace'
      );
      console.error('- Original communication data:', communication);
      throw new Error('Failed to log communication');
    }
  }

  async getCommunications(
    memberId: string,
    limitCount: number = 50
  ): Promise<Communication[]> {
    try {
      const q = query(
        this.getCommunicationsCollection(memberId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
        followUpDate: doc.data().followUpDate?.toDate(),
      })) as Communication[];
    } catch (error) {
      console.error('Error fetching communications:', error);
      throw new Error('Failed to load communications');
    }
  }
}

export const notesService = new NotesService();
