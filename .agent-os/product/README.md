# Shepherd Church Management System - Agent OS Integration

## Product Overview

**Shepherd** is a free, open-source Church Management System designed to provide smaller churches with an affordable alternative to expensive commercial solutions like Planning Center and Worship Tools.

### Mission Statement
Empowering smaller churches with professional-grade management tools they can actually afford, built with modern web technologies and designed for ease of use.

### Target Users
- Small to medium-sized churches (50-500 members)
- Budget-conscious congregations seeking alternatives to $50-200/month solutions
- Churches with basic technical needs but requiring professional features

## Current Status: Phase 2B Event Calendar & Attendance (70% Complete)

### ✅ Already Completed Features (50% MVP)

**Phase 0: Foundation & Enhanced Member Management**
- [x] Enhanced Member Forms with professional contact arrays
- [x] Member Directory with CRUD operations and search
- [x] Member Profiles with household integration
- [x] US States dropdown and professional form components

**Phase 2A: Household Management**
- [x] Complete household CRUD system
- [x] Family relationship tracking and management
- [x] Primary contact management
- [x] Member-household assignment system

**Phase 2B: Event System Foundation (70% Complete)**
- [x] Event Data Model & TypeScript interfaces (Event, EventRSVP, EventAttendance)
- [x] Events Firebase Service with CRUD operations and role-based queries
- [x] Event RSVP Service with capacity management and waitlist support
- [x] Firestore Security Rules for events and RSVPs
- [x] Event Form Component with validation and role-based creation
- [x] Event List & Cards Implementation with filtering and role-based display
- [x] Calendar View Component with month/week views and click-to-create
- [ ] **NEXT**: RSVP Modal System (in progress)
- [ ] **FINAL**: Attendance Tracking Interface

**Authentication & Security**
- [x] Firebase Authentication (email/password, magic links)
- [x] QR-based member self-registration system
- [x] Role-based access control (Admin/Pastor/Member)
- [x] Firebase Security Rules enforcement

**Dashboard & Analytics**
- [x] Role-specific dashboard views
- [x] Member statistics and growth analytics
- [x] Real-time data synchronization

### 🔄 Current Development (Phase 2B - 30% Remaining)
- RSVP Modal System - Event capacity management and waitlist UI
- Attendance Tracking Interface - Check-in/check-out functionality

### 📋 Planned MVP Features (50% Remaining)
- **Phase 2C**: Donation Tracking & Financial Reports
- **Phase 2D**: Volunteer Scheduling System
- **Phase 2E**: Sermon Archive & Media Management

## Architecture Overview

### Tech Stack
- **Frontend**: React 18.2.0 + TypeScript 5.2.2 + Vite 5.0.8
- **Styling**: TailwindCSS 3.3.0 with responsive design
- **Backend**: Firebase 12.0.0 (Firestore, Auth, Storage, Hosting)
- **Forms**: React Hook Form 7.48.0
- **Routing**: React Router v6.20.0
- **Icons**: Lucide React 0.294.0

### Key Architectural Patterns
- **Service Layer Architecture**: Firebase services extending BaseFirestoreService
- **Type-Safe Data Conversion**: Firestore converters for seamless TypeScript/Firebase integration
- **Component Organization**: Feature-based component structure
- **Role-Based Security**: Enforced at both service and component levels
- **Real-Time Data**: Firestore listeners for live synchronization

### Service Layer Structure
```
src/services/firebase/
├── base.service.ts - Abstract base service with common CRUD patterns
├── members.service.ts - Complete member management with contact arrays
├── households.service.ts - Household and family relationship management
├── events.service.ts - Event lifecycle with role-based queries
├── event-rsvp.service.ts - RSVP processing with capacity management
├── roles.service.ts - User role assignment and management
├── dashboard.service.ts - Analytics and statistics
├── registration-approval.service.ts - Member registration workflows
└── [planned] donations.service.ts - Financial tracking
```

## Development Standards

### Code Quality Requirements
- **No `any` types** - Strict TypeScript usage throughout
- **Functional components** with React hooks
- **Async/await** syntax over promises
- **Service layer** for all Firebase operations
- **Type-safe converters** for Firestore data transformation

### Security Requirements
- **Role-based access** enforced at service and component levels
- **Firebase Security Rules** for database-level security
- **Member data privacy** - members only see own data
- **Pastor access** for pastoral care without financial data
- **Admin access** for system administration

### MCP Server Integration
- **Context7**: React/TypeScript coding standards and documentation
- **Semgrep**: Security scanning and vulnerability detection
- **Serena**: Intelligent code search and analysis
- **Firebase MCP**: Database operations and security rule management
- **GitHub MCP**: PR creation and issue management

## Development Workflow

### Phase-Based Development
Development follows PRP (Purpose-Requirements-Procedure) task format:
- **Purpose**: Clear objective and business value
- **Requirements**: Dependencies and success criteria
- **Procedure**: Step-by-step implementation guide

### Current Phase Priority
1. **Complete Phase 2B** - Finish RSVP Modal and Attendance Tracking (2-3 weeks)
2. **Phase 2C** - Donation Tracking implementation (3-4 weeks)
3. **Phase 2D** - Volunteer Scheduling system (2-3 weeks)
4. **Phase 2E** - Sermon Archive functionality (2-3 weeks)

### Quality Assurance
- **Manual testing guides** for each major feature
- **Data verification protocols** for Firestore operations
- **Role-based testing** across Admin/Pastor/Member permissions
- **Security scanning** with Semgrep before commits

## Agent OS Integration Opportunities

### High-Value Automation Areas
1. **Member Data Quality**: Duplicate detection, profile completion, data validation
2. **Event Management**: Recurring events, reminder automation, waitlist processing
3. **Financial Compliance**: Donation categorization, tax reporting, audit trails
4. **Pastoral Care**: Follow-up scheduling, communication tracking, care analytics

### Agent-Ready Infrastructure
- **Type-safe services** ready for agent integration
- **Role-based permissions** can be inherited by agents
- **Real-time data** enables reactive agent responses
- **Comprehensive logging** for agent activity tracking

## Project Files Reference

### Core Configuration
- `/CLAUDE.md` - AI agent instructions and development standards
- `/docs/project_tracker.md` - Development progress and phase tracking
- `/docs/prd.md` - Product requirements and specifications
- `/firestore.rules` - Firebase security rules
- `/src/lib/firebase.ts` - Firebase configuration and initialization

### Key Implementation Files
- `/src/types/index.ts` - Core domain models (Member, Household)
- `/src/types/events.ts` - Event system types
- `/src/utils/firestore-converters.ts` - **CRITICAL** Type-safe document conversion
- `/src/services/firebase/` - All Firebase service implementations
- `/src/components/` - Feature-organized React components

Last Updated: 2025-08-27