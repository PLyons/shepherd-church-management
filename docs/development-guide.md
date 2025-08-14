# Development Guide - Shepherd Church Management System

## Quick Start

### Prerequisites
- **Node.js 18+** 
- **Firebase Account** (free tier)
- **Git** for version control

### Setup Steps

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd shepherd
   npm install
   ```

2. **Firebase Configuration**
   - Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password, Email Link)
   - Enable Firestore Database
   - Copy configuration to `src/lib/firebase.ts` or use environment variables

3. **Environment Setup** (Optional)
   ```bash
   cp .env.example .env.local
   # Add your Firebase config if not hardcoded
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

5. **Seed Database**
   ```bash
   npm run seed
   ```

6. **Create Admin User**
   ```bash
   npm run setup-admin
   ```

## Development Workflow

### Daily Development
```bash
# Start development server
npm run dev

# Run linting and formatting
npm run lint
npm run format

# Type checking
npm run typecheck
```

### Database Management
```bash
# Seed database with test data
npm run seed

# Create admin user
npm run setup-admin

# Create specific admin user
npm run create-admin
```

### Build and Deploy
```bash
# Production build
npm run build

# Preview production build
npm run preview

# Security audit
npm run security:check
```

## Project Structure

```
src/
├── components/           # React components organized by feature
│   ├── auth/            # Authentication components
│   ├── members/         # Member management
│   ├── households/      # Household management
│   ├── admin/           # Admin-only components
│   ├── dashboard/       # Dashboard views
│   └── common/          # Shared UI components
├── contexts/            # React contexts (Auth, Theme, Toast)
├── hooks/               # Custom React hooks
├── lib/                 # Configuration and utilities
├── pages/               # Page-level components
├── router/              # React Router configuration
├── scripts/             # Database seeding and admin scripts
├── services/firebase/   # Firebase service layer
└── types/               # TypeScript type definitions
```

## Firebase Services

### Service Layer Pattern
All Firebase operations go through service classes:

```typescript
// Use service layer, not Firebase SDK directly
import { firebaseService } from '../services/firebase';

// Good
const members = await firebaseService.members.getAll();

// Bad - never do this
import { collection, getDocs } from 'firebase/firestore';
```

### Available Services
- **`firebaseService.members`** - Member CRUD operations
- **`firebaseService.households`** - Household management
- **`firebaseService.roles`** - Role assignment
- **`firebaseService.dashboard`** - Dashboard statistics
- **`firebaseService.auth`** - Authentication helpers

### Database Collections
- **`members`** - Individual church members
- **`households`** - Family units and addresses

## Authentication System

### User Roles
- **`admin`** - Full system access
- **`pastor`** - Member management and analytics
- **`member`** - Own data and limited directory access

### Authentication Methods
- **Email/Password** - Traditional login
- **Magic Links** - Passwordless email authentication
- **QR Registration** - Quick member onboarding

### Role Guards
```tsx
import { RoleGuard } from '../components/auth/RoleGuard';

<RoleGuard allowedRoles={['admin', 'pastor']}>
  <AdminComponent />
</RoleGuard>
```

## Development Standards

### Code Style
- **Prettier** for formatting (run `npm run format`)
- **ESLint** for linting (run `npm run lint`)
- **TypeScript** strict mode enabled
- **Functional components** with hooks

### Component Guidelines
- Use **React Hook Form** for all forms
- Implement **loading states** and **error handling**
- Follow **mobile-first** responsive design
- Use **TailwindCSS** for styling

### Type Safety
- Avoid `any` types
- Use proper TypeScript interfaces from `src/types/`
- Leverage Firebase type safety with proper typing

### Error Handling
```tsx
try {
  const result = await firebaseService.members.create(data);
  toast.success('Member created successfully');
} catch (error) {
  console.error('Failed to create member:', error);
  toast.error('Failed to create member. Please try again.');
}
```

## Testing & Quality Assurance

### Before Committing
1. **Run lint**: `npm run lint` (must pass)
2. **Run format**: `npm run format`
3. **Type check**: `npm run typecheck` (must pass)
4. **Test manually**: Verify core functionality works

### Manual Testing Checklist
- [ ] Authentication (login, logout, role switching)
- [ ] Member CRUD operations
- [ ] Household management
- [ ] Dashboard data accuracy
- [ ] Mobile responsiveness
- [ ] Error handling

## Firebase Security Rules

### Rule Structure
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Member access rules
    match /members/{memberId} {
      allow read, write: if isAuthenticated() && 
        (isAdmin() || isPastor() || resource.data.id == getUserId());
    }
  }
}
```

### Security Testing
- Test with different user roles
- Verify unauthorized access is blocked
- Check member data isolation

## Common Development Tasks

### Adding New Components
1. Create in appropriate feature folder
2. Follow existing patterns for props and styling
3. Add proper TypeScript interfaces
4. Include loading and error states

### Modifying Database Schema
1. Update TypeScript types in `src/types/`
2. Update service layer methods
3. Update Firebase Security Rules
4. Test with existing data

### Adding New Routes
1. Add route to `src/router/index.tsx`
2. Create page component in `src/pages/`
3. Add navigation link if needed
4. Implement proper role guards

## Environment Variables

Optional Firebase configuration via environment variables:

```bash
# .env.local
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Troubleshooting

### Firebase Connection Issues
- Check Firebase project configuration
- Verify API keys and project ID
- Ensure Firestore and Auth are enabled

### Authentication Problems
- Clear browser storage/cookies
- Check Firebase Auth settings
- Verify user exists in Firebase console

### Build Errors
- Run `npm run typecheck` to identify type issues
- Check for missing imports
- Verify all environment variables are set

### Performance Issues
- Use React DevTools Profiler
- Check for unnecessary re-renders
- Optimize Firebase queries with proper indexing

## Getting Help

### Key Documentation Files
- **`CLAUDE.md`** - Project guidelines and standards
- **`README.md`** - Project overview and setup
- **`docs/current-features.md`** - What's currently implemented
- **`docs/prd.md`** - Product requirements and roadmap

### Debugging Tips
- Use browser DevTools Network tab for Firebase requests
- Check Firebase console for database contents
- Use React DevTools for component state
- Check browser console for JavaScript errors

## Next Steps for Feature Development

When adding new features:

1. **Plan first** - Update `docs/prd.md` if needed
2. **Design database schema** - Add to `src/types/`
3. **Implement service layer** - Add to `src/services/firebase/`
4. **Create UI components** - Follow existing patterns
5. **Add routes and navigation** - Update router
6. **Test thoroughly** - All roles and edge cases
7. **Update documentation** - Keep guides current

This systematic approach ensures consistency and maintainability as the project grows.