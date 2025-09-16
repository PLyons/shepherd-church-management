# Shepherd Church Management System

A React + TypeScript church management system focused on core membership functionality, built with Vite and Firebase.

## ✅ Current Features

### Core Membership Management
- **Enhanced Member Forms (Phase 0.1 ✅)** - Professional contact management with multiple emails, phones, and addresses
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

### Event Management (Phase 2B - ✅ COMPLETE)
- **Event Data Model** ✅ - Complete TypeScript interfaces for events, RSVPs, and attendance
- **Events Service** ✅ - Full CRUD with role-based queries and event lifecycle management  
- **RSVP Service** ✅ - Capacity management, waitlist processing, and comprehensive statistics
- **Event Calendar** ✅ - Full calendar views with monthly/weekly navigation and event interaction
- **Event Forms** ✅ - Comprehensive event creation and editing with React Hook Form validation
- **Event Discovery** ✅ - Enhanced event list with filtering, search, and multiple display modes
- **RSVP System** ✅ - Interactive modal with capacity management and waitlist functionality
- **Data Consistency** ✅ - Events appear consistently across dashboard, calendar, and event list views
- **Event Filtering** ✅ - Cancelled events properly excluded from all views
- **Event Visibility** ✅ - All events visible to congregation members for transparency

## 🚀 Recently Completed Features

**Phase 2C Donation Tracking & Financial Reports (September 2025):**
- ✅ **Donation Recording** - Professional donation entry with member lookup and validation
- ✅ **Payment Processing** - Stripe integration with recurring donations and mobile optimization
- ✅ **Member Donation History** - Individual tracking with PDF tax statements
- ✅ **Financial Reports Dashboard** - Administrative reporting with charts and export capabilities
- ✅ **Donation Categories** - Flexible categorization system with Form 990 compliance

## 🚀 Features Ready for Implementation

Based on PRD specifications, the following features have a solid foundation and can be systematically added:
- **Volunteer Scheduling** - Ministry and service coordination
- **Sermon Archive** - File management and sermon notes
- **Email/SMS Notifications** - Member communication system

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Payment Processing**: Stripe (Elements, Webhooks, Subscriptions)
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

4. **Configure Payment Processing (Optional)**
   - Create a Stripe account at https://stripe.com
   - Get your publishable and secret keys from Stripe Dashboard
   - Add Stripe configuration to your `.env.local`:
     ```bash
     VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
     STRIPE_SECRET_KEY=sk_test_...
     STRIPE_WEBHOOK_SECRET=whsec_...
     ```
   - Configure webhook endpoint at `/api/stripe/webhook` in Stripe Dashboard

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access Application**
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

## 🎯 **CORE SYSTEMS OPERATIONAL** 

Shepherd has successfully implemented core church management functionality with a complete member management system and comprehensive event management with calendar integration. **Phase 2B Event Management System is now 100% complete.**

**✅ Currently Implemented:**
- **Enhanced Member Management (Phase 0.1 Complete)** - Professional contact arrays, collapsible forms, backward compatibility
- **Member Directory** - Full CRUD operations, search, profiles with enhanced contact display
- **Household Management** - Family relationships and household profiles  
- **Event Management System (Phase 2B ✅ COMPLETE)** - Full event lifecycle with calendar views, RSVP system, data consistency, and filtering
- **Donation Tracking & Financial Reports (Phase 2C 80% COMPLETE)** - Professional donation recording, Stripe payment processing, member history, financial reports dashboard
- **Authentication & Security** - Firebase Auth with magic links and QR registration
- **Role-Based Access Control** - Admin, Pastor, Member permission levels
- **Dashboard Views** - Role-specific dashboards with member and event statistics
- **Database Integration** - Firebase Firestore with real-time updates and field mapping

**🚀 Ready for Implementation (per PRD):**
- Automated donation statements and tax receipts (Phase 2C completion)
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

