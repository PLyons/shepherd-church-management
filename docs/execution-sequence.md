# Shepherd - Claude Code Execution Sequence

## Project Setup Instructions

Execute each task in the order listed below. Copy and paste each command to Claude Code exactly as shown.

---

## Phase 1: Initial Project Setup

### 1. Create Project Structure
```
Execute create_shepherd_file_structure.md to set up the complete project structure for Shepherd
```

### 2. Initialize Frontend Repository
```
Navigate to the shepherd-frontend directory and execute setup_frontend_repo.md to initialize the Vite + React + TypeScript project with TailwindCSS
```

### 3. Initialize Supabase Project
```
Execute init_supabase_project.md to create the Supabase backend. Note the project URL and anon key for the next step.
```

### 4. Configure Environment Variables
```
Create .env.local file with the Supabase credentials from the previous step following the .env.example template
```

---

## Phase 2: Database Schema Creation

### 5. Create Database Schema
```
Execute 001_create_schema.sql to create the churchops schema in Supabase
```

### 6. Create Households Table
```
Execute create_household_schema.md to create the households table following the exact specifications
```

### 7. Create Members Table
```
Execute create_member_schema.md to create the members table with foreign key to households
```

### 8. Create Member Events Table
```
Execute create_member_events_schema.md to create the table for tracking life events
```

### 9. Create Donation Tables
```
Execute create_donation_categories_schema.md to create the donation categories table
```

```
Execute create_donations_schema.md to create the donations tracking table
```

### 10. Create Events Tables
```
Execute create_events_schema.md to create the church events table
```

```
Execute create_event_attendance_schema.md to create the attendance tracking table
```

### 11. Create Sermon Table
```
Execute create_sermons_schema.md to create the sermons archive table
```

### 12. Create Volunteer Tables
```
Execute create_volunteer_roles_schema.md to create and seed volunteer roles
```

```
Execute create_volunteer_slots_schema.md to create the volunteer assignment table
```

---

## Phase 3: Authentication & Security Setup

### 13. Enable Supabase Authentication
```
Execute enable_supabase_auth.md to configure email and magic link authentication in Supabase
```

### 14. Create Auth Triggers
```
Execute create_auth_triggers_and_roles.md to link auth.users to members table and manage roles
```

### 15. Configure Row Level Security
```
Execute configure_rls_for_members.md to set up RLS policies for the members table
```

### 16. Setup Base Components
```
Create the authentication context and provider components in src/contexts/AuthContext.tsx following the patterns in Claude.md
```

### 17. Create Auth Guard Components
```
Create AuthGuard.tsx and RoleGuard.tsx components in src/components/auth/ for protecting routes
```

---

## Phase 4: Core UI Implementation - Members

### 18. Setup Routing
```
Create the React Router setup in src/router/index.tsx with all defined routes from the file structure
```

### 19. Create Layout Components
```
Create Layout.tsx, Navigation.tsx, and MobileMenu.tsx in src/components/common/ following the responsive design patterns
```

### 20. Implement Member Directory
```
Execute create_member_directory_ui.md to create the member listing page with search and filtering
```

### 21. Create Member Profile Page
```
Execute create_member_profile_page.md to implement detailed member views with edit capabilities
```

### 22. Create Household Profile
```
Execute create_household_profile_page.md to show household groupings and relationships
```

---

## Phase 5: Events Management

### 23. Create Event Calendar
```
Execute create_event_calendar_page.md using react-calendar library for the calendar view
```

### 24. Create Event Details
```
Execute create_event_detail_page.md with RSVP functionality for members
```

### 25. Create Event Admin Form
```
Execute create_event_form_admin.md for admins to create and manage events
```

---

## Phase 6: Donations System

### 26. Create Donation Entry Form
```
Execute create_donation_entry_form_admin.md for recording donations with member lookup
```

### 27. Create Donation History
```
Execute create_donation_history_view.md with filtering and role-based visibility
```

### 28. Create 990 Report Generator
```
Execute generate_990_style_report.md for tax-compliant financial reporting
```

---

## Phase 7: Sermons Module

### 29. Create Sermon Upload
```
Execute create_sermon_upload_form.md with Supabase Storage integration for media files
```

### 30. Create Sermon Archive
```
Execute create_sermon_archive_view.md for public access to sermon library
```

---

## Phase 8: Volunteer Management

### 31. Create Volunteer Admin Schedule
```
Execute create_volunteer_schedule_admin.md for assigning volunteers to event roles
```

### 32. Create Volunteer Signup
```
Execute create_volunteer_signup_ui.md for members to claim open volunteer slots
```

### 33. Create Personal Volunteer View
```
Execute create_my_volunteer_schedule_view.md showing individual volunteer commitments
```

---

## Phase 9: Advanced Features

### 34. Implement QR Registration
```
Execute implement_qr_registration.md to create the QR-based member onboarding flow
```

### 35. Implement Magic Link Login
```
Execute implement_magic_link_login.md for passwordless authentication
```

---

## Phase 10: Final Integration & Testing

### 36. Create Dashboard
```
Create the main Dashboard.tsx page with stats cards, recent activity, and quick actions using components from src/components/dashboard/
```

### 37. Implement Toast Notifications
```
Create ToastContext.tsx and Toast.tsx component for user feedback throughout the application
```

### 38. Add Loading States
```
Implement LoadingSpinner.tsx and add loading states to all async operations
```

### 39. Create Error Boundaries
```
Implement ErrorBoundary.tsx to gracefully handle runtime errors
```

### 40. Run Integration Tests
```
Test the complete flow: Login → Member Creation → Event Creation → RSVP → Donation Entry → Report Generation
```

---

## Important Notes for Claude Code:

1. **Always start each session** by reading Claude.md for context
2. **Check dependencies** before each task (e.g., households table must exist before members)
3. **Test incrementally** - verify each component works before moving to the next
4. **Use exact names** specified in the task files for tables, columns, and routes
5. **Implement proper error handling** in all components
6. **Ensure mobile responsiveness** using TailwindCSS utilities
7. **Apply TypeScript types** consistently throughout

## Deployment Preparation:

After completing all tasks:
1. Run `npm run build` to verify production build
2. Deploy frontend to Vercel
3. Configure production environment variables
4. Test all features in production environment
5. Generate and distribute QR codes for member onboarding