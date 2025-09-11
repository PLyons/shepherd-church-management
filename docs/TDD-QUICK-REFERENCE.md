# TDD Quick Reference Guide

> Essential TDD commands and patterns for Shepherd CMS development
> Last Updated: 2025-01-09
> Version: 1.0.0
> **Related:** [Agent TDD Workflow](AGENT-TDD-WORKFLOW.md) | [CLAUDE.md TDD Section](../CLAUDE.md#test-driven-development-tdd-methodology)

## Quick Commands

### Essential TDD Commands
```bash
# Start TDD workflow
npm run test -- --watch                    # Watch mode for active development
npm run test:coverage                       # Generate coverage reports
npm run test -- --grep="[feature]"         # Run specific test group
npm run test -- --bail                     # Stop on first failure

# Test file patterns
npm run test -- src/services              # Test all services
npm run test -- src/components            # Test all components
npm run test -- --grep="unit"             # Run only unit tests
npm run test -- --grep="integration"      # Run only integration tests
npm run test -- --grep="security"         # Run only security tests

# Coverage analysis
npm run test:coverage -- --reporter=html   # HTML coverage report
npm run test:coverage -- --threshold=80    # Enforce minimum coverage
```

## RED-GREEN-REFACTOR Cycle

### RED Phase: Write Failing Tests

**1. Identify Requirements**
```typescript
// Example: Service method requirements
describe('DonationsService', () => {
  describe('create', () => {
    it('should create donation with valid data', async () => {
      // This test should FAIL initially
      const donationData = TestFixtures.validDonation;
      const result = await service.create(donationData);
      expect(result.id).toBeDefined();
      expect(result.amount).toBe(donationData.amount);
    });
    
    it('should reject donations with negative amounts', async () => {
      // This test should FAIL initially
      const invalidData = { ...TestFixtures.validDonation, amount: -100 };
      await expect(service.create(invalidData)).rejects.toThrow('Invalid amount');
    });
  });
});
```

**2. Run Tests (Should Fail)**
```bash
npm run test -- --grep="DonationsService create"
# Expected: All tests fail with "method not implemented" or similar
```

### GREEN Phase: Make Tests Pass

**1. Implement Minimal Code**
```typescript
// Minimal implementation to pass tests
class DonationsService {
  async create(data: DonationFormData): Promise<Donation> {
    // Minimal validation
    if (data.amount <= 0) {
      throw new Error('Invalid amount');
    }
    
    // Minimal implementation
    const donation: Donation = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    
    return donation;
  }
}
```

**2. Run Tests (Should Pass)**
```bash
npm run test -- --grep="DonationsService create"
# Expected: All tests pass
```

### REFACTOR Phase: Improve Code

**1. Optimize Implementation**
```typescript
// Refactored implementation
class DonationsService {
  async create(data: DonationFormData): Promise<Donation> {
    // Enhanced validation
    this.validateDonationData(data);
    
    // Clean implementation with proper error handling
    try {
      const donation = await this.firestore
        .collection('donations')
        .add(this.convertToDocument(data));
        
      return this.convertFromDocument(donation);
    } catch (error) {
      throw new ServiceError('Failed to create donation', error);
    }
  }
  
  private validateDonationData(data: DonationFormData): void {
    if (data.amount <= 0) throw new ValidationError('Invalid amount');
    if (!data.categoryId) throw new ValidationError('Category required');
    // Additional validation...
  }
}
```

**2. Run Tests Again (Should Still Pass)**
```bash
npm run test -- --grep="DonationsService"
npm run test:coverage
# Expected: All tests pass, improved coverage
```

## Test File Organization

### Directory Structure
```
src/
├── services/
│   ├── firebase/
│   │   ├── __tests__/
│   │   │   ├── donations.service.unit.test.ts
│   │   │   ├── donations.service.integration.test.ts
│   │   │   └── donations.service.security.test.ts
│   │   └── donations.service.ts
│   └── __tests__/
│       └── test-fixtures.ts
├── components/
│   ├── donations/
│   │   ├── __tests__/
│   │   │   ├── DonationForm.test.tsx
│   │   │   └── DonationList.test.tsx
│   │   ├── DonationForm.tsx
│   │   └── DonationList.tsx
│   └── __tests__/
│       └── component-test-utils.tsx
└── types/
    ├── __tests__/
    │   └── donations.test.ts
    └── donations.ts
```

### File Naming Conventions
- **Unit Tests**: `[feature].unit.test.ts` - Pure business logic
- **Integration Tests**: `[feature].integration.test.ts` - Service interactions
- **Security Tests**: `[feature].security.test.ts` - Access control & validation
- **Component Tests**: `[Component].test.tsx` - React component behavior
- **Type Tests**: `[types].test.ts` - TypeScript interface validation

## Common Testing Patterns

### 1. Service Testing Pattern
```typescript
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { DonationsService } from '../donations.service';
import { mockFirestore } from '../../__tests__/firebase-mocks';

describe('DonationsService', () => {
  let service: DonationsService;
  let mockCollection: Mock;
  let mockDoc: Mock;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup service with mocked dependencies
    service = new DonationsService(mockFirestore);
    mockCollection = mockFirestore.collection as Mock;
    mockDoc = mockCollection().doc as Mock;
  });

  describe('CRUD Operations', () => {
    it('should create donation successfully', async () => {
      // Arrange
      const donationData = TestFixtures.validDonation;
      mockDoc.set.mockResolvedValue({ id: 'new-id' });
      
      // Act
      const result = await service.create(donationData);
      
      // Assert
      expect(mockCollection).toHaveBeenCalledWith('donations');
      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: donationData.amount,
          createdAt: expect.any(Object)
        })
      );
      expect(result.id).toBe('new-id');
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      // Arrange
      const donationData = TestFixtures.validDonation;
      mockDoc.set.mockRejectedValue(new Error('Firestore error'));
      
      // Act & Assert
      await expect(service.create(donationData))
        .rejects.toThrow('Failed to create donation');
    });
  });
});
```

### 2. React Component Testing Pattern
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DonationForm } from '../DonationForm';
import { TestProviders } from '../../__tests__/test-providers';

describe('DonationForm', () => {
  const mockOnSubmit = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForm = (props = {}) => {
    return render(
      <TestProviders>
        <DonationForm onSubmit={mockOnSubmit} {...props} />
      </TestProviders>
    );
  };

  describe('Form Validation', () => {
    it('should show validation error for invalid amount', async () => {
      renderForm();
      
      // Enter invalid amount
      const amountInput = screen.getByLabelText(/amount/i);
      fireEvent.change(amountInput, { target: { value: '-100' } });
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      
      // Check for validation error
      await waitFor(() => {
        expect(screen.getByText(/amount must be greater than/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should submit form with valid data', async () => {
      renderForm();
      
      // Fill form with valid data
      fireEvent.change(screen.getByLabelText(/amount/i), 
        { target: { value: '100' } });
      fireEvent.change(screen.getByLabelText(/category/i), 
        { target: { value: 'tithe' } });
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      
      // Check form submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 100,
            categoryId: 'tithe'
          })
        );
      });
    });
  });
});
```

### 3. Firebase Integration Testing Pattern
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { initializeTestApp, clearFirestoreData } from '@firebase/rules-unit-testing';
import { DonationsService } from '../donations.service';

describe('DonationsService Integration', () => {
  let testApp: any;
  let service: DonationsService;

  beforeEach(async () => {
    testApp = initializeTestApp({
      projectId: 'test-shepherd-cms',
      auth: { uid: 'test-admin', role: 'admin' }
    });
    
    service = new DonationsService(testApp.firestore());
    await clearFirestoreData({ projectId: 'test-shepherd-cms' });
  });

  afterEach(async () => {
    await testApp.delete();
  });

  it('should create and retrieve donation', async () => {
    // Create donation
    const donationData = TestFixtures.validDonation;
    const created = await service.create(donationData);
    
    // Retrieve donation
    const retrieved = await service.getById(created.id);
    
    // Verify
    expect(retrieved).toEqual(created);
    expect(retrieved.amount).toBe(donationData.amount);
  });
});
```

## Coverage Checking

### Coverage Targets
- **Overall**: 80% minimum
- **Critical Paths**: 90% (core business logic)
- **Financial/Security**: 95% (donation handling, authentication)
- **UI Components**: 85% (user interaction scenarios)

### Coverage Commands
```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
npm run test:coverage -- --reporter=html
open coverage/index.html

# Check specific thresholds
npm run test:coverage -- --threshold=80

# Coverage for specific files
npm run test:coverage -- src/services/firebase/donations.service.ts
```

### Coverage Analysis
```bash
# Show uncovered lines
npm run test:coverage -- --reporter=detailed

# Generate JSON coverage data
npm run test:coverage -- --reporter=json

# Combined coverage report
npm run test:coverage -- --reporter=html --reporter=text
```

## Test Fixtures & Utilities

### Creating Test Fixtures
```typescript
// src/__tests__/test-fixtures.ts
export const TestFixtures = {
  validDonation: {
    amount: 100.00,
    donationDate: '2025-01-15',
    method: 'credit_card' as const,
    categoryId: 'tithe-category',
    memberId: 'member-123',
    note: 'Test donation'
  },
  
  validMember: {
    id: 'member-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: 'member' as const
  },
  
  adminUser: {
    uid: 'admin-123',
    role: 'admin' as const,
    email: 'admin@church.com'
  }
};
```

### Test Providers Setup
```typescript
// src/__tests__/test-providers.tsx
import { AuthContextProvider } from '../contexts/AuthContext';
import { ToastContextProvider } from '../contexts/ToastContext';

export const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthContextProvider testUser={TestFixtures.adminUser}>
      <ToastContextProvider>
        {children}
      </ToastContextProvider>
    </AuthContextProvider>
  );
};
```

## Troubleshooting Guide

### Common Issues & Solutions

#### 1. Tests Not Running
```bash
# Check test configuration
npm run test -- --reporter=verbose

# Clear cache
npm run test -- --clear-cache

# Update dependencies
npm update vitest @testing-library/react
```

#### 2. Coverage Not Accurate
```bash
# Ensure all files are included
npm run test:coverage -- --include="src/**/*.{ts,tsx}"

# Exclude test files from coverage
npm run test:coverage -- --exclude="**/*.test.{ts,tsx}"
```

#### 3. Flaky Tests
- **Use `waitFor`** for async operations
- **Mock external dependencies** consistently
- **Reset mocks** between tests with `beforeEach`
- **Use deterministic test data** (avoid random values)

#### 4. TypeScript Errors in Tests
```typescript
// Proper typing for mocks
const mockService = {
  create: vi.fn().mockResolvedValue(TestFixtures.validDonation),
  getById: vi.fn().mockImplementation((id: string) => 
    Promise.resolve({ ...TestFixtures.validDonation, id }))
} as jest.Mocked<DonationsService>;
```

### Performance Optimization

#### 1. Faster Test Execution
```bash
# Run tests in parallel
npm run test -- --threads

# Run only changed files
npm run test -- --changed

# Skip coverage for faster iteration
npm run test -- --skip-coverage
```

#### 2. Selective Test Running
```bash
# Run specific test file
npm run test -- donations.service.test.ts

# Run tests matching pattern
npm run test -- --grep="validation"

# Run failed tests only
npm run test -- --retry-once
```

## Integration with MCP Servers

### Using Test Runner MCP
```bash
# Start test watcher via MCP
mcp test-runner watch

# Run coverage via MCP
mcp test-runner coverage --threshold=80

# Run specific test suite via MCP
mcp test-runner run --pattern="donations"
```

### Using Serena for Test Analysis
```bash
# Analyze test coverage gaps
serena analyze-tests --coverage-report

# Find untested code paths
serena find-untested-code --path="src/services"

# Generate test stubs
serena generate-test-stubs --component="DonationForm"
```

## Daily TDD Workflow

### 1. Start of Development Session
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run existing tests to ensure baseline
npm run test

# Start TDD watch mode
npm run test -- --watch
```

### 2. Feature Development Cycle
1. **Write failing test** (RED)
2. **Run test to verify failure**
3. **Implement minimal code** (GREEN)
4. **Run test to verify pass**
5. **Refactor implementation** (REFACTOR)
6. **Run all tests to prevent regression**
7. **Check coverage**: `npm run test:coverage`

### 3. End of Session
```bash
# Final test run
npm run test

# Coverage check
npm run test:coverage

# Commit with test status
git add .
git commit -m "feat: implement [feature] with 95% test coverage"
git push origin feature-branch
```

## Best Practices Summary

1. **Write tests first** - Always start with failing tests
2. **Small iterations** - Keep RED-GREEN-REFACTOR cycles short
3. **Comprehensive coverage** - Aim for high coverage on critical paths
4. **Mock external dependencies** - Keep tests isolated and fast
5. **Test edge cases** - Include error conditions and boundary values
6. **Maintain test quality** - Refactor tests as you refactor code
7. **Use descriptive names** - Test names should explain expected behavior
8. **Organize tests logically** - Group related tests with clear structure

---

**Quick Reference Card**
```bash
# Essential daily commands
npm run test -- --watch          # TDD development mode
npm run test:coverage            # Check coverage
npm run test -- --bail           # Stop on first failure
npm run test -- --grep="[name]"  # Run specific tests
```