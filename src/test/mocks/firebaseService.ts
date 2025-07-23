import { vi } from 'vitest';
import {
  mockTimestamp,
  createMockDocSnapshot,
  createMockQuerySnapshot,
} from './firebase';

// Mock implementation of BaseFirestoreService
export class MockBaseFirestoreService<TDocument, TClient> {
  protected collectionName: string;
  private mockData: Map<string, TDocument> = new Map();
  private nextId = 1;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Mock data management
  setMockData(data: Record<string, TDocument>) {
    this.mockData.clear();
    Object.entries(data).forEach(([id, doc]) => {
      this.mockData.set(id, doc);
    });
  }

  addMockDocument(id: string, data: TDocument) {
    this.mockData.set(id, data);
  }

  clearMockData() {
    this.mockData.clear();
  }

  // Abstract methods that need to be implemented by specific service mocks
  protected documentToClient(id: string, document: TDocument): TClient {
    return { id, ...document } as any;
  }

  protected clientToDocument(client: Partial<TClient>): Partial<TDocument> {
    const { id, ...document } = client as any;
    return document;
  }

  // Mock implementations of base service methods
  async create(data: Partial<TClient>, customId?: string): Promise<TClient> {
    const id = customId || `generated-${this.nextId++}`;
    const now = mockTimestamp.now();

    const documentData = {
      ...this.clientToDocument(data),
      createdAt: now,
      updatedAt: now,
    } as TDocument;

    this.mockData.set(id, documentData);
    return this.documentToClient(id, documentData);
  }

  async getById(id: string): Promise<TClient | null> {
    const document = this.mockData.get(id);
    if (!document) {
      return null;
    }
    return this.documentToClient(id, document);
  }

  async update(id: string, data: Partial<TClient>): Promise<TClient> {
    const existingDoc = this.mockData.get(id);
    if (!existingDoc) {
      throw new Error('Document not found');
    }

    const documentData = {
      ...existingDoc,
      ...this.clientToDocument(data),
      updatedAt: mockTimestamp.now(),
    } as TDocument;

    this.mockData.set(id, documentData);
    return this.documentToClient(id, documentData);
  }

  async delete(id: string): Promise<void> {
    this.mockData.delete(id);
  }

  async getAll(options?: any): Promise<TClient[]> {
    const documents = Array.from(this.mockData.entries()).map(([id, doc]) =>
      this.documentToClient(id, doc)
    );

    // Apply basic filtering for testing
    if (options?.where) {
      return documents.filter((doc: any) => {
        return options.where.every((condition: any) => {
          const { field, operator, value } = condition;
          const docValue = doc[field];

          switch (operator) {
            case '==':
              return docValue === value;
            case '!=':
              return docValue !== value;
            case '<':
              return docValue < value;
            case '<=':
              return docValue <= value;
            case '>':
              return docValue > value;
            case '>=':
              return docValue >= value;
            case 'in':
              return Array.isArray(value) && value.includes(docValue);
            case 'array-contains':
              return Array.isArray(docValue) && docValue.includes(value);
            default:
              return true;
          }
        });
      });
    }

    // Apply sorting
    if (options?.orderBy) {
      documents.sort((a: any, b: any) => {
        const aValue = a[options.orderBy.field];
        const bValue = b[options.orderBy.field];
        const direction = options.orderBy.direction === 'desc' ? -1 : 1;

        if (aValue < bValue) return -1 * direction;
        if (aValue > bValue) return 1 * direction;
        return 0;
      });
    }

    // Apply limit
    if (options?.limit) {
      return documents.slice(0, options.limit);
    }

    return documents;
  }

  async getWhere(field: string, operator: any, value: any): Promise<TClient[]> {
    return this.getAll({
      where: [{ field, operator, value }],
    });
  }

  async count(options?: any): Promise<number> {
    const results = await this.getAll(options);
    return results.length;
  }

  subscribeToDocument(
    id: string,
    callback: (data: TClient | null) => void
  ): () => void {
    // Immediately call with current data
    const document = this.mockData.get(id);
    callback(document ? this.documentToClient(id, document) : null);

    // Return unsubscribe function
    return vi.fn();
  }

  subscribeToCollection(
    options?: any,
    callback?: (data: TClient[]) => void
  ): () => void {
    // Immediately call with current data
    this.getAll(options).then((data) => callback?.(data));

    // Return unsubscribe function
    return vi.fn();
  }

  async createBatch(items: Partial<TClient>[]): Promise<TClient[]> {
    const results: TClient[] = [];

    for (const item of items) {
      const result = await this.create(item);
      results.push(result);
    }

    return results;
  }

  async updateBatch(
    updates: { id: string; data: Partial<TClient> }[]
  ): Promise<TClient[]> {
    const results: TClient[] = [];

    for (const update of updates) {
      const result = await this.update(update.id, update.data);
      results.push(result);
    }

    return results;
  }

  async deleteBatch(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(id);
    }
  }
}

// Factory function to create service mocks
export const createMockFirebaseService = <TDocument, TClient>(
  collectionName: string,
  documentToClient?: (id: string, document: TDocument) => TClient,
  clientToDocument?: (client: Partial<TClient>) => Partial<TDocument>
) => {
  const service = new MockBaseFirestoreService<TDocument, TClient>(
    collectionName
  );

  if (documentToClient) {
    service['documentToClient'] = documentToClient;
  }

  if (clientToDocument) {
    service['clientToDocument'] = clientToDocument;
  }

  return service;
};
