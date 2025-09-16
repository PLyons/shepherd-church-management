import {
  writeBatch,
  WriteBatch,
  DocumentReference,
  Firestore,
  Timestamp,
} from 'firebase/firestore';

export interface BatchOperation<TClient> {
  type: 'create' | 'update' | 'delete';
  id?: string;
  data?: Partial<TClient>;
  customId?: string;
}

export interface BatchResult {
  success: boolean;
  operationsCount: number;
  error?: Error;
}

export class FirestoreBatch<TDocument, TClient> {
  private currentBatch: WriteBatch | null = null;
  private operationsCount = 0;

  constructor(
    private db: Firestore,
    private getDocRef: (id: string) => DocumentReference,
    private clientToDocument: (client: Partial<TClient>) => Partial<TDocument>
  ) {}

  /**
   * Start a new batch operation
   */
  startBatch(): this {
    this.currentBatch = writeBatch(this.db);
    this.operationsCount = 0;
    return this;
  }

  /**
   * Add a create operation to the batch
   */
  addCreate(data: Partial<TClient>, customId?: string): this {
    if (!this.currentBatch) {
      throw new Error('No active batch. Call startBatch() first.');
    }

    const docRef = customId
      ? this.getDocRef(customId)
      : this.getDocRef(this.generateId());
    const documentData = this.clientToDocument(data);
    const now = Timestamp.now();

    const finalData = {
      ...documentData,
      createdAt: now,
      updatedAt: now,
    };

    this.currentBatch.set(docRef, finalData as any);
    this.operationsCount++;
    return this;
  }

  /**
   * Add an update operation to the batch
   */
  addUpdate(id: string, data: Partial<TClient>): this {
    if (!this.currentBatch) {
      throw new Error('No active batch. Call startBatch() first.');
    }

    const docRef = this.getDocRef(id);
    const documentData = this.clientToDocument(data);

    const finalData = {
      ...documentData,
      updatedAt: Timestamp.now(),
    };

    this.currentBatch.update(docRef, finalData as Partial<TDocument>);
    this.operationsCount++;
    return this;
  }

  /**
   * Add a delete operation to the batch
   */
  addDelete(id: string): this {
    if (!this.currentBatch) {
      throw new Error('No active batch. Call startBatch() first.');
    }

    const docRef = this.getDocRef(id);
    this.currentBatch.delete(docRef);
    this.operationsCount++;
    return this;
  }

  /**
   * Execute multiple operations in a single batch
   */
  async executeOperations(
    operations: BatchOperation<TClient>[]
  ): Promise<BatchResult> {
    try {
      this.startBatch();

      operations.forEach((operation) => {
        switch (operation.type) {
          case 'create':
            if (!operation.data) {
              throw new Error('Create operation requires data');
            }
            this.addCreate(operation.data, operation.customId);
            break;

          case 'update':
            if (!operation.id || !operation.data) {
              throw new Error('Update operation requires id and data');
            }
            this.addUpdate(operation.id, operation.data);
            break;

          case 'delete':
            if (!operation.id) {
              throw new Error('Delete operation requires id');
            }
            this.addDelete(operation.id);
            break;

          default:
            throw new Error(`Unknown operation type: ${operation.type}`);
        }
      });

      await this.commitBatch();

      return {
        success: true,
        operationsCount: this.operationsCount,
      };
    } catch (error) {
      console.error('Batch operations failed:', error);
      return {
        success: false,
        operationsCount: this.operationsCount,
        error: error as Error,
      };
    }
  }

  /**
   * Commit the current batch
   */
  async commitBatch(): Promise<void> {
    if (!this.currentBatch) {
      throw new Error('No active batch to commit.');
    }

    try {
      await this.currentBatch.commit();
      console.log(
        `Batch committed successfully with ${this.operationsCount} operations`
      );
    } catch (error) {
      console.error('Error committing batch:', error);
      throw error;
    } finally {
      this.currentBatch = null;
      this.operationsCount = 0;
    }
  }

  /**
   * Cancel the current batch
   */
  cancelBatch(): void {
    this.currentBatch = null;
    this.operationsCount = 0;
  }

  /**
   * Batch create multiple documents
   */
  async createMultiple(
    items: Array<{ data: Partial<TClient>; customId?: string }>
  ): Promise<BatchResult> {
    const operations: BatchOperation<TClient>[] = items.map((item) => ({
      type: 'create',
      data: item.data,
      customId: item.customId,
    }));

    return this.executeOperations(operations);
  }

  /**
   * Batch update multiple documents
   */
  async updateMultiple(
    updates: Array<{ id: string; data: Partial<TClient> }>
  ): Promise<BatchResult> {
    const operations: BatchOperation<TClient>[] = updates.map((update) => ({
      type: 'update',
      id: update.id,
      data: update.data,
    }));

    return this.executeOperations(operations);
  }

  /**
   * Batch delete multiple documents
   */
  async deleteMultiple(ids: string[]): Promise<BatchResult> {
    const operations: BatchOperation<TClient>[] = ids.map((id) => ({
      type: 'delete',
      id,
    }));

    return this.executeOperations(operations);
  }

  /**
   * Get current batch status
   */
  getBatchStatus(): { isActive: boolean; operationsCount: number } {
    return {
      isActive: this.currentBatch !== null,
      operationsCount: this.operationsCount,
    };
  }

  /**
   * Generate a unique ID (placeholder implementation)
   */
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}
