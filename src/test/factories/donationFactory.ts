import { faker } from '@faker-js/faker';

export interface MockDonation {
  id: string;
  memberId: string;
  amount: number;
  date: Date;
  method: 'cash' | 'check' | 'credit_card' | 'bank_transfer';
  category: string;
  notes?: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const createMockDonation = (
  overrides: Partial<MockDonation> = {}
): MockDonation => {
  return {
    id: faker.string.uuid(),
    memberId: faker.string.uuid(),
    amount: faker.number.float({ min: 5, max: 1000, multipleOf: 0.01 }),
    date: faker.date.past(),
    method: faker.helpers.arrayElement([
      'cash',
      'check',
      'credit_card',
      'bank_transfer',
    ]),
    category: faker.helpers.arrayElement([
      'Tithe',
      'Offering',
      'Building Fund',
      'Missions',
      'Youth Ministry',
      'Music Ministry',
      'Special Events',
      'Emergency Fund',
    ]),
    notes: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
    isAnonymous: faker.datatype.boolean({ probability: 0.1 }), // 10% chance of anonymous
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
};

export const createMockDonations = (count: number = 10): MockDonation[] => {
  return Array.from({ length: count }, () => createMockDonation());
};

export const createMockDonationsForMember = (
  memberId: string,
  count: number = 5
): MockDonation[] => {
  return Array.from({ length: count }, () => createMockDonation({ memberId }));
};

export const createMockYearlyDonations = (
  year: number,
  memberCount: number = 10
) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const donations: MockDonation[] = [];

  for (let i = 0; i < memberCount; i++) {
    const memberId = faker.string.uuid();
    const donationCount = faker.number.int({ min: 12, max: 52 }); // 12-52 donations per year

    for (let j = 0; j < donationCount; j++) {
      donations.push(
        createMockDonation({
          memberId,
          date: faker.date.between({ from: startDate, to: endDate }),
        })
      );
    }
  }

  return donations.sort((a, b) => a.date.getTime() - b.date.getTime());
};
