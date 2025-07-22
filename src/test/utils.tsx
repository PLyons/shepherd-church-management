import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { ToastProvider } from '@/contexts/ToastContext'

// Mock Auth Context for testing
interface MockAuthContextType {
  user: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  sendMagicLink: (email: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const MockAuthContext = React.createContext<MockAuthContextType>({
  user: null,
  loading: false,
  signIn: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockResolvedValue(undefined),
  sendMagicLink: vi.fn().mockResolvedValue(undefined),
  resetPassword: vi.fn().mockResolvedValue(undefined),
})

interface MockAuthProviderProps {
  children: React.ReactNode
  value?: Partial<MockAuthContextType>
}

export function MockAuthProvider({ children, value = {} }: MockAuthProviderProps) {
  const mockValue: MockAuthContextType = {
    user: null,
    loading: false,
    signIn: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    sendMagicLink: vi.fn().mockResolvedValue(undefined),
    resetPassword: vi.fn().mockResolvedValue(undefined),
    ...value,
  }

  return (
    <MockAuthContext.Provider value={mockValue}>
      {children}
    </MockAuthContext.Provider>
  )
}

// Custom render function with all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add custom options here if needed
  authValue?: Partial<MockAuthContextType>
  initialRoute?: string
}

function AllTheProviders({ 
  children, 
  authValue, 
  initialRoute = '/' 
}: { 
  children: React.ReactNode
  authValue?: Partial<MockAuthContextType>
  initialRoute?: string
}) {
  // Set initial route if provided
  if (initialRoute !== '/') {
    window.history.pushState({}, '', initialRoute)
  }

  return (
    <BrowserRouter>
      <MockAuthProvider value={authValue}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </MockAuthProvider>
    </BrowserRouter>
  )
}

export function customRender(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { authValue, initialRoute, ...renderOptions } = options
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders 
        authValue={authValue} 
        initialRoute={initialRoute}
      >
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
export { MockAuthContext }
export { MockAuthProvider as TestAuthProvider }

// Helper functions for testing
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'member',
  firstName: 'Test',
  lastName: 'User',
  ...overrides,
})

export const createMockMember = (overrides = {}) => ({
  id: 'test-member-id',
  firstName: 'Test',
  lastName: 'Member',
  email: 'member@test.com',
  phone: '555-1234',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'Male' as const,
  role: 'member' as const,
  householdId: 'test-household-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockHousehold = (overrides = {}) => ({
  id: 'test-household-id',
  name: 'Test Household',
  address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockEvent = (overrides = {}) => ({
  id: 'test-event-id',
  title: 'Test Event',
  description: 'Test event description',
  startDate: new Date(),
  endDate: new Date(),
  location: 'Test Location',
  maxAttendees: 50,
  createdBy: 'test-user-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})