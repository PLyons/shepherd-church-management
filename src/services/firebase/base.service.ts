import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  Timestamp,
  DocumentReference,
  Query,
  QueryConstraint,
  FirestoreError
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { QueryOptions } from '../../types/firestore';

// ============================================================================
// BASE FIRESTORE SERVICE CLASS
// ============================================================================
// Provides common CRUD operations for all Firestore collections

export abstract class BaseFirestoreService<TDocument, TClient> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // ============================================================================
  // ABSTRACT METHODS (must be implemented by subclasses)
  // ============================================================================

  protected abstract documentToClient(id: string, document: TDocument): TClient;
  protected abstract clientToDocument(client: Partial<TClient>): Partial<TDocument>;

  // ============================================================================
  // COLLECTION REFERENCE
  // ============================================================================

  protected getCollectionRef() {
    return collection(db, this.collectionName);
  }

  protected getDocRef(id: string) {
    return doc(db, this.collectionName, id);
  }

  // ============================================================================
  // BASIC CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new document
   */
  async create(data: Partial<TClient>, customId?: string): Promise<TClient> {
    try {
      const documentData = this.clientToDocument(data);
      const now = Timestamp.now();
      
      // Add timestamps
      const finalData = {
        ...documentData,
        createdAt: now,
        updatedAt: now,
      };

      let docRef: DocumentReference;
      
      if (customId) {
        // Use custom ID (e.g., Firebase Auth UID for members)
        docRef = this.getDocRef(customId);
        await updateDoc(docRef, finalData as any);
      } else {
        // Auto-generate ID
        docRef = await addDoc(this.getCollectionRef(), finalData);
      }

      // Fetch and return the created document
      const createdDoc = await getDoc(docRef);
      if (!createdDoc.exists()) {
        throw new Error('Failed to create document');
      }

      return this.documentToClient(createdDoc.id, createdDoc.data() as TDocument);
    } catch (error) {
      console.error(`Error creating ${this.collectionName} document:`, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Get a document by ID
   */
  async getById(id: string): Promise<TClient | null> {
    try {
      const docRef = this.getDocRef(id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.documentToClient(docSnap.id, docSnap.data() as TDocument);
    } catch (error) {
      console.error(`Error getting ${this.collectionName} document:`, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Update a document by ID
   */
  async update(id: string, data: Partial<TClient>): Promise<TClient> {
    try {
      const docRef = this.getDocRef(id);
      const documentData = this.clientToDocument(data);
      
      // Add update timestamp
      const finalData = {
        ...documentData,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(docRef, finalData as any);

      // Fetch and return the updated document
      const updatedDoc = await getDoc(docRef);
      if (!updatedDoc.exists()) {
        throw new Error('Document not found after update');
      }

      return this.documentToClient(updatedDoc.id, updatedDoc.data() as TDocument);
    } catch (error) {
      console.error(`Error updating ${this.collectionName} document:`, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Delete a document by ID
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = this.getDocRef(id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting ${this.collectionName} document:`, error);
      throw this.handleFirestoreError(error);
    }
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  /**
   * Get all documents with optional filtering, sorting, and pagination
   */
  async getAll(options?: QueryOptions): Promise<TClient[]> {
    try {
      const constraints: QueryConstraint[] = [];

      // Add where clauses
      if (options?.where) {
        options.where.forEach(condition => {
          constraints.push(where(condition.field, condition.operator, condition.value));
        });
      }

      // Add ordering
      if (options?.orderBy) {
        constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
      }

      // Add limit
      if (options?.limit) {
        constraints.push(limit(options.limit));
      }

      // Add pagination
      if (options?.startAfter) {
        constraints.push(startAfter(options.startAfter));
      }

      const q = query(this.getCollectionRef(), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => 
        this.documentToClient(doc.id, doc.data() as TDocument)
      );
    } catch (error) {
      console.error(`Error querying ${this.collectionName} documents:`, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Get documents with a simple where condition
   */
  async getWhere(field: string, operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any', value: any): Promise<TClient[]> {
    return this.getAll({
      where: [{ field, operator, value }]
    });
  }

  /**
   * Count documents with optional filtering
   */
  async count(options?: QueryOptions): Promise<number> {
    const results = await this.getAll(options);
    return results.length;
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to document changes
   */
  subscribeToDocument(id: string, callback: (data: TClient | null) => void): () => void {
    const docRef = this.getDocRef(id);
    
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(this.documentToClient(docSnap.id, docSnap.data() as TDocument));
      } else {
        callback(null);
      }
    }, (error) => {
      console.error(`Error in ${this.collectionName} document subscription:`, error);
    });
  }

  /**
   * Subscribe to collection changes
   */
  subscribeToCollection(options?: QueryOptions, callback?: (data: TClient[]) => void): () => void {
    const constraints: QueryConstraint[] = [];

    // Add where clauses
    if (options?.where) {
      options.where.forEach(condition => {
        constraints.push(where(condition.field, condition.operator, condition.value));
      });
    }

    // Add ordering
    if (options?.orderBy) {
      constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
    }

    // Add limit
    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(this.getCollectionRef(), ...constraints);
    
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => 
        this.documentToClient(doc.id, doc.data() as TDocument)
      );
      callback?.(data);
    }, (error) => {
      console.error(`Error in ${this.collectionName} collection subscription:`, error);
    });
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Create multiple documents in a batch
   */
  async createBatch(items: Partial<TClient>[]): Promise<TClient[]> {
    try {
      const batch = writeBatch(db);
      const docRefs: DocumentReference[] = [];
      const now = Timestamp.now();

      items.forEach(item => {
        const docRef = doc(this.getCollectionRef());
        const documentData = this.clientToDocument(item);
        const finalData = {
          ...documentData,
          createdAt: now,
          updatedAt: now,
        };
        
        batch.set(docRef, finalData);
        docRefs.push(docRef);
      });

      await batch.commit();

      // Fetch created documents
      const createdDocs = await Promise.all(
        docRefs.map(async (docRef) => {
          const doc = await getDoc(docRef);
          return this.documentToClient(doc.id, doc.data() as TDocument);
        })
      );

      return createdDocs;
    } catch (error) {
      console.error(`Error creating ${this.collectionName} batch:`, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Update multiple documents in a batch
   */
  async updateBatch(updates: { id: string; data: Partial<TClient> }[]): Promise<TClient[]> {
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();

      updates.forEach(({ id, data }) => {
        const docRef = this.getDocRef(id);
        const documentData = this.clientToDocument(data);
        const finalData = {
          ...documentData,
          updatedAt: now,
        };
        
        batch.update(docRef, finalData as any);
      });

      await batch.commit();

      // Fetch updated documents
      const updatedDocs = await Promise.all(
        updates.map(async ({ id }) => {
          const doc = await getDoc(this.getDocRef(id));
          return this.documentToClient(doc.id, doc.data() as TDocument);
        })
      );

      return updatedDocs;
    } catch (error) {
      console.error(`Error updating ${this.collectionName} batch:`, error);
      throw this.handleFirestoreError(error);
    }
  }

  /**
   * Delete multiple documents in a batch
   */
  async deleteBatch(ids: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);

      ids.forEach(id => {
        const docRef = this.getDocRef(id);
        batch.delete(docRef);
      });

      await batch.commit();
    } catch (error) {
      console.error(`Error deleting ${this.collectionName} batch:`, error);
      throw this.handleFirestoreError(error);
    }
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  protected handleFirestoreError(error: any): Error {
    if (error instanceof FirestoreError) {
      switch (error.code) {
        case 'permission-denied':
          return new Error('You do not have permission to perform this operation');
        case 'not-found':
          return new Error('The requested document was not found');
        case 'already-exists':
          return new Error('A document with this ID already exists');
        case 'failed-precondition':
          return new Error('The operation failed due to a precondition failure');
        case 'unavailable':
          return new Error('The service is temporarily unavailable');
        default:
          return new Error(`Firestore error: ${error.message}`);
      }
    }
    
    return error instanceof Error ? error : new Error('An unknown error occurred');
  }
}