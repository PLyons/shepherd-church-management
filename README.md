# Shepherd Church Management System

A comprehensive React + TypeScript church management system built with Vite and Supabase.

## Features

- Member and household management
- Event planning and attendance tracking
- Donation management and reporting
- Volunteer scheduling
- Sermon archive

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (free tier)

### Quick Start

#### Option A: Local Development (Recommended)

1. **Clone Repository**
   ```bash
   git clone https://github.com/PLyons/shepherd-church-management.git
   cd shepherd-church-management
   ```

2. **Install Dependencies**
   ```bash
   npm install
   npm install -g @supabase/cli
   ```

3. **Start Local Development**
   ```bash
   # Copy local development environment
   cp .env.local.development .env.local
   
   # Start Supabase local stack
   supabase start
   
   # Start React development server
   npm run dev
   ```

4. **Access Services**
   - **App**: http://localhost:5173
   - **Database**: http://localhost:54323 (Supabase Studio)
   - **Login**: admin@test.com / password123

#### Option B: Hosted Development

1. **Configure Environment**
   - Copy `.env.local.hosted-backup` to `.env.local`
   - Uses hosted Supabase instance

2. **Start Development Server**
   ```bash
   npm run dev
   ```

### Database Setup

#### Local Development
- **Automatic**: Database schema and seed data applied automatically with `supabase start`
- **Reset**: Use `supabase db reset` for fresh database with test data
- **Studio**: Access database at http://localhost:54323

#### Hosted Development
- Schema deployed to hosted Supabase instance
- Access via https://app.supabase.com/project/aroglkyqegrxbphbfwgj
- Manual seed data required

### Current Status

**✅ Phase 1 Complete:** Environment Setup
- React + TypeScript + Vite configured
- Component structure scaffolded
- Supabase connection established

**✅ Phase 2 Complete:** Database Schema  
- 10 core tables created with relationships
- Households, members, events, donations, volunteers
- All tables accessible via Supabase Dashboard

**✅ Phase 3 Complete:** Authentication & Security
- Email and Magic Link authentication enabled
- Row Level Security (RLS) policies configured
- AuthContext and route protection implemented
- Role-based access control (admin, pastor, member)

**✅ Phase 4 Complete:** Core UI Implementation
- Responsive navigation with role-based menu items
- Login/logout functionality tested and working
- React Router with authentication protection
- Mobile-friendly layout and navigation

**✅ Phase 5 Complete:** Member Profiles + Local Development
- Member directory with search and pagination implemented
- Individual member profile pages with editing capabilities
- Household profile system with member relationships
- Member creation form with role-based access control
- **Docker-based local development environment setup**
- **Automated database seeding with 14 test members**
- **Local vs hosted development workflow established**
- All member management features tested and functional

**✅ Phase 6 Complete:** Event Management
- Event calendar and detail pages implemented
- RSVP functionality with authentication integration
- Admin event creation and management forms
- Public and private event visibility controls

**✅ Phase 7 Complete:** Donations System
- **Donation entry form with member search and autocomplete**
- **Advanced donation filtering by date, category, member, amount, and method**
- **990-style tax-compliant annual financial reporting**
- **CSV export functionality for donation history**
- **Role-based access control for donor visibility**
- **Anonymous donation support**
- **Real-time statistics and reporting dashboards**

**✅ Phase 8 Complete:** Sermons Module
- **Sermon upload form with Supabase Storage integration**
- **Support for audio and video files up to 50MB**
- **Public sermon library with search and filtering**
- **Collapsible sermon notes and scripture references**
- **Download and streaming capabilities**
- **Speaker-based filtering and statistics**
- **Role-based upload permissions (admin/pastor only)**

**✅ Phase 9 Complete:** Volunteer Management
- **Admin volunteer slot creation for events and roles**
- **Member volunteer sign-up and cancellation system**
- **Real-time volunteer assignment tracking**
- **Event-based filtering and volunteer role management**
- **Status tracking (Open, Filled, Cancelled)**
- **Comprehensive volunteer statistics dashboard**
- **Role-based permissions for slot management**

**✅ Phase 10 Complete:** Advanced Features & Final Integration
- **QR-based member onboarding flow with token validation**
- **Passwordless magic link authentication system**
- **Personal volunteer commitment schedule view**
- **Comprehensive dashboard with real-time statistics**
- **Quick action buttons for common administrative tasks**
- **Complete integration testing and system polish**

## 🎉 **PROJECT COMPLETE!**

The Shepherd Church Management System is now fully implemented with all core features and advanced functionality. The system provides a complete digital solution for modern church operations including member management, event coordination, financial tracking, sermon archiving, and volunteer coordination.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run preview` - Preview production build

## Project Structure

- `src/components/` - Reusable UI components organized by feature
- `src/pages/` - Top-level page components
- `src/services/` - API service functions
- `src/types/` - TypeScript type definitions
- `src/hooks/` - Custom React hooks
- `src/contexts/` - React contexts for global state
- `supabase/` - Database migrations and functions
- `docs/` - Project documentation and guides
- `tasks/` - Implementation task files organized by phase