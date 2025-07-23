import { vi } from 'vitest';

// Mock Firebase App
export const mockFirebaseApp = {
  name: 'test-app',
  options: {
    projectId: 'test-project',
    apiKey: 'test-api-key',
  },
};

// Mock Firestore Document Reference
export const createMockDocRef = (path: string) => ({
  id: path.split('/').pop(),
  path,
  parent: { id: path.split('/').slice(-2, -1)[0] },
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  onSnapshot: vi.fn(),
});

// Mock Firestore Collection Reference
export const createMockCollectionRef = (path: string) => ({
  id: path.split('/').pop(),
  path,
  doc: vi.fn((id?: string) =>
    createMockDocRef(`${path}/${id || 'generated-id'}`)
  ),
  add: vi.fn(),
  get: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
});

// Mock Firestore Query
export const createMockQuery = () => ({
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  get: vi.fn(),
  onSnapshot: vi.fn(),
});

// Mock Firestore Snapshot
export const createMockDocSnapshot = (
  data: any = {},
  exists: boolean = true
) => ({
  id: 'test-doc-id',
  exists: () => exists,
  data: () => (exists ? data : undefined),
  get: (field: string) => data[field],
  ref: createMockDocRef('test-collection/test-doc-id'),
});

export const createMockQuerySnapshot = (docs: any[] = []) => ({
  size: docs.length,
  empty: docs.length === 0,
  docs: docs.map((data, index) => createMockDocSnapshot(data, true)),
  forEach: (callback: (doc: any) => void) => {
    docs.forEach((data, index) => callback(createMockDocSnapshot(data, true)));
  },
});

// Mock Firebase Auth User
export const createMockAuthUser = (overrides: any = {}) => ({
  uid: 'test-user-id',
  email: 'test@example.com',
  emailVerified: true,
  displayName: 'Test User',
  photoURL: null,
  phoneNumber: null,
  isAnonymous: false,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: vi.fn(),
  getIdToken: vi.fn().mockResolvedValue('mock-id-token'),
  getIdTokenResult: vi.fn(),
  reload: vi.fn(),
  toJSON: vi.fn(),
  ...overrides,
});

// Mock Firebase Auth
export const mockFirebaseAuth = {
  currentUser: null,
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendSignInLinkToEmail: vi.fn(),
  isSignInWithEmailLink: vi.fn(),
  signInWithEmailLink: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updatePassword: vi.fn(),
  updateProfile: vi.fn(),
};

// Mock Firestore
export const mockFirestore = {
  collection: vi.fn((path: string) => createMockCollectionRef(path)),
  doc: vi.fn((path: string) => createMockDocRef(path)),
  runTransaction: vi.fn(),
  batch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(),
  })),
  enableNetwork: vi.fn(),
  disableNetwork: vi.fn(),
};

// Mock Firebase Storage
export const mockFirebaseStorage = {
  ref: vi.fn((path?: string) => ({
    child: vi.fn(),
    put: vi.fn(),
    putString: vi.fn(),
    delete: vi.fn(),
    getDownloadURL: vi.fn(),
    getMetadata: vi.fn(),
    updateMetadata: vi.fn(),
    listAll: vi.fn(),
  })),
};

// Mock Timestamp
export const mockTimestamp = {
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
};

// Reset all mocks
export const resetFirebaseMocks = () => {
  vi.clearAllMocks();
  mockFirebaseAuth.currentUser = null;
};
