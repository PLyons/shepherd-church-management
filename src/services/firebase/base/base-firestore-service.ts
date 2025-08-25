import {
  collection,
  doc,
  DocumentReference,
  CollectionReference,
  Firestore,
  QueryConstraint,
  Timestamp,
} from 'firebase/firestore';

import { FirestoreOperations } from './firestore-operations';
import { FirestoreQueries, PaginationParams, QueryResult } from './firestore-queries';

type FirestoreOperator = 
  | '==' 
  | '!=' 
  | '<' 
  | '<=' 
  | '>' 
  | '>=' 
  | 'array-contains' 
  | 'array-contains-any' 
  | 'in' 
  | 'not-in';
import { FirestoreSubscriptions, SubscriptionCallback, DocumentSubscriptionCallback } from './firestore-subscriptions';
import { FirestoreBatch, BatchOperation, BatchResult } from './firestore-batch';
import { FirestoreErrorHandler, ErrorContext } from './firestore-error-handler';

export abstract class BaseFirestoreService<TDocument, TClient> {
  protected operations: FirestoreOperations<TDocument, TClient>;
  protected queries: FirestoreQueries<TDocument, TClient>;
  protected subscriptions: FirestoreSubscriptions<TDocument, TClient>;
  protected batch: FirestoreBatch<TDocument, TClient>;

  constructor(
    protected db: Firestore,
    protected collectionName: string,
    protected documentToClient: (id: string, document: TDocument) => TClient,
    protected clientToDocument: (client: Partial<TClient>) => Partial<TDocument>
  ) {
    // Initialize composition modules
    this.operations = new FirestoreOperations(
      db,
      collectionName,
      documentToClient,
      clientToDocument
    );

    this.queries = new FirestoreQueries(
      db,
      () => this.getCollectionRef(),
      documentToClient
    );

    this.subscriptions = new FirestoreSubscriptions(
      db,
      () => this.getCollectionRef(),
      (id: string) => this.getDocRef(id),
      documentToClient
    );

    this.batch = new FirestoreBatch(
      db,
      (id: string) => this.getDocRef(id),
      clientToDocument
    );
  }

  // ============================================================================
  // COLLECTION AND DOCUMENT REFERENCES
  // ============================================================================

  protected getCollectionRef(): CollectionReference {
    return collection(this.db, this.collectionName);
  }

  protected getDocRef(id: string): DocumentReference {
    return doc(this.db, this.collectionName, id);
  }

  // ============================================================================
  // BASIC CRUD OPERATIONS (delegated to FirestoreOperations)
  // ============================================================================

  async create(data: Partial<TClient>, customId?: string): Promise<TClient> {
    return FirestoreErrorHandler.wrapOperation(
      () => this.operations.create(data, customId),
      { operation: 'create', collectionName: this.collectionName }
    );
  }

  async getById(id: string): Promise<TClient | null> {
    return FirestoreErrorHandler.wrapOperation(
      () => this.operations.getById(id),
      { operation: 'getById', collectionName: this.collectionName, documentId: id }
    );
  }

  async update(id: string, data: Partial<TClient>): Promise<TClient> {
    return FirestoreErrorHandler.wrapOperation(
      () => this.operations.update(id, data),
      { operation: 'update', collectionName: this.collectionName, documentId: id }
    );
  }

  async delete(id: string): Promise<void> {
    return FirestoreErrorHandler.wrapOperation(
      () => this.operations.delete(id),
      { operation: 'delete', collectionName: this.collectionName, documentId: id }
    );
  }

  // ============================================================================
  // QUERY OPERATIONS (delegated to FirestoreQueries)
  // ============================================================================

  async getAll(constraints: QueryConstraint[] = []): Promise<TClient[]> {
    return FirestoreErrorHandler.wrapOperation(
      () => this.queries.getAll(constraints),
      { operation: 'getAll', collectionName: this.collectionName }
    );
  }

  async getPaginated(
    constraints: QueryConstraint[] = [],
    pagination: PaginationParams
  ): Promise<QueryResult<TClient>> {
    return FirestoreErrorHandler.wrapOperation(
      () => this.queries.getPaginated(constraints, pagination),
      { operation: 'getPaginated', collectionName: this.collectionName }
    );
  }

  async findByField(
    fieldPath: string,
    value: unknown,
    pagination?: PaginationParams
  ): Promise<QueryResult<TClient>> {
    return FirestoreErrorHandler.wrapOperation(
      () => this.queries.findByField(fieldPath, value, pagination),
      { operation: 'findByField', collectionName: this.collectionName }
    );
  }

  /**
   * Get documents with a simple where condition (returns array of TClient)
   */
  async getWhere(
    field: string,
    operator:
      | '=='
      | '!='
      | '<'
      | '<='
      | '>'
      | '>='
      | 'in'
      | 'not-in'
      | 'array-contains'
      | 'array-contains-any',
    value: string | number | boolean | Timestamp | string[] | number[]
  ): Promise<TClient[]> {
    const result = await this.findByField(field, value);
    return result.items;
  }

  async search(
    searchConstraints: {
      filters?: Array<{ field: string; operator: FirestoreOperator; value: unknown }>;
      orderByField?: string;
      orderDirection?: 'asc' | 'desc';
    },
    pagination?: PaginationParams
  ): Promise<QueryResult<TClient>> {
    return FirestoreErrorHandler.wrapOperation(
      () => this.queries.search(searchConstraints, pagination),
      { operation: 'search', collectionName: this.collectionName }
    );
  }

  async count(constraints: QueryConstraint[] = []): Promise<number> {
    return FirestoreErrorHandler.wrapOperation(
      () => this.queries.count(constraints),
      { operation: 'count', collectionName: this.collectionName }
    );
  }

  // ============================================================================
  // SUBSCRIPTION OPERATIONS (delegated to FirestoreSubscriptions)
  // ============================================================================

  subscribeToCollection(
    callback: SubscriptionCallback<TClient>,
    constraints: QueryConstraint[] = [],
    subscriptionId?: string
  ): string {
    return this.subscriptions.subscribeToCollection(callback, constraints, subscriptionId);
  }

  subscribeToDocument(
    id: string,
    callback: DocumentSubscriptionCallback<TClient>,
    subscriptionId?: string
  ): string {
    return this.subscriptions.subscribeToDocument(id, callback, subscriptionId);
  }

  subscribeToDocuments(
    ids: string[],
    callback: SubscriptionCallback<TClient>,
    subscriptionId?: string
  ): string {
    return this.subscriptions.subscribeToDocuments(ids, callback, subscriptionId);
  }

  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.unsubscribe(subscriptionId);
  }

  unsubscribeAll(): void {
    this.subscriptions.unsubscribeAll();
  }

  getActiveSubscriptionsCount(): number {
    return this.subscriptions.getActiveSubscriptionsCount();
  }

  // ============================================================================
  // BATCH OPERATIONS (delegated to FirestoreBatch)
  // ============================================================================

  async executeOperations(operations: BatchOperation<TClient>[]): Promise<BatchResult> {
    return FirestoreErrorHandler.wrapOperation(
      () => this.batch.executeOperations(operations),
      { operation: 'executeOperations', collectionName: this.collectionName }
    );
  }

  async createMultiple(
    items: Array<{ data: Partial<TClient>; customId?: string }>
  ): Promise<BatchResult> {
    return FirestoreErrorHandler.wrapOperation(
      () => this.batch.createMultiple(items),
      { operation: 'createMultiple', collectionName: this.collectionName }
    );
  }

  async updateMultiple(
    updates: Array<{ id: string; data: Partial<TClient> }>
  ): Promise<BatchResult> {
    return FirestoreErrorHandler.wrapOperation(
      () => this.batch.updateMultiple(updates),
      { operation: 'updateMultiple', collectionName: this.collectionName }
    );
  }

  async deleteMultiple(ids: string[]): Promise<BatchResult> {
    return FirestoreErrorHandler.wrapOperation(
      () => this.batch.deleteMultiple(ids),
      { operation: 'deleteMultiple', collectionName: this.collectionName }
    );
  }

  // ============================================================================
  // ERROR HANDLING UTILITIES
  // ============================================================================

  protected async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries = 3
  ): Promise<T> {
    return FirestoreErrorHandler.retryOperation(
      operation,
      { operation: operationName, collectionName: this.collectionName },
      maxRetries
    );
  }

  protected handleError(error: unknown, operationName: string, documentId?: string): never {
    const context: ErrorContext = {
      operation: operationName,
      collectionName: this.collectionName,
      documentId,
    };

    FirestoreErrorHandler.logError(error, context);
    const errorDetails = FirestoreErrorHandler.handleError(error, context);
    
    throw FirestoreErrorHandler.createError(
      errorDetails.userMessage,
      errorDetails.code,
      error instanceof Error ? error : undefined
    );
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Clean up resources when service is no longer needed
   */
  destroy(): void {
    this.subscriptions.unsubscribeAll();
    this.batch.cancelBatch();
  }
}