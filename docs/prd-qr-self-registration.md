# PRD: QR Code Self-Registration System

## Executive Summary
Implement a QR code-based self-registration system that allows church visitors and members to register themselves without authentication. The system will generate QR codes that can be displayed at church entrances, printed on bulletins, or shared digitally, leading to a mobile-friendly registration form.

## Problem Statement
Currently, new visitors and members must be manually added by administrators, creating a bottleneck and potentially missing visitor information. Churches need a streamlined way to capture visitor information immediately when they attend services.

## Solution Overview
A two-part system:
1. **Admin Side**: QR code generation and management interface for church staff
2. **Public Side**: Mobile-optimized registration form accessible via QR scan (no authentication required)

## User Stories

### As a Church Administrator
- I want to generate QR codes for different events/services
- I want to track how many people register through each QR code
- I want to review and approve registrations before they become members
- I want to detect and merge duplicate registrations

### As a Church Visitor
- I want to quickly register by scanning a QR code
- I want to submit my information without creating an account
- I want to indicate whether I'm a visitor or member
- I want the form to work well on my mobile device

## Detailed Implementation Plan

## Phase 1: Database & Backend Infrastructure

### Step 1.1: Create Registration Tokens Collection
```typescript
Collection: registration_tokens
Fields:
- id: string (auto-generated)
- token: string (unique, URL-safe)
- createdBy: string (admin/pastor member ID)
- createdAt: Timestamp
- expiresAt: Timestamp
- maxUses: number (default: unlimited/-1)
- currentUses: number (default: 0)
- isActive: boolean
- metadata: {
    purpose: string (e.g., "Sunday Service", "Youth Event")
    notes: string
}
```

### Step 1.2: Create Pending Registrations Collection
```typescript
Collection: pending_registrations
Fields:
- id: string
- tokenId: string (reference to registration_tokens)
- firstName: string
- lastName: string
- email: string (optional)
- phone: string (optional)
- birthdate: string (optional)
- gender: 'Male' | 'Female' | '' (optional)
- address: {
    line1: string
    line2: string
    city: string
    state: string
    postalCode: string
}
- memberStatus: 'member' | 'visitor'
- submittedAt: Timestamp
- ipAddress: string
- userAgent: string
- approvalStatus: 'pending' | 'approved' | 'rejected'
- approvedBy: string (optional)
- approvedAt: Timestamp (optional)
- memberId: string (reference to created member, if approved)
```

### Step 1.3: Update Firestore Security Rules
```javascript
// Allow unauthenticated writes to pending_registrations
match /pending_registrations/{document} {
  allow create: if true;
  allow read: if isAdminOrPastor();
  allow update: if isAdminOrPastor();
  allow delete: if isAdmin();
}

// Registration tokens - admin/pastor only
match /registration_tokens/{document} {
  allow read: if true; // Public needs to validate tokens
  allow write: if isAdminOrPastor();
}
```

## Phase 2: Token Management System

### Step 2.1: Create Token Service
`src/services/firebase/registration-tokens.service.ts`

Key methods:
- `generateToken()`: Create unique, URL-safe token
- `createRegistrationToken()`: Store token with metadata
- `validateToken()`: Check if token is valid/active/not expired
- `incrementUsage()`: Update usage count after registration
- `deactivateToken()`: Admin can disable tokens
- `getTokenStats()`: View usage statistics

### Step 2.2: Admin Token Management UI
`src/pages/admin/RegistrationTokens.tsx`

Features:
- List all tokens with status, usage, expiry
- Create new token with:
  - Purpose/event name
  - Expiration date (optional)
  - Max uses (optional)
  - Auto-generate QR code
- View QR code for any token
- Download/print QR codes
- Deactivate tokens
- View registration statistics per token

## Phase 3: Public Registration Form

### Step 3.1: Update QR Registration Page
`src/pages/QRRegistration.tsx`

Features:
- No authentication required
- Mobile-first responsive design
- Progressive form with sections:
  1. Basic Info (required): firstName, lastName
  2. Contact (optional): email, phone
  3. Personal (optional): birthdate, gender
  4. Address (optional): full address fields
  5. Status: Member or Visitor selection
- Real-time validation
- Success confirmation with church info
- Error handling for invalid/expired tokens

### Step 3.2: Create Registration Service
`src/services/firebase/public-registration.service.ts`

- `submitRegistration()`: Save to pending_registrations
- No Firebase Auth required
- Capture metadata (IP, user agent, timestamp)
- Handle duplicate detection (by email/phone)

## Phase 4: Registration Review & Approval System

### Step 4.1: Admin Review Dashboard
`src/pages/admin/PendingRegistrations.tsx`

Features:
- List all pending registrations
- Filter by date, status, token
- Quick approve/reject actions
- Bulk approval options
- Edit before approval
- Duplicate detection alerts
- Auto-assignment to households

### Step 4.2: Approval Workflow Service
`src/services/firebase/registration-approval.service.ts`

- `approveRegistration()`: 
  - Create member record
  - Create/assign household
  - Send welcome email (if email provided)
  - Update pending registration status
- `rejectRegistration()`: Mark as rejected with reason
- `detectDuplicates()`: Check existing members by email/phone
- `bulkApprove()`: Process multiple registrations

## Phase 5: Household Management

### Step 5.1: Smart Household Assignment
Logic:
- Check if same last name household exists
- Suggest existing households for assignment
- Create new household if needed
- Auto-set as primary contact if first in household

## Phase 6: Analytics & Reporting

### Step 6.1: Registration Analytics Dashboard
`src/components/admin/RegistrationAnalytics.tsx`

Metrics:
- Registrations by date/time
- Visitor vs Member ratio
- Token usage statistics
- Conversion rate (approved/rejected)
- Geographic distribution (from addresses)
- Peak registration times

## Phase 7: Additional Features

### Step 7.1: QR Code Display Options
- Generate printable PDF with QR codes
- Digital display mode for tablets/screens
- Customizable QR code with church logo
- Short URL fallback (shepherd.church/register/[token])

### Step 7.2: Follow-up Actions
- Auto-send welcome packet to new members
- Add to mailing lists (with consent)
- Schedule pastoral follow-up
- Invite to new member orientation

## Technical Architecture

### Flow Diagram
```
1. Admin generates QR code
   ↓
2. Visitor scans QR
   ↓
3. Opens registration form (/register/qr?token=xxx)
   ↓
4. Submits data (no auth required)
   ↓
5. Saves to pending_registrations
   ↓
6. Admin reviews in dashboard
   ↓
7. Approves/creates member
   ↓
8. Welcome process begins
```

### Component Structure
```
src/
├── pages/
│   ├── QRRegistration.tsx (public form)
│   └── admin/
│       ├── RegistrationTokens.tsx
│       └── PendingRegistrations.tsx
├── components/
│   ├── registration/
│   │   ├── RegistrationForm.tsx
│   │   ├── QRCodeDisplay.tsx
│   │   └── TokenManager.tsx
│   └── admin/
│       ├── RegistrationReview.tsx
│       └── RegistrationAnalytics.tsx
├── services/
│   └── firebase/
│       ├── registration-tokens.service.ts
│       ├── public-registration.service.ts
│       └── registration-approval.service.ts
└── types/
    └── registration.ts
```

## Security Considerations

### Public Form Security
- Rate limiting on form submissions (max 10 per IP per hour)
- CAPTCHA for bot prevention (after 3 submissions)
- Token expiration and usage limits
- IP-based duplicate detection
- Data validation and sanitization
- XSS prevention on all inputs

### Data Privacy
- GDPR compliance for data collection
- Clear privacy policy display
- Consent checkboxes for communications
- Data retention policies
- Right to deletion requests

## Mobile-First Design Requirements

### Form UX
- Large touch targets (min 44x44px)
- Auto-advance between fields
- Phone number formatting with mask
- Native date picker for birthdate
- Address autocomplete (Google Places API)
- Offline capability with retry
- Progress indicator
- Field validation on blur

### Responsive Design
- Single column layout on mobile
- Sticky submit button
- Collapsible sections
- Touch-friendly dropdowns
- Optimized keyboard navigation

## Success Metrics

### Quantitative Metrics
- Reduced manual data entry time by 80%
- Increased visitor information capture rate by 60%
- Average registration completion time < 2 minutes
- Form abandonment rate < 20%
- Duplicate registration rate < 5%

### Qualitative Metrics
- User satisfaction score > 4.5/5
- Admin efficiency improvement
- Data accuracy improvement
- Visitor follow-up rate increase

## Implementation Timeline

### Week 1: Foundation
- Database schema creation
- Security rules implementation
- Token service development
- Basic token generation

### Week 2: Admin Interface
- Token management UI
- QR code generation
- Token statistics dashboard
- Print/download functionality

### Week 3: Public Form
- Registration form development
- Mobile optimization
- Validation implementation
- Success/error handling

### Week 4: Review System
- Approval workflow
- Admin review dashboard
- Duplicate detection
- Bulk operations

### Week 5: Polish & Deploy
- Testing (unit, integration, E2E)
- Performance optimization
- Documentation
- Deployment

## Migration Notes

### From Existing System
- Replace Supabase references with Firebase
- Maintain backward compatibility with existing member data
- Migrate existing registration tokens if any
- Update security rules progressively

### Data Migration
- No existing registration system to migrate from
- Ensure new registrations integrate with existing member records
- Maintain data consistency with current schema

## Testing Requirements

### Unit Tests
- Token generation and validation
- Registration submission logic
- Approval workflow
- Duplicate detection algorithms

### Integration Tests
- End-to-end registration flow
- Token expiration handling
- Database operations
- Security rule validation

### User Acceptance Testing
- Mobile device testing (iOS/Android)
- Different screen sizes
- Slow network conditions
- High volume testing

## Documentation Requirements

### Admin Documentation
- How to generate QR codes
- Token management best practices
- Registration review process
- Analytics interpretation

### User Documentation
- Registration instructions
- Privacy policy
- Data usage guidelines
- Support contact information

## Future Enhancements

### Phase 2 Features
- Multi-language support
- Custom registration fields
- Event-specific registrations
- Integration with check-in system
- Automated household matching
- SMS verification option

### Phase 3 Features
- AI-powered duplicate detection
- Predictive analytics
- Advanced reporting
- API for third-party integrations
- Mobile app integration

## Risk Analysis

### Technical Risks
- **Risk**: High volume registrations overwhelming system
- **Mitigation**: Implement queuing and rate limiting

### Security Risks
- **Risk**: Spam registrations
- **Mitigation**: CAPTCHA and IP-based limits

### User Experience Risks
- **Risk**: Complex form leading to abandonment
- **Mitigation**: Progressive disclosure and save-as-you-go

## Acceptance Criteria

### Must Have
- ✅ QR code generation by admin
- ✅ Public registration form (no auth)
- ✅ Mobile-responsive design
- ✅ Admin review dashboard
- ✅ Basic duplicate detection
- ✅ Member/visitor status selection

### Should Have
- ✅ Token expiration
- ✅ Usage limits
- ✅ Bulk approval
- ✅ Registration analytics
- ✅ Email notifications

### Nice to Have
- Address autocomplete
- Custom branding
- Multi-language support
- SMS notifications
- Advanced analytics

## Appendix

### Sample QR Code URL Format
```
https://shepherd.church/register/qr?token=abc123xyz789
```

### Sample Registration Response
```json
{
  "success": true,
  "message": "Thank you for registering! A church administrator will review your information.",
  "registrationId": "reg_123456"
}
```

### Sample Token Metadata
```json
{
  "purpose": "Sunday Service - Main Campus",
  "eventDate": "2024-12-25",
  "location": "Main Sanctuary",
  "notes": "Christmas Service Registration"
}
```