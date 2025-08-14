# SPEC-1-Shepherd

## Background

Smaller churches often operate with limited financial and technical resources, making it difficult to adopt or maintain modern software tools for daily operations. Many rely on spreadsheets, ad hoc messaging, and manual processes for tasks such as member management, donation tracking, event coordination, and volunteer scheduling. This can lead to inefficiencies, lost data, and poor engagement.

To address these challenges, this project aims to build a web-based application – **Shepherd** – designed specifically for smaller churches. The initial version will be developed and tested within one local church context, allowing for iterative improvements. Once stabilized and feature-complete for typical small-church operations, the solution will be offered as freeware to other churches with similar needs.

## Requirements

### Currently Implemented (Core Foundation)
- Member directory with:
  - Individual profiles
  - Household and family relationships
  - Search and filtering capabilities
- Role-based access (admin, pastor, member)
- Secure cloud-hosted web application with Firebase
- Authentication system with magic links and QR registration
- Admin dashboard with member statistics

### Should Have (Planned for Reimplementation)
- Member life events tracking (dedication, baptism, marriage, birthdays, anniversaries, deaths, funerals)
- Donation tracking with reporting/export
- Event calendar with RSVP/attendance tracking
- Volunteer scheduling
- Email and SMS notification system
- Sermon archive (file uploads, notes)
- Integration with payment processors (e.g., Stripe, PayPal)
- Mobile-friendly/responsive UI (partially implemented)
- Financial data reporting suitable for Form 990 or equivalent nonprofit regulatory filings

### Could Have
- Mobile apps (iOS/Android)
- Church-wide messaging (chat/forum)
- Sermon livestream integration (YouTube, etc.)
- Public website builder
- Multi-church admin support

### Won't Have (for now)
- In-app video conferencing
- Advanced financial accounting (e.g., payroll, taxes)
- Custom CMS for public sites

## Method

### Technical Approach

**Primary stack components:**

| Layer       | Technology              | Justification                                        |
|-------------|--------------------------|------------------------------------------------------|
| Frontend    | React (via Vite)         | Fast, modern UI development                          |
| Backend     | Firebase                 | Authentication, Firestore database, file storage    |
| Database    | Cloud Firestore         | NoSQL with real-time updates and security rules     |
| Auth        | Firebase Auth            | Secure login with email links and social options    |
| Storage     | Firebase Storage         | For future sermon files and attachments             |
| Hosting     | Vercel + Firebase        | Free-tier deployment and cloud services             |
| Payments    | Stripe / PayPal          | For tracked donations                                |

## Implementation

### Phase 1 – Environment & Setup
- Repositories created (frontend/backend)
- Supabase project provisioned
- Domain + hosting configured
- Schema initialized in Supabase
- Predefined roles & categories seeded

### Phase 2 – Core Functionality (MVP)
- Member & Household Management
- Event Calendar & Attendance
- Donation Tracking
- Volunteer Scheduling
- Sermon Archive

### Phase 3 – Finishing Touches
- Mobile-Responsive UI Testing
- Email & Notification Integration
- Access Control Polishing

## Milestones

### Milestone 1: Project Foundation (1–2 weeks)
### Milestone 2: Member & Household Management (2–3 weeks)
### Milestone 3: Events & Attendance (2 weeks)
### Milestone 4: Donations & Reporting (2–3 weeks)
### Milestone 5: Volunteer Scheduling & Sermons (2–3 weeks)
### Milestone 6: Notifications & Polish (1–2 weeks)

## Gathering Results

### Success Metrics

**Quantitative**
- 80% of members onboarded via QR code within 30 days
- Weekly service attendance logged >90% of the time
- 100% of donations recorded with category and method
- 990-compatible financial export generated quarterly

**Qualitative**
- Reduced admin effort
- Positive member feedback
- 80%+ satisfaction rate in survey

**Operational**
- 99% uptime during active hours
- No critical bugs in first 60 days
- Feature backlog driven by real-world use