// src/services/firebase/facades/donations-facade.ts
// Narrow entry point for donations Firebase services
// Import only when the donations feature flag is on
// RELEVANT FILES: src/services/firebase/donations.service.ts, src/services/firebase/donation-categories.service.ts, src/config/features.ts

import { donationsService } from '../donations.service';
import { donationCategoriesService } from '../donation-categories.service';
import { donationStatementsService } from '../donationStatements.service';

export { DonationsService, donationsService } from '../donations.service';
export {
  DonationCategoriesService,
  donationCategoriesService,
} from '../donation-categories.service';
export {
  DonationStatementsService,
  donationStatementsService,
} from '../donationStatements.service';

export const donationsFacade = {
  donations: donationsService,
  categories: donationCategoriesService,
  statements: donationStatementsService,
} as const;
