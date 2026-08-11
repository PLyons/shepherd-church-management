// src/services/firebase/index.ts
// Barrel re-exports for Firebase services (backward compatible)
// Member-core code should import from facades/members-facade or *.service files (Phase 2.1)
// RELEVANT FILES: src/services/firebase/facades/members-facade.ts, src/services/firebase/unified-firebase.service.ts

export { BaseFirestoreService } from './base.service';
export { MembersService, membersService } from './members.service';
export { HouseholdsService, householdsService } from './households.service';
export { EventsService, eventsService } from './events.service';
export { EventRSVPService, eventRSVPService } from './event-rsvp.service';
export { DonationsService, donationsService } from './donations.service';
export {
  DonationCategoriesService,
  donationCategoriesService,
} from './donation-categories.service';
export {
  DonationStatementsService,
  donationStatementsService,
} from './donationStatements.service';

// Lazy unified facade — prefer module facades for new / member-core code
export {
  FirebaseService,
  firebase,
  firebaseService,
  getFirebaseService,
} from './unified-firebase.service';
