# Shepherd Church Management System

A comprehensive React + TypeScript church management system built with Vite and Firebase.

## Features

- Member and household management
- Event planning and attendance tracking
- Donation management and reporting
- Volunteer scheduling
- Sermon archive

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library + MSW

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
   # Seed test data into Firebase
   npm run seed:firebase
   ```

3. **Create Admin User**
   ```bash
   # Set up initial admin user
   npm run setup-admin
   ```

### Current Status

**✅ Phase 1 Complete:** Environment Setup
- React + TypeScript + Vite configured
- Component structure scaffolded
- Firebase connection established

**✅ Phase 2 Complete:** Database Schema  
- 10 core collections created with relationships
- Households, members, events, donations, volunteers
- All collections accessible via Firebase Console

**✅ Phase 3 Complete:** Authentication & Security
- Email/Password and Email Link authentication enabled
- Firebase Security Rules configured
- AuthContext and route protection implemented
- Role-based access control (admin, pastor, member)

**✅ Phase 4 Complete:** Core UI Implementation
- Responsive navigation with role-based menu items
- Login/logout functionality tested and working
- React Router with authentication protection
- Mobile-friendly layout and navigation

**✅ Phase 5 Complete:** Member Profiles
- Member directory with search and pagination implemented
- Individual member profile pages with editing capabilities
- Household profile system with member relationships
- Member creation form with role-based access control
- **Firebase integration with real-time updates**
- **Automated database seeding with test members**
- All member management features tested and functional

**✅ Phase 6 Complete:** Event Management
- Event calendar and detail pages implemented
- RSVP functionality with authentication integration
- Admin event creation and management forms
- Public and private event visibility controls

**✅ Phase 7 Complete:** Donations System
- **Donation entry form with member search and autocomplete**
- **Advanced donation filtering by date, category, member, amount, and method**
- **Tax-compliant annual financial reporting**
- **CSV export functionality for donation history**
- **Role-based access control for donor visibility**
- **Anonymous donation support**
- **Real-time statistics and reporting dashboards**

**✅ Phase 8 Complete:** Sermons Module
- **Sermon upload form with Firebase Storage integration**
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

### 🔄 **Firebase Migration Complete**

The project has been successfully migrated from Supabase to Firebase, providing:
- **Real-time data synchronization** across all clients
- **Offline support** with Firebase's built-in caching
- **Scalable NoSQL database** with Firestore
- **Integrated authentication** with multiple sign-in methods
- **Secure file storage** for sermons and documents

### ✅ **BETA TESTING FRAMEWORK READY**

**Comprehensive Beta Testing Roadmap Delivered:**
- **Complete Testing Documentation** - Methodology, onboarding, and systematic approach
- **Module-Specific Test Plans** - Detailed scenarios for Authentication, Members, Events, and more
- **GitHub Issues Integration** - Templates, workflows, and centralized tracking system
- **Systematic Issue Logging** - Structured documentation and quality assurance framework

**Beta Testing Features:**
- **Role-Based Testing** - Admin, Pastor, Member perspectives with tailored scenarios
- **Cross-Platform Coverage** - Desktop, tablet, mobile validation across browsers
- **Performance & Security Testing** - Load times, RLS policies, data protection verification
- **Integration Testing** - Module interaction and data flow validation
- **Quality Assurance** - Standardized reporting templates and completion tracking

**Ready for Beta Deployment:**
- 📂 Complete testing directory structure (`/docs/testing/`)
- 🎯 Systematic testing approach with clear guidance for beta testers
- 🚀 Production-ready framework for immediate beta testing deployment
- 📊 Quality assurance through standardized processes and documentation
- 🔗 GitHub Issues integration for seamless issue tracking and resolution

**Next Phase:** 🚀 **BETA TESTING EXECUTION** (Framework ready for beta tester deployment)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run preview` - Preview production build
- `npm run test` - Run test suite
- `npm run test:coverage` - Run tests with coverage report
- `npm run seed:firebase` - Seed Firebase with test data
- `npm run setup-admin` - Create initial admin user
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

- `src/components/` - Reusable UI components organized by feature
- `src/pages/` - Top-level page components
- `src/services/` - Service layer with Firebase implementations
  - `src/services/firebase/` - Firebase-specific service implementations
- `src/types/` - TypeScript type definitions
  - `firestore.ts` - Firestore schema types
  - `index.ts` - Core domain models
- `src/hooks/` - Custom React hooks
- `src/contexts/` - React contexts for global state
- `src/lib/` - External library configurations (Firebase)
- `src/test/` - Testing utilities and mocks
- `docs/` - Project documentation and guides
  - `docs/testing/` - **Beta testing framework and documentation**
    - `beta-testing-overview.md` - Complete testing methodology
    - `beta-tester-onboarding.md` - Setup and role assignments
    - `testing-checklist.md` - Master completion tracking
    - `modules/` - Module-specific test scenarios
    - `github/` - GitHub Issues integration templates
    - `logging/` - Issue logging and feedback collection
- `tasks/` - Implementation task files organized by phase
- `firestore.rules` - Firebase Security Rules
- `.serena/` - Serena AI coding assistant configuration

## Beta Testing Documentation

### Quick Start for Beta Testers
1. **Read the Overview**: Start with `/docs/testing/beta-testing-overview.md`
2. **Complete Onboarding**: Follow `/docs/testing/beta-tester-onboarding.md`
3. **Use the Checklist**: Track progress with `/docs/testing/testing-checklist.md`
4. **Follow Test Scenarios**: Execute module-specific tests in `/docs/testing/modules/`
5. **Report Issues**: Use GitHub Issues with templates from `/docs/testing/github/`

### Testing Framework Features
- **Systematic Approach** - Role-based testing with clear guidance
- **Quality Assurance** - Standardized documentation and reporting
- **Issue Integration** - Seamless GitHub Issues workflow
- **Comprehensive Coverage** - All modules and user perspectives
- **Progress Tracking** - Master checklist and completion metrics