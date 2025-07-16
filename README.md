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

1. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

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