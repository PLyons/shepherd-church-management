# Shepherd CMS Technical Stack

## Core Architecture

### Frontend Stack
- **React 18.2.0** - Modern React with hooks and functional components
- **TypeScript 5.2.2** - Strict type safety, zero `any` types policy
- **Vite 5.0.8** - Fast build tool and development server
- **TailwindCSS 3.3.0** - Utility-first CSS framework with responsive design
- **PostCSS 8.4.32** & **Autoprefixer 10.4.16** - CSS processing and vendor prefixes

### Backend & Database
- **Firebase 12.0.0** - Complete backend-as-a-service solution
  - **Firestore** - NoSQL document database with real-time updates
  - **Firebase Auth** - Authentication with email/password, magic links
  - **Firebase Storage** - File storage for future sermon/media management
  - **Firebase Hosting** - Static web app hosting
- **Firebase Security Rules** - Database-level access control

### Form Management & Validation
- **React Hook Form 7.48.0** - Performant form library with validation
- **Built-in Validation** - Custom validation rules for church-specific data
- **Dynamic Field Arrays** - Professional contact management (emails, phones, addresses)

### Navigation & Routing
- **React Router v6.20.0** - Client-side routing with role-based guards
- **Nested Routes** - Organized route structure with protected routes
- **Route Guards** - Component-level access control by user role

### UI Components & Icons
- **Lucide React 0.294.0** - Modern icon library with consistent styling
- **Custom Components** - Feature-specific components in `/src/components/`
- **Responsive Design** - Mobile-first approach with TailwindCSS utilities

### State Management
- **React Context API** - Global state management for:
  - **AuthContext** - User authentication and role state
  - **ThemeContext** - Dark/light theme preferences  
  - **ToastContext** - Global notification system
- **React Hooks** - Local component state and effects
- **Firebase Hooks** - Real-time data synchronization with `react-firebase-hooks 5.1.1`

### Data Processing & Utilities
- **date-fns 3.0.0** - Date manipulation and formatting
- **Fuse.js 7.1.0** - Fuzzy search for member directory
- **Papa Parse 5.4.1** - CSV parsing for data import/export
- **jsPDF 3.0.1** - PDF generation for reports
- **QRCode.react 4.2.0** - QR code generation for member registration

### Charts & Analytics
- **Recharts 3.1.2** - Dashboard charts and analytics visualization
- **React Calendar 4.8.0** - Event calendar component

### Development Tools
- **ESLint 8.55.0** - Code linting with TypeScript and React rules
- **Prettier 3.1.1** - Code formatting with consistent style
- **tsx 4.20.3** - TypeScript execution for scripts and seeding
- **dotenv 17.2.0** - Environment variable management

### MCP Server Integration
- **Context7 MCP** - Library documentation and coding standards
- **Serena MCP** - Intelligent code search and analysis  
- **Semgrep MCP** - Security scanning and vulnerability detection
- **Firebase MCP** - Database operations and rule management
- **GitHub MCP** - Pull request creation and issue management

## Architecture Patterns

### Service Layer Pattern
```typescript
// Base service with common CRUD operations
abstract class BaseFirestoreService<T, TDocument> {
  protected abstract collectionName: string;
  protected abstract toDocument(entity: T): TDocument;
  protected abstract fromDocument(doc: TDocument): T;
  
  async create(entity: T): Promise<string> { /* ... */ }
  async getById(id: string): Promise<T | null> { /* ... */ }
  async update(id: string, updates: Partial<T>): Promise<void> { /* ... */ }
  async delete(id: string): Promise<void> { /* ... */ }
}

// Feature-specific services extend base
class MembersService extends BaseFirestoreService<Member, MemberDocument> {
  // Member-specific operations with role-based access
}
```

### Type-Safe Data Conversion
```typescript
// Firestore converters ensure type safety
export const memberConverter: FirestoreDataConverter<Member> = {
  toFirestore: (member: Member): DocumentData => memberToMemberDocument(member),
  fromFirestore: (snapshot: QueryDocumentSnapshot): Member => 
    memberDocumentToMember(snapshot.data() as MemberDocument, snapshot.id)
};

// Usage in services
const membersRef = collection(db, 'members').withConverter(memberConverter);
```

### Role-Based Security
```typescript
// Component-level role guards
const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { user, userRole } = useAuth();
  
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Service-level role checking
class EventsService {
  async createEvent(event: Event, userRole: string): Promise<string> {
    if (!['admin', 'pastor'].includes(userRole)) {
      throw new Error('Insufficient permissions');
    }
    // ... creation logic
  }
}
```

### Component Organization
```
src/components/
├── auth/           # Authentication components
│   ├── LoginForm.tsx
│   ├── RoleGuard.tsx
│   └── QRRegistration.tsx
├── members/        # Member management
│   ├── MemberForm.tsx
│   ├── MemberList.tsx  
│   ├── MemberProfile.tsx
│   └── forms/
├── households/     # Household management
├── events/         # Event management
├── dashboard/      # Role-based dashboards
├── admin/          # Administrative functions
└── common/         # Shared UI components
```

## Database Schema (Firestore)

### Collections Structure
```
/members {memberId}
  - firstName: string
  - lastName: string
  - emails: Array<{type, address, isPrimary}>
  - phones: Array<{type, number, isPrimary, smsOptIn}>
  - addresses: Array<{type, street, city, state, zip, isPrimary}>
  - memberStatus: 'active' | 'inactive' | 'visitor'
  - householdId?: string
  - roles?: Array<'admin' | 'pastor' | 'member'>

/households {householdId}
  - name: string
  - primaryContactId: string
  - memberIds: Array<string>
  - address: Address
  - createdAt: Timestamp

/events {eventId}
  - title: string
  - description: string
  - startDate: Timestamp
  - endDate: Timestamp
  - eventType: EventType
  - capacity?: number
  - isPublic: boolean
  - createdBy: string

/eventRSVPs {rsvpId}
  - eventId: string
  - memberId: string
  - status: 'yes' | 'no' | 'maybe'
  - responseDate: Timestamp
  - isWaitlisted: boolean
```

### Security Rules
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Members collection - role-based access
    match /members/{memberId} {
      allow read: if isSignedIn() && 
        (isAdmin() || isPastor() || resource.id == request.auth.uid);
      allow write: if isSignedIn() && 
        (isAdmin() || isPastor() || 
         (resource.id == request.auth.uid && !isChangingRoles()));
    }
    
    // Events collection - role-based creation/editing
    match /events/{eventId} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn() && (isAdmin() || isPastor());
      allow delete: if isSignedIn() && isAdmin();
    }
  }
}
```

## Performance Optimizations

### Bundle Optimization
- **Vite Code Splitting** - Automatic route-based code splitting
- **Tree Shaking** - Unused code elimination
- **Lazy Loading** - Dynamic imports for route components
- **Asset Optimization** - Image and static asset compression

### Database Performance  
- **Firestore Indexing** - Custom indexes for complex queries
- **Real-time Listeners** - Efficient data synchronization
- **Pagination** - Limit query results for large collections
- **Caching** - Component-level caching for frequently accessed data

### Development Performance
- **Fast Refresh** - Instant component updates during development
- **TypeScript Incremental Compilation** - Faster type checking
- **ESLint Caching** - Faster linting on subsequent runs

## Security Considerations

### Authentication Security
- **Firebase Auth** - Industry-standard authentication service
- **Magic Links** - Passwordless authentication option
- **Role-Based Access** - Granular permission system
- **Session Management** - Automatic token refresh and expiration

### Data Security
- **Firestore Security Rules** - Database-level access control
- **Input Validation** - Client and server-side validation
- **XSS Prevention** - React's built-in XSS protection
- **CSRF Protection** - Firebase SDK CSRF protection

### Development Security
- **Environment Variables** - Secure configuration management  
- **Dependency Scanning** - Regular security audit with `npm audit`
- **Semgrep Integration** - Automated security scanning
- **No Secrets in Code** - Configuration via environment variables

## Deployment Architecture

### Build Process
```bash
# Production build
npm run build          # TypeScript compilation + Vite build
npm run typecheck      # Type safety verification
npm run lint           # Code quality checking
```

### Hosting Configuration
- **Firebase Hosting** - Static site hosting with CDN
- **Single Page Application** - Client-side routing support
- **Environment Management** - Separate staging/production configs
- **Continuous Deployment** - GitHub Actions integration ready

### Monitoring & Analytics
- **Firebase Analytics** - User engagement tracking (planned)
- **Performance Monitoring** - Load time and error tracking (planned) 
- **Real-time Database Monitoring** - Firestore usage analytics

## Future Technical Enhancements

### Performance Enhancements
- **Service Worker** - Offline functionality and caching
- **Progressive Web App** - Mobile app-like experience
- **Image Optimization** - WebP/AVIF format support
- **Database Query Optimization** - Advanced indexing strategies

### Development Experience
- **Storybook Integration** - Component documentation and testing
- **Automated Testing** - Unit and integration test suites
- **Visual Regression Testing** - UI consistency validation
- **API Documentation** - Service layer documentation

### Integration Capabilities
- **REST API Layer** - Third-party integration support
- **Webhook System** - Event-driven external integrations  
- **Export/Import APIs** - Data migration and backup systems
- **Plugin Architecture** - Extensible functionality system

Last Updated: 2025-08-27