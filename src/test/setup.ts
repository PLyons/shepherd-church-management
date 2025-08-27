import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('../lib/firebase', () => ({
  db: {},
  auth: {},
  analytics: {},
}));

// Mock Firebase Auth Context
vi.mock('../contexts/FirebaseAuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    isLoading: false,
  })),
  FirebaseAuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Toast Context
vi.mock('../contexts/ToastContext', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
  })),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock EventRSVP Service
vi.mock('../services/firebase/event-rsvp.service', () => ({
  eventRSVPService: {
    createRSVP: vi.fn(),
    updateRSVP: vi.fn(),
    getCapacityInfo: vi.fn(),
    getWaitlistPosition: vi.fn(),
    getRSVPByMember: vi.fn(),
  },
}));