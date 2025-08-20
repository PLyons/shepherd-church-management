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
- Core services: members, households, roles
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

### React & TypeScript Naming Conventions (MANDATORY)
**ALWAYS follow these four critical naming rules:**

1. **Never use snake_case** for variables/functions in React/TypeScript
   - ❌ `const user_name = 'john'`
   - ✅ `const userName = 'john'`

2. **Always use camelCase** for variables, functions, props, and object properties
   - ✅ `const isLoggedIn = true`
   - ✅ `function getUserData() {}`
   - ✅ `const [age, setAge] = useState(42)`
   - ✅ `<Button onClick={handleClick} isDisabled={false} />`

3. **PascalCase mandatory** for React components and interfaces (JSX requirement)
   - ✅ `function UserProfile() {}`
   - ✅ `const ProfileCard = () => {}`
   - ✅ `interface UserProps { userName: string; }`

4. **Follow React-specific conventions**:
   - Event handlers: `on` + PascalCase → `onClick`, `onUserSelect`
   - State setters: `set` + PascalCase → `setAge`, `setUserData`
   - Custom hooks: `use` + PascalCase → `useAuth`, `useCustomHook`
   - Constants: `SCREAMING_SNAKE_CASE` → `API_ENDPOINT`, `MAX_RETRIES`

**These rules are non-negotiable and must be followed in all code.**

## Project-Wide Constraints
- No use of paid services during development (must run on free-tier limits)
- Environment secrets must be passed via `.env` files and never hardcoded
- No global state libraries (e.g., Redux) unless scoped locally
- Firebase Security Rules must be enforced for all user data access
- All database changes must be done via Firebase service layer and Firestore

## Project Status

**🎯 CORE FOUNDATION COMPLETE**: Shepherd has been stripped back to focus on core membership management functionality.

**Current Implementation:**
- Member management with full CRUD operations
- Household management with family relationships
- Role-based access control (admin, pastor, member)
- Firebase Authentication integration
- Dashboard views by role
- QR-based member onboarding and magic link authentication

**Features Removed for Reimplementation:**
- Event management and RSVP system
- Donation tracking and financial reports
- Sermon archive and media management
- Volunteer scheduling system

**Current Focus**: Methodical reimplementation of features according to PRD specifications. All development uses Firebase services exclusively.


## MCP Servers Integration

This project uses multiple Model Context Protocol (MCP) servers to enhance Claude Code's capabilities. All servers are automatically configured and should be running when working on this project.

### Current MCP Servers

#### 1. Serena - AI Coding Assistant
Serena is an advanced coding agent toolkit installed in `serena/` directory that provides semantic code analysis and IDE-level capabilities using Language Server Protocol (LSP).

**Configuration:**
```bash
# Add Serena to Claude Code
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena-mcp-server --context ide-assistant --project $(pwd)
```

**Primary Capabilities:**
- **Semantic Code Analysis**: Symbol-level understanding, cross-reference finding, multi-language LSP support
- **Advanced Code Editing**: Symbol-based insertions, precise line editing, regex find/replace
- **Project Management**: Memory persistence, intelligent onboarding, configuration management
- **AI Agent Integration**: MCP server for Claude integration, context/mode switching

**Essential Tools:**
- `find_symbol`, `get_symbols_overview` - Symbol navigation and analysis
- `insert_before_symbol`, `replace_symbol_body` - Precise code editing
- `write_memory`, `read_memory` - Project knowledge persistence
- `onboarding` - Automated project analysis and setup

**Debug Dashboard**: `http://localhost:24282/dashboard/`

#### 2. Firebase MCP Server
Provides direct integration with Firebase services for database operations, authentication management, and security rule validation.

**Configuration:**
```bash
# Automatically configured via Firebase CLI
npx -y firebase-tools@latest experimental:mcp
```

**Primary Capabilities:**
- **Firestore Operations**: Document CRUD, collection queries, security rule validation
- **Authentication Management**: User management, custom claims, SMS region policies
- **Storage Operations**: File management, download URLs
- **Cloud Messaging**: Push notification sending
- **Remote Config**: Template management and publishing
- **Real-time Database**: Data operations and rules validation

**Key Tools:**
- `mcp__firebase__firestore_*` - Firestore database operations
- `mcp__firebase__auth_*` - Authentication and user management
- `mcp__firebase__storage_*` - Storage operations
- `mcp__firebase__messaging_*` - Push notifications

#### 3. Semgrep MCP Server
Static analysis security scanner that identifies vulnerabilities, bugs, and code quality issues across multiple programming languages.

**Configuration:**
```bash
# Automatically configured via uvx
uvx --isolated --with fastmcp==2.9.* semgrep-mcp
```

**Primary Capabilities:**
- **Security Scanning**: OWASP Top 10, security anti-patterns, injection vulnerabilities
- **Code Quality**: Best practices, performance issues, maintainability concerns
- **Multi-language Support**: JavaScript/TypeScript, Python, Java, Go, and more
- **Custom Rules**: Project-specific rule configuration and validation

**Key Tools:**
- `mcp__semgrep__semgrep_scan` - Run security and quality scans
- `mcp__semgrep__start_scan` - Initiate scans with progress tracking
- `mcp__semgrep__get_scan_results` - Retrieve scan findings
- `mcp__semgrep__get_supported_languages` - Check language support

#### 4. Context7 MCP Server
Provides up-to-date code documentation and examples by fetching current library information and best practices directly into the AI's context.

**Configuration:**
```bash
# Add Context7 to Claude Code (local server)
claude mcp add context7 -- npx -y @upstash/context7-mcp

# Alternative: Remote server connection
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```

**Primary Capabilities:**
- **Current Documentation**: Fetches up-to-date library documentation and API references
- **Code Examples**: Provides version-specific, working code examples
- **Best Practices**: Retrieves current coding patterns and recommended approaches
- **Library Information**: Real-time access to package information, changelogs, and updates
- **Framework Support**: Covers popular frameworks like React, Vue, Angular, Node.js, and more

**Usage:**
- Add "use context7" to prompts when needing current documentation
- Automatically fetches the most recent library information
- Helps avoid outdated or deprecated code patterns
- Provides context-aware examples for the specific versions being used

**Benefits:**
- Eliminates outdated documentation issues
- Provides real-time library information
- Ensures code examples match current best practices
- Reduces errors from deprecated API usage

### MCP Server Management

**Check all server status:**
```bash
claude mcp list
```

**Debug server connections:**
```bash
claude --debug mcp list
```

**Add/remove servers:**
```bash
claude mcp add <name> -- <command>
claude mcp remove <name>
```

### Integration Best Practices

1. **Security-First Development**: Use Semgrep for continuous security scanning
2. **Database Operations**: Prefer Firebase MCP tools over direct Firebase CLI for consistency
3. **Code Analysis**: Use Serena for semantic understanding before making large changes
4. **Current Documentation**: Use Context7 when implementing new features or updating dependencies
5. **Error Handling**: All MCP tools include proper error handling and validation
6. **Performance**: Batch operations when possible using parallel tool calls
7. **Development Workflow**: Context7 → Serena → Implementation → Semgrep → Firebase deployment

## PRP Task Format

Each task file follows the **PRP structure**: Purpose, Requirements, Procedure

### Structure:
```md
# <task-name>

## Purpose
<What this task is solving or creating. Plain English, simple.>

## Requirements
- <List of technical or contextual requirements>
- <File or schema dependencies>
- <Firebase, Auth, or other service needed>

## Procedure
<Exact step-by-step instructions that the AI agent should follow. Include file paths, table names, and relevant logic.>
```

### Example:
```md
# create_member_schema

## Purpose
Define the Firestore collection for storing individual member information.

## Requirements
- Collection name: members
- Should link to `households` collection via reference
- Enforce gender as Male/Female only
- Include audit fields (createdAt, updatedAt)

## Procedure
1. Create a new Firestore collection schema for `members`
2. Define `members` document structure with the following fields: ...
3. Apply household reference relationship via `householdId`
4. Add validation rules for gender in Firebase Security Rules
```

## CRITICAL: Information Accuracy Standards

**NEVER provide information unless you are certain it is factually correct based on documented sources.**

### Mandatory Information Verification Protocol:
1. **No Assumptions**: Never assume how third-party services work
2. **No Guessing**: If you don't have documented knowledge, explicitly state "I don't have current documentation on this"
3. **Verify Before Advising**: When providing technical instructions, only give steps you can verify from official documentation
4. **Use Documentation Tools**: Use WebFetch to check official documentation before giving technical advice
5. **Admit Knowledge Gaps**: Always say "I need to check the official documentation" rather than guessing

### Examples of Required Behavior:
- ❌ **Wrong**: "You can regenerate Firebase API keys in the console settings"
- ✅ **Correct**: "I need to check Firebase documentation to give you accurate steps for API key management"
- ❌ **Wrong**: "This should work based on typical patterns"  
- ✅ **Correct**: "Let me verify this approach against the official documentation first"

### When Uncertain:
1. **State your uncertainty clearly**
2. **Use WebFetch to check official documentation**
3. **Only provide verified, documented procedures**
4. **Never fill gaps with assumptions**

**Providing incorrect information damages trust and can cause security issues. Accuracy is more important than speed.**

## Critical Standards

1. **Data Accuracy**: Member data, donations, and events must be 100% accurate
2. **Security**: Implement proper authentication checks and data validation
3. **Mobile-First**: All features must work on mobile devices
4. **Type Safety**: Leverage TypeScript strictly - avoid `any` types
5. **Error Handling**: Always provide user-friendly error messages

## **DEBUGGING METHODOLOGY**
**When encountering issues, follow this EXACT order:**

1. **Identify the actual error** - Don't assume root cause from symptoms
2. **Check imports and dependencies** - Circular deps cause "uninitialized variable" errors
3. **Use existing patterns** - Look at working code before creating new solutions  
4. **Test simple fixes first** - Don't overcomplicate 5-minute problems
5. **Understand existing architecture** - Read converter functions, service patterns, etc.
6. **Make minimal changes** - Fix the actual problem, not perceived problems

**RED FLAGS that indicate you're going off the rails:**
- Changing security rules to match code instead of fixing code
- Using different translation systems than what exists
- Making multiple "fixes" for one simple problem
- Not testing simple solutions before complex ones

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
- **Ensure mobile responsiveness** using TailwindCSS utilities
- **Apply Firebase Security Rules** consistently across all collections

## Coordination Protocol

If you are unsure of assumptions or hit ambiguous scope:
- Prompt the human architect with exact question
- Halt implementation until confirmed

## Key Files to Reference

### Core Configuration
- **`/src/lib/firebase.ts`** - Firebase client configuration and initialization
- **`/firestore.rules`** - Firebase Security Rules with role-based access control
- **`.env.example`** - Environment variables template

### Service Layer & Data Management
- **`/src/services/firebase/members.service.ts`** - Member management service
- **`/src/services/firebase/households.service.ts`** - Household management service  
- **`/src/services/firebase/roles.service.ts`** - Role assignment and management
- **`/src/services/firebase/dashboard.service.ts`** - Dashboard data aggregation
- **`/src/types/index.ts`** - Core type definitions (Member, Household)
- **`/src/utils/firestore-converters.ts`** - Type-safe Firestore document conversion

### Documentation & Scripts
- **`/docs/prd.md`** - Complete project requirements and specifications
- **`/src/scripts/seed-firebase-data.ts`** - Database seeding with test data
- **`/src/scripts/setup-admin.ts`** - Initial admin user setup

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

### Database Schema Requirements

#### Enhanced Role Assignment (Future)
```typescript
interface RoleAssignment {
  id: string
  memberId: string
  role: string
  permissions: Permission[]
  assignedBy: string
  assignedAt: Timestamp
  expiresAt?: Timestamp
  isActive: boolean
}

interface AuditLog {
  id: string
  action: 'role_assigned' | 'role_removed' | 'permission_granted'
  performedBy: string
  affectedMember: string
  details: any
  timestamp: Timestamp
}
```

### Security Best Practices
1. **Principle of least privilege** - Default to minimal access
2. **Data segregation** - Financial and personal data have strict access controls
3. **Audit trail** - All role changes and sensitive data access logged
4. **Session management** - Role changes require re-authentication
5. **Regular audits** - Quarterly review of role assignments

**CRITICAL**: Before implementing any dashboard or data access feature, always consider what role should see what data. Default to restricting access rather than allowing it.


## Output Expectations

- All files must be saved in correct paths
- New files and folders must be explicitly named in procedures
- Avoid creating "sample" code — implement real logic unless specified
- Be explicit about what was implemented vs. what needs manual steps
- Highlight any deviations from the original procedure with justification