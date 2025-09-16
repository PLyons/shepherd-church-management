# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shepherd is a Church Management System built with React, TypeScript, and Vite, focusing on core membership management functionality. The project uses Firebase for all backend services.

## Development Commands

```bash
# Development
npm run dev             # Start development server
npm run build           # Build for production
npm run build:staging   # Build for staging environment
npm run preview         # Preview production build

# Code quality checks - ALWAYS run before completing tasks
npm run lint            # Run ESLint
npm run format          # Format with Prettier
npm run typecheck       # TypeScript type checking
npm run security:check  # Security audit


# Database operations
npm run migrate         # Run migrations
npm run seed            # Seed test data
npm run create-admin    # Create admin user
npm run setup-admin     # Setup initial admin
```

## Architecture & Key Patterns

### Service Layer Architecture
The codebase uses a Firebase-based service layer pattern:
- `src/services/firebase/` - Firebase service implementations
- `src/services/payment/` - Payment processing services (Stripe integration)
- Core services: members, households, events, roles, donations, payment processing
- All Firebase services extend BaseFirestoreService for consistent patterns

### **CRITICAL: Data Translation & Type Conversion**
**ALWAYS use the existing translation system - DO NOT create new ones!**

- **`src/utils/firestore-converters.ts`** - The ONLY translation layer between TypeScript and Firestore
- Contains `memberToMemberDocument()` and `memberDocumentToMember()` converters
- **TypeScript uses camelCase, Firestore ALSO uses camelCase** (via converters)
- **DO NOT use `firestore-field-mapper.ts`** - this is for different use cases
- **Firebase Security Rules expect camelCase** (firstName, lastName, memberStatus)

**Before changing ANY data layer code:**
1. Check existing converter functions first
2. Understand what translation system is already in place
3. Never assume field naming conventions without checking the converters

### Component Organization
Components are organized by feature in `src/components/`:
- `members/` - Member management components
- `households/` - Household management components
- `auth/` - Authentication and role guards
- `admin/` - Administrative functions (role management)
- `dashboard/` - Dashboard views by role
- `common/` - Shared UI components
- `donations/` - Donation tracking and financial components
  - `sections/` - Modular form sections (DonorInfoSection, DonationDetailsSection, TaxReceiptSection, BatchModeSection)
  - `MemberDonationHistory.tsx` - Member-only donation history with PDF generation
  - `DonationFilters.tsx` - Advanced filtering component with date ranges and categories
  - `DonationStatementPDF.tsx` - jsPDF-based tax statement generation
  - `PaymentForm.tsx` - Stripe payment processing with mobile optimization
  - `PaymentErrorHandler.tsx` - Payment error handling with retry logic
  - `DonationStatements.tsx` - IRS-compliant statement generation and management
  - `ReceiptGenerator.tsx` - Automated receipt generation for individual donations
- Page-level components in `src/pages/`

### **NEW: Modular Form Architecture Pattern (PRP-2C-005)**
**MANDATORY for complex forms:** Break large forms into focused sections under 300 LOC each.

**Established Pattern:**
- Main form component coordinates state and submission
- Section components handle specific form areas with clear boundaries
- Each section receives only the form props it needs (register, errors, watch, setValue)
- Sections maintain single responsibility and are easily testable
- Currency utilities centralized in `src/utils/currency.ts` for financial precision

**Example Implementation (DonationForm):**
```
DonationForm.tsx (299 LOC) - Main coordinator
├── DonorInfoSection.tsx (287 LOC) - Member lookup & anonymous toggle
├── DonationDetailsSection.tsx (199 LOC) - Amount, date, method, category
├── TaxReceiptSection.tsx (87 LOC) - Tax deductible & receipt preferences
└── BatchModeSection.tsx (134 LOC) - Batch entry functionality
```

### **NEW: Member Privacy & PDF Generation Patterns (PRP-2C-006)**
**MANDATORY for financial data:** Implement strict member-only access with comprehensive security architecture.

**Established Pattern:**
- Member-only data access enforced at Firebase Security Rules level
- Zero cross-member data exposure with audit logging for all access attempts
- PDF generation using jsPDF with tax-compliant formatting and church branding
- Advanced filtering with real-time search capabilities for date ranges, categories, and payment methods
- Performance optimization with intelligent caching and pagination for large datasets
- Full mobile responsiveness with touch-friendly controls and progressive enhancement

**Example Implementation (MemberDonationHistory):**
```
MemberDonationHistory.tsx (485 LOC) - Main component with member-only security
├── DonationFilters.tsx (312 LOC) - Advanced filtering with date ranges and categories
├── DonationStatementPDF.tsx (267 LOC) - jsPDF tax statement generation
├── useMemberDonations.ts (198 LOC) - Optimized data hook with caching
└── 104+ comprehensive test cases covering security, PDF generation, and performance
```

### **NEW: Payment Processor Integration Patterns (PRP-2C-008)**
**MANDATORY for payment processing:** Implement secure, PCI-compliant payment flows with comprehensive error handling and mobile optimization.

**Established Pattern:**
- Stripe SDK integration with TypeScript for secure payment processing
- Payment components separated by concern (PaymentForm, PaymentErrorHandler)
- Webhook-based payment confirmation with idempotent processing
- PCI compliance maintained (no card data on servers)
- Mobile-optimized payment flows with touch-friendly interfaces
- Comprehensive error handling with retry logic and user-friendly messaging
- Payment method management for recurring donations

**Example Implementation (Payment System):**
```
src/services/payment/
├── stripe.service.ts (380 LOC) - Core Stripe integration with payment intent management
├── stripe-client.service.ts (290 LOC) - Client-side Stripe operations and error handling
├── donation-payment.service.ts (150 LOC) - Integration with donation recording system
└── __tests__/ (87 test cases) - Comprehensive payment processing and security testing

src/components/donations/
├── PaymentForm.tsx (645 LOC) - Main payment interface with saved payment methods
├── PaymentErrorHandler.tsx (78 LOC) - Error handling with retry logic
└── __tests__/ (195 test cases) - Payment UI, error handling, and mobile testing

src/api/stripe/
└── webhook.ts (831 LOC) - Secure webhook processing for payment confirmations
```

**Security & Compliance Requirements:**
- Environment validation for production (test vs live keys)
- Webhook signature verification for all incoming events
- Sensitive data sanitization in logs and analytics
- Payment amount validation and constraint enforcement
- Integration with Firebase Security Rules for donation recording

### **NEW: PDF Generation & IRS Compliance Patterns (PRP-2C-009)**
**MANDATORY for tax documentation:** Implement IRS-compliant statement generation with professional PDF output and comprehensive audit trails.

**Established Pattern:**
- jsPDF integration with professional church letterhead and branding
- IRS-compliant formatting with required legal language and tax documentation
- Template management system for customizable statements and receipts
- Bulk processing capabilities for year-end statement generation
- Complete audit trail for all generated statements and receipts
- Administrative controls for statement management and customization

**Example Implementation (Statement System):**
```
src/components/donations/
├── DonationStatements.tsx (425 LOC) - Main statement management interface
├── ReceiptGenerator.tsx (312 LOC) - Individual receipt generation with templates
├── StatementTemplateManager.tsx (198 LOC) - Template customization and management
└── __tests__/ (36+ test cases) - PDF generation, IRS compliance, and bulk processing testing

src/services/firebase/
├── donationStatements.service.ts (280 LOC) - Statement generation service
├── receiptProcessor.service.ts (245 LOC) - Receipt processing and delivery
└── statementTemplates.service.ts (156 LOC) - Template management service

src/utils/pdf/
├── statementPdfGenerator.ts (390 LOC) - IRS-compliant PDF generation
├── receiptPdfGenerator.ts (267 LOC) - Individual receipt PDF creation
└── pdfTemplateEngine.ts (189 LOC) - Template processing and church branding
```

**IRS Compliance Requirements:**
- Official receipt format with required legal language
- Donation acknowledgment with tax-deductible status
- Church identification and contact information
- Comprehensive donation history for tax filing
- Statement generation date and audit information
- Professional formatting meeting IRS guidelines

### Type Definitions
All TypeScript types are centralized in `src/types/`:
- `index.ts` - Core domain models (Member, Household)
- `events.ts` - Event system types (Event, EventRSVP, EventAttendance)
- `donations.ts` - Donation system types (Donation, DonationCategory, DonationReport, DonationStatement, DonationReceipt)
- `payment.ts` - Payment processing types (PaymentIntent, PaymentMethod, StripeConfig)
- `firestore.ts` - Firebase/Firestore schema types
- Clean, Firebase-focused type definitions with payment integration

### Data Management Patterns
- **Firestore Converters**: `src/utils/firestore-converters.ts` - Type-safe Firestore document conversion
- **Service Layer**: Firebase services with consistent CRUD patterns
- **Real-time Updates**: Firestore listeners for live data synchronization
- **Role-based Data Access**: Security enforced at service layer

### Authentication & Authorization
The system uses a role-based access control (RBAC) system with three primary roles:
- `admin` - Full system access including member management, household management, and system settings
- `pastor` - Access to member information for pastoral care, household management
- `member` - Limited access to own data and basic directory information

**Critical Security Principle**: Members should only see their own data and limited information about other members. Role-based access is enforced at both the component and service level.

### Context Providers
Three main contexts manage global state:
- `AuthContext` - Authentication and user state
- `ThemeContext` - Dark/light theme
- `ToastContext` - Toast notifications


## Code Standards
- Follow **Prettier** formatting defaults
- Use **ESLint** with recommended TypeScript and React rules
- Prefer **functional components** and **React hooks**
- Use **async/await** over `.then()` syntax
- Avoid magic strings/numbers — define constants where applicable
- Prefer composition over inheritance

## Context Management Rules (MANDATORY)

**CRITICAL:** These rules prevent context explosion and ensure efficient development workflows.

### File Size Limits
- **Test files**: Maximum 300 lines per file
- **Component files**: Maximum 500 lines per file  
- **If larger needed**: Split into multiple focused files immediately
- **Large files PROHIBITED**: Never create files exceeding these limits

### TDD Context Constraints
- **RED phase**: Maximum 30 tests initially, never create 100+ tests upfront
- **Incremental approach**: Build test coverage gradually (10-20 tests at a time)
- **Focus critical path**: Test core functionality first, edge cases later
- **Split test files**: Break large test suites into focused, smaller files

### Sub-Agent Utilization (MANDATORY)
- **Main agent role**: Planning, orchestration, and symbolic tool usage only
- **Sub-agent delegation**: All file creation, modification, and implementation
- **Parallel execution**: Use multiple sub-agents for independent tasks
- **Context preservation**: Main agent never reads files >200 lines

### Tool Usage Hierarchy
1. **First priority**: `mcp__serena__find_symbol`, `mcp__serena__get_symbols_overview`, `mcp__serena__replace_symbol_body`
2. **Second priority**: Pattern search with `grep` or `mcp__serena__search_for_pattern`
3. **Last resort only**: `Read` entire file (>200 lines prohibited in main context)

### Task Decomposition Requirements
- **Maximum task duration**: 30 minutes per sub-task
- **Bounded scope**: Each task <300 lines of code
- **Clear deliverables**: Specific, measurable outcomes per task
- **Sequential dependencies**: Define clear task order and prerequisites

### Context Monitoring
- **File read tracking**: Monitor cumulative context consumption
- **Early intervention**: Switch to sub-agents when context >50% consumed
- **Symbolic operations preferred**: Always attempt symbolic tools before full file reads
- **Session boundaries**: Respect context limits, never exceed capacity

**VIOLATION CONSEQUENCES**: Any violation of these rules requires immediate corrective action and workflow adjustment.

## Test-Driven Development (TDD) Methodology

**MANDATORY:** All new development must follow Test-Driven Development (TDD) practices as established in Phase 2C foundation layers.

### TDD Workflow Requirements
**RED-GREEN-REFACTOR Cycle:**
1. **RED Phase:** Write failing tests first that define expected behavior
   - **CONSTRAINT:** Maximum 30 tests initially (never 100+ upfront)
   - **APPROACH:** Focus on core functionality, add edge cases incrementally
   - **FILE LIMITS:** Keep test files under 300 lines, split if larger
2. **GREEN Phase:** Implement minimal code to make tests pass
   - **SUB-AGENT DELEGATION:** Use sub-agents for all implementation work
   - **CONTEXT PRESERVATION:** Main agent coordinates, never implements directly
3. **REFACTOR Phase:** Improve code quality while keeping tests green
   - **INCREMENTAL:** Add more tests gradually (10-20 at a time)
   - **SYMBOLIC TOOLS:** Use targeted edits, avoid reading large files

### Coverage Targets by Feature Type
- **Overall Application:** 80% minimum test coverage
- **Core Business Logic:** 90% minimum test coverage (member/household/event management)
- **Financial & Security Features:** 95% minimum test coverage (donations, authentication, role-based access)
- **UI Components:** 85% minimum test coverage (user interaction scenarios)

### Test Organization Structure
```
src/[feature]/
├── __tests__/
│   ├── [feature].unit.test.ts        # Pure business logic tests
│   ├── [feature].integration.test.ts # Service interaction tests  
│   ├── [feature].security.test.ts    # Role-based access & validation tests
│   └── [Component].test.tsx          # React component tests
├── [feature].service.ts
├── [Component].tsx
└── index.ts
```

### Essential TDD Commands
```bash
# TDD Development Workflow
npm run test -- --watch              # Watch mode for active development
npm run test:coverage                 # Generate coverage reports (80%+ required)
npm run test -- --grep="[feature]"   # Run specific test group
npm run test -- --bail               # Stop on first failure for debugging

# Quality Assurance
npm run test:coverage -- --threshold=80    # Enforce minimum coverage
npm run test -- --grep="security"          # Run security-specific tests
npm run test -- --grep="integration"       # Run integration tests
```

### TDD Implementation Standards
- **Write tests first** - Always begin with failing tests that define expected behavior
- **Test all error conditions** - Include validation errors, service failures, and edge cases
- **Mock external dependencies** - Keep tests isolated and fast with proper mocking
- **Test role-based access** - Verify admin/pastor/member permissions in security tests
- **Firebase emulator integration** - Use Firebase emulators for integration testing

### Quality Gates
- All tests must pass before code completion
- Coverage targets must be met for feature acceptance
- Security tests must verify role-based access control
- Integration tests must validate Firebase service interactions

### TDD Documentation References
- **Quick Reference:** `docs/TDD-QUICK-REFERENCE.md` - Essential commands and patterns
- **Agent Workflow:** `docs/AGENT-TDD-WORKFLOW.md` - Step-by-step TDD implementation guide
- **Test Examples:** Phase 2C foundation layers (PRP-2C-001 through PRP-2C-006) demonstrate comprehensive TDD patterns including member-only security and PDF generation testing

**Achievement:** Phase 2C donation system implemented with 520+ passing tests demonstrating excellence in TDD methodology, including member-only security patterns, PDF generation, and IRS-compliant statement generation.

### TypeScript Type Safety (MANDATORY)
- **NEVER use `any` types** - Always specify proper types
- Use `unknown` for truly unknown data, then narrow with type guards
- Use `Record<string, unknown>` for generic objects instead of `any`
- Use proper union types (`string | number`) instead of `any`
- Use `@ts-expect-error` with explanation instead of `@ts-ignore`
- Leverage TypeScript's strict mode - avoid type assertion unless absolutely necessary

### React & TypeScript Naming Conventions (MANDATORY)
1. **Never use snake_case** - Use camelCase for variables, functions, props
2. **PascalCase mandatory** - Components, interfaces, types
3. **React conventions** - Event handlers: `onClick`, State: `setAge`, Hooks: `useAuth`
4. **Constants** - `SCREAMING_SNAKE_CASE`

## Project-Wide Constraints
- No use of paid services during development (must run on free-tier limits)
- Environment secrets must be passed via `.env` files and never hardcoded
- No global state libraries (e.g., Redux) unless scoped locally
- Firebase Security Rules must be enforced for all user data access
- All database changes must be done via Firebase service layer and Firestore

## Project Status

**📍 For current development status, see [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) - the authoritative source of truth.**

**Summary**: Phase 2C Donation Tracking & Financial Reports - **NEAR COMPLETION** (90% complete). **ACHIEVEMENT**: PRP-2C-001 through PRP-2C-009 implemented with comprehensive TDD (520+ passing tests).

**MVP Implementation (100% Complete Design)**:
- ✅ Member Management - Enhanced CRUD with contact arrays and household sidebar  
- ✅ Role-based Access Control - Admin/pastor/member roles with security enforcement
- ✅ Firebase Authentication - Magic links and member onboarding
- ✅ Dashboard Views - Role-based dashboards with statistics
- ✅ Household Management - Complete CRUD system with member assignment and primary contact management
- ✅ Event Calendar & Attendance - Complete event management system with data consistency and filtering fixes
- ✅ **DESIGN COMPLETE**: Donation Tracking & Financial Reports - Comprehensive financial system ready for implementation

**Completed Phase 2B Event Calendar & Attendance (September 2025)**:
- ✅ PRP-2B-001: Event Data Model & Types - Complete TypeScript interface system
- ✅ PRP-2B-002: Events Firebase Service - Complete CRUD service with role-based queries
- ✅ PRP-2B-003: Event RSVP Service - Complete with capacity management and waitlist support
- ✅ PRP-2B-004: Firestore Security Rules - Complete role-based security for events and RSVPs
- ✅ PRP-2B-005: Event Form Component - Complete EventForm with React Hook Form validation (2025-08-28)
- ✅ PRP-2B-006: Event List & Cards Component - Complete EventList with filtering and search
- ✅ **COMPLETE**: PRP-2B-007 Calendar View Component - EventCalendar working perfectly with data consistency
- ✅ **COMPLETE**: Event System Data Consistency - All views show consistent, filtered event data
- ✅ **COMPLETE**: Event Visibility Simplification - Removed isPublic field, all events visible to congregation

**Phase 2C Donation Tracking & Financial Reports - APPROACHING COMPLETION (September 2025)**:
- ✅ **COMPLETE** PRP-2C-001: Donation Data Model & Types - 22 comprehensive test cases covering all interfaces
- ✅ **COMPLETE** PRP-2C-002: Donations Firebase Service - 40+ test cases with TDD implementation
- ✅ **COMPLETE** PRP-2C-003: Donation Categories Service - 53 comprehensive test cases covering category management with Firebase integration
- ✅ **COMPLETE** PRP-2C-004: Firestore Security Rules - Enhanced financial data protection with 36 security test scenarios
- ✅ **COMPLETE** PRP-2C-005: Donation Recording Form - Professional donation entry form with modular architecture and comprehensive TDD
- ✅ **COMPLETE** PRP-2C-006: Member Donation History - Member-only donation tracking with PDF statements and comprehensive TDD (104+ tests)
- ✅ **COMPLETE** PRP-2C-007: Financial Reports Dashboard - Administrative reporting with charts and export capabilities (132+ tests)
- ✅ **COMPLETE** PRP-2C-008: Payment Processor Integration - Stripe gateway implementation with comprehensive TDD and security compliance (68+ tests)
- ✅ **COMPLETE** PRP-2C-009: Donation Statements & Receipts - IRS-compliant statement generation with comprehensive TDD (36+ tests)
- 🔄 **NEXT** PRP-2C-010: Integration & Navigation - Final Phase 2C system integration and polish

**Next Implementation Features**:
- Volunteer Scheduling System
- Sermon Archive & Media Management

**🎉 RECENT ACHIEVEMENTS (September 2025)**:
- **PRP-2C-009 Donation Statements & Receipts Complete (2025-09-16)** - IRS-compliant statement generation with comprehensive TDD and professional PDF output
- **PRP-2C-008 Payment Processor Integration Complete (2025-09-16)** - Stripe gateway implementation with comprehensive TDD and security compliance
- **PRP-2C-006 Member Donation History Complete (2025-09-11)** - Member-only donation tracking with PDF tax statements and comprehensive TDD
- **PDF Generation Excellence (2025-09-11)** - jsPDF integration with tax-compliant formatting and church branding
- **Member Privacy & Security Architecture (2025-09-11)** - Zero cross-member data access with audit logging
- **Advanced Filtering Patterns (2025-09-11)** - Real-time search with date ranges, categories, and payment methods
- **Performance Optimization Techniques (2025-09-11)** - Caching strategies and pagination for large datasets
- **PRP-2C-005 Donation Form Complete (2025-01-11)** - Professional donation recording UI with modular architecture
- **Modular Form Pattern Established (2025-01-11)** - 5 components under 300 LOC each following agents.md requirements
- **Currency Handling Excellence (2025-01-11)** - 30/30 currency utility tests with decimal precision and validation
- **Service Integration Mastery (2025-01-11)** - Full Firebase service integration with error handling and member lookup
- **Role-Based Page Security (2025-01-11)** - Admin/pastor access control with RoleGuard wrapper pattern
- **Phase 2C Categories & Security Complete** - PRP-2C-003 & PRP-2C-004 implemented with comprehensive TDD
- **Donation Categories Service** - 53 test cases covering category management, validation, and Firebase integration  
- **Enhanced Security Architecture** - 36 security test scenarios with 6 new helper functions for financial data protection
- **Firebase Security Rules Deployed** - Production deployment of enhanced financial data protection rules
- **Phase 2C Foundation Complete** - PRP-2C-001 & PRP-2C-002 implemented with comprehensive TDD
- **Donation Types System** - 22 test cases covering all interfaces, enums, Form 990 compliance, and edge cases
- **Donations Service Layer** - 40+ test cases covering CRUD operations, role-based access, and financial calculations
- **Financial Security Implementation** - Admin/Pastor/Member access control with audit logging
- **Form 990 Compliance Ready** - Complete IRS nonprofit reporting field support with validation
- **Financial Data Integrity** - Decimal precision handling, amount validation, and currency calculations tested
- **Event System Complete** - Full event management lifecycle operational (Previous Phase Achievement)

## Phase 2C Implementation Guidelines

### Financial Data Security (CRITICAL)
- **Members**: Only see their own donation history and giving statements
- **Pastors**: Access aggregate reports but limited individual donor details without justification
- **Admins**: Full financial reporting and individual donation management access

### Donation System Components
- **Donation Entry**: Form-based entry with member lookup and category assignment
- **Financial Reports**: Role-based reporting with data visualization using Chart.js
- **Member Statements**: Individual giving statements with tax information
- **Security Rules**: Firestore rules enforcing financial data privacy

### Implementation Order
1. ✅ Donation data models and Firebase service (PRP-2C-001, PRP-2C-002)
2. ✅ Firestore security rules for financial data (PRP-2C-004)
3. ✅ Donation entry form with validation (PRP-2C-005)
4. ✅ Member donation history and statements (PRP-2C-006) 
5. 🔄 Financial reports dashboard with role filtering (PRP-2C-007 - Next)

## MCP Servers Integration

**MANDATORY: Use MCP servers proactively for all tasks**

### Required Usage:
- **Serena**: Code analysis with `get_symbols_overview` and `find_symbol` (never read entire files)
- **Context7**: Current documentation for libraries/frameworks  
- **Firebase MCP**: Database operations instead of CLI
- **Playwright**: UI testing on `http://localhost:5173`
- **Semgrep**: Security scanning before commits
- **GitHub MCP**: PR creation and issue management

### Server Setup:
- **Serena**: `claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena-mcp-server`
- **Firebase**: `npx -y firebase-tools@latest experimental:mcp`  
- **Context7**: `claude mcp add context7 -- npx -y @upstash/context7-mcp`
- **GitHub**: `claude mcp add --transport http github https://api.githubcopilot.com/mcp`
- **Management**: `claude mcp list` | `claude --debug mcp list`

### Key Tools:
- **Serena**: `find_symbol`, `get_symbols_overview`, `replace_symbol_body`, `write_memory`
- **Firebase**: `mcp__firebase__firestore_*`, `mcp__firebase__auth_*`
- **Playwright**: `browser_navigate`, `browser_click`, `browser_snapshot`, `browser_network_requests`
- **Semgrep**: `semgrep_scan`, `get_scan_results`

## Multi-Machine Development

**Start work**: `git pull origin main`
**End work**: `git add . && git commit -m "WIP: switching to [machine]" && git push origin main`

**Setup**: Clone repo → `npm install` → Copy `.env.example` to `.env` → Configure MCP servers

## PRP Task Format

**Structure**: Purpose (what/why) → Requirements (dependencies) → Procedure (exact steps)

## CRITICAL: Information Accuracy

**Never provide information unless factually correct from documented sources.**

**Protocol**: No assumptions → Use WebFetch for verification → Admit knowledge gaps → "I need to check documentation" not guessing

## Critical Standards

1. **Data Accuracy**: Member data, donations, and events must be 100% accurate
2. **Security**: Implement proper authentication checks and data validation
3. **Desktop-First**: All features optimized for desktop administrative workflows
4. **Type Safety**: Leverage TypeScript strictly - **NEVER use `any` types**
5. **Error Handling**: Always provide user-friendly error messages

## **DEBUGGING METHODOLOGY**
1. **Identify actual error** - Don't assume from symptoms
2. **Check imports/dependencies** - Circular deps cause "uninitialized variable" errors  
3. **Use existing patterns** - Look at working code first
4. **Test simple fixes** - Don't overcomplicate
5. **Understand architecture** - Read converters, service patterns
6. **Make minimal changes** - Fix actual problem only

## Common Development Tasks

### Adding a New Feature
1. Create service interface in `src/services/`
2. Implement Firebase service in `src/services/firebase/`
3. Create TypeScript types in `src/types/`
4. Build components in appropriate feature folder
5. Add route if needed in `src/router/`
6. Update relevant context if state management needed

### Working with Forms
- Use React Hook Form for all forms
- Implement proper validation with clear error messages
- Follow existing patterns in `src/components/*/forms/`

### Database Operations
- Use Firebase Admin SDK for server-side operations
- Implement proper security rules in Firebase Console
- Follow existing patterns for real-time updates using Firestore listeners

## Environment Variables

Key environment variables (see `.env.example`):
- `VITE_USE_FIREBASE` - Toggle between Supabase and Firebase
- `VITE_FIREBASE_*` - Firebase configuration
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key for payment processing
- `STRIPE_SECRET_KEY` - Stripe secret key for server-side operations
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret for security
- `VITE_SUPABASE_*` - Supabase configuration (legacy)

## Session Management

### Session Startup Protocol
1. **Always read** this CLAUDE.md file first to establish context
2. **Check** `docs/project_tracker.md` for current progress and next tasks
3. **Verify** which phase we're in and any dependencies
4. **Start local development** with `npm run dev` (Firebase runs in cloud)
5. **Confirm** database seeding and authentication working
6. **Review** any session notes from previous work

### Task Execution Order
- **Follow the order** specified in project_tracker.md strictly
- **Verify dependencies** before executing any task
- **Complete each phase** before moving to the next to maintain architectural integrity

### Implementation Guidelines
- **Use exact names** for tables, columns, and routes as specified in task files
- **Reference existing code** when implementing related features
- **Maintain consistency** with previously implemented patterns and components

### Testing Protocol
- **Test incrementally** after creating each schema with a test insert
- **Verify security rules** work correctly before implementing UI components
- **Test each UI component** with different user roles (admin, pastor, member)
- **Confirm integrations** work (e.g., auth triggers, foreign key constraints)

### Error Handling
- **Flag potential issues** proactively during implementation
- **Request clarification** immediately when requirements are ambiguous
- **Document workarounds** if standard approaches don't work
- **Never skip error handling** in production code

### Quality Assurance
- **Follow TypeScript** best practices with proper typing
- **Implement loading states** and error boundaries in React components
- **Ensure desktop efficiency** using TailwindCSS utilities for administrative workflows
- **Apply Firebase Security Rules** consistently across all collections

## Coordination Protocol

If you are unsure of assumptions or hit ambiguous scope:
- Prompt the human architect with exact question
- Halt implementation until confirmed

## Key Files to Reference

### Core Configuration
- `/src/lib/firebase.ts` - Firebase client configuration
- `/firestore.rules` - Security rules with role-based access
- `.env.example` - Environment variables

### Services & Types  
- `/src/services/firebase/` - Firebase service implementations (members, households, events, roles, dashboard, donations)
- `/src/types/index.ts` - Core domain models (Member, Household)
- `/src/types/events.ts` - Event system types (Event, EventRSVP, EventAttendance, EventType)
- `/src/types/donations.ts` - **NEW**: Donation system types (Donation, DonationCategory, DonationReport)
- `/src/utils/firestore-converters.ts` - **CRITICAL**: Type-safe document conversion
- `/src/utils/member-form-utils.ts` - Form utilities and phone formatting

### Components
- `/src/pages/Members.tsx` - Member directory with full-width layout
- `/src/pages/MemberProfile.tsx` - Profile with household sidebar
- `/src/components/members/` - Member forms and profile components
- `/src/components/common/` - Layout, Navigation, shared UI
- `/src/components/events/EventForm.tsx` - Comprehensive event creation/editing form
- `/src/components/donations/DonationForm.tsx` - **NEW**: Professional donation recording form with modular architecture
- `/src/components/donations/sections/` - **NEW**: Modular form sections following 300 LOC pattern

### Documentation & Scripts
- `/docs/prd.md` - Project requirements
- `/docs/prps/phase-2c-donations/` - **NEW**: Phase 2C donation system documentation
- `/src/scripts/` - Database seeding and admin setup

## Security & Roles System

### Current Role Structure
The application uses three primary roles stored on Member documents:
- **`admin`** - Full system administrator
- **`pastor`** - Church leadership with pastoral care access
- **`member`** - Regular church member with limited access

### Critical Security Requirements

#### Member Role Access (Principle of Least Privilege)
**Members should ONLY see:**
- ✅ Own profile and household information
- ✅ Own donation history only
- ✅ Upcoming public events (not private/admin events)
- ✅ Limited church directory (names, public contact info only)
- ✅ Own event RSVPs and attendance
- ❌ **NEVER** other members' donations or financial details
- ❌ **NEVER** private member information or pastoral notes
- ❌ **NEVER** administrative functions or reports

#### Pastor Role Access (Pastoral Care Focus)
**Pastors should have access to:**
- ✅ All member information for pastoral care purposes
- ✅ Event creation and management (all events)
- ✅ Aggregate donation reports (not individual line items unless pastoral need)
- ✅ Full church directory and member engagement analytics
- ✅ Event attendance tracking across all events
- ❌ System administration functions
- ❌ User role assignments
- ❌ Individual donation details without specific justification

#### Admin Role Access (Full System Access)
**Admins have complete access to:**
- ✅ All financial data and detailed reports
- ✅ User role management and system configuration
- ✅ All analytics, reporting, and data export/import
- ✅ Audit logs and system monitoring
- ✅ Database administration functions

### Implementation Priorities

#### Phase 1 (Critical Security)
1. **Dashboard filtering** - Implement role-based data filtering on all dashboard views
2. **Financial data security** - Ensure members only see own donations
3. **Role assignment system** - Admin-only interface for managing roles
4. **Audit logging** - Track all role changes and sensitive data access

#### Phase 2 (Enhanced Permissions)
1. **Granular permissions system** - Permission-based access beyond just roles
2. **Additional roles** - Treasurer, volunteer coordinator, ministry leader
3. **Role expiration** - Time-limited role assignments
4. **Approval workflows** - Multi-step approval for sensitive access

**CRITICAL**: Default to restricting access. Members only see own data, pastors see member info for care, admins see everything.


## Documentation Standards

**CRITICAL: Use environment date as authoritative source for "today's date" - never use existing doc dates**

**Documentation Hierarchy**: CLAUDE.md (this file) → docs/INDEX.md → README.md → docs/*

**Key Requirements**: 
- Update docs with feature changes
- Include update timestamps  
- Archive obsolete content to docs/archive/
- Maintain accuracy - never contradict implementation