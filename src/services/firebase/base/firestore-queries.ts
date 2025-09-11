// src/services/firebase/base/firestore-queries.ts
// Advanced Firestore querying module with pagination, filtering, and sorting capabilities
// Provides type-safe query construction, pagination support, and efficient result handling for complex data retrieval
// RELEVANT FILES: src/services/firebase/base/base-firestore-service.ts, src/services/firebase/base/firestore-operations.ts, src/services/firebase/members/member-pagination.ts, src/services/firebase/members/member-search.ts

import {
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryConstraint,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  CollectionReference,
  Firestore,
} from 'firebase/firestore';

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

export interface PaginationParams {
  limit?: number;
  startAfter?: DocumentSnapshot;
}

export interface QueryResult<TClient> {
  items: TClient[];
  lastDoc?: QueryDocumentSnapshot;
  hasMore: boolean;
  total?: number;
}

export class FirestoreQueries<TDocument, TClient> {
  constructor(
    private db: Firestore,
    private getCollectionRef: () => CollectionReference,
    private documentToClient: (id: string, document: TDocument) => TClient
  ) {}

  /**
   * Execute a query with optional filtering and pagination
   */
  async executeQuery(
    constraints: QueryConstraint[] = [],
    pagination?: PaginationParams
  ): Promise<QueryResult<TClient>> {
    try {
      // Ensure constraints is an array
      const constraintsArray = Array.isArray(constraints) ? constraints : [];
      const queryConstraints = [...constraintsArray];
      
      // Add pagination constraints
      if (pagination?.limit) {
        queryConstraints.push(limit(pagination.limit));
      }
      
      if (pagination?.startAfter) {
        queryConstraints.push(startAfter(pagination.startAfter));
      }

      const q = query(this.getCollectionRef(), ...queryConstraints);
      const querySnapshot = await getDocs(q);

      const items = querySnapshot.docs.map(doc =>
        this.documentToClient(doc.id, doc.data() as TDocument)
      );

      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      const hasMore = pagination?.limit ? querySnapshot.docs.length === pagination.limit : false;

      return {
        items,
        lastDoc,
        hasMore,
      };
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  /**
   * Get all documents matching the query constraints
   */
  async getAll(constraints: QueryConstraint[] = []): Promise<TClient[]> {
    const result = await this.executeQuery(constraints);
    return result.items;
  }

  /**
   * Get documents with pagination
   */
  async getPaginated(
    constraints: QueryConstraint[] = [],
    pagination: PaginationParams
  ): Promise<QueryResult<TClient>> {
    return this.executeQuery(constraints, pagination);
  }

  /**
   * Find documents by field value
   */
  async findByField(
    fieldPath: string,
    value: unknown,
    pagination?: PaginationParams
  ): Promise<QueryResult<TClient>> {
    const constraints = [where(fieldPath, '==', value)];
    return this.executeQuery(constraints, pagination);
  }

  /**
   * Find documents with multiple field conditions
   */
  async findByFields(
    conditions: Array<{ field: string; operator: FirestoreOperator; value: unknown }>,
    pagination?: PaginationParams
  ): Promise<QueryResult<TClient>> {
    const constraints = conditions.map(({ field, operator, value }) =>
      where(field, operator, value)
    );
    return this.executeQuery(constraints, pagination);
  }

  /**
   * Search documents with ordering and filtering
   */
  async search(
    searchConstraints: {
      filters?: Array<{ field: string; operator: FirestoreOperator; value: unknown }>;
      orderByField?: string;
      orderDirection?: 'asc' | 'desc';
    },
    pagination?: PaginationParams
  ): Promise<QueryResult<TClient>> {
    const constraints: QueryConstraint[] = [];

    // Add filters
    if (searchConstraints.filters) {
      searchConstraints.filters.forEach(({ field, operator, value }) => {
        constraints.push(where(field, operator, value));
      });
    }

    // Add ordering
    if (searchConstraints.orderByField) {
      constraints.push(
        orderBy(searchConstraints.orderByField, searchConstraints.orderDirection || 'asc')
      );
    }

    return this.executeQuery(constraints, pagination);
  }

  /**
   * Count documents matching constraints (approximate)
   */
  async count(constraints: QueryConstraint[] = []): Promise<number> {
    try {
      const result = await this.executeQuery(constraints);
      return result.items.length;
    } catch (error) {
      console.error('Error counting documents:', error);
      throw error;
    }
  }
}