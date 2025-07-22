# Security & Role System Design

## Overview

This document outlines the role-based access control (RBAC) system design for the Shepherd Church Management System, including security requirements, permission models, and implementation strategy.

## Current Implementation

### Role Storage
- Roles are stored as string fields on Member documents in Firebase
- Current roles: `admin`, `pastor`, `member`
- No role assignment workflow or audit trail currently exists

### Authentication Flow
- Firebase Authentication handles user login/logout
- Role checking done via `useAuth()` hook and `RoleGuard` component
- Basic role-based route protection implemented

## Security Requirements Analysis

### Critical Privacy Concerns
1. **Financial Privacy**: Members should never see other members' donation data
2. **Personal Information**: Limited directory access to prevent privacy violations
3. **Pastoral Care**: Sensitive member information should be restricted to pastoral staff
4. **Administrative Functions**: System management limited to administrators only

### Regulatory Considerations
- **Data Protection**: Member personal information must be protected
- **Financial Transparency**: Church financial data has specific access requirements
- **Audit Requirements**: Role changes and data access should be logged

## Recommended Role Definitions

### Member (Default Role)
**Primary Use Case**: Regular church member accessing own information and participating in church activities

**Access Permissions**:
- ✅ Own profile and household information (read/write)
- ✅ Own donation history only (read-only)
- ✅ Public events and event registration (read/write own RSVPs)
- ✅ Limited church directory (names, public contact info only)
- ✅ Own ministry/small group participation (read/write)
- ❌ Other members' personal information
- ❌ Other members' financial data
- ❌ Private/administrative events
- ❌ System administration functions

**Dashboard Components**:
```typescript
interface MemberDashboard {
  personalProfile: OwnMemberData
  householdInfo: OwnHouseholdData
  recentDonations: OwnDonationHistory
  upcomingEvents: PublicEventsList
  myRegistrations: OwnEventRSVPs
  churchDirectory: PublicDirectoryInfo
  myMinistries: OwnParticipation
}
```

### Pastor
**Primary Use Case**: Church leadership requiring access to member information for pastoral care and ministry management

**Access Permissions**:
- ✅ All member personal information (pastoral care purposes)
- ✅ Create and manage all events (public and private)
- ✅ View aggregate donation reports (church financial health)
- ✅ Full church directory access
- ✅ Event attendance and engagement analytics
- ✅ Ministry and small group management
- ❌ Individual donation line items (unless specific pastoral need)
- ❌ System administration (user management, technical settings)
- ❌ Role assignments

**Key Limitations**:
- Financial data access focused on ministry needs, not detailed individual transactions
- Cannot modify system settings or assign roles
- Access logged for accountability

### Admin
**Primary Use Case**: Technical and administrative management of the church management system

**Access Permissions**:
- ✅ All system functions and data
- ✅ User role management
- ✅ Detailed financial reports and individual donation records
- ✅ System configuration and settings
- ✅ Data export/import functionality
- ✅ Audit logs and system monitoring
- ✅ Database administration

**Responsibilities**:
- Role assignment and management
- System security and maintenance
- Financial reporting and compliance
- Data privacy and protection

## Implementation Strategy

### Phase 1: Critical Security Implementation
**Priority**: High - Address immediate security concerns

1. **Dashboard Data Filtering**
   - Implement role-based queries in all services
   - Ensure members only see own financial data
   - Filter member directory based on role

2. **Role Assignment System**
   - Admin-only interface for role management
   - Confirmation dialogs for sensitive role changes
   - Role change notifications

3. **Financial Data Security**
   - Service-level filtering for donation data
   - Member dashboard shows only own donations
   - Pastor dashboard shows aggregates only

4. **Basic Audit Logging**
   - Log role assignments and changes
   - Track sensitive data access
   - Simple audit trail for accountability

### Phase 2: Enhanced Permission System
**Priority**: Medium - Improve granular control

1. **Permission-Based Access**
   ```typescript
   interface Permission {
     resource: 'donations' | 'members' | 'events' | 'reports' | 'settings'
     actions: ('read' | 'write' | 'delete' | 'manage')[]
     scope: 'own' | 'household' | 'ministry' | 'all'
   }
   ```

2. **Additional Roles**
   - `treasurer` - Financial data focus
   - `volunteer_coordinator` - Event and volunteer management
   - `ministry_leader` - Specific ministry group access

3. **Time-Limited Roles**
   - Role expiration dates
   - Automatic role review processes
   - Temporary access grants

### Phase 3: Advanced Features
**Priority**: Low - Enhanced workflows and reporting

1. **Approval Workflows**
   - Multi-step approval for sensitive data access
   - Request/approval system for temporary permissions
   - Automated permission reviews

2. **Advanced Audit Reporting**
   - Detailed access logs
   - Permission usage analytics
   - Security incident reporting

## Database Schema Design

### Current Schema (Member Document)
```typescript
interface Member {
  // ... existing fields
  role: 'admin' | 'pastor' | 'member'
}
```

### Enhanced Schema (Phase 2)
```typescript
interface RoleAssignment {
  id: string
  memberId: string
  role: string
  permissions: Permission[]
  assignedBy: string
  assignedAt: Timestamp
  expiresAt?: Timestamp
  isActive: boolean
  reason?: string // Why role was assigned
}

interface AuditLog {
  id: string
  action: 'role_assigned' | 'role_removed' | 'permission_granted' | 'data_accessed'
  performedBy: string
  affectedMember?: string
  resourceType?: string
  resourceId?: string
  details: Record<string, any>
  timestamp: Timestamp
  ipAddress?: string
  userAgent?: string
}

interface Permission {
  resource: 'donations' | 'members' | 'events' | 'reports' | 'settings' | 'directory'
  actions: ('read' | 'write' | 'delete' | 'manage')[]
  scope: 'own' | 'household' | 'ministry' | 'all'
  conditions?: Record<string, any> // Additional access conditions
}
```

## Security Implementation Guidelines

### Service Layer Security
```typescript
// Example: Donation service with role-based filtering
class DonationsService {
  async getDonations(userId: string, userRole: string): Promise<Donation[]> {
    switch(userRole) {
      case 'member':
        return this.getWhere('donorId', '==', userId) // Own donations only
      case 'pastor':
        throw new Error('Pastors cannot access individual donations without specific authorization')
      case 'admin':
        return this.getAll() // Full access
      default:
        throw new Error('Unauthorized access')
    }
  }
}
```

### Component-Level Guards
```typescript
function DonationsList() {
  const { user, member } = useAuth()
  
  if (member?.role === 'member') {
    return <OwnDonationsList userId={user.id} />
  } else if (member?.role === 'admin') {
    return <AllDonationsList />
  } else {
    return <AccessDenied />
  }
}
```

### Route Protection
```typescript
<RoleGuard allowedRoles={['admin']}>
  <AdminDashboard />
</RoleGuard>

<RoleGuard allowedRoles={['admin', 'pastor']}>
  <MemberManagement />
</RoleGuard>
```

## Best Practices

### Security Principles
1. **Principle of Least Privilege**: Grant minimum necessary access
2. **Defense in Depth**: Multiple layers of security (route, component, service, database)
3. **Audit Everything**: Log all role changes and sensitive data access
4. **Regular Reviews**: Periodic audit of role assignments
5. **Fail Securely**: Default to denying access rather than allowing

### Development Guidelines
1. **Always check roles** before displaying sensitive data
2. **Filter at the service layer** not just the UI layer
3. **Log sensitive operations** for audit purposes
4. **Test with different roles** during development
5. **Document permission requirements** for all features

### User Experience Considerations
1. **Clear role indicators** in the UI
2. **Helpful error messages** when access is denied
3. **Request access workflows** for additional permissions
4. **Role-appropriate navigation** hiding inaccessible features

## Migration Strategy

### From Current Implementation
1. **Backward compatibility**: Keep existing role field during transition
2. **Gradual migration**: Phase in new permission system
3. **Data migration**: Convert existing roles to new permission system
4. **Testing**: Comprehensive testing with all role combinations

### Rollout Plan
1. **Phase 1**: Implement basic role-based filtering (immediate security)
2. **Phase 2**: Add permission system and audit logging
3. **Phase 3**: Advanced features and workflows
4. **Ongoing**: Regular security reviews and updates

## Compliance and Audit Requirements

### Data Protection
- Member personal information protected by role-based access
- Financial data segregated with strict access controls
- Audit trail for all sensitive data access

### Church Governance
- Pastor access aligned with pastoral care responsibilities
- Administrative functions properly segregated
- Financial transparency balanced with privacy requirements

### Technical Security
- Authentication and authorization at multiple layers
- Session management and role verification
- Regular security audits and penetration testing

---

**Document Status**: Draft - Approved for implementation
**Last Updated**: January 2025
**Next Review**: Quarterly role assignment audit