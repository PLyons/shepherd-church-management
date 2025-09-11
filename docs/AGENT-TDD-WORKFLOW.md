# Agent TDD Workflow Guide

> Step-by-step TDD implementation guide for AI agents working on Shepherd CMS
> Last Updated: 2025-01-09
> Version: 1.0.0
> **Related:** [TDD Quick Reference](TDD-QUICK-REFERENCE.md) | [CLAUDE.md TDD Section](../CLAUDE.md#test-driven-development-tdd-methodology)

## Overview

This guide provides AI agents with a structured approach to implementing Test-Driven Development (TDD) on the Shepherd CMS project. It integrates with existing MCP servers and ensures consistent, high-quality code delivery.

## Pre-Implementation Checklist

### 1. Context Establishment
- [ ] Read `CLAUDE.md` for project standards and patterns
- [ ] Review relevant PRP document for specific requirements
- [ ] Check `docs/TDD-QUICK-REFERENCE.md` for commands and patterns
- [ ] Verify all dependencies from previous PRPs are complete
- [ ] Confirm test environment is set up: `npm run test`

### 2. MCP Server Integration
- [ ] **Serena**: Use for code analysis and symbol overview
- [ ] **Test Runner**: For continuous test execution
- [ ] **Firebase MCP**: For database operations testing
- [ ] **Context7**: For library documentation lookup

### 3. Test Infrastructure Verification
```bash
# Verify test setup
npm run test -- --version
npm run test:coverage -- --version

# Check existing test patterns
npm run test -- --grep="example" --dry-run
```

## Phase 1: Test Planning & Setup

### Step 1: Analyze Requirements with Serena
```bash
# Get overview of existing code structure
serena get_symbols_overview --path="src/[feature]"

# Find existing patterns for similar features
serena find_symbol --pattern="[SimilarFeature]Service"
serena find_symbol --pattern="[SimilarFeature]Form"
```

### Step 2: Create Test File Structure
Following the established pattern:
```
src/[feature]/
├── __tests__/
│   ├── [feature].unit.test.ts
│   ├── [feature].integration.test.ts
│   ├── [feature].security.test.ts
│   └── [Component].test.tsx
├── [feature].service.ts
├── [Component].tsx
└── index.ts
```

### Step 3: Set Up Test Fixtures
Create comprehensive test data following project patterns:
```typescript
// src/__tests__/test-fixtures/[feature]-fixtures.ts
export const [Feature]TestFixtures = {
  valid[Entity]: {
    // Valid test data matching TypeScript interfaces
  },
  invalid[Entity]: {
    // Invalid test data for error scenarios
  },
  edge[Cases]: {
    // Edge case test data
  }
};
```

## Phase 2: RED - Write Failing Tests

### Step 1: Start with Unit Tests
Begin with pure business logic tests:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { [FeatureService] } from '../[feature].service';

describe('[FeatureService]', () => {
  let service: [FeatureService];
  
  beforeEach(() => {
    service = new [FeatureService]();
    vi.clearAllMocks();
  });

  describe('Core Functionality', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange
      const input = TestFixtures.valid[Entity];
      
      // Act
      const result = service.[method](input);
      
      // Assert
      expect(result).toEqual(expectedOutput);
    });

    it('should throw error when [invalid condition]', () => {
      // Arrange
      const input = TestFixtures.invalid[Entity];
      
      // Act & Assert
      expect(() => service.[method](input)).toThrow('Expected error message');
    });
  });
});
```

### Step 2: Add Integration Tests
Test service interactions with Firebase:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { [FeatureService] } from '../[feature].service';
import { mockFirestore } from '../../__tests__/firebase-mocks';

describe('[FeatureService] Integration', () => {
  let service: [FeatureService];
  let firestore: any;

  beforeEach(() => {
    firestore = mockFirestore();
    service = new [FeatureService](firestore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should interact with Firestore correctly', async () => {
    // Arrange
    const testData = TestFixtures.valid[Entity];
    firestore.collection().doc().set.mockResolvedValue({ id: 'test-id' });
    
    // Act
    const result = await service.create(testData);
    
    // Assert
    expect(firestore.collection).toHaveBeenCalledWith('[collection]');
    expect(result.id).toBe('test-id');
  });
});
```

### Step 3: Add Component Tests (if applicable)
Test React components with user interactions:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { [Component] } from '../[Component]';
import { TestProviders } from '../../__tests__/test-providers';

describe('[Component]', () => {
  const mockProps = {
    onSubmit: vi.fn(),
    // Other required props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with initial state', () => {
    render(
      <TestProviders>
        <[Component] {...mockProps} />
      </TestProviders>
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    render(
      <TestProviders>
        <[Component] {...mockProps} />
      </TestProviders>
    );
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalled();
    });
  });
});
```

### Step 4: Add Security Tests
Test role-based access and data validation:

```typescript
describe('[Feature] Security', () => {
  describe('Role-based Access', () => {
    it('should allow admin access', async () => {
      const adminUser = { uid: 'admin-1', role: 'admin' };
      const service = new [FeatureService](mockFirestore, adminUser);
      
      const result = await service.[protectedMethod]();
      expect(result).toBeDefined();
    });

    it('should deny member access', async () => {
      const memberUser = { uid: 'member-1', role: 'member' };
      const service = new [FeatureService](mockFirestore, memberUser);
      
      await expect(service.[protectedMethod]())
        .rejects.toThrow('Insufficient permissions');
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields', () => {
      const invalidData = { /* missing required fields */ };
      
      expect(() => service.validate(invalidData))
        .toThrow('Validation error');
    });
  });
});
```

### Step 5: Run Tests (Should All Fail)
```bash
# Run all new tests
npm run test -- src/[feature]/__tests__

# Expected output: All tests failing with "not implemented" errors
# Verify test count and structure
```

## Phase 3: GREEN - Make Tests Pass

### Step 1: Implement Service Layer
Create minimal implementation to pass unit tests:

```typescript
export class [FeatureService] {
  constructor(private firestore: any, private user?: any) {}

  async create(data: [EntityType]): Promise<[EntityType]> {
    // Minimal validation
    this.validate(data);
    
    // Minimal implementation
    const doc = await this.firestore
      .collection('[collection]')
      .add(this.convertToDocument(data));
      
    return this.convertFromDocument({ id: doc.id, ...data });
  }

  private validate(data: [EntityType]): void {
    if (!data.requiredField) {
      throw new Error('Required field missing');
    }
  }

  private convertToDocument(data: [EntityType]): [DocumentType] {
    return {
      ...data,
      createdAt: new Date(),
    };
  }

  private convertFromDocument(doc: any): [EntityType] {
    return {
      id: doc.id,
      ...doc.data(),
    };
  }
}
```

### Step 2: Implement Component (if applicable)
Create minimal React component to pass component tests:

```typescript
export const [Component]: React.FC<[ComponentProps]> = ({
  onSubmit,
  ...props
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(/* form data */);
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Submit</button>
    </form>
  );
};
```

### Step 3: Run Tests (Should Pass)
```bash
# Run tests incrementally
npm run test -- src/[feature]/__tests__/[feature].unit.test.ts
npm run test -- src/[feature]/__tests__/[feature].integration.test.ts
npm run test -- src/[feature]/__tests__/[Component].test.tsx

# All tests should pass
npm run test -- src/[feature]
```

## Phase 4: REFACTOR - Improve Implementation

### Step 1: Add Error Handling
Enhance error handling while keeping tests green:

```typescript
export class [FeatureService] {
  async create(data: [EntityType]): Promise<[EntityType]> {
    try {
      this.validate(data);
      
      const doc = await this.firestore
        .collection('[collection]')
        .add(this.convertToDocument(data));
        
      return this.convertFromDocument({ id: doc.id, ...data });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ServiceError('Failed to create [entity]', error);
    }
  }

  private validate(data: [EntityType]): void {
    const errors: string[] = [];
    
    if (!data.requiredField) {
      errors.push('Required field is missing');
    }
    
    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }
}
```

### Step 2: Add Performance Optimizations
Optimize implementation while maintaining test coverage:

```typescript
export class [FeatureService] {
  private cache = new Map<string, [EntityType]>();

  async getById(id: string): Promise<[EntityType] | null> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const doc = await this.firestore
      .collection('[collection]')
      .doc(id)
      .get();

    if (!doc.exists) {
      return null;
    }

    const entity = this.convertFromDocument(doc);
    this.cache.set(id, entity);
    return entity;
  }
}
```

### Step 3: Enhance Component Features
Add advanced features while maintaining test compatibility:

```typescript
export const [Component]: React.FC<[ComponentProps]> = ({
  onSubmit,
  initialData,
  validation = true,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validation) {
      const validationErrors = validateForm(formData);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    setIsLoading(true);
    try {
      await onSubmit?.(formData);
    } catch (error) {
      setErrors(['Submission failed']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <div className="text-red-600">
          {errors.map(error => <p key={error}>{error}</p>)}
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={isLoading}
        className="btn btn-primary"
      >
        {isLoading ? 'Loading...' : 'Submit'}
      </button>
    </form>
  );
};
```

### Step 4: Run Tests Again
```bash
# Ensure all tests still pass after refactoring
npm run test -- src/[feature]

# Check coverage
npm run test:coverage -- src/[feature]
```

## Phase 5: Coverage Validation & Quality Gates

### Step 1: Check Coverage Targets
```bash
# Generate detailed coverage report
npm run test:coverage -- src/[feature] --reporter=html

# Verify coverage meets targets:
# - Overall: 80% minimum
# - Critical paths: 90%
# - Financial/Security: 95%
```

### Step 2: Coverage Analysis
```bash
# Identify uncovered lines
npm run test:coverage -- src/[feature] --reporter=detailed

# Add tests for uncovered critical paths
# Focus on error conditions and edge cases
```

### Step 3: Security Validation
```bash
# Run security-specific tests
npm run test -- --grep="security"

# Validate role-based access
npm run test -- --grep="role"

# Test data validation
npm run test -- --grep="validation"
```

### Step 4: Integration Validation
```bash
# Test service integrations
npm run test -- --grep="integration"

# Test Firebase interactions
npm run test -- --grep="firestore"

# Test component integrations
npm run test -- --grep="component.*integration"
```

## Quality Gates & Escalation

### Automatic Quality Gates
- **Coverage Threshold**: Must meet minimum coverage targets
- **Test Execution**: All tests must pass consistently
- **Type Safety**: No TypeScript errors allowed
- **Security Tests**: All role-based access tests must pass

### When to Escalate
Escalate to human developer when:

1. **Coverage gaps in critical paths** cannot be easily tested
2. **Complex integration scenarios** require manual verification
3. **Performance bottlenecks** identified during testing
4. **Security vulnerabilities** discovered during testing
5. **Architectural decisions** needed for test structure

### Escalation Process
```bash
# Document the issue clearly
echo "ESCALATION NEEDED: [Issue Description]" >> escalation.log
echo "Coverage: [current %]" >> escalation.log
echo "Failed Tests: [list]" >> escalation.log
echo "Attempted Solutions: [description]" >> escalation.log

# Create checkpoint commit
git add .
git commit -m "TDD checkpoint: [issue] requires escalation"
```

## MCP Server Integration Patterns

### Using Serena for Test Analysis
```bash
# Analyze test coverage gaps
serena analyze_coverage --path="src/[feature]" --target=90

# Find untested code paths
serena find_untested --path="src/[feature]"

# Generate additional test cases
serena suggest_tests --path="src/[feature]" --type="edge-cases"
```

### Using Test Runner MCP
```bash
# Continuous test monitoring
test-runner watch --path="src/[feature]"

# Coverage tracking
test-runner coverage --threshold=85 --watch

# Test result analysis
test-runner analyze --failures-only
```

### Using Firebase MCP for Integration Tests
```bash
# Setup test database
firebase-mcp firestore-emulator start

# Run integration tests against emulator
npm run test -- --grep="integration" --config="firebase-test"

# Clear test data
firebase-mcp firestore-emulator clear
```

## Common Patterns & Solutions

### 1. Mocking External Dependencies
```typescript
// Mock Firebase services
vi.mock('../../services/firebase', () => ({
  [serviceName]: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
  }
}));

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: 'test-id' }),
}));
```

### 2. Testing Async Operations
```typescript
it('should handle async operations', async () => {
  // Arrange
  const promise = service.asyncMethod();
  
  // Act & Assert
  await expect(promise).resolves.toEqual(expectedResult);
  
  // Or for errors
  await expect(promise).rejects.toThrow('Expected error');
});
```

### 3. Testing User Interactions
```typescript
it('should handle user interactions', async () => {
  render(<Component />);
  
  // Simulate user actions
  fireEvent.change(screen.getByLabelText('Input'), 
    { target: { value: 'test' } });
  fireEvent.click(screen.getByRole('button'));
  
  // Wait for async operations
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### 4. Testing Error Conditions
```typescript
it('should handle service errors gracefully', async () => {
  // Mock service failure
  mockService.create.mockRejectedValue(new Error('Service error'));
  
  render(<Component />);
  fireEvent.click(screen.getByRole('button'));
  
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

## Troubleshooting Guide

### Common Issues & Solutions

#### 1. Tests Not Running
- Check test file naming: `*.test.ts` or `*.test.tsx`
- Verify imports are correct
- Clear test cache: `npm run test -- --clear-cache`

#### 2. Mock Issues
- Ensure mocks are defined before imports
- Use `vi.clearAllMocks()` in `beforeEach`
- Check mock return values match expected types

#### 3. Coverage Issues
- Add tests for error conditions
- Test all code branches (if/else, try/catch)
- Include integration scenarios

#### 4. Flaky Tests
- Use `waitFor` for async operations
- Mock time-dependent code
- Avoid random test data

## Success Metrics

### Quantitative Metrics
- **Coverage**: 80%+ overall, 90%+ critical paths, 95%+ financial/security
- **Test Count**: Minimum 15 tests per major feature
- **Execution Time**: Tests complete in under 30 seconds
- **Stability**: 99%+ test pass rate across multiple runs

### Qualitative Metrics
- **Readability**: Tests clearly express expected behavior
- **Maintainability**: Tests are easy to update when requirements change
- **Reliability**: Tests catch regressions consistently
- **Completeness**: All user workflows and edge cases covered

## Workflow Summary

1. **PLAN**: Analyze requirements and existing patterns
2. **SETUP**: Create test structure and fixtures
3. **RED**: Write comprehensive failing tests
4. **GREEN**: Implement minimal working code
5. **REFACTOR**: Improve implementation while maintaining tests
6. **VALIDATE**: Verify coverage and quality gates
7. **INTEGRATE**: Ensure compatibility with existing codebase

**Remember**: The goal is not just passing tests, but comprehensive coverage that ensures reliability, maintainability, and confidence in the codebase.

---

**Quick Agent Checklist**
- [ ] Read PRP requirements thoroughly
- [ ] Use Serena for code analysis
- [ ] Create test files before implementation
- [ ] Follow RED-GREEN-REFACTOR strictly
- [ ] Verify coverage targets
- [ ] Test all error conditions
- [ ] Validate security scenarios
- [ ] Document any escalation needs