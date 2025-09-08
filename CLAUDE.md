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
- Core services: members, households, events, roles
- All services extend BaseFirestoreService for consistent patterns

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
- Page-level components in `src/pages/`

### Type Definitions
All TypeScript types are centralized in `src/types/`:
- `index.ts` - Core domain models (Member, Household)
- `events.ts` - Event system types (Event, EventRSVP, EventAttendance)
- `firestore.ts` - Firebase/Firestore schema types
- Clean, Firebase-focused type definitions

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

**Summary**: Phase 2B Event Calendar & Attendance System - 97% complete. Calendar View Component completed (PRP-2B-007).

**MVP Implementation (95% Complete)**:
- ✅ Member Management - Enhanced CRUD with contact arrays and household sidebar  
- ✅ Role-based Access Control - Admin/pastor/member roles with security enforcement
- ✅ Firebase Authentication - Magic links and member onboarding
- ✅ Dashboard Views - Role-based dashboards with statistics
- ✅ Household Management - Complete CRUD system with member assignment and primary contact management
- 🔄 Event Calendar & Attendance - Event CRUD, discovery UI, and calendar views complete

**Active Phase 2B Event Calendar & Attendance (August 2025)**:
- ✅ PRP-2B-001: Event Data Model & Types - Complete TypeScript interface system
- ✅ PRP-2B-002: Events Firebase Service - Complete CRUD service with role-based queries
- ✅ PRP-2B-003: Event RSVP Service - Complete with capacity management and waitlist support
- ✅ PRP-2B-004: Firestore Security Rules - Complete role-based security for events and RSVPs
- ✅ PRP-2B-005: Event Form Component - Complete EventForm with React Hook Form validation (2025-08-28)
- ✅ PRP-2B-006: Event List & Cards Component - Complete EventList with filtering and search
- ✅ PRP-2B-007: Calendar View Component - Complete EventCalendar with monthly/weekly views
- 🔄 **Next**: PRP-2B-008 Event Details & RSVP Modal Implementation

**Pending MVP Features (40% Remaining)**:
- Event Calendar & Attendance UI Components (Event Discovery, Calendar View, RSVP System)
- Donation Tracking & Financial Reports
- Volunteer Scheduling System
- Sermon Archive & Media Management


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
- `/src/services/firebase/` - Firebase service implementations (members, households, events, roles, dashboard)
- `/src/types/index.ts` - Core domain models (Member, Household)
- `/src/types/events.ts` - Event system types (Event, EventRSVP, EventAttendance, EventType)
- `/src/utils/firestore-converters.ts` - **CRITICAL**: Type-safe document conversion
- `/src/utils/member-form-utils.ts` - Form utilities and phone formatting

### Components
- `/src/pages/Members.tsx` - Member directory with full-width layout
- `/src/pages/MemberProfile.tsx` - Profile with household sidebar
- `/src/components/members/` - Member forms and profile components
- `/src/components/common/` - Layout, Navigation, shared UI
- `/src/components/events/EventForm.tsx` - **NEW**: Comprehensive event creation/editing form

### Documentation & Scripts
- `/docs/prd.md` - Project requirements
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