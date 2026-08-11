// src/services/firebase/facades/events-facade.ts
// Narrow entry point for events + RSVP Firebase services
// Import only when the events feature flag is on
// RELEVANT FILES: src/services/firebase/events.service.ts, src/services/firebase/event-rsvp.service.ts, src/config/features.ts

import { eventsService } from '../events.service';
import { eventRSVPService } from '../event-rsvp.service';

export { EventsService, eventsService } from '../events.service';
export { EventRSVPService, eventRSVPService } from '../event-rsvp.service';

export const eventsFacade = {
  events: eventsService,
  eventRSVPs: eventRSVPService,
} as const;
