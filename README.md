# Shepherd Frontend

A React + TypeScript church management system built with Vite and Supabase.

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
- Supabase CLI (optional, for local development)

### Initial Setup

1. **Create Supabase Project**
   - Follow the guide in `docs/supabase-setup-guide.md`
   - Create a project named "ChurchOps Dev"
   - Enable Email/Password and Magic Link authentication

2. **Configure Environment**
   - Copy `.env.example` to `.env.local`
   - Add your Supabase project URL and anon key from the Supabase dashboard

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Local Development with Supabase CLI

1. Start local Supabase:
   ```bash
   supabase start
   ```

2. Update `.env.local` to use local URLs (see comments in file)

3. Access Supabase Studio at http://localhost:54323

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