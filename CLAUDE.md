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

**🔧 Phase 0.2 CORRECTIVE IMPLEMENTATION - COMPLETED (2025-08-22)**: Fixed layout architecture issues identified in member profile implementation.

**✅ Critical Issues Resolved (2025-08-22):**
- ✅ Responsive grid layout causing content compression at smaller viewports → Fixed with flexbox layout
- ✅ Horizontal card layout violating Planning Center design patterns → Converted to vertical sections
- ✅ Missing desktop-first constraints allowing unwanted responsive behavior → Added 1200px minimum width
- ✅ Household sidebar implemented as grid column instead of fixed sidebar → Implemented true 400px fixed sidebar
- ✅ Excessive whitespace reducing information density → Optimized spacing to match Planning Center standards

**✅ Corrective PRPs Completed (2025-08-22):**
- **✅ PRP-101**: Layout Architecture Restructure - Replaced grid with flexbox and minimum widths
- **✅ PRP-102**: Vertical Content Organization - Converted horizontal cards to vertical sections with 2-column field grids
- **✅ PRP-103**: Enhanced Profile Header - Created prominent header with large avatar and integrated badges
- **✅ PRP-104**: Fixed Household Sidebar - Implemented true 400px fixed sidebar with flex-shrink-0
- **✅ PRP-105**: Desktop-First Constraints - Enforced 1200px minimum width throughout profile components
- **✅ PRP-106**: Information Density Optimization - Reduced spacing and padding to match Planning Center standards

**✅ Recently Completed (Phase 0.1.6 - 2025-08-22):**
- **Full-Width Layout Optimization**: Maximum browser width utilization for administrative efficiency
  - Removed artificial width constraints (max-w-7xl) from all layout containers
  - Expanded member profile from 4-column to 5-column grid with enhanced household sidebar (40% width)
  - Enhanced household sidebar with larger avatars, comprehensive member details, and statistics
  - Full-width navigation and form layouts for better screen real estate usage
  - Optimized for modern widescreen monitors used in church administrative environments

**✅ Previously Completed (Phase 0.1.5 - 2025-08-22):**
- **Desktop-First Architecture Cleanup**: Comprehensive removal of mobile-first responsive complexity
  - Simplified member directory with all columns visible by default (no responsive hiding)
  - Streamlined household sidebar with consistent desktop layout
  - Removed complex responsive breakpoints from forms and dashboards
  - Eliminated mobile drawer patterns and multi-breakpoint layouts
  - Focus on administrative efficiency and desktop workflows
  - Maintained basic usability across screen sizes without complex responsive patterns

**✅ Previously Completed (Phase 0.1.4 - 2025-08-22):**
- **PRP-004 Household Sidebar Implementation**: Complete household information sidebar for member profiles
  - Professional household member visualization with avatars and relationship indicators
  - Desktop-optimized sidebar layout for administrative efficiency
  - Real-time household data loading with proper loading states and error handling
  - Role-based household management actions for admin/pastor users
  - Industry-standard member profile layout following Planning Center/WorshipTools patterns

**✅ Previously Completed (Phase 0.1.3 - 2025-08-21):**
- **Member Directory Professional Organization**: Clean table layout optimized for administrative workflows
  - Separated concatenated names into distinct Last Name and First Name columns following industry standards
  - Added dedicated Photo column for avatar placeholders (future member photo uploads)
  - All 8 columns visible for complete member information: Photo, Last Name, First Name, Email, Phone, Status, Role, Actions
  - WCAG 2.1 AA accessibility compliance with keyboard navigation
  - Desktop-optimized for efficient member management
- **Member Directory UX Enhancement** (Phase 0.1.2): Industry-standard clickable name hyperlinks
  - Removed redundant View buttons following Planning Center/WorshipTools patterns
  - Converted member names to professional blue hyperlinks with hover effects
  - Streamlined Actions column showing only relevant user actions
  - Professional administrative interface optimized for desktop workflows
  - Pattern consistency established as application standard
- **US States Dropdown** (Phase 0.1.1): Standardized state selection with USPS abbreviations
- **Enhanced Member Data Model**: Arrays for emails, phones, addresses with type/primary flags
- **Advanced Member Form**: Collapsible sections, dynamic arrays, conditional SMS opt-in
- **Deep Field Mapping**: Automatic camelCase ↔ snake_case conversion for nested data
- **Smart Contact Display**: Primary email/phone detection with backward compatibility
- **Professional Contact Management**: Multiple contact methods per member

**🔧 Recent Bug Fixes & Improvements (2025-08-20):**
- **Duplicate UI Elements**: Removed redundant Add Member button from Members directory
- **Edit Profile Navigation**: Fixed edit profile routing from view to edit form
- **Address Functionality**: Enhanced address persistence and display in edit mode
- **Date Field Issues**: Fixed birthdate and anniversary date persistence and display
- **Phone Number Formatting**: Implemented (xxx) xxx-xxxx display format while storing as digits
- **Contact Data Display**: Enhanced member profile view to show all enhanced contact arrays
- **Field Mapping**: Updated Firestore converters for proper snake_case ↔ camelCase conversion

**📋 Future Enhancements (2025-08-21):**
- **Address Verification System**: Implementation plan moved to `docs/Future Enhancements/` for post-MVP development
- **Post-MVP Features**: All enhancement specifications stored in `docs/Future Enhancements/` directory

**Current MVP Implementation (25.0% Complete - 1.5 of 6 components):**
- ✅ **Member Management** - Enhanced CRUD operations with professional contact arrays
- ✅ **Role-based Access Control** - Admin, pastor, member roles with security enforcement
- ✅ **Firebase Authentication** - Magic links and QR-based member onboarding
- ✅ **Dashboard Views** - Role-based dashboards with member statistics
- ✅ **Enhanced Member Profiles** - Multiple contact methods, formatted display, robust field mapping, household sidebar
- 🔄 **Household Management** - Partially Complete (Member profile integration done, household CRUD pending)

**MVP Features Pending Implementation (75.0% Remaining):**
- 🔄 **Household Management** - Complete household CRUD operations and management interface
- ❌ **Event Calendar & Attendance System** (Phase 2B - Planned)
- ❌ **Donation Tracking & Financial Reports** (Phase 2C - Planned)
- ❌ **Volunteer Scheduling System** (Phase 2D - Planned)
- ❌ **Sermon Archive & Media Management** (Phase 2D - Planned)

**✅ Phase 0.2 Documentation Updated (2025-08-22):**
- **Desktop-First PRP Alignment**: Updated all Phase 0.2 PRPs for desktop-first architecture
  - PRP-009 (Mobile Optimization) removed as incompatible with desktop-first approach
  - PRPs 007, 008, 010, 011, 012 updated to remove mobile-specific requirements
  - 11 PRPs remain focused on desktop administrative workflows
  - 4 PRPs already completed (PRP-001 through PRP-004) as part of Phase 0.1 desktop-first cleanup

**Phase 0.2 Implementation Status**:
- **✅ Corrective PRPs (101-106)**: COMPLETED - Fixed fundamental layout architecture issues
- **Original PRPs (005-012)**: PRP-005 (Inline Editing), PRP-006 (Membership Type Selector), and PRP-007 (Activity History Tab) completed, ready to continue with PRP-008
- **Next Steps**: Continue with PRPs 008-011 with the corrected layout foundation

**Implementation Sequence** (Updated 2025-08-22):
1. ✅ Execute corrective PRPs 101-106 to fix layout foundation → **COMPLETED**
2. ✅ Resume PRP-006 (Membership Type Selector) with corrected layout → **COMPLETED**
3. ✅ Continue with PRP-007 (Activity History Tab) → **COMPLETED**
4. 🔄 Continue with PRPs 008-011 as originally planned → **READY FOR PRP-008**
5. Skip PRP-012 (Testing) as requested

Post-MVP enhancements stored in `docs/Future Enhancements/`.


## MCP Servers Integration

This project uses multiple Model Context Protocol (MCP) servers to enhance Claude Code's capabilities. All servers are automatically configured and should be running when working on this project.

## **MANDATORY: MCP Server Usage Rules**

**Claude Code MUST use MCP servers proactively for all relevant tasks. These tools exist to make you work smarter, not harder.**

### **Required Usage Patterns:**

1. **ALWAYS use Serena for code analysis** - Before reading entire files, use `get_symbols_overview` and `find_symbol` for token-efficient code exploration
2. **ALWAYS use Context7 for current documentation** - When implementing features with external libraries, fetch current docs instead of using outdated knowledge
3. **ALWAYS use Firebase MCP for database operations** - Direct Firebase tool usage instead of manual CLI commands
4. **ALWAYS use Playwright for UI testing** - Test forms, workflows, and user interactions on the running development server
5. **ALWAYS use Semgrep for security scanning** - Run security scans before code commits, especially for authentication/authorization code
6. **ALWAYS use GitHub MCP for repository operations** - Automate PR creation, issue management, and GitHub Actions workflows

### **Proactive Usage Requirements:**

- **Before editing code**: Use Serena's `find_symbol` and `get_symbols_overview` to understand existing patterns
- **Before implementing new features**: Use Context7 to get current best practices and API documentation
- **Before database changes**: Use Firebase MCP tools to verify data structure and test operations
- **After UI changes**: Use Playwright to verify functionality on `http://localhost:5173` (development server)
- **Before task completion**: Run Semgrep security scan to identify potential vulnerabilities
- **After completing tasks**: Use GitHub MCP to create PRs with standardized commit messages and manage issues

### **Efficiency Rules:**

1. **Don't reinvent what exists** - Use Serena to find existing patterns before creating new ones
2. **Don't guess API usage** - Use Context7 to fetch current documentation
3. **Don't manually test UI** - Use Playwright to automate testing on the running app
4. **Don't skip security** - Use Semgrep to catch issues early
5. **Don't manually manage repository tasks** - Use GitHub MCP to automate PR creation, issue management, and workflows

**These tools exist to enhance your capabilities - USE THEM consistently and proactively.**

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

#### 5. Playwright MCP Server
Browser automation and testing framework providing comprehensive end-to-end testing capabilities for web applications.

**Configuration:**
```bash
# Automatically configured via Claude Code MCP integration
# Server provides direct access to Playwright's browser automation tools
```

**Primary Capabilities:**
- **Browser Management**: Launch, resize, close browsers with full Chromium/Firefox support
- **Navigation & Page Control**: URL navigation, page history, accessibility snapshots, screenshots
- **User Interactions**: Click, type, hover, drag-and-drop, keyboard input, file uploads
- **Element Targeting**: Human-readable descriptions with exact element references
- **Advanced Features**: JavaScript execution, console monitoring, network request tracking
- **Tab Management**: Multi-tab support with tab creation, switching, and closing
- **Dialog Handling**: Alert, confirm, and prompt dialog management
- **Wait Conditions**: Wait for text appearance/disappearance or time-based delays

**Key Tools:**
- `mcp__playwright__browser_navigate` - Navigate to URLs
- `mcp__playwright__browser_click` - Element interaction and clicking
- `mcp__playwright__browser_type` - Form input and text entry
- `mcp__playwright__browser_snapshot` - Accessibility-focused page snapshots
- `mcp__playwright__browser_evaluate` - JavaScript execution on page/elements
- `mcp__playwright__browser_network_requests` - Monitor API calls and responses
- `mcp__playwright__browser_tab_*` - Multi-tab management

**Testing Applications:**
- **End-to-End Testing**: Complete user workflow validation for Shepherd CMS
- **Role-based Testing**: Authentication flows for admin/pastor/member roles
- **Form Validation**: Member registration, donation forms, event RSVPs
- **Responsive Design**: Cross-device and screen size compatibility testing
- **API Integration**: Monitor Firebase/Firestore network requests during user actions
- **Accessibility Testing**: Semantic element validation and screen reader compatibility
- **Security Testing**: Authentication boundaries and data access validation

**Benefits:**
- Real browser automation with full JavaScript support
- Accessibility-first approach for better test reliability
- Network monitoring for API integration validation
- Multi-tab support for complex user workflows
- Element targeting using human-readable descriptions
- Comprehensive interaction capabilities (clicks, typing, file uploads)

#### 6. GitHub MCP Server
GitHub's official MCP server providing comprehensive GitHub API integration for repository management, automation, and development workflows.

**Configuration:**
```bash
# Official GitHub MCP server via remote HTTP transport (recommended)
claude mcp add --transport http github https://api.githubcopilot.com/mcp -H "Authorization: Bearer <your-github-token>"

# Alternative: Local Docker installation
claude mcp add github -e GITHUB_PERSONAL_ACCESS_TOKEN=<your-token> -- docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server
```

**13 Comprehensive Toolsets:**
- **Issues Management**: Create, update, comment, assign, and manage GitHub issues
- **Pull Requests**: Create, review, merge, and manage pull requests with full workflow support
- **Repositories**: Complete repository operations including file management, branches, and settings
- **GitHub Actions**: Workflow management, run triggering, artifact handling, and CI/CD automation
- **Code Security**: Security alerts, vulnerability scanning, and code analysis integration
- **Dependabot**: Dependency vulnerability tracking and automated security updates
- **Discussions**: GitHub Discussions creation, management, and community engagement
- **Gists**: Code snippet creation, sharing, and management
- **Notifications**: GitHub notification handling and management
- **Organizations**: Organization-level operations and team management
- **Users**: User profile interactions and management
- **Secret Protection**: Security scanning for exposed secrets and sensitive data
- **Context**: Repository and user context information for enhanced AI interactions

**Essential Tools:**
- Complete repository file operations and branch management
- Issue creation with automated assignment and labeling
- Pull request creation with standardized commit messages and descriptions
- GitHub Actions workflow triggering and monitoring
- Security alert management and vulnerability tracking
- Comprehensive project and organization management

**Development Applications:**
- **Automated PR Creation**: Create properly formatted pull requests with standardized commit messages
- **Issue Management**: Convert TODOs and bugs into tracked GitHub issues
- **CI/CD Integration**: Trigger builds, tests, and deployments through GitHub Actions
- **Code Documentation**: Create and manage Gists for code snippets and examples
- **Security Management**: Manage repository secrets for Firebase, deployment keys, and API tokens
- **Release Automation**: Automate release creation and deployment workflows

**Benefits for Shepherd Project:**
- Seamless integration with existing MCP server stack (Serena, Firebase, Semgrep, Playwright)
- Automated development workflows for PRP implementation
- Enhanced CI/CD capabilities for deployment automation
- Secure secrets management for production deployments
- Standardized commit message formatting with "🤖 Generated with Claude Code"

**Setup Requirements:**
- GitHub Personal Access Token with `repo` scope (minimum required)
- Additional recommended scopes: `workflow`, `gist`, `read:org`, `read:user`
- Optional: Docker installation for local server deployment
- Claude Code CLI or Claude Desktop application

**Authentication Methods:**
- **Remote Server**: Uses Authorization Bearer header with GitHub PAT
- **Local Docker**: Uses GITHUB_PERSONAL_ACCESS_TOKEN environment variable
- **OAuth Integration**: Supported for enterprise installations

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
5. **Testing & Validation**: Use Playwright for end-to-end testing and user workflow validation
6. **Error Handling**: All MCP tools include proper error handling and validation
7. **Performance**: Batch operations when possible using parallel tool calls
8. **Development Workflow**: Context7 → Serena → Implementation → Playwright Testing → Semgrep → Firebase deployment

## Multi-Machine Development Workflow

This project supports seamless development across multiple machines (desktop and laptop) using Git-based synchronization.

### Critical Workflow Rules

**ALWAYS start work with:**
```bash
git pull origin main
```

**ALWAYS end work with:**
```bash
git add .
git commit -m "WIP: Work in progress - switching to [laptop/desktop]"
git push origin main
```

### Initial Laptop Setup

1. **Clone repository:**
   ```bash
   git clone https://github.com/PLyons/shepherd-church-management.git
   cd shepherd-church-management
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   # Add your Firebase credentials to .env
   ```

3. **MCP servers setup (if using Claude Code):**
   Follow the same MCP server configuration as documented above

### Best Practices for Multi-Machine Work

1. **Commit Frequently**: Small, focused commits prevent conflicts
2. **Use "WIP" Commits**: For incomplete work when switching machines
3. **Pull Before Starting**: Always get latest changes first
4. **Push Before Switching**: Never leave uncommitted work on a machine
5. **Descriptive Commit Messages**: Help track work across machines

### Conflict Resolution

If merge conflicts occur:
```bash
# Git will mark conflicts in files
# Edit files to resolve conflicts
# Remove conflict markers and choose correct version
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

### Emergency Recovery

- All pushed commits are safe in GitHub
- Use `git reflog` to see recent actions
- Use `git log --oneline` to see commit history
- Local backups available via Time Machine (Mac)

**Detailed Setup Guide**: See `docs/MULTI-MACHINE-SETUP.md` for comprehensive instructions.

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
3. **Desktop-First**: All features optimized for desktop administrative workflows
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
- **Ensure desktop efficiency** using TailwindCSS utilities for administrative workflows
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
- **`/src/services/firebase/members.service.ts`** - Member management service with deep field mapping
- **`/src/services/firebase/households.service.ts`** - Household management service  
- **`/src/services/firebase/roles.service.ts`** - Role assignment and management
- **`/src/services/firebase/dashboard.service.ts`** - Dashboard data aggregation
- **`/src/types/index.ts`** - Core type definitions (Member, Household) with enhanced arrays
- **`/src/utils/firestore-converters.ts`** - Type-safe Firestore document conversion
- **`/src/utils/firestore-field-mapper.ts`** - Deep field mapping (camelCase ↔ snake_case)
- **`/src/utils/member-form-utils.ts`** - Member form utilities including phone formatting

### Enhanced Components (Phase 0.1)
- **`/src/components/members/MemberFormEnhanced.tsx`** - Full-width member form with advanced arrays and states dropdown
- **`/src/pages/Members.tsx`** - Enhanced member directory with all columns visible and full-width layout
- **`/src/pages/MemberProfile.tsx`** - Member profile with full-width 5-column layout and enhanced household sidebar
- **`/src/components/members/profile/HouseholdSidebar.tsx`** - Enhanced household sidebar with comprehensive member details, statistics, and larger avatars
- **`/src/components/common/Layout.tsx`** - Full-width layout container without artificial constraints
- **`/src/components/common/Navigation.tsx`** - Full-width navigation optimized for widescreen monitors
- **`/src/router/index.tsx`** - Updated routing for enhanced forms

### Constants & Standards
- **`/src/constants/states.ts`** - US States & Territories with USPS abbreviations

### Documentation & Testing
- **`/docs/prd.md`** - Complete project requirements and specifications
- **`/docs/Future Enhancements/`** - Post-MVP feature specifications and implementation plans
- **`/src/scripts/seed-firebase-data.ts`** - Database seeding with test data
- **`/src/scripts/setup-admin.ts`** - Initial admin user setup
- **`/MANUAL-TESTING-GUIDE.md`** - Comprehensive Phase 0.1 testing protocol
- **`/FIRESTORE-DATA-VERIFICATION.md`** - Data format verification and debugging guide

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


## Documentation Standards & Maintenance

### Documentation Hierarchy
1. **CLAUDE.md (This File)** - Authoritative technical reference, always kept current
2. **docs/INDEX.md** - Documentation hub and navigation
3. **README.md** - Public-facing project overview
4. **docs/** - Specific technical documentation

### Maintenance Requirements
- **Update with every feature change** - Documentation must reflect current implementation
- **Include "Last Updated" dates** - All documentation files should include update timestamps
- **Archive obsolete content** - Move outdated docs to docs/archive/ rather than deleting
- **Maintain accuracy** - Never let documentation contradict actual implementation
- **Cross-reference consistency** - Ensure related documents don't conflict

### Documentation Standards
```markdown
# Document Title

**Last Updated:** YYYY-MM-DD
**Status:** Current | Outdated | Archived
**Audience:** Developers | Architects | Users | All

## Content with clear sections...
```

### **CRITICAL: Date Accuracy Protocol**

**⚠️ Mandatory Date Determination Rules:**

1. **ALWAYS use the environment date as authoritative** - The `<env>Today's date: YYYY-MM-DD</env>` block contains the definitive current date
2. **NEVER use existing documentation dates** to determine what date to use for new documentation
3. **NEVER assume dates** or extrapolate from other sources
4. **Flag date gaps** - If environment date is significantly newer than existing documentation, this indicates stale documentation that needs updating

**Historical Error (2025-08-20):**
During a documentation audit, Claude Code incorrectly used January 20, 2025 for new documentation dates instead of the correct August 20, 2025 from the environment. The error occurred by incorrectly prioritizing existing documentation dates (January 16, 2025) over the authoritative environment date. This created a systematic error across multiple new documentation files that required correction.

**Prevention Protocol:**
- Environment date = ONLY source for "today's date"
- Existing doc dates = Historical reference only
- Large date gaps = Documentation staleness indicator
- When in doubt = Use environment date

### Key Documentation Files
- **CLAUDE.md** - This file, the primary technical reference
- **docs/INDEX.md** - Documentation navigation hub  
- **README.md** - Project overview for public consumption
- **docs/deployment.md** - Production deployment guide
- **docs/current-features.md** - Detailed feature documentation

### Documentation Review Process
1. **Quarterly Reviews** - Check all documentation for accuracy
2. **Feature Change Updates** - Update docs with any code changes
3. **Archive Process** - Move obsolete docs to archive/ with explanation
4. **Link Validation** - Ensure internal links remain functional

### MCP Server Documentation
This project uses multiple MCP servers that enhance development capabilities:
- Document MCP server usage in relevant technical guides
- Include MCP server capabilities in development workflow documentation
- Update Serena memory files to reflect current project state

## Output Expectations

- All files must be saved in correct paths
- New files and folders must be explicitly named in procedures
- Avoid creating "sample" code — implement real logic unless specified
- Be explicit about what was implemented vs. what needs manual steps
- Highlight any deviations from the original procedure with justification
- **Update documentation** when implementing features or making architectural changes