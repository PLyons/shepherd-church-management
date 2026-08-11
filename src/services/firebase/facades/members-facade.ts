// src/services/firebase/facades/members-facade.ts
// Narrow entry point for member + household Firebase services
// Use this (or direct *.service imports) on the member-core path — not FirebaseService
// RELEVANT FILES: src/services/firebase/members.service.ts, src/services/firebase/households.service.ts, src/pages/Members.tsx

import { membersService } from '../members.service';
import { householdsService } from '../households.service';
import { rolesService } from '../roles.service';
import { membershipHistoryService } from '../membershipHistory.service';
import { notesService } from '../notes.service';
import { activityService } from '../activity.service';

export { MembersService, membersService } from '../members.service';
export { HouseholdsService, householdsService } from '../households.service';
export { RolesService, rolesService } from '../roles.service';
export { membershipHistoryService } from '../membershipHistory.service';
export { notesService } from '../notes.service';
export { activityService } from '../activity.service';

/** Sync bag of member-core services — no events or donations. */
export const membersFacade = {
  members: membersService,
  households: householdsService,
  roles: rolesService,
  membershipHistory: membershipHistoryService,
  notes: notesService,
  activity: activityService,
} as const;
