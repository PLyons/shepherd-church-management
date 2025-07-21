// ============================================================================
// SUPABASE TO FIREBASE MIGRATION SCRIPT
// ============================================================================
// Migrates data from Supabase PostgreSQL to Firebase Firestore

import { supabase } from '../lib/supabase';
import { firebaseService } from '../services/firebase';
import type { Database } from '../types/supabase';

// Types from Supabase
type SupabaseMember = Database['public']['Tables']['members']['Row'];
type SupabaseHousehold = Database['public']['Tables']['households']['Row'];
type SupabaseEvent = Database['public']['Tables']['events']['Row'];

interface MigrationResult {
  success: number;
  errors: { id: string | number; error: string }[];
}

interface MigrationSummary {
  households: MigrationResult;
  members: MigrationResult;
  events: MigrationResult;
  totalDuration: number;
  warnings: string[];
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Test both database connections
 */
export async function testConnections(): Promise<{
  supabase: boolean;
  firebase: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let supabaseOk = false;
  let firebaseOk = false;

  // Test Supabase
  try {
    const { data, error } = await supabase
      .from('members')
      .select('id')
      .limit(1);
    
    if (error) {
      errors.push(`Supabase error: ${error.message}`);
    } else {
      supabaseOk = true;
    }
  } catch (error) {
    errors.push(`Supabase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Test Firebase
  try {
    const result = await firebaseService.testConnection();
    if (result.error) {
      errors.push(`Firebase error: ${result.error}`);
    } else {
      firebaseOk = result.canRead && result.canWrite;
    }
  } catch (error) {
    errors.push(`Firebase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { supabase: supabaseOk, firebase: firebaseOk, errors };
}

/**
 * Get data counts from both systems for comparison
 */
export async function getDataCounts(): Promise<{
  supabase: { members: number; households: number; events: number };
  firebase: { members: number; households: number; events: number };
}> {
  // Get Supabase counts
  const [membersResult, householdsResult, eventsResult] = await Promise.all([
    supabase.from('members').select('id', { count: 'exact', head: true }),
    supabase.from('households').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true })
  ]);

  const supabaseCounts = {
    members: membersResult.count || 0,
    households: householdsResult.count || 0,
    events: eventsResult.count || 0
  };

  // Get Firebase counts
  const firebaseCounts = await firebaseService.getCollectionCounts();

  return { supabase: supabaseCounts, firebase: firebaseCounts };
}

/**
 * Migrate households from Supabase to Firebase
 */
async function migrateHouseholds(): Promise<MigrationResult> {
  const result: MigrationResult = { success: 0, errors: [] };

  try {
    // Fetch all households from Supabase
    const { data: households, error } = await supabase
      .from('households')
      .select('*')
      .order('created_at');

    if (error) {
      throw new Error(`Failed to fetch households: ${error.message}`);
    }

    if (!households || households.length === 0) {
      console.log('No households found to migrate');
      return result;
    }

    console.log(`Migrating ${households.length} households...`);

    // Migrate each household
    for (const household of households) {
      try {
        await firebaseService.households.create({
          id: household.id.toString(), // Convert UUID to string
          familyName: household.family_name,
          address: {
            line1: household.address_line1 || '',
            line2: household.address_line2 || '',
            city: household.city || '',
            state: household.state || '',
            postalCode: household.postal_code || '',
            country: household.country || 'US'
          },
          primaryContactId: household.primary_contact_id?.toString(),
          primaryContactName: household.primary_contact_name || undefined,
          memberIds: [], // Will be populated when migrating members
          memberCount: 0, // Will be updated when migrating members
          createdAt: household.created_at,
          updatedAt: household.updated_at
        }, household.id.toString());

        result.success++;
        console.log(`✓ Migrated household: ${household.family_name}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push({ id: household.id, error: errorMsg });
        console.error(`✗ Failed to migrate household ${household.family_name}:`, errorMsg);
      }
    }
  } catch (error) {
    console.error('Error in household migration:', error);
    result.errors.push({ id: 'general', error: error instanceof Error ? error.message : 'Unknown error' });
  }

  return result;
}

/**
 * Migrate members from Supabase to Firebase
 */
async function migrateMembers(): Promise<MigrationResult> {
  const result: MigrationResult = { success: 0, errors: [] };

  try {
    // Fetch all members from Supabase with household info
    const { data: members, error } = await supabase
      .from('members')
      .select(`
        *,
        households!inner(family_name)
      `)
      .order('created_at');

    if (error) {
      throw new Error(`Failed to fetch members: ${error.message}`);
    }

    if (!members || members.length === 0) {
      console.log('No members found to migrate');
      return result;
    }

    console.log(`Migrating ${members.length} members...`);

    // Migrate each member
    for (const member of members) {
      try {
        // Use auth_uid if available, otherwise use member ID
        const documentId = member.auth_uid || member.id.toString();
        
        const memberData = {
          id: member.id.toString(),
          firstName: member.first_name,
          lastName: member.last_name,
          email: member.email,
          phone: member.phone || undefined,
          birthdate: member.birthdate || undefined,
          gender: member.gender as 'Male' | 'Female' | undefined,
          role: (member.role as 'admin' | 'pastor' | 'member') || 'member',
          memberStatus: (member.member_status as 'active' | 'inactive' | 'visitor') || 'active',
          joinedAt: member.joined_at || undefined,
          householdId: member.household_id.toString(),
          householdName: (member.households as any)?.family_name,
          isPrimaryContact: member.is_primary_contact || false,
          fullName: `${member.first_name} ${member.last_name}`,
          createdAt: member.created_at,
          updatedAt: member.updated_at
        };

        await firebaseService.members.create(memberData, documentId);

        // Add member to household
        await firebaseService.households.addMemberToHousehold(
          member.household_id.toString(),
          documentId
        );

        // Set as primary contact if applicable
        if (member.is_primary_contact) {
          await firebaseService.households.setPrimaryContact(
            member.household_id.toString(),
            documentId,
            memberData.fullName
          );
        }

        result.success++;
        console.log(`✓ Migrated member: ${memberData.fullName}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push({ id: member.id, error: errorMsg });
        console.error(`✗ Failed to migrate member ${member.first_name} ${member.last_name}:`, errorMsg);
      }
    }
  } catch (error) {
    console.error('Error in member migration:', error);
    result.errors.push({ id: 'general', error: error instanceof Error ? error.message : 'Unknown error' });
  }

  return result;
}

/**
 * Migrate events from Supabase to Firebase
 */
async function migrateEvents(): Promise<MigrationResult> {
  const result: MigrationResult = { success: 0, errors: [] };

  try {
    // Fetch all events from Supabase
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at');

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`);
    }

    if (!events || events.length === 0) {
      console.log('No events found to migrate');
      return result;
    }

    console.log(`Migrating ${events.length} events...`);

    // Migrate each event
    for (const event of events) {
      try {
        await firebaseService.events.create({
          id: event.id.toString(),
          title: event.title,
          description: event.description || undefined,
          startTime: event.start_time,
          endTime: event.end_time || undefined,
          location: event.location || undefined,
          isPublic: event.is_public || false,
          maxCapacity: event.max_capacity || undefined,
          registrationDeadline: event.registration_deadline || undefined,
          createdBy: event.created_by?.toString(),
          categoryId: event.category_id?.toString(),
          rsvpStats: {
            yes: 0,
            no: 0,
            maybe: 0,
            total: 0
          },
          createdAt: event.created_at,
          updatedAt: event.updated_at
        }, event.id.toString());

        result.success++;
        console.log(`✓ Migrated event: ${event.title}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push({ id: event.id, error: errorMsg });
        console.error(`✗ Failed to migrate event ${event.title}:`, errorMsg);
      }
    }
  } catch (error) {
    console.error('Error in event migration:', error);
    result.errors.push({ id: 'general', error: error instanceof Error ? error.message : 'Unknown error' });
  }

  return result;
}

// ============================================================================
// MAIN MIGRATION FUNCTION
// ============================================================================

/**
 * Run complete migration from Supabase to Firebase
 */
export async function runMigration(options?: {
  skipHouseholds?: boolean;
  skipMembers?: boolean;
  skipEvents?: boolean;
  dryRun?: boolean;
}): Promise<MigrationSummary> {
  const startTime = Date.now();
  const warnings: string[] = [];

  console.log('🚀 Starting Supabase to Firebase migration...\n');

  // Test connections first
  console.log('1. Testing database connections...');
  const connectionTest = await testConnections();
  if (!connectionTest.supabase || !connectionTest.firebase) {
    throw new Error(`Connection test failed: ${connectionTest.errors.join(', ')}`);
  }
  console.log('✓ Both databases are accessible\n');

  // Show data counts
  console.log('2. Checking data counts...');
  const counts = await getDataCounts();
  console.log(`Supabase: ${counts.supabase.households} households, ${counts.supabase.members} members, ${counts.supabase.events} events`);
  console.log(`Firebase: ${counts.firebase.households} households, ${counts.firebase.members} members, ${counts.firebase.events} events\n`);

  if (counts.firebase.members > 0 || counts.firebase.households > 0 || counts.firebase.events > 0) {
    warnings.push('Firebase already contains data. Migration will add to existing data.');
  }

  if (options?.dryRun) {
    console.log('🔍 DRY RUN MODE - No data will be migrated\n');
    return {
      households: { success: 0, errors: [] },
      members: { success: 0, errors: [] },
      events: { success: 0, errors: [] },
      totalDuration: Date.now() - startTime,
      warnings
    };
  }

  // Run migrations in order (households first, then members, then events)
  const results: MigrationSummary = {
    households: { success: 0, errors: [] },
    members: { success: 0, errors: [] },
    events: { success: 0, errors: [] },
    totalDuration: 0,
    warnings
  };

  // Migrate households first
  if (!options?.skipHouseholds) {
    console.log('3. Migrating households...');
    results.households = await migrateHouseholds();
    console.log(`Households: ${results.households.success} migrated, ${results.households.errors.length} errors\n`);
  }

  // Migrate members (depends on households)
  if (!options?.skipMembers) {
    console.log('4. Migrating members...');
    results.members = await migrateMembers();
    console.log(`Members: ${results.members.success} migrated, ${results.members.errors.length} errors\n`);
  }

  // Migrate events
  if (!options?.skipEvents) {
    console.log('5. Migrating events...');
    results.events = await migrateEvents();
    console.log(`Events: ${results.events.success} migrated, ${results.events.errors.length} errors\n`);
  }

  results.totalDuration = Date.now() - startTime;

  console.log('✅ Migration completed!');
  console.log(`Total time: ${Math.round(results.totalDuration / 1000)}s`);
  console.log(`Total success: ${results.households.success + results.members.success + results.events.success}`);
  console.log(`Total errors: ${results.households.errors.length + results.members.errors.length + results.events.errors.length}`);

  return results;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clear all Firebase data (use with caution)
 */
export async function clearFirebaseData(): Promise<void> {
  console.log('⚠️  WARNING: This will delete ALL data in Firebase!');
  
  const counts = await firebaseService.getCollectionCounts();
  const totalDocs = counts.members + counts.households + counts.events;
  
  if (totalDocs === 0) {
    console.log('No data to clear.');
    return;
  }

  console.log(`About to delete: ${counts.members} members, ${counts.households} households, ${counts.events} events`);
  
  // Delete all members
  const members = await firebaseService.members.getAll();
  if (members.length > 0) {
    await firebaseService.members.deleteBatch(members.map(m => m.id));
    console.log(`Deleted ${members.length} members`);
  }

  // Delete all households
  const households = await firebaseService.households.getAll();
  if (households.length > 0) {
    await firebaseService.households.deleteBatch(households.map(h => h.id));
    console.log(`Deleted ${households.length} households`);
  }

  // Delete all events
  const events = await firebaseService.events.getAll();
  if (events.length > 0) {
    await firebaseService.events.deleteBatch(events.map(e => e.id));
    console.log(`Deleted ${events.length} events`);
  }

  console.log('✅ All Firebase data cleared');
}

/**
 * Verify migration integrity
 */
export async function verifyMigration(): Promise<{
  isValid: boolean;
  issues: string[];
  summary: {
    supabase: { members: number; households: number; events: number };
    firebase: { members: number; households: number; events: number };
  };
}> {
  console.log('🔍 Verifying migration integrity...');
  
  const counts = await getDataCounts();
  const issues: string[] = [];

  // Check if counts match
  if (counts.supabase.households !== counts.firebase.households) {
    issues.push(`Household count mismatch: Supabase=${counts.supabase.households}, Firebase=${counts.firebase.households}`);
  }

  if (counts.supabase.members !== counts.firebase.members) {
    issues.push(`Member count mismatch: Supabase=${counts.supabase.members}, Firebase=${counts.firebase.members}`);
  }

  if (counts.supabase.events !== counts.firebase.events) {
    issues.push(`Event count mismatch: Supabase=${counts.supabase.events}, Firebase=${counts.firebase.events}`);
  }

  // Run Firebase integrity check
  const integrityCheck = await firebaseService.performIntegrityCheck();
  issues.push(...integrityCheck.issues);

  const isValid = issues.length === 0;

  console.log(`Verification ${isValid ? '✅ PASSED' : '❌ FAILED'}`);
  if (issues.length > 0) {
    console.log('Issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }

  return {
    isValid,
    issues,
    summary: counts
  };
}

// Export for use in other scripts
export default {
  runMigration,
  testConnections,
  getDataCounts,
  clearFirebaseData,
  verifyMigration
};