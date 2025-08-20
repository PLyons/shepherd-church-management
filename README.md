# Shepherd Church Management System

A React + TypeScript church management system focused on core membership functionality, built with Vite and Firebase.

## ✅ Current Features

### Core Membership Management
- **Member Directory** - Complete CRUD operations with search and filtering
- **Member Profiles** - Individual profiles with personal and church information
- **Household Management** - Family relationship tracking and household profiles
- **Address Management** - Complete household address tracking

### Authentication & Security
- **Multi-Method Authentication**:
  - Email/password login
  - Magic link passwordless authentication
  - QR-based member self-registration
- **Role-Based Access Control** - Admin, Pastor, and Member permission levels
- **Firebase Security Rules** - Database-level security enforcement

### Advanced Features
- **QR Registration System** - Self-service member onboarding
- **Registration Token Management** - Secure registration flow control
- **Analytics Dashboard** - Member engagement and growth analytics
- **Real-time Updates** - Live data synchronization via Firestore
- **Role Management** - Admin interface for user role assignment
- **Multi-Dashboard Views** - Role-specific dashboards with tailored information

### User Interface
- **Responsive Design** - Mobile-first, works on all devices
- **Dark/Light Theme Support** - User preference theming
- **Toast Notifications** - User feedback and error handling
- **Loading States** - Professional loading indicators
- **Search & Filtering** - Advanced member search capabilities

### Developer Experience
- **Service Layer Architecture** - Clean separation between UI and Firebase
- **TypeScript Integration** - Full type safety throughout
- **Database Seeding** - Comprehensive test data generation
- **Multiple Admin Setup Scripts** - Flexible admin user creation
- **MCP Server Integration** - Enhanced development with AI coding tools

## 🚀 Features Ready for Implementation

Based on PRD specifications, the following features have a solid foundation and can be systematically added:

- **Event Management** - Calendar, RSVP system, attendance tracking
- **Donation Tracking** - Financial management and reporting
- **Volunteer Scheduling** - Ministry and service coordination
- **Sermon Archive** - File management and sermon notes
- **Email/SMS Notifications** - Member communication system
- **Financial Reporting** - Donation reports and exports

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase account (free tier)
- Git

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

3. **Configure Firebase**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password and Email Link)
   - Enable Firestore Database
   - Enable Storage
   - Copy `.env.example` to `.env.local` and add your Firebase config (optional - defaults are provided)

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access Application**
   - **App**: http://localhost:5173
   - **Firebase Console**: https://console.firebase.google.com
   - **Default Admin**: Set up using `npm run setup-admin`

### Database Setup

#### Firebase Setup
1. **Initialize Firestore**
   - Firebase automatically creates collections on first use
   - Security rules are defined in `firestore.rules`

2. **Seed Data**
   ```bash
   # Seed data into Firebase
   npm run seed
   ```

3. **Create Admin User**
   ```bash
   # Set up initial admin user
   npm run setup-admin
   ```

### Current Status

## 🎯 **CORE FOUNDATION COMPLETE**

Shepherd has been refactored to focus on core membership management functionality, creating a solid foundation for methodical feature reimplementation.

**✅ Currently Implemented:**
- **Member Management** - Full CRUD operations, search, profiles
- **Household Management** - Family relationships and household profiles  
- **Authentication & Security** - Firebase Auth with magic links and QR registration
- **Role-Based Access Control** - Admin, Pastor, Member permission levels
- **Dashboard Views** - Role-specific dashboards with member statistics
- **Database Integration** - Firebase Firestore with real-time updates

**🚀 Ready for Reimplementation (per PRD):**
- Event management and RSVP system
- Donation tracking and financial reporting
- Sermon archive with file management
- Volunteer scheduling system

**Architecture Benefits:**
- **Clean Foundation** - Streamlined codebase focused on core functionality
- **Firebase-Native** - Full Firebase integration with security rules
- **Scalable Pattern** - Service layer ready for systematic feature addition
- **Type-Safe** - Comprehensive TypeScript coverage


## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run preview` - Preview production build
- `npm run seed` - Seed Firebase with sample data
- `npm run setup-admin` - Create initial admin user
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

- `src/components/` - React components organized by feature
  - `members/` - Member management components
  - `households/` - Household management components
  - `auth/` - Authentication and role guards
  - `admin/` - Administrative components (role management)
  - `dashboard/` - Role-based dashboard views
  - `common/` - Shared UI components
- `src/pages/` - Page-level routing components
- `src/services/firebase/` - Firebase service implementations
  - `members.service.ts` - Member CRUD operations
  - `households.service.ts` - Household management
  - `roles.service.ts` - Role assignment
  - `dashboard.service.ts` - Dashboard data
- `src/types/index.ts` - Core type definitions (Member, Household)
- `src/hooks/` - Custom React hooks
- `src/contexts/` - React contexts (Auth, Theme, Toast)
- `src/lib/firebase.ts` - Firebase configuration
- `firestore.rules` - Firebase Security Rules

