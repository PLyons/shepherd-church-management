// src/services/firebase/base/firestore-subscriptions.ts
// Real-time Firestore subscription management module for live data updates and collection monitoring
// Handles onSnapshot subscriptions for both collections and documents with automatic error handling and cleanup
// RELEVANT FILES: src/services/firebase/base/base-firestore-service.ts, src/services/firebase/members/member-subscriptions.ts, src/services/firebase/base/firestore-queries.ts, src/services/firebase/base/firestore-error-handler.ts

import {
  onSnapshot,
  query,
  QueryConstraint,
  DocumentReference,
  CollectionReference,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';

export type SubscriptionCallback<TClient> = (
  data: TClient[],
  error?: Error
) => void;

export type DocumentSubscriptionCallback<TClient> = (
  data: TClient | null,
  error?: Error
) => void;

export class FirestoreSubscriptions<TDocument, TClient> {
  private subscriptions = new Map<string, Unsubscribe>();

  constructor(
    private db: Firestore,
    private getCollectionRef: () => CollectionReference,
    private getDocRef: (id: string) => DocumentReference,
    private documentToClient: (id: string, document: TDocument) => TClient
  ) {}

  /**
   * Subscribe to collection changes with optional query constraints
   */
  subscribeToCollection(
    callback: SubscriptionCallback<TClient>,
    constraints: QueryConstraint[] = [],
    subscriptionId?: string
  ): string {
    const id = subscriptionId || `collection_${Date.now()}`;
    
    try {
      const q = constraints.length > 0 
        ? query(this.getCollectionRef(), ...constraints)
        : this.getCollectionRef();

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          try {
            const items = querySnapshot.docs.map(doc =>
              this.documentToClient(doc.id, doc.data() as TDocument)
            );
            callback(items);
          } catch (error) {
            console.error('Error processing collection snapshot:', error);
            callback([], error as Error);
          }
        },
        (error) => {
          console.error('Collection subscription error:', error);
          callback([], error);
        }
      );

      this.subscriptions.set(id, unsubscribe);
      return id;
    } catch (error) {
      console.error('Error setting up collection subscription:', error);
      callback([], error as Error);
      return id;
    }
  }

  /**
   * Subscribe to a single document changes
   */
  subscribeToDocument(
    id: string,
    callback: DocumentSubscriptionCallback<TClient>,
    subscriptionId?: string
  ): string {
    const subId = subscriptionId || `document_${id}_${Date.now()}`;
    
    try {
      const docRef = this.getDocRef(id);

      const unsubscribe = onSnapshot(
        docRef,
        (docSnapshot) => {
          try {
            if (docSnapshot.exists()) {
              const client = this.documentToClient(
                docSnapshot.id,
                docSnapshot.data() as TDocument
              );
              callback(client);
            } else {
              callback(null);
            }
          } catch (error) {
            console.error('Error processing document snapshot:', error);
            callback(null, error as Error);
          }
        },
        (error) => {
          console.error('Document subscription error:', error);
          callback(null, error);
        }
      );

      this.subscriptions.set(subId, unsubscribe);
      return subId;
    } catch (error) {
      console.error('Error setting up document subscription:', error);
      callback(null, error as Error);
      return subId;
    }
  }

  /**
   * Subscribe to multiple documents by their IDs
   */
  subscribeToDocuments(
    ids: string[],
    callback: SubscriptionCallback<TClient>,
    subscriptionId?: string
  ): string {
    const subId = subscriptionId || `documents_${Date.now()}`;
    const documentCallbacks = new Map<string, TClient | null>();
    let completedCount = 0;

    const checkAndCallback = () => {
      if (completedCount === ids.length) {
        const results = Array.from(documentCallbacks.values()).filter(
          (item): item is TClient => item !== null
        );
        callback(results);
      }
    };

    const documentSubscriptions: string[] = [];

    ids.forEach((id) => {
      const docSubId = this.subscribeToDocument(
        id,
        (data, error) => {
          if (error) {
            callback([], error);
            return;
          }
          
          const wasInitialized = documentCallbacks.has(id);
          documentCallbacks.set(id, data);
          
          if (!wasInitialized) {
            completedCount++;
          }
          
          checkAndCallback();
        },
        `${subId}_doc_${id}`
      );
      documentSubscriptions.push(docSubId);
    });

    // Store a composite unsubscribe function
    const compositeUnsubscribe = () => {
      documentSubscriptions.forEach(docSubId => {
        this.unsubscribe(docSubId);
      });
    };

    this.subscriptions.set(subId, compositeUnsubscribe);
    return subId;
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): boolean {
    const unsubscribe = this.subscriptions.get(subscriptionId);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
      return true;
    }
    return false;
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.subscriptions.clear();
  }

  /**
   * Get count of active subscriptions
   */
  getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get all active subscription IDs
   */
  getActiveSubscriptionIds(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Check if a subscription is active
   */
  isSubscriptionActive(subscriptionId: string): boolean {
    return this.subscriptions.has(subscriptionId);
  }
}