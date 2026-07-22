# Shepherd Remediation Plan — Grok PM Tracker

**Owner:** Cursor Grok 4.5 (Project Manager)  
**Human:** Paul (Builder)  
**Created:** 2026-07-21  
**Last Updated:** 2026-07-21  
**Authority:** This file is the source of truth for simplification, hardening, and reintegration.  
**Status:** ACTIVE — Phase 0 not started

---

## How we work (non-negotiable)

You asked me to keep tight reins. I will.

1. **One active task at a time.** See **CURRENT FOCUS** below. Nothing else.
2. **No rabbit holes.** If an idea is not on this plan, it goes in the Parking Lot. We do not start it.
3. **Phase gates.** You do not start Phase N+1 until Phase N checklist is done and marked complete here.
4. **Scope lock.** “While we’re here…” is not allowed unless it is a P0 security fix.
5. **Definition of done.** Task is done only when: code works, relevant tests pass, and this doc is updated.
6. **Ask before expanding.** New modules, refactors, or UI polish that are not listed here require an explicit plan amendment.

**When you feel the pull to chase something else:** open this file, read CURRENT FOCUS, and do only that.

---

## CURRENT FOCUS

```
PHASE:  1 — Feature flags (next major phase)
TASK:   1.1 — Add feature flags: members, households, events, donations, registration
STATUS: NOT STARTED
WHY:    Gate modules off without deleting code before simplifying the member core.
OUT:    Flags exist; default members+households+auth ON; events+donations OFF.
```

**Phase 0 status:** COMPLETE (0.1–0.5) + **0.6a register lockdown (app layer)**  
**Do not start Phase 1 until you say “start 1.1”.**  
**Hard Auth block still pending:** say “add signup blocking function” when on Blaze.  
**Just completed:** lock down `/register` (invite-only page; `signUp` throws)

---

## Goal

Turn Shepherd from a bloated, tightly coupled MVP into a **bulletproof member-management core**, then reintegrate events and donations behind clean seams and feature flags.

**North star:** Auth + Members + Households (+ optional Registration) that are secure, simple, and hard to break. Everything else is optional and gated.

---

## Critical findings (discovered 2026-07-21)

Priority key: **P0** = fix now · **P1** = fix this phase · **P2** = fix before reintegration · **P3** = later hygiene

### Security

| ID | Pri | Finding | Location | Risk |
|----|-----|---------|----------|------|
| S1 | P0 | Member self-update does not lock `role` (privilege escalation) | `firestore.rules` members update | **FIXED & DEPLOYED** to `shepherd-cms-ba981` (0.1) |
| S2 | P0 | Notes rendered via `dangerouslySetInnerHTML` without sanitization | `NotesList.tsx` | **FIXED (0.2)** — plain text display only |
| S3 | P1 | Any authenticated user can read all members/households | `firestore.rules` | PII oversharing |
| S4 | P1 | `pending_registrations` create / `registration_tokens` read are public (`if true`) | `firestore.rules` | Abuse / spam |
| S5 | P1 | Pastor UI allows Record Donation; Firestore write is admin-only | Router + rules + pages | **FIXED (0.4 + 0.5)** |
| S6 | P2 | Widespread `as any` / `(user as any)?.role` in financial + auth paths | donations services/UI | Type safety bypass |

### Bugs / broken wiring

| ID | Pri | Finding | Location |
|----|-----|---------|----------|
| B1 | P0 | Nav “My Giving” → `/donations/my-giving`; route is `/my-giving` | **FIXED (0.3)** |
| B2 | P0 | Nav links to `/donations/categories` — no route | **FIXED (0.3)** — removed; replaced with real batch/create links |
| B3 | P0 | Admin dashboard links to `/donations/new` and `/donation-statements` (wrong paths) | **FIXED (0.3)** |
| B4 | P1 | Duplicate donation edit routes; uneven RoleGuard coverage | **FIXED (0.4)** — both edit paths + record/batch admin-guarded |
| B5 | P2 | Docs say `isPublic` removed; rules/UI still use it | events rules + dashboards |

### Architecture / maintainability

| ID | Pri | Finding |
|----|-----|---------|
| A1 | P1 | Donations/Events tightly coupled into dashboards, nav, member profile tabs, `FirebaseService` |
| A2 | P1 | Dual converter systems (`firestore-converters`, `utils/converters/*`, `firestore-field-mapper`) |
| A3 | P2 | Many files/tests far over 300 LOC target |
| A4 | P2 | Client-side “fetch many then filter” event search (scale/cost) |
| A5 | P3 | Legacy Supabase feature flag surface still present |

### Module interconnectivity (what depends on what)

```
Auth/Roles ──► Members ◄──► Households
                 │
                 ├── Notes / Communications / Activity
                 ├── Registration (creates members)
                 ├── Events / RSVP (memberId, createdBy)
                 └── Donations / Stripe / Statements (memberId)
                        ▲
Dashboards / Nav / Profile tabs pull Events + Donations hard
```

**Hardest to strip:** Members ↔ Households (keep together for “basic” CMS).  
**Easiest to gate:** Events, Donations (flag routes, nav, widgets, profile tabs).

---

## What “basic member management” means

**IN (core):**
- Auth (login, guards, roles on member docs)
- Members CRUD + profile (overview, settings as needed)
- Households (keep with members)
- Registration (optional but allowed in core if needed for onboarding)
- Layout / Navigation (core links only)

**OUT (feature-flagged, not deleted first):**
- Events + Calendar + RSVP
- Donations + Giving + Stripe + Statements + Financial reports
- Donation/Event widgets on dashboards
- Member profile Giving tab + donation activity feed items

---

## Phased plan

### Phase 0 — Stabilize (no feature strip)

**Goal:** Stop the bleeding. Fix security and broken routes before restructuring.

| Task | Pri | Status | Notes |
|------|-----|--------|-------|
| 0.1 Lock member `role` (and privileged fields) on owner update in rules | P0 | DONE | Rules + tests; deployed to `shepherd-cms-ba981` |
| 0.2 Sanitize or stop HTML notes XSS | P0 | DONE | Plain-text display via `safe-html.ts`; TipTap HTML kept for edit only |
| 0.3 Fix nav/dashboard donation route mismatches (B1–B3) | P0 | DONE | Links now match router; categories nav removed (no route) |
| 0.4 Align RoleGuard on all donation routes (B4) | P1 | DONE | All management routes admin-only at router; pages aligned |
| 0.5 Align pastor donation access: UI matches rules (S5) | P1 | DONE | Record UI admin-only; giving tab/activity/hook aligned |

**Phase 0 exit criteria:** S1, S2 fixed; B1–B3 fixed; no known route 404s on primary nav; this section checkboxes updated.

---

### Phase 1 — Feature flags (preferred over hard delete)

**Goal:** Turn modules off without deleting code.

| Task | Status | Notes |
|------|--------|-------|
| 1.1 Add flags: `members`, `households`, `events`, `donations`, `registration` | NOT STARTED | Default: members+households+auth ON; events+donations OFF |
| 1.2 Gate routes by flag | NOT STARTED | |
| 1.3 Gate Navigation items by flag | NOT STARTED | |
| 1.4 Gate dashboard widgets by flag | NOT STARTED | |
| 1.5 Gate member profile tabs (Giving) by flag | NOT STARTED | |

**Phase 1 exit criteria:** App boots with events+donations OFF; no broken imports on default path; member directory/profile/households work.

---

### Phase 2 — Extract seams

**Goal:** Make modules swappable. Kill the god-object coupling.

| Task | Status | Notes |
|------|--------|-------|
| 2.1 Split `FirebaseService` into per-module facades / narrow hooks | NOT STARTED | |
| 2.2 Dashboard uses `useMemberStats` only when donations/events off | NOT STARTED | |
| 2.3 Single converter path; quarantine unused mappers | NOT STARTED | A2 |
| 2.4 Split oversized files only when touched (300 LOC rule) | NOT STARTED | No big-bang rewrite |

**Phase 2 exit criteria:** Member core compiles and runs with zero donation/event imports on the default dashboard path.

---

### Phase 3 — Member-only vertical slice (prove it)

**Goal:** Ship the thin, secure core.

| Task | Status | Notes |
|------|--------|-------|
| 3.1 Manual QA checklist: login, directory, profile edit, household, roles | NOT STARTED | |
| 3.2 Tighten member/household read rules where safe (S3) | NOT STARTED | Careful — directory UX depends on this |
| 3.3 Harden public registration (S4) | NOT STARTED | |
| 3.4 Smoke tests for member core only | NOT STARTED | |

**Phase 3 exit criteria:** You can demo member management confidently with donations/events off.

---

### Phase 4 — Reintegrate (strict order)

Do **not** reorder. Do **not** start the next module until the previous one is green.

1. Households polish (if anything was deferred)  
2. Events (list, calendar, RSVP)  
3. Donations (recording + history) — fix admin-create-for-others rules carefully  
4. Stripe + statements last  

Each reintegration gets its own mini checklist added here before work starts.

---

### Phase 5 — Hardening pass after re-enable

- Re-audit financial rules vs UI  
- Directory field minimization  
- Remove dead routes and stale docs (`isPublic` story)  
- Coverage gates on financial/security paths  

---

## Parking lot (ideas only — do not start)

Put rabbit holes here. They are **not** tasks until promoted into a phase.

- Volunteer scheduling / sermons (future product, not remediation)
- Full UI redesign / branding pass
- Migrating off Firebase
- Mass test rewrite for 95% coverage before Phase 0
- New payment processors
- Mobile app
- Performance micro-optimizations unrelated to P0/P1
- Rich HTML note rendering with DOMPurify (optional later; plain text is secure enough for now)

---

## Session protocol (every time we work)

1. Open this file first.  
2. Confirm **CURRENT FOCUS**.  
3. Do only that task.  
4. Mark task done; move CURRENT FOCUS to the next numbered task.  
5. If you want to change the plan, say so explicitly — I will amend this file or refuse.

**Magic phrases you can use:**
- “What’s my one task?” → I point at CURRENT FOCUS only  
- “I want to do X instead” → I check the plan; if X is not next, I redirect or park it  
- “Update the plan” → We amend this file together, then continue  

---

## Progress log

| Date | Change |
|------|--------|
| 2026-07-21 | Plan created from codebase review. Phase 0.1 set as CURRENT FOCUS. |
| 2026-07-21 | **0.1 DONE:** Locked role/status on member owner updates; pastors cannot change role; only admin assigns roles. Added `__tests__/security/member-role-lock.rules.test.ts`. Emulator tests pending Java/`firebase-tools` on this machine. **You must deploy `firestore.rules` for production effect.** CURRENT FOCUS → 0.2 |
| 2026-07-21 | **0.1 DEPLOYED:** `firestore.rules` released to Firebase project `shepherd-cms-ba981`. Role lock is live. |
| 2026-07-21 | **0.2 DONE:** Removed all `dangerouslySetInnerHTML` from `src`. Notes expand/preview use `noteDisplayText` / `toSafePlainText`. Added `src/utils/safe-html.ts` + 6 passing tests. CURRENT FOCUS → 0.3 |
| 2026-07-21 | **0.3 DONE:** Fixed donation/giving links in Navigation, AdminDashboard, DonationInsightsWidget, MyGivingWidget. Removed dead `/donations/categories`. Nav tests updated & passing. CURRENT FOCUS → 0.4 |
| | | **Parked (not 0.3):** other dead dashboard links like `/profile`, `/member-care`, `/admin/audit-logs` — add later if needed |
| 2026-07-21 | **0.4 DONE:** All donation management routes use router `RoleGuard` admin-only (record/batch/edit/create/detail/list). Pages aligned. Pastor denied on record/batch (tests). Decision: pastors use `/giving-overview` only. CURRENT FOCUS → 0.5 |
| 2026-07-21 | **0.5 DONE / Phase 0 COMPLETE:** Scrubbed pastor Record Donation button/modal; giving tab + activity donation fetch + useMemberDonations admin/own-only. Pastor → `/giving-overview` only for financials. CURRENT FOCUS → Phase 1.1 (await start command) |
| 2026-07-21 | **0.6a DONE (app):** Public register locked — `/register` is invite-only message; Login link removed; `signUp()` throws. QR `/register/qr` unchanged. Still need Auth blocking function for API-level signup. |

---

## Commitment

I am up for this. My job is the bigger picture and the leash. Your job is one focused build step at a time.

We will not rebuild everything at once. We will stabilize, gate, simplify, prove, then reintegrate — in that order.
