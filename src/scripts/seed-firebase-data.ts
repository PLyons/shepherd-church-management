// ============================================================================
// FIREBASE DATA SEEDING SCRIPT
// ============================================================================
// Creates realistic test data for Shepherd CMS in Firebase Firestore

import { firebaseService } from '../services/firebase';

// ============================================================================
// TEST DATA DEFINITIONS
// ============================================================================

const TEST_HOUSEHOLDS = [
  {
    familyName: 'Smith Family',
    address: {
      line1: '123 Oak Street',
      line2: '',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62701',
      country: 'US',
    },
  },
  {
    familyName: 'Johnson Family',
    address: {
      line1: '456 Maple Avenue',
      line2: 'Apt 2B',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62702',
      country: 'US',
    },
  },
  {
    familyName: 'Williams Family',
    address: {
      line1: '789 Pine Road',
      line2: '',
      city: 'Chatham',
      state: 'IL',
      postalCode: '62629',
      country: 'US',
    },
  },
  {
    familyName: 'Brown Family',
    address: {
      line1: '321 Elm Drive',
      line2: '',
      city: 'Sherman',
      state: 'IL',
      postalCode: '62684',
      country: 'US',
    },
  },
  {
    familyName: 'Davis Family',
    address: {
      line1: '654 Cedar Lane',
      line2: 'Unit 5',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62703',
      country: 'US',
    },
  },
  {
    familyName: 'Miller Family',
    address: {
      line1: '987 Birch Circle',
      line2: '',
      city: 'Rochester',
      state: 'IL',
      postalCode: '62563',
      country: 'US',
    },
  },
];

const TEST_MEMBERS = [
  // Smith Family (2 members)
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '217-555-0101',
    birthdate: '1985-03-15',
    gender: 'Male' as const,
    role: 'admin' as const,
    memberStatus: 'active' as const,
    joinedAt: '2020-01-15',
    isPrimaryContact: true,
    householdIndex: 0,
  },
  {
    firstName: 'Sarah',
    lastName: 'Smith',
    email: 'sarah.smith@email.com',
    phone: '217-555-0102',
    birthdate: '1987-07-22',
    gender: 'Female' as const,
    role: 'member' as const,
    memberStatus: 'active' as const,
    joinedAt: '2020-01-15',
    isPrimaryContact: false,
    householdIndex: 0,
  },

  // Johnson Family (3 members)
  {
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.johnson@email.com',
    phone: '217-555-0201',
    birthdate: '1975-11-08',
    gender: 'Male' as const,
    role: 'pastor' as const,
    memberStatus: 'active' as const,
    joinedAt: '2018-06-01',
    isPrimaryContact: true,
    householdIndex: 1,
  },
  {
    firstName: 'Lisa',
    lastName: 'Johnson',
    email: 'lisa.johnson@email.com',
    phone: '217-555-0202',
    birthdate: '1978-02-14',
    gender: 'Female' as const,
    role: 'member' as const,
    memberStatus: 'active' as const,
    joinedAt: '2018-06-01',
    isPrimaryContact: false,
    householdIndex: 1,
  },
  {
    firstName: 'Emma',
    lastName: 'Johnson',
    email: 'emma.johnson@email.com',
    phone: '',
    birthdate: '2005-09-12',
    gender: 'Female' as const,
    role: 'member' as const,
    memberStatus: 'active' as const,
    joinedAt: '2018-06-01',
    isPrimaryContact: false,
    householdIndex: 1,
  },

  // Williams Family (2 members)
  {
    firstName: 'David',
    lastName: 'Williams',
    email: 'david.williams@email.com',
    phone: '217-555-0301',
    birthdate: '1990-05-30',
    gender: 'Male' as const,
    role: 'member' as const,
    memberStatus: 'active' as const,
    joinedAt: '2021-03-20',
    isPrimaryContact: true,
    householdIndex: 2,
  },
  {
    firstName: 'Jennifer',
    lastName: 'Williams',
    email: 'jennifer.williams@email.com',
    phone: '217-555-0302',
    birthdate: '1992-12-03',
    gender: 'Female' as const,
    role: 'member' as const,
    memberStatus: 'active' as const,
    joinedAt: '2021-03-20',
    isPrimaryContact: false,
    householdIndex: 2,
  },

  // Brown Family (4 members)
  {
    firstName: 'Robert',
    lastName: 'Brown',
    email: 'robert.brown@email.com',
    phone: '217-555-0401',
    birthdate: '1970-08-17',
    gender: 'Male' as const,
    role: 'member' as const,
    memberStatus: 'active' as const,
    joinedAt: '2019-09-08',
    isPrimaryContact: true,
    householdIndex: 3,
  },
  {
    firstName: 'Nancy',
    lastName: 'Brown',
    email: 'nancy.brown@email.com',
    phone: '217-555-0402',
    birthdate: '1972-01-25',
    gender: 'Female' as const,
    role: 'member' as const,
    memberStatus: 'active' as const,
    joinedAt: '2019-09-08',
    isPrimaryContact: false,
    householdIndex: 3,
  },
  {
    firstName: 'Tyler',
    lastName: 'Brown',
    email: 'tyler.brown@email.com',
    phone: '',
    birthdate: '2000-04-10',
    gender: 'Male' as const,
    role: 'member' as const,
    memberStatus: 'active' as const,
    joinedAt: '2019-09-08',
    isPrimaryContact: false,
    householdIndex: 3,
  },
  {
    firstName: 'Ashley',
    lastName: 'Brown',
    email: 'ashley.brown@email.com',
    phone: '',
    birthdate: '2003-06-18',
    gender: 'Female' as const,
    role: 'member' as const,
    memberStatus: 'active' as const,
    joinedAt: '2019-09-08',
    isPrimaryContact: false,
    householdIndex: 3,
  },

  // Davis Family (2 members)
  {
    firstName: 'James',
    lastName: 'Davis',
    email: 'james.davis@email.com',
    phone: '217-555-0501',
    birthdate: '1995-10-12',
    gender: 'Male' as const,
    role: 'member' as const,
    memberStatus: 'active' as const,
    joinedAt: '2022-05-15',
    isPrimaryContact: true,
    householdIndex: 4,
  },
  {
    firstName: 'Jessica',
    lastName: 'Davis',
    email: 'jessica.davis@email.com',
    phone: '217-555-0502',
    birthdate: '1997-03-28',
    gender: 'Female' as const,
    role: 'member' as const,
    memberStatus: 'active' as const,
    joinedAt: '2022-05-15',
    isPrimaryContact: false,
    householdIndex: 4,
  },

  // Miller Family (1 member)
  {
    firstName: 'Mary',
    lastName: 'Miller',
    email: 'mary.miller@email.com',
    phone: '217-555-0601',
    birthdate: '1945-12-20',
    gender: 'Female' as const,
    role: 'member' as const,
    memberStatus: 'active' as const,
    joinedAt: '2015-04-12',
    isPrimaryContact: true,
    householdIndex: 5,
  },
];

const TEST_EVENTS = [
  {
    title: 'Sunday Morning Worship',
    description:
      'Join us for our weekly worship service with contemporary music and biblical teaching.',
    startTime: '2024-01-28T10:00:00.000Z',
    endTime: '2024-01-28T11:30:00.000Z',
    location: 'Main Sanctuary',
    isPublic: true,
    maxCapacity: 200,
    registrationDeadline: '2024-01-27T23:59:59.000Z',
  },
  {
    title: 'Wednesday Bible Study',
    description:
      'Mid-week Bible study focusing on the Book of Romans. All are welcome!',
    startTime: '2024-01-31T19:00:00.000Z',
    endTime: '2024-01-31T20:30:00.000Z',
    location: 'Fellowship Hall',
    isPublic: true,
    maxCapacity: 50,
    registrationDeadline: '2024-01-30T17:00:00.000Z',
  },
  {
    title: 'Youth Group Meeting',
    description: 'Monthly youth gathering with games, discussion, and pizza!',
    startTime: '2024-02-03T18:00:00.000Z',
    endTime: '2024-02-03T20:00:00.000Z',
    location: 'Youth Room',
    isPublic: false,
    maxCapacity: 30,
    registrationDeadline: '2024-02-02T17:00:00.000Z',
  },
];

// ============================================================================
// SEEDING FUNCTIONS
// ============================================================================

export async function seedHouseholds(): Promise<string[]> {
  console.log('🏠 Creating test households...');
  const householdIds: string[] = [];

  for (let i = 0; i < TEST_HOUSEHOLDS.length; i++) {
    const householdData = TEST_HOUSEHOLDS[i];
    try {
      const household = await firebaseService.households.create({
        ...householdData,
        memberIds: [],
        memberCount: 0,
      });
      householdIds.push(household.id);
      console.log(
        `✓ Created household: ${household.familyName} (${household.id})`
      );
    } catch (error) {
      console.error(
        `✗ Failed to create household ${householdData.familyName}:`,
        error
      );
      throw error;
    }
  }

  return householdIds;
}

export async function seedMembers(householdIds: string[]): Promise<string[]> {
  console.log('👥 Creating test members...');
  const memberIds: string[] = [];

  for (let i = 0; i < TEST_MEMBERS.length; i++) {
    const memberData = TEST_MEMBERS[i];
    const householdId = householdIds[memberData.householdIndex];
    const householdName = TEST_HOUSEHOLDS[memberData.householdIndex].familyName;

    try {
      // Create member with household relationship
      const result = await firebaseService.createMemberWithHousehold({
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        email: memberData.email,
        phone: memberData.phone || undefined,
        birthdate: memberData.birthdate,
        gender: memberData.gender,
        role: memberData.role,
        memberStatus: memberData.memberStatus,
        joinedAt: memberData.joinedAt,
        isPrimaryContact: memberData.isPrimaryContact,
        existingHouseholdId: householdId,
      });

      memberIds.push(result.member.id);
      console.log(
        `✓ Created member: ${memberData.firstName} ${memberData.lastName} (${result.member.id})`
      );

      // Set as primary contact if needed
      if (memberData.isPrimaryContact) {
        console.log(`  → Set as primary contact for ${householdName}`);
      }
    } catch (error) {
      console.error(
        `✗ Failed to create member ${memberData.firstName} ${memberData.lastName}:`,
        error
      );
      throw error;
    }
  }

  return memberIds;
}

export async function seedEvents(
  createdByMemberId?: string
): Promise<string[]> {
  console.log('📅 Skipping event seeding (events feature removed)...');
  return [];
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

export async function seedFirebaseData(options?: {
  skipHouseholds?: boolean;
  skipMembers?: boolean;
  skipEvents?: boolean;
  clearExisting?: boolean;
}): Promise<{
  success: boolean;
  summary: {
    households: number;
    members: number;
    events: number;
  };
  errors: string[];
}> {
  const startTime = Date.now();
  const errors: string[] = [];
  let householdCount = 0;
  let memberCount = 0;
  let eventCount = 0;

  console.log('🌱 Starting Firebase data seeding...\n');

  try {
    // Test Firebase connection first
    console.log('1. Testing Firebase connection...');
    const connectionTest = await firebaseService.testConnection();
    if (!connectionTest.canWrite) {
      throw new Error(`Firebase connection failed: ${connectionTest.error}`);
    }
    console.log('✓ Firebase connection successful\n');

    // Clear existing data if requested
    if (options?.clearExisting) {
      console.log('2. Clearing existing data...');
      const counts = await firebaseService.getCollectionCounts();
      if (counts.members > 0 || counts.households > 0 || counts.events > 0) {
        console.log(
          `   Found existing data: ${counts.members} members, ${counts.households} households, ${counts.events} events`
        );

        // Clear in reverse dependency order
        if (counts.members > 0) {
          const members = await firebaseService.members.getAll();
          await firebaseService.members.deleteBatch(members.map((m) => m.id));
          console.log(`   Cleared ${members.length} existing members`);
        }

        if (counts.households > 0) {
          const households = await firebaseService.households.getAll();
          await firebaseService.households.deleteBatch(
            households.map((h) => h.id)
          );
          console.log(`   Cleared ${households.length} existing households`);
        }

        // Event clearing skipped (events feature removed)
      } else {
        console.log('   No existing data to clear');
      }
      console.log('✓ Data clearing complete\n');
    }

    // Seed households
    let householdIds: string[] = [];
    if (!options?.skipHouseholds) {
      console.log('3. Seeding households...');
      householdIds = await seedHouseholds();
      householdCount = householdIds.length;
      console.log(`✓ Created ${householdCount} households\n`);
    }

    // Seed members
    let memberIds: string[] = [];
    if (!options?.skipMembers) {
      console.log('4. Seeding members...');
      if (householdIds.length === 0) {
        console.log('   Getting existing households...');
        const existingHouseholds = await firebaseService.households.getAll();
        householdIds = existingHouseholds.map((h) => h.id);
        console.log(`   Found ${householdIds.length} existing households`);
      }

      if (householdIds.length === 0) {
        throw new Error('Cannot create members: no households available');
      }

      memberIds = await seedMembers(householdIds);
      memberCount = memberIds.length;
      console.log(`✓ Created ${memberCount} members\n`);
    }

    // Seed events
    if (!options?.skipEvents) {
      console.log('5. Seeding events...');
      let createdByMemberId: string | undefined;

      if (memberIds.length === 0) {
        console.log('   Getting existing members...');
        const existingMembers = await firebaseService.members.getAll();
        if (existingMembers.length > 0) {
          // Use first admin or pastor, otherwise first member
          const adminOrPastor = existingMembers.find(
            (m) => m.role === 'admin' || m.role === 'pastor'
          );
          createdByMemberId = adminOrPastor?.id || existingMembers[0].id;
        }
      } else {
        // Use first created member (John Smith - admin)
        createdByMemberId = memberIds[0];
      }

      const eventIds = await seedEvents(createdByMemberId);
      eventCount = eventIds.length;
      console.log(`✓ Created ${eventCount} events\n`);
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('✅ Firebase data seeding completed successfully!');
    console.log(
      `📊 Summary: ${householdCount} households, ${memberCount} members, ${eventCount} events`
    );
    console.log(`⏱️  Duration: ${duration}s\n`);

    return {
      success: true,
      summary: {
        households: householdCount,
        members: memberCount,
        events: eventCount,
      },
      errors,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('\n❌ Firebase seeding failed:', errorMessage);
    errors.push(errorMessage);

    return {
      success: false,
      summary: {
        households: householdCount,
        members: memberCount,
        events: eventCount,
      },
      errors,
    };
  }
}

// Export for CLI usage
export default {
  seedFirebaseData,
  seedHouseholds,
  seedMembers,
  seedEvents,
};
