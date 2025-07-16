# Claude.md

## Purpose

This file defines the universal standards, constraints, and operational context for all AI-based coding agents (Claude Code, Cursor, etc.) used in the development of the ChurchOps Suite project.

The goal is to ensure consistency, reliability, and efficient task execution across recursively decomposed markdown task files that follow the PRP format.

---

## Global Development Standards

### Languages & Frameworks
- **Frontend**: React + TypeScript (Vite)
- **Backend/API**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Styling**: TailwindCSS (preferred)
- **Hosting**: Vercel (Frontend), Supabase (Backend)

### Code Standards
- Follow **Prettier** formatting defaults
- Use **ESLint** with recommended TypeScript and React rules
- Prefer **functional components** and **React hooks**
- Use **async/await** over `.then()` syntax
- Avoid magic strings/numbers — define constants where applicable
- Prefer composition over inheritance

---

## Project-Wide Constraints

- No use of paid services during development (must run on free-tier limits)
- Environment secrets must be passed via `.env` files and never hardcoded
- No global state libraries (e.g., Redux) unless scoped locally
- Supabase Row Level Security (RLS) must be enforced for all user data access
- All database changes must be done via Supabase SQL migration scripts

---

## Task File Standard (PRP)

Each task file will follow the **PRP structure**: Purpose, Requirements, Procedure

### Structure:
```md
# <task-name>

## Purpose
<What this task is solving or creating. Plain English, simple.>

## Requirements
- <List of technical or contextual requirements>
- <File or schema dependencies>
- <Supabase, Auth, or other service needed>

## Procedure
<Exact step-by-step instructions that the AI agent should follow. Include file paths, table names, and relevant logic.>
```

### Example:
```md
# create_member_schema

## Purpose
Define the Postgres table for storing individual member information.

## Requirements
- Table name: members
- Should link to `households` table via foreign key
- Enforce gender as Male/Female only
- Include audit columns (created_at, updated_at)

## Procedure
1. Create a new SQL migration in Supabase called `create_members_table.sql`
2. Define `members` table with the following columns: ...
3. Apply foreign key constraint to `household_id`
4. Add `CHECK` constraint for gender
```

---

## Documentation Practices

- Use self-documenting variable and component names
- Always document reusable functions and components with JSDoc
- Include a README.md in every major feature folder
- Prefer inline SQL over ORMs (use Supabase RPC where complex)

---

## How Claude and Cursor Should Operate

1. Load `Claude.md` and referenced task file
2. Establish execution context from PRP sections
3. Write scoped, deterministic code
4. Test assumptions in isolation before chaining across files
5. Comment non-obvious logic or decisions

---

## Output Expectations

- All files must be saved in correct paths
- New files and folders must be explicitly named in `Procedure`
- Avoid creating "sample" code — implement real logic unless specified

---

## Coordination

If you are unsure of assumptions or hit ambiguous scope:
- Prompt the human architect with exact question
- Halt implementation until confirmed

---

## Execution Tips

### Session Management
- **Start each session** by reading this Claude.md file to establish context
- **Load project_tracker.md** to understand the overall task order and dependencies
- **Track completed tasks** within the session to avoid duplication

### Task Execution Order
- **Follow the order** specified in project_tracker.md strictly
- **Verify dependencies** before executing any task (e.g., ensure households table exists before creating members table)
- **Complete each phase** before moving to the next to maintain architectural integrity

### Implementation Guidelines
- **Use exact names** for tables, columns, and routes as specified in task files
- **Reference existing code** when implementing related features (e.g., "Using the Supabase client already configured...")
- **Maintain consistency** with previously implemented patterns and components

### Testing Protocol
- **Test incrementally** after creating each schema with a test insert
- **Verify RLS policies** work correctly before implementing UI components
- **Test each UI component** with different user roles (admin, pastor, member)
- **Confirm integrations** work (e.g., auth triggers, foreign key constraints)

### Context Maintenance
- **Reference Claude.md standards** in every implementation ("Follow the standards in Claude.md")
- **Acknowledge dependencies** explicitly ("Given the existing members and households tables...")
- **Build on previous work** ("Using the authentication system already in place...")

### Error Handling
- **Flag potential issues** proactively during implementation
- **Request clarification** immediately when requirements are ambiguous
- **Document workarounds** if standard approaches don't work
- **Never skip error handling** in production code

### Quality Assurance
- **Follow TypeScript** best practices with proper typing
- **Implement loading states** and error boundaries in React components
- **Ensure mobile responsiveness** using TailwindCSS utilities
- **Apply Supabase RLS** policies consistently across all tables

### Communication Protocol
- **Be explicit** about what was implemented vs. what needs manual steps
- **Highlight any deviations** from the original procedure with justification
- **Suggest improvements** when the specified approach could be optimized
- **Confirm completion** of each task with a summary of what was done

---

## Project Status Reference

### Current Project Context
- **Project Name**: Shepherd Church Management System
- **Frontend Location**: Root directory (consolidated structure)
- **Database Schema**: `churchops` schema in Supabase
- **Development Server**: http://localhost:5173 (run `npm run dev`)

### Key Files to Reference
- **`/docs/project_tracker.md`** - Current progress, completed tasks, and next steps
- **`/docs/prd.md`** - Full project requirements and specifications
- **`/lib/constants.ts`** - Project constants, types, and enums
- **`/lib/supabase.ts`** - Supabase client configuration
- **`/supabase/config.toml`** - Local Supabase configuration
- **`.env.local`** - Environment variables (Supabase credentials)

### Session Startup Protocol
1. **Always read** `docs/Claude.md` first to establish context
2. **Check** `docs/project_tracker.md` for current progress and next tasks
3. **Verify** which phase we're in and any dependencies
4. **Review** any session notes from previous work
5. **Confirm** development environment is ready before starting

### Custom Commands Available
- **`/end-session`** - Automated session cleanup and project state saving

### Important Project Details
- **Supabase Project**: Connected and verified working (using hosted instance at app.supabase.com)
- **Database Access**: Direct access via Supabase Dashboard at https://app.supabase.com/project/aroglkyqegrxbphbfwgj
- **Schema Management**: Use Supabase Dashboard SQL Editor or migrations applied directly to hosted instance
- **Authentication**: Email/Password and Magic Link enabled
- **File Structure**: 169 files created, components organized by feature
- **Git Repos**: Both parent and frontend have separate repositories
- **Phase Status**: Phase 1, 2 & 3 complete (Environment Setup, Database Schema, Authentication & Security), Phase 4 ready (Core UI Implementation)