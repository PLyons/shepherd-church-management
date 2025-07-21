# Claude.md

## Purpose

This file defines the universal standards, constraints, and operational context for all AI-based coding agents (Claude Code, Cursor, etc.) used in the development of the ChurchOps Suite project.

The goal is to ensure consistency, reliability, and efficient task execution across recursively decomposed markdown task files that follow the PRP format.

---

## Global Development Standards

### Languages & Frameworks
- **Frontend**: React + TypeScript (Vite)
- **Backend/API**: Firebase (Firestore, Auth, Storage, Functions)
- **Styling**: TailwindCSS (preferred)
- **Hosting**: Vercel (Frontend), Firebase (Backend)

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
- Firebase Security Rules must be enforced for all user data access
- All database changes must be done via Firebase service layer and Firestore

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
- <Firebase, Auth, or other service needed>

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
1. Create a new Firestore collection schema for `members`
2. Define `members` document structure with the following fields: ...
3. Apply household reference relationship via `householdId`
4. Add validation rules for gender in Firebase Security Rules
```

---

## Documentation Practices

- Use self-documenting variable and component names
- Always document reusable functions and components with JSDoc
- Include a README.md in every major feature folder
- Use Firebase service layer for data operations (avoid direct Firestore calls in components)

---

## How Claude and Cursor Should Operate

1. Load `Claude.md` and referenced task file
2. Establish execution context from PRP sections
3. Write scoped, deterministic code
4. Test assumptions in isolation before chaining across files
5. Comment non-obvious logic or decisions

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
- **Reference existing code** when implementing related features (e.g., "Using the Firebase services already configured...")
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
- **Apply Firebase Security Rules** consistently across all collections

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
- **Database Schema**: `churchops` schema in local PostgreSQL
- **Development Server**: http://localhost:5173 (run `npm run dev`)
- **Firebase Console**: https://console.firebase.google.com (Firebase project management)
- **Firestore Console**: Firebase Console → Firestore Database

### Key Files to Reference
- **`/docs/project_tracker.md`** - Current progress, completed tasks, and next steps
- **`/docs/prd.md`** - Full project requirements and specifications
- **`/src/lib/firebase.ts`** - Firebase client configuration
- **`/src/services/firebase/`** - Firebase service layer
- **`/src/scripts/seed-firebase-data.ts`** - Database seed script with test data
- **`/firestore.rules`** - Firebase Security Rules
- **`.env.local`** - Environment variables (local development)
- **`.env.local.development`** - Local development template
- **`.env.local`** - Firebase configuration with API keys
- **`/LOCAL_DEVELOPMENT.md`** - Complete local development guide
- **`/docker-compose.yml`** - Docker stack configuration

### Session Startup Protocol
1. **Always read** `docs/Claude.md` first to establish context
2. **Check** `docs/project_tracker.md` for current progress and next tasks
3. **Verify** which phase we're in and any dependencies
4. **Start local development** with `npm run dev` (Firebase runs in cloud)
5. **Confirm** database seeding and authentication working
6. **Review** any session notes from previous work

### Development Commands Available
- **`npm run dev`** - Start React development server
- **`npm run seed:firebase`** - Seed Firebase with test data
- **Firebase Console** - Manage database through web interface
- **Firestore Rules** - Deploy security rules with Firebase CLI
- **`/end-session`** - Automated session cleanup and project state saving

### Important Project Details
- **Development Environment**: Cloud-based Firebase with local React development
- **Database**: Cloud Firestore (NoSQL document database)
- **Database Access**: Firebase Console and service layer methods
- **Schema Management**: TypeScript interfaces and Firebase Security Rules
- **Seed Data**: Automated population with 14 members across 6 households
- **Authentication**: Local auth with test user admin@test.com / password123
- **File Structure**: 169 files created, components organized by feature
- **Git Repos**: Single consolidated repository structure
- **Phase Status**: Phase 1, 2, 3, 4 & 5 complete (Environment Setup, Database Schema, Authentication & Security, Core UI Implementation, Member Profiles + Local Development), Phase 6 ready (Event Management)