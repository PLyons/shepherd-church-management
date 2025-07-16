# create_shepherd_file_structure

## Purpose
Create the complete file structure for the Shepherd project, organizing all frontend code, configuration files, and documentation in a logical hierarchy that supports efficient development with Cursor IDE and Claude Code.

## Requirements
- Must follow React + TypeScript + Vite conventions
- Must organize components by feature/domain
- Must include all necessary configuration files
- Must support Supabase integration structure
- Must follow the standards defined in Claude.md

## Procedure

1. Create the following directory structure in the `shepherd-frontend` repository:

```
shepherd-frontend/
├── .env.example
├── .env.local
├── .eslintrc.cjs
├── .gitignore
├── .prettierrc
├── README.md
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
│
├── public/
│   ├── favicon.ico
│   └── shepherd-logo.svg
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── member.types.ts
│   │   ├── household.types.ts
│   │   ├── event.types.ts
│   │   ├── donation.types.ts
│   │   ├── volunteer.types.ts
│   │   ├── sermon.types.ts
│   │   └── supabase.types.ts
│   │
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSupabase.ts
│   │   ├── useToast.ts
│   │   └── useMediaQuery.ts
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Layout.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── MobileMenu.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   └── Table.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── MagicLinkForm.tsx
│   │   │   ├── QRRegistration.tsx
│   │   │   ├── AuthGuard.tsx
│   │   │   └── RoleGuard.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   └── AttendanceChart.tsx
│   │   │
│   │   ├── members/
│   │   │   ├── MemberList.tsx
│   │   │   ├── MemberCard.tsx
│   │   │   ├── MemberForm.tsx
│   │   │   ├── MemberProfile.tsx
│   │   │   ├── MemberSearch.tsx
│   │   │   └── MemberEvents.tsx
│   │   │
│   │   ├── households/
│   │   │   ├── HouseholdList.tsx
│   │   │   ├── HouseholdForm.tsx
│   │   │   ├── HouseholdProfile.tsx
│   │   │   └── HouseholdMembers.tsx
│   │   │
│   │   ├── events/
│   │   │   ├── EventCalendar.tsx
│   │   │   ├── EventList.tsx
│   │   │   ├── EventCard.tsx
│   │   │   ├── EventForm.tsx
│   │   │   ├── EventDetail.tsx
│   │   │   ├── EventRSVP.tsx
│   │   │   └── AttendanceTracker.tsx
│   │   │
│   │   ├── donations/
│   │   │   ├── DonationForm.tsx
│   │   │   ├── DonationList.tsx
│   │   │   ├── DonationHistory.tsx
│   │   │   ├── DonationReport.tsx
│   │   │   ├── CategoryManager.tsx
│   │   │   └── Form990Export.tsx
│   │   │
│   │   ├── volunteers/
│   │   │   ├── VolunteerSchedule.tsx
│   │   │   ├── VolunteerSignup.tsx
│   │   │   ├── RoleManager.tsx
│   │   │   ├── SlotAssignment.tsx
│   │   │   └── MySchedule.tsx
│   │   │
│   │   └── sermons/
│   │       ├── SermonList.tsx
│   │       ├── SermonUpload.tsx
│   │       ├── SermonPlayer.tsx
│   │       ├── SermonArchive.tsx
│   │       └── SermonNotes.tsx
│   │
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Members.tsx
│   │   ├── Households.tsx
│   │   ├── Events.tsx
│   │   ├── Donations.tsx
│   │   ├── Volunteers.tsx
│   │   ├── Sermons.tsx
│   │   ├── Reports.tsx
│   │   ├── Settings.tsx
│   │   └── NotFound.tsx
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── ToastContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── member.service.ts
│   │   ├── household.service.ts
│   │   ├── event.service.ts
│   │   ├── donation.service.ts
│   │   ├── volunteer.service.ts
│   │   ├── sermon.service.ts
│   │   └── report.service.ts
│   │
│   └── router/
│       ├── index.tsx
│       ├── routes.ts
│       └── PrivateRoute.tsx
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_schema.sql
│   │   ├── 002_create_households_table.sql
│   │   ├── 003_create_members_table.sql
│   │   ├── 004_create_member_events_table.sql
│   │   ├── 005_create_donation_categories_table.sql
│   │   ├── 006_create_donations_table.sql
│   │   ├── 007_create_events_table.sql
│   │   ├── 008_create_event_attendance_table.sql
│   │   ├── 009_create_sermons_table.sql
│   │   ├── 010_create_volunteer_roles_table.sql
│   │   ├── 011_create_volunteer_slots_table.sql
│   │   ├── 012_create_registration_tokens_table.sql
│   │   ├── 013_create_auth_triggers.sql
│   │   ├── 014_enable_rls_policies.sql
│   │   └── 015_seed_initial_data.sql
│   │
│   ├── functions/
│   │   ├── handle_new_user.sql
│   │   ├── get_member_role.sql
│   │   └── generate_990_report.sql
│   │
│   └── seed.sql
│
├── docs/
│   ├── Claude.md
│   ├── prd.md
│   ├── project_tracker.md
│   ├── deployment.md
│   └── api-reference.md
│
└── tasks/
    ├── 01_env_setup/
    │   ├── init_supabase_project.md
    │   └── setup_frontend_repo.md
    │
    ├── 02_schema/
    │   ├── create_household_schema.md
    │   ├── create_member_schema.md
    │   ├── create_member_events_schema.md
    │   ├── create_donation_categories_schema.md
    │   ├── create_donations_schema.md
    │   ├── create_events_schema.md
    │   ├── create_event_attendance_schema.md
    │   ├── create_sermons_schema.md
    │   ├── create_volunteer_roles_schema.md
    │   └── create_volunteer_slots_schema.md
    │
    ├── 03_auth/
    │   ├── enable_supabase_auth.md
    │   ├── create_auth_triggers_and_roles.md
    │   ├── configure_rls_for_members.md
    │   ├── implement_qr_registration.md
    │   └── implement_magic_link_login.md
    │
    ├── 04_member_mgmt/
    │   ├── create_member_directory_ui.md
    │   ├── create_member_profile_page.md
    │   └── create_household_profile_page.md
    │
    ├── 05_event_ui/
    │   ├── create_event_calendar_page.md
    │   ├── create_event_detail_page.md
    │   └── create_event_form_admin.md
    │
    ├── 06_donations_ui/
    │   ├── create_donation_entry_form_admin.md
    │   ├── create_donation_history_view.md
    │   └── generate_990_style_report.md
    │
    ├── 07_sermons_ui/
    │   ├── create_sermon_upload_form.md
    │   └── create_sermon_archive_view.md
    │
    └── 08_volunteers/
        ├── create_volunteer_schedule_admin.md
        ├── create_volunteer_signup_ui.md
        └── create_my_volunteer_schedule_view.md
```

2. Create initial configuration files:

### .env.example
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### .gitignore
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment files
.env
.env.local
.env.*.local

# Build outputs
dist/
dist-ssr/
*.local

# Editor directories
.vscode/
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Testing
coverage/
.nyc_output

# Misc
*.pem
```

### package.json
```json
{
  "name": "shepherd-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\""
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "lucide-react": "^0.294.0",
    "date-fns": "^3.0.0",
    "react-calendar": "^4.7.0",
    "react-hook-form": "^7.48.0",
    "papaparse": "^5.4.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "prettier": "^3.1.1",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

3. Verify all directories are created with proper nesting
4. Ensure all task files from the original project are properly organized in the tasks/ directory
5. Create placeholder README.md files in each major directory explaining its purpose