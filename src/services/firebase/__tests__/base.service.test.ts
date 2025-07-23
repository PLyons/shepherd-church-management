import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Firebase modules before importing the service
vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    startAfter: vi.fn(),
    onSnapshot: vi.fn(),
    writeBatch: vi.fn(),
    Timestamp: {
      now: vi.fn(() => ({
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
        toDate: () => new Date(),
      })),
      fromDate: vi.fn((date: Date) => ({
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
        toDate: () => date,
      })),
    },
    FirestoreError: class FirestoreError extends Error {
      code: string;
      constructor(code: string, message: string) {
        super(message);
        this.code = code;
        this.name = 'FirestoreError';
      }
    },
  };
});

vi.mock('../../../lib/firebase', () => ({
  db: 'mock-db',
}));

// Import the service after mocks are set up
import { BaseFirestoreService } from '../base.service';
// Import the mocked functions
import * as firestore from 'firebase/firestore';

// Test document and client types
interface TestDocument {
  name: string;
  value: number;
  createdAt: any;
  updatedAt: any;
}

interface TestClient {
  id: string;
  name: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

// Concrete implementation for testing
class TestFirestoreService extends BaseFirestoreService<
  TestDocument,
  TestClient
> {
  constructor() {
    super('test-collection');
  }

  protected documentToClient(id: string, document: TestDocument): TestClient {
    return {
      id,
      name: document.name,
      value: document.value,
      createdAt: document.createdAt?.toDate?.() || new Date(document.createdAt),
      updatedAt: document.updatedAt?.toDate?.() || new Date(document.updatedAt),
    };
  }

  protected clientToDocument(
    client: Partial<TestClient>
  ): Partial<TestDocument> {
    return {
      name: client.name,
      value: client.value,
    };
  }
}

describe('BaseFirestoreService', () => {
  let service: TestFirestoreService;
  let mockDocRef: any;
  let mockCollectionRef: any;
  let mockBatch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TestFirestoreService();

    mockDocRef = {
      id: 'test-doc-id',
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockCollectionRef = {
      id: 'test-collection',
    };

    mockBatch = {
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(firestore.collection).mockReturnValue(mockCollectionRef);
    vi.mocked(firestore.doc).mockReturnValue(mockDocRef);
    vi.mocked(firestore.query).mockReturnValue({ get: vi.fn() });
    vi.mocked(firestore.writeBatch).mockReturnValue(mockBatch);
  });

  describe('create', () => {
    it('should create a new document with auto-generated ID', async () => {
      const testData = { name: 'Test Item', value: 42 };
      const mockDocData = {
        name: 'Test Item',
        value: 42,
        createdAt: {
          seconds: 1640995200,
          nanoseconds: 0,
          toDate: () => new Date('2022-01-01'),
        },
        updatedAt: {
          seconds: 1640995200,
          nanoseconds: 0,
          toDate: () => new Date('2022-01-01'),
        },
      };

      vi.mocked(firestore.addDoc).mockResolvedValue(mockDocRef);
      vi.mocked(firestore.getDoc).mockResolvedValue({
        id: 'test-doc-id',
        exists: () => true,
        data: () => mockDocData,
      } as any);

      const result = await service.create(testData);

      expect(vi.mocked(firestore.addDoc)).toHaveBeenCalledWith(
        mockCollectionRef,
        expect.objectContaining({
          name: 'Test Item',
          value: 42,
          createdAt: expect.any(Object),
          updatedAt: expect.any(Object),
        })
      );
      expect(result).toEqual({
        id: 'test-doc-id',
        name: 'Test Item',
        value: 42,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should create a new document with custom ID', async () => {
      const testData = { name: 'Test Item', value: 42 };
      const customId = 'custom-id';
      const mockDocData = {
        name: 'Test Item',
        value: 42,
        createdAt: {
          seconds: 1640995200,
          nanoseconds: 0,
          toDate: () => new Date('2022-01-01'),
        },
        updatedAt: {
          seconds: 1640995200,
          nanoseconds: 0,
          toDate: () => new Date('2022-01-01'),
        },
      };

      vi.mocked(firestore.getDoc).mockResolvedValue({
        id: customId,
        exists: () => true,
        data: () => mockDocData,
      } as any);

      const result = await service.create(testData, customId);

      expect(vi.mocked(firestore.updateDoc)).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          name: 'Test Item',
          value: 42,
          createdAt: expect.any(Object),
          updatedAt: expect.any(Object),
        })
      );
      expect(result.id).toBe(customId);
    });

    it('should handle creation errors', async () => {
      vi.mocked(firestore.addDoc).mockRejectedValue(
        new Error('Creation failed')
      );

      await expect(service.create({ name: 'Test', value: 1 })).rejects.toThrow(
        'Creation failed'
      );
    });
  });

  describe('getById', () => {
    it('should return a document by ID', async () => {
      const mockDocData = {
        name: 'Test Item',
        value: 42,
        createdAt: {
          seconds: 1640995200,
          nanoseconds: 0,
          toDate: () => new Date('2022-01-01'),
        },
        updatedAt: {
          seconds: 1640995200,
          nanoseconds: 0,
          toDate: () => new Date('2022-01-01'),
        },
      };

      vi.mocked(firestore.getDoc).mockResolvedValue({
        id: 'test-doc-id',
        exists: () => true,
        data: () => mockDocData,
      } as any);

      const result = await service.getById('test-doc-id');

      expect(result).toEqual({
        id: 'test-doc-id',
        name: 'Test Item',
        value: 42,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should return null for non-existent document', async () => {
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await service.getById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a document', async () => {
      const updateData = { name: 'Updated Item', value: 100 };
      const mockDocData = {
        name: 'Updated Item',
        value: 100,
        createdAt: {
          seconds: 1640995200,
          nanoseconds: 0,
          toDate: () => new Date('2022-01-01'),
        },
        updatedAt: {
          seconds: 1640995200,
          nanoseconds: 0,
          toDate: () => new Date('2022-01-01'),
        },
      };

      vi.mocked(firestore.getDoc).mockResolvedValue({
        id: 'test-doc-id',
        exists: () => true,
        data: () => mockDocData,
      } as any);

      const result = await service.update('test-doc-id', updateData);

      expect(vi.mocked(firestore.updateDoc)).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          name: 'Updated Item',
          value: 100,
          updatedAt: expect.any(Object),
        })
      );
      expect(result.name).toBe('Updated Item');
      expect(result.value).toBe(100);
    });
  });

  describe('delete', () => {
    it('should delete a document', async () => {
      await service.delete('test-doc-id');

      expect(vi.mocked(firestore.deleteDoc)).toHaveBeenCalledWith(mockDocRef);
    });
  });

  describe('getAll', () => {
    it('should get all documents', async () => {
      const mockDocs = [
        {
          id: 'doc1',
          data: () => ({
            name: 'Item 1',
            value: 1,
            createdAt: {
              seconds: 1640995200,
              nanoseconds: 0,
              toDate: () => new Date('2022-01-01'),
            },
            updatedAt: {
              seconds: 1640995200,
              nanoseconds: 0,
              toDate: () => new Date('2022-01-01'),
            },
          }),
        },
        {
          id: 'doc2',
          data: () => ({
            name: 'Item 2',
            value: 2,
            createdAt: {
              seconds: 1640995200,
              nanoseconds: 0,
              toDate: () => new Date('2022-01-01'),
            },
            updatedAt: {
              seconds: 1640995200,
              nanoseconds: 0,
              toDate: () => new Date('2022-01-01'),
            },
          }),
        },
      ];

      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs,
      } as any);

      const result = await service.getAll();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Item 1');
      expect(result[1].name).toBe('Item 2');
    });

    it('should apply query constraints', async () => {
      const options = {
        where: [{ field: 'value', operator: '>', value: 10 }],
        orderBy: { field: 'name', direction: 'asc' },
        limit: 5,
      };

      vi.mocked(firestore.getDocs).mockResolvedValue({ docs: [] } as any);

      await service.getAll(options as any);

      expect(vi.mocked(firestore.where)).toHaveBeenCalledWith('value', '>', 10);
      expect(vi.mocked(firestore.orderBy)).toHaveBeenCalledWith('name', 'asc');
      expect(vi.mocked(firestore.limit)).toHaveBeenCalledWith(5);
      expect(vi.mocked(firestore.query)).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle Firestore permission errors', async () => {
      const permissionError = new firestore.FirestoreError(
        'permission-denied',
        'Permission denied'
      );

      vi.mocked(firestore.getDoc).mockRejectedValue(permissionError);

      await expect(service.getById('test-id')).rejects.toThrow(
        'You do not have permission to perform this operation'
      );
    });

    it('should handle Firestore not-found errors', async () => {
      const notFoundError = new firestore.FirestoreError(
        'not-found',
        'Document not found'
      );

      vi.mocked(firestore.getDoc).mockRejectedValue(notFoundError);

      await expect(service.getById('test-id')).rejects.toThrow(
        'The requested document was not found'
      );
    });
  });

  describe('batch operations', () => {
    it('should create multiple documents in batch', async () => {
      const items = [
        { name: 'Item 1', value: 1 },
        { name: 'Item 2', value: 2 },
      ];

      vi.mocked(firestore.getDoc).mockResolvedValue({
        id: 'test-id',
        data: () => ({
          name: 'Item 1',
          value: 1,
          createdAt: {
            seconds: 1640995200,
            nanoseconds: 0,
            toDate: () => new Date('2022-01-01'),
          },
          updatedAt: {
            seconds: 1640995200,
            nanoseconds: 0,
            toDate: () => new Date('2022-01-01'),
          },
        }),
      } as any);

      const result = await service.createBatch(items);

      expect(mockBatch.set).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('subscriptions', () => {
    it('should subscribe to document changes', () => {
      const callback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(firestore.onSnapshot).mockReturnValue(mockUnsubscribe);

      const unsubscribe = service.subscribeToDocument('test-id', callback);

      expect(vi.mocked(firestore.onSnapshot)).toHaveBeenCalledWith(
        mockDocRef,
        expect.any(Function),
        expect.any(Function)
      );
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should subscribe to collection changes', () => {
      const callback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(firestore.onSnapshot).mockReturnValue(mockUnsubscribe);

      const unsubscribe = service.subscribeToCollection({}, callback);

      expect(vi.mocked(firestore.onSnapshot)).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });
});
