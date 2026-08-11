# Quarantined converters (Phase 2.3)

These files are **not** part of the active Firestore translation path.
Do **not** import them from app or service code.

| File | Why quarantined |
|------|-----------------|
| `firestore-field-mapper.ts` | Snake_case mapper — Firestore + TypeScript both use camelCase; never use |
| `legacy-event-converters.ts` | Old `startTime`/`endTime` LegacyEvent shape — live events use `startDate`/`endDate` |
| `content-converters.ts` | No content/sermons module yet |
| `volunteer-converters.ts` | No volunteer module yet |

**Canonical path:** import from `src/utils/firestore-converters` (re-exports `src/utils/converters/*`).
