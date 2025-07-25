# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shepherd is a comprehensive Church Management System built with React, TypeScript, and Vite. The project is currently migrating from Supabase to Firebase for backend services.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Code quality checks - ALWAYS run before completing tasks
npm run lint
npm run format

# Database operations
npm run migrate         # Run migrations
npm run seed           # Seed test data
npm run seed:firebase  # Seed Firebase with test data
```

## Architecture & Key Patterns

### Service Layer Architecture
The codebase uses a service layer pattern with dual backend support during migration:
- `src/services/` - Main service layer with abstract interfaces
- `src/services/firebase/` - Firebase-specific implementations
- Environment variable `VITE_USE_FIREBASE` controls which backend is active

### Component Organization
Components are organized by feature in `src/components/`:
- Each feature folder contains related components, hooks, and utilities
- Common components in `src/components/common/`
- Page-level components in `src/pages/`

### Type Definitions
All TypeScript types are centralized in `src/types/`:
- `index.ts` - Core domain models (Member, Household, Event, etc.)
- `api.ts` - API response types
- `supabase.ts` - Database schema types
- `firestore.ts` - Firebase/Firestore schema types

### Authentication & Authorization
The system uses a role-based access control (RBAC) system with three primary roles:
- `admin` - Full system access including financial data, user management, and system settings
- `pastor` - Access to member information for pastoral care, event management, and aggregate reports
- `member` - Limited access to own data, public events, and basic directory information

**Critical Security Principle**: Members should only see their own financial data (donations) and limited information about other members. Full implementation details are documented in the Security & Roles section below.

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

## Project-Wide Constraints
- No use of paid services during development (must run on free-tier limits)
- Environment secrets must be passed via `.env` files and never hardcoded
- No global state libraries (e.g., Redux) unless scoped locally
- Firebase Security Rules must be enforced for all user data access
- All database changes must be done via Firebase service layer and Firestore

## Firebase Migration Context

The project is actively migrating from Supabase to Firebase. When working on features:
1. Check if the feature has been migrated by looking for Firebase service implementations
2. New features should be implemented using Firebase services only
3. Maintain the service abstraction layer to keep components backend-agnostic

## Testing Approach

Beta testing framework is in `docs/testing/`:
- `beta-testing-guide.md` - User testing instructions
- `test-scenarios.md` - Comprehensive test cases
- `testing-checklist.md` - Feature verification checklist

For unit tests, check for test files alongside components (`.test.ts` or `.spec.ts` files).

## Serena Integration - Advanced AI Coding Assistant

Serena is an advanced coding agent toolkit that has been installed in this project to enhance AI-powered development capabilities. It provides semantic code analysis, intelligent symbol navigation, and powerful editing tools using Language Server Protocol (LSP).

### Serena Overview

**Location**: `serena/` directory  
**Purpose**: Provides AI agents with IDE-level capabilities for semantic code understanding and editing  
**Key Advantage**: Uses Language Server Protocol for precise, symbol-based code operations vs text-based approaches

### Quick Start Commands

```bash
# Navigate to Serena directory
cd serena

# Activate Serena environment 
export PATH="$HOME/.local/bin:$PATH" && source .venv/bin/activate

# Start MCP server for Claude Code integration
uv run serena-mcp-server

# Start MCP server in SSE mode (HTTP-based)
uv run serena-mcp-server --transport sse --port 9999

# List all available tools
cd scripts && python print_tool_overview.py

# Index a project for faster performance
uv run serena project index /path/to/project
```

### Core Capabilities

**1. Semantic Code Analysis**
- Symbol-level understanding using LSP
- Cross-reference finding and navigation
- Intelligent code completion and suggestions
- Multi-language support (Python, TypeScript, Go, Rust, Java, C#, PHP, etc.)

**2. Advanced Code Editing**
- Symbol-based insertions and replacements
- Line-level precise editing
- Regex-based find/replace operations
- Maintains code structure and formatting

**3. Project Management**
- Intelligent project onboarding and analysis
- Memory persistence across sessions
- Configuration management per project
- Integration with version control systems

**4. AI Agent Integration**
- Model Context Protocol (MCP) server for Claude integration
- Agno framework support for any LLM
- Tool-based architecture for easy extension
- Context and mode switching for different workflows

### Key Tools Available

**File & Project Operations:**
- `activate_project` - Activate project by name/path
- `list_dir` - Directory listing with recursion
- `create_text_file` - Create/overwrite files
- `read_file` - Read file contents
- `find_file` - Find files by patterns
- `search_for_pattern` - Project-wide pattern search

**Symbol & Code Analysis:**
- `find_symbol` - Global symbol search with filtering
- `get_symbols_overview` - Top-level symbols in files/directories
- `find_referencing_symbols` - Find symbol references
- `replace_symbol_body` - Replace complete symbol definitions

**Code Editing:**
- `insert_at_line` - Insert content at specific lines
- `insert_before_symbol`/`insert_after_symbol` - Symbol-relative insertions
- `replace_lines` - Replace line ranges with new content
- `replace_regex` - Regex-based replacements
- `delete_lines` - Delete line ranges

**Memory & Knowledge Management:**
- `write_memory` - Store project knowledge
- `read_memory` - Retrieve stored knowledge
- `list_memories` - Show available memories
- `delete_memory` - Remove memories
- `onboarding` - Automated project analysis

**Workflow & Meta Operations:**
- `execute_shell_command` - Run shell commands
- `switch_modes` - Change operational modes
- `get_current_config` - Show current configuration
- `restart_language_server` - Restart LSP server
- `summarize_changes` - Generate change summaries

### Configuration System

**Contexts** (Environment types):
- `desktop-app` - For Claude Desktop integration (default)
- `agent` - For autonomous agent operation  
- `ide-assistant` - For IDE integration (VSCode, Cursor, etc.)

**Modes** (Operational patterns):
- `interactive` - Conversational workflow
- `editing` - Direct code modification focus
- `planning` - Analysis and planning emphasis
- `one-shot` - Single-response tasks
- `onboarding` - Project setup and learning

**Configuration Hierarchy** (highest precedence first):
1. Command-line arguments
2. Project-specific `.serena/project.yml`
3. User config `~/.serena/serena_config.yml`
4. Active contexts and modes

### Integration Patterns

**With Claude Code:**
```bash
# Add Serena to Claude Code from project directory
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena-mcp-server --context ide-assistant --project $(pwd)

# Load instructions in Claude Code session
/mcp__serena__initial_instructions
```

**With Other MCP Clients:**
Configure MCP client to run:
```bash
uvx --from git+https://github.com/oraios/serena serena-mcp-server --context ide-assistant
```

**For Multi-Language Projects:**
Serena automatically detects and configures appropriate language servers for:
- **Python** (Pyright)
- **TypeScript/JavaScript** (TSServer) 
- **Go** (gopls)
- **Rust** (rust-analyzer)
- **Java** (Eclipse JDT)
- **C#** (OmniSharp/C# LSP)
- **PHP** (Intelephense)
- **C/C++** (clangd)
- **Elixir** (NextLS)
- **Clojure** (clojure-lsp)
- **Terraform** (terraform-ls)

### Best Practices

**Project Setup:**
1. Start from clean git state for change tracking
2. Enable appropriate git autocrlf settings on Windows
3. Ensure good test coverage for verification
4. Structure code with clear modularity

**Workflow Optimization:**
1. Use onboarding for new projects to create memories
2. Switch modes based on task type (planning vs editing)
3. Leverage memory system for complex, multi-session work
4. Use symbol-based operations over line-based when possible

**Performance Tips:**
1. Index large projects using `uv run serena project index`
2. Use context filtering to limit tool scope
3. Be frugal with token usage - avoid reading unnecessary symbols
4. Restart language servers if performance degrades

### Troubleshooting

**Common Issues:**
- Language server crashes → Use `restart_language_server` tool
- Hanging processes → Use web dashboard to shut down cleanly  
- Symbol not found → Check if project is properly indexed
- Performance issues → Try reindexing or restarting language servers

**Debug Resources:**
- Web dashboard: `http://localhost:24282/dashboard/`
- Log levels configurable in `serena_config.yml`
- LSP communication tracing available
- Tool execution timeouts configurable

### Advanced Features

**Memory System:**
- Markdown-based storage in `.serena/memories/`
- Project-specific knowledge persistence
- Contextual retrieval based on relevance
- Manual and automated memory creation

**Dashboard & Monitoring:**
- Real-time web dashboard for session monitoring
- Tool usage statistics and performance metrics
- Log viewing and session management
- Process control and cleanup

**Extension Points:**
- Custom contexts and modes via YAML configuration
- Tool framework for adding new capabilities
- Integration with external agent frameworks
- Language server adapter pattern for new languages

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
- **`/docs/project_tracker.md`** - Current progress, completed tasks, and next steps
- **`/docs/prd.md`** - Full project requirements and specifications
- **`/src/lib/firebase.ts`** - Firebase client configuration
- **`/src/services/firebase/`** - Firebase service layer
- **`/src/scripts/seed-firebase-data.ts`** - Database seed script with test data
- **`/firestore.rules`** - Firebase Security Rules
- **`.env.example`** - Environment variables template

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

## Testing Requirements

### Test Coverage Standards
The project uses Vitest for comprehensive testing with the following coverage requirements:
- **Minimum 50% coverage** for all new code
- **Target 80% coverage** for critical services and components
- **100% coverage** for authentication and authorization logic

### Testing Infrastructure
- **Vitest** as test runner with React Testing Library for component testing
- **Mock Service Worker (MSW)** for API mocking
- **Firebase mocks** for all Firestore operations
- **Comprehensive test utilities** in `src/test/` folder

### Critical Testing Areas
1. **Service layer tests** - Firebase services with CRUD operations, filtering, and error handling
2. **Authentication tests** - Auth guards, role checks, and permission validation
3. **Component tests** - Forms, guards, and data display components
4. **Integration tests** - End-to-end user workflows

### Test Commands
```bash
npm test                    # Run all tests
npm run test:coverage      # Run tests with coverage report
npm run test:watch         # Run tests in watch mode
```

**IMPORTANT**: All tests must pass before marking any task as completed. Run `npm test` before committing changes.

## Output Expectations

- All files must be saved in correct paths
- New files and folders must be explicitly named in procedures
- Avoid creating "sample" code — implement real logic unless specified
- Be explicit about what was implemented vs. what needs manual steps
- Highlight any deviations from the original procedure with justification