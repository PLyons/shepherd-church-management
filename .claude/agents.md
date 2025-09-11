# AI Agent Interface for Shepherd CMS

Welcome! This is your command center for working with the Shepherd Church Management System. Think of this as your onboarding guide and quick reference for all AI agents working on this project.

## WHAT YOU'RE WORKING ON

**Current Phase**: Phase 2C - Donation Tracking & Financial Reports  
**Status**: Foundation Complete (PRP-2C-001 through PRP-2C-004)  
**Next Task**: PRP-2C-005 - Donation Recording Form  
**Location**: `docs/prps/phase-2c-donations/`

We're building a comprehensive church management system with React, TypeScript, and Firebase. The financial module is our current focus - we've got the data models, services, and security in place. Now we need the user interfaces.

## ESSENTIAL COMMANDS

Before you do anything else, run these to get your bearings:

```bash
# Start the development environment
npm run dev                 # Launches on http://localhost:5173

# Code quality (ALWAYS run before completing tasks)
npm run lint               # ESLint checks
npm run format             # Prettier formatting  
npm run typecheck          # TypeScript validation
npm run security:check     # Security audit

# Database operations
npm run seed               # Load test data
npm run create-admin       # Create admin user
```

## TEST-DRIVEN DEVELOPMENT (MANDATORY)

**TDD is non-negotiable** on this project. Every feature follows the RED-GREEN-REFACTOR cycle:

### The TDD Cycle
1. **RED**: Write a failing test first
2. **GREEN**: Write minimal code to make it pass
3. **REFACTOR**: Clean up while keeping tests green

### Testing Requirements
- **Minimum 80% code coverage** for all new features
- **Test file naming**: `*.test.ts` for unit tests, `*.spec.ts` for integration
- **Unit tests**: Use Vitest (already configured)
- **E2E tests**: Use Playwright for browser testing

### Testing Commands
```bash
npm run test              # Run all tests
npm run test:coverage     # Coverage report
npm run test:watch        # Watch mode for development
npm run test:e2e          # Playwright E2E tests
```

### Test File Locations
- Unit tests: `src/**/*.test.ts` (co-located with source)
- Integration tests: `src/**/*.spec.ts`
- E2E tests: `tests/e2e/`
- Test utilities: `src/test-utils/`

**Remember**: If you're not writing tests first, you're not following our process. The codebase has 89+ passing tests already - maintain that standard.

## PROJECT TRACKING HIERARCHY

Understanding where information lives is crucial for effective work:

### PRIMARY SOURCE OF TRUTH
**`docs/PROJECT_STATUS.md`** - This is your starting point. Always check here first for:
- Current phase progress and completion percentages
- Recent achievements and what's been done
- What's coming next and dependencies

### Documentation Hierarchy
```
PROJECT_STATUS.md (current state, progress, achievements)
    ↓
CLAUDE.md (technical standards, architecture, patterns)
    ↓  
PRP Files (detailed specifications for current phase)
    ↓
agents.md (this file - workflow and quick reference)
```

### Current Phase Documentation
- **Specifications**: `docs/prps/phase-2c-donations/`
- **Next Task**: `docs/prps/phase-2c-donations/PRP-2C-005-donation-recording-form.md`
- **Design Assets**: `docs/prps/phase-2c-donations/designs/`
- **Test Plans**: Each PRP file includes testing requirements

## WHERE TO FIND THINGS

Quick reference for AI agents:

### Current Work
- **Active Phase**: Phase 2C Donation Tracking & Financial Reports
- **Current Task**: PRP-2C-005 (Donation Recording Form)
- **Task Location**: `docs/prps/phase-2c-donations/PRP-2C-005-donation-recording-form.md`
- **Related Components**: `src/components/donations/` (ready for implementation)

### Code Organization
- **Services**: `src/services/firebase/` (donations service already complete)
- **Types**: `src/types/donations.ts` (comprehensive type definitions)
- **Components**: `src/components/donations/` (forms and UI components)
- **Tests**: Co-located `*.test.ts` files with 80%+ coverage requirement
- **Firebase Rules**: `firestore.rules` (financial security already implemented)

### Key Reference Files
- **Architecture Guide**: `CLAUDE.md` (read this first for technical context)
- **Type Definitions**: `src/types/` (all TypeScript interfaces)
- **Service Patterns**: `src/services/firebase/BaseFirestoreService.ts`
- **Security Rules**: `firestore.rules` (role-based access control)

### Testing Patterns
- **Service Tests**: `src/services/firebase/*.test.ts` (40+ test examples)
- **Type Tests**: `src/types/*.test.ts` (22+ validation examples)
- **Component Tests**: `src/components/**/*.test.ts` (UI interaction testing)
- **E2E Tests**: `tests/e2e/` (full workflow testing)

## ACTIVE CONTRIBUTORS

### Specialized Agents
- **docs-synchronizer**: Updates documentation after implementation
- **test-runner**: Executes TDD workflows and validates coverage
- **project-manager**: Tracks task completion and roadmap updates
- **git-workflow**: Manages branches and PR creation

### Development Requirements
- **TDD Mandatory**: All new code must follow test-driven development
- **80% Coverage**: Minimum code coverage for new features
- **Type Safety**: Strict TypeScript - no `any` types allowed
- **Security First**: Role-based access control enforced everywhere
- **Desktop Optimized**: Administrative workflows prioritized

### Quality Standards
- Every feature starts with failing tests
- All tests must pass before PRs
- Documentation updated with implementation
- Security rules validated before deployment

## GETTING STARTED

1. **Read the current state**: Check `docs/PROJECT_STATUS.md`
2. **Understand the architecture**: Review `CLAUDE.md`
3. **Find your task**: Look in `docs/prps/phase-2c-donations/`
4. **Write tests first**: Follow TDD methodology
5. **Implement with quality**: Lint, format, typecheck
6. **Update docs**: Use docs-synchronizer agent

Remember: We're building something that real churches will use to manage their communities. Quality and security aren't optional - they're the foundation of trust.

**Questions?** Check the documentation hierarchy above, or ask for clarification. We'd rather pause and get clarity than build the wrong thing.