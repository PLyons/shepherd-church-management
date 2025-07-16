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

1. **Clone Repository**
   ```bash
   git clone https://github.com/PLyons/shepherd-church-management.git
   cd shepherd-church-management
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   - Copy `.env.example` to `.env.local`
   - Add your Supabase project URL and anon key
   - Current project uses hosted Supabase instance (see `.env.local`)

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Database Setup

The database schema is already deployed to the hosted Supabase instance. If setting up a new project:

1. Create Supabase project at https://app.supabase.com
2. Run the migration files in `/supabase/migrations/` in order
3. Update `.env.local` with your project credentials

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

**🔄 Phase 4 Ready:** Core UI Implementation
- Next: Setup routing and layout components

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