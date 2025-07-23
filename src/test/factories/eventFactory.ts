import { faker } from '@faker-js/faker';

// Define types based on the project structure
export interface MockEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  maxAttendees?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface MockRSVP {
  id: string;
  eventId: string;
  memberId: string;
  status: 'attending' | 'not_attending' | 'maybe';
  createdAt: Date;
  updatedAt: Date;
}

export const createMockEvent = (
  overrides: Partial<MockEvent> = {}
): MockEvent => {
  const startDate = faker.date.future();
  const endDate = new Date(
    startDate.getTime() + faker.number.int({ min: 1, max: 4 }) * 60 * 60 * 1000
  );

  return {
    id: faker.string.uuid(),
    title: faker.helpers.arrayElement([
      'Sunday Service',
      'Bible Study',
      'Youth Group',
      "Women's Fellowship",
      "Men's Breakfast",
      'Community Outreach',
      'Prayer Meeting',
      'Choir Practice',
    ]),
    description: faker.lorem.paragraph(),
    startDate,
    endDate,
    location: faker.helpers.arrayElement([
      'Main Sanctuary',
      'Fellowship Hall',
      'Youth Room',
      'Conference Room',
      'Community Center',
      'Church Parking Lot',
    ]),
    maxAttendees: faker.number.int({ min: 10, max: 200 }),
    createdBy: faker.string.uuid(),
    isActive: true,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
};

export const createMockRSVP = (overrides: Partial<MockRSVP> = {}): MockRSVP => {
  return {
    id: faker.string.uuid(),
    eventId: faker.string.uuid(),
    memberId: faker.string.uuid(),
    status: faker.helpers.arrayElement(['attending', 'not_attending', 'maybe']),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
};

export const createMockEvents = (count: number = 5): MockEvent[] => {
  return Array.from({ length: count }, () => createMockEvent());
};

export const createMockRSVPs = (count: number = 10): MockRSVP[] => {
  return Array.from({ length: count }, () => createMockRSVP());
};

export const createMockEventWithRSVPs = (rsvpCount: number = 5) => {
  const event = createMockEvent();
  const rsvps = Array.from({ length: rsvpCount }, () =>
    createMockRSVP({ eventId: event.id })
  );

  return { event, rsvps };
};
