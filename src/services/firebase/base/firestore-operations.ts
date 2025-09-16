// src/services/firebase/base/firestore-operations.ts
// Core Firestore CRUD operations module providing type-safe document manipulation with automatic timestamp handling
// Handles basic create, read, update, delete operations with document-to-client transformation and error management
// RELEVANT FILES: src/services/firebase/base/base-firestore-service.ts, src/services/firebase/base/firestore-error-handler.ts, src/utils/converters/converter-utils.ts, src/services/firebase/base/index.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  Timestamp,
  DocumentReference,
  Firestore,
} from 'firebase/firestore';

export class FirestoreOperations<TDocument, TClient> {
  constructor(
    private db: Firestore,
    private collectionName: string,
    private documentToClient: (id: string, document: TDocument) => TClient,
    private clientToDocument: (client: Partial<TClient>) => Partial<TDocument>
  ) {}

  protected getCollectionRef() {
    return collection(this.db, this.collectionName);
  }

  protected getDocRef(id: string) {
    return doc(this.db, this.collectionName, id);
  }

  /**
   * Create a new document
   */
  async create(data: Partial<TClient>, customId?: string): Promise<TClient> {
    try {
      console.log(
        'Creating document in collection:',
        this.collectionName,
        'with data:',
        data
      );
      const documentData = this.clientToDocument(data);
      console.log('Converted to document data:', documentData);
      const now = Timestamp.now();

      // Add timestamps
      const finalData = {
        ...documentData,
        createdAt: now,
        updatedAt: now,
      };

      console.log('Final data for Firestore:', finalData);

      let docRef: DocumentReference;

      if (customId) {
        // Use custom ID (e.g., Firebase Auth UID for members)
        docRef = this.getDocRef(customId);
        await setDoc(docRef, finalData as any);
      } else {
        // Auto-generate ID
        docRef = await addDoc(this.getCollectionRef(), finalData);
      }

      console.log('Document created with ID:', docRef.id);

      // Fetch and return the created document
      const createdDoc = await getDoc(docRef);
      if (!createdDoc.exists()) {
        throw new Error('Failed to create document');
      }

      const result = this.documentToClient(
        createdDoc.id,
        createdDoc.data() as TDocument
      );
      console.log('Returning created document:', result);
      return result;
    } catch (error) {
      console.error(
        'Error creating document in collection:',
        this.collectionName,
        error
      );
      throw error;
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
      console.error(
        'Error getting document from collection:',
        this.collectionName,
        error
      );
      throw error;
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

      await updateDoc(docRef, finalData as Partial<TDocument>);

      // Fetch and return the updated document
      const updatedDoc = await getDoc(docRef);
      if (!updatedDoc.exists()) {
        throw new Error('Document not found after update');
      }

      return this.documentToClient(
        updatedDoc.id,
        updatedDoc.data() as TDocument
      );
    } catch (error) {
      console.error(
        'Error updating document in collection:',
        this.collectionName,
        error
      );
      throw error;
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
      console.error(
        'Error deleting document from collection:',
        this.collectionName,
        error
      );
      throw error;
    }
  }
}
