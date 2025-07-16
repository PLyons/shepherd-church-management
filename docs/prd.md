# SPEC-1-Shepherd

## Background

Smaller churches often operate with limited financial and technical resources, making it difficult to adopt or maintain modern software tools for daily operations. Many rely on spreadsheets, ad hoc messaging, and manual processes for tasks such as member management, donation tracking, event coordination, and volunteer scheduling. This can lead to inefficiencies, lost data, and poor engagement.

To address these challenges, this project aims to build a web-based application – **Shepherd** – designed specifically for smaller churches. The initial version will be developed and tested within one local church context, allowing for iterative improvements. Once stabilized and feature-complete for typical small-church operations, the solution will be offered as freeware to other churches with similar needs.

## Requirements

### Must Have
- Member directory with:
  - Individual profiles
  - Household and family relationships
  - Important life events: dedication, baptism, marriage, birthdays, anniversaries, deaths, funerals
- Donation tracking with reporting/export
- Event calendar with RSVP/attendance tracking
- Admin dashboard with simple analytics (e.g., attendance trends, giving totals)
- Role-based access (admin, pastor, member)
- Secure cloud-hosted web application

### Should Have
- Volunteer scheduling
- Email and SMS notification system
- Sermon archive (file uploads, notes)
- Integration with payment processors (e.g., Stripe, PayPal)
- Mobile-friendly/responsive UI
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
| Backend     | Supabase (Postgres + API + Auth) | Free-tier friendly, integrated auth & storage |
| Auth        | Supabase Auth            | Secure login with email or social options            |
| Storage     | Supabase Storage         | For sermon files and attachments                     |
| Hosting     | Vercel + Supabase        | Free-tier deployment and database                    |
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