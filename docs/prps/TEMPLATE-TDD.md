# PRP-[PHASE]-[NUMBER]: [FEATURE_NAME]

**Phase**: [PHASE_DESCRIPTION]  
**Task**: [TASK_NUMBER]  
**Priority**: [PRIORITY_LEVEL] - [PRIORITY_REASON]  
**Status**: [STATUS]  
**Estimated Time**: [TIME_ESTIMATE]  
**TDD Implementation**: [TDD_STATUS]  

## Purpose

[DETAILED_PURPOSE_DESCRIPTION]

## Context Required

**Essential Files to Read:**
- `CLAUDE.md` - Project standards and [RELEVANT_STANDARDS]
- [KEY_FILE_1] - [FILE_PURPOSE]
- [KEY_FILE_2] - [FILE_PURPOSE]
- [ADDITIONAL_FILES] - [PURPOSE]

**Key Patterns to Follow:**
- [PATTERN_1] - [DESCRIPTION]
- [PATTERN_2] - [DESCRIPTION]
- [ADDITIONAL_PATTERNS]

## Requirements

**Dependencies:**
- [DEPENDENCY_1] - [DESCRIPTION]
- [DEPENDENCY_2] - [DESCRIPTION]
- [ADDITIONAL_DEPENDENCIES]

**Critical Requirements:**
1. **[REQUIREMENT_1]**: [DETAILED_DESCRIPTION]
2. **[REQUIREMENT_2]**: [DETAILED_DESCRIPTION]
3. **[REQUIREMENT_3]**: [DETAILED_DESCRIPTION]

## TDD Requirements

**Test Coverage Targets:**
- **Minimum Coverage**: 80% overall
- **Critical Path Coverage**: 90% for core functionality
- **High-Risk Areas**: 95% for financial/security operations
- **UI Component Coverage**: 85% for complex components

**Testing Strategy:**
- **Unit Tests**: All business logic, utilities, and service methods
- **Integration Tests**: Firebase service interactions and data flow
- **Component Tests**: React components with user interactions
- **Security Tests**: Role-based access control and data validation

**Test File Structure:**
```
src/
├── [feature]/
│   ├── __tests__/
│   │   ├── [feature].unit.test.ts        # Pure logic tests
│   │   ├── [feature].integration.test.ts # Service integration tests
│   │   ├── [feature].security.test.ts    # Security & validation tests
│   │   └── [Component].test.tsx          # React component tests
│   ├── [feature].service.ts
│   ├── [Component].tsx
│   └── index.ts
```

**TDD Success Criteria:**
- [ ] All tests written before implementation (RED phase)
- [ ] All tests pass after implementation (GREEN phase)
- [ ] Code refactored for clarity and performance (REFACTOR phase)
- [ ] Coverage targets met: `npm run test:coverage`
- [ ] No regression in existing tests: `npm run test`
- [ ] Security scenarios tested with role-based access

**Test Patterns to Follow:**
1. **Service Tests**: Mock Firebase, test business logic
2. **Component Tests**: Mock services, test user interactions
3. **Validation Tests**: Edge cases, error conditions, boundary values
4. **Integration Tests**: End-to-end data flow with test fixtures

## Detailed Procedure

### Step 0: TDD Setup (MANDATORY FIRST STEP)

**Create Test Files First:**
1. Create test file structure following project patterns
2. Write failing tests for all requirements (RED phase)
3. Verify all tests fail as expected
4. Run coverage check: `npm run test:coverage`

**Test File Creation Pattern:**
```typescript
// Example: src/services/firebase/__tests__/[feature].service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { [FeatureService] } from '../[feature].service';
import { [TestFixtures] } from '../../__tests__/test-fixtures';

describe('[FeatureService]', () => {
  let service: [FeatureService];

  beforeEach(() => {
    // Setup test environment
    service = new [FeatureService]();
    vi.clearAllMocks();
  });

  describe('[Method Group]', () => {
    it('should [expected behavior] when [condition]', async () => {
      // Arrange
      const testData = TestFixtures.[testDataSet];
      
      // Act
      const result = await service.[method](testData);
      
      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should handle [error condition] gracefully', async () => {
      // Test error scenarios
    });
  });
});
```

### Step 1: [STEP_1_TITLE]

[DETAILED_STEP_1_INSTRUCTIONS]

**TDD Implementation:**
1. **RED**: Write failing test for [specific functionality]
2. **GREEN**: Implement minimal code to pass test
3. **REFACTOR**: Optimize implementation while keeping tests green

### Step 2: [STEP_2_TITLE]

[DETAILED_STEP_2_INSTRUCTIONS]

**TDD Implementation:**
1. **RED**: Write failing tests for [specific functionality]
2. **GREEN**: Implement functionality to pass tests
3. **REFACTOR**: Clean up code structure and performance

### Step [N]: TDD Validation & Final Testing

**Comprehensive Testing:**
1. Run full test suite: `npm run test`
2. Check coverage: `npm run test:coverage`
3. Validate security tests: `npm run test -- --grep="security"`
4. Run integration tests: `npm run test -- --grep="integration"`

**Coverage Validation:**
- [ ] Overall coverage ≥ 80%
- [ ] Critical paths ≥ 90%
- [ ] Financial/Security code ≥ 95%
- [ ] All edge cases covered
- [ ] Error scenarios tested

## Success Criteria

**Technical Validation:**
- [ ] All TypeScript compiles without errors
- [ ] [SPECIFIC_TECHNICAL_REQUIREMENTS]

**TDD Validation:**
- [ ] Test coverage meets targets (80%/90%/95%)
- [ ] All tests pass consistently
- [ ] Tests written before implementation
- [ ] Security scenarios comprehensively tested
- [ ] Integration tests validate service interactions
- [ ] Component tests cover user workflows
- [ ] Error handling tested for all edge cases

**Functional Validation:**
- [ ] [FUNCTIONAL_REQUIREMENT_1]
- [ ] [FUNCTIONAL_REQUIREMENT_2]
- [ ] [ADDITIONAL_FUNCTIONAL_REQUIREMENTS]

**Integration Readiness:**
- [ ] [INTEGRATION_REQUIREMENT_1]
- [ ] [INTEGRATION_REQUIREMENT_2]
- [ ] [ADDITIONAL_INTEGRATION_REQUIREMENTS]

## Files Created/Modified

**New Files:**
- [LIST_OF_NEW_FILES]

**Test Files:**
- [LIST_OF_TEST_FILES]

**Modified Files:**
- [LIST_OF_MODIFIED_FILES]

## Next Task

After completion, proceed to **[NEXT_PRP]** which will [NEXT_TASK_DESCRIPTION].

## Notes

- [PROJECT_SPECIFIC_NOTES]
- [TDD_IMPLEMENTATION_NOTES]
- [INTEGRATION_CONSIDERATIONS]

## TDD Implementation Log

**Test Development:**
- [ ] Unit tests created: [DATE] - [DEVELOPER]
- [ ] Integration tests created: [DATE] - [DEVELOPER]
- [ ] Security tests created: [DATE] - [DEVELOPER]
- [ ] Component tests created: [DATE] - [DEVELOPER]

**Implementation Progress:**
- [ ] RED phase completed: [DATE] - All tests failing as expected
- [ ] GREEN phase completed: [DATE] - All tests passing
- [ ] REFACTOR phase completed: [DATE] - Code optimized, tests still passing

**Coverage Achievement:**
- [ ] 80% overall coverage achieved: [DATE]
- [ ] 90% critical path coverage achieved: [DATE]
- [ ] 95% financial/security coverage achieved: [DATE]