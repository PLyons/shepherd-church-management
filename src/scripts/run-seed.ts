#!/usr/bin/env tsx
// ============================================================================
// FIREBASE SEEDING RUNNER SCRIPT
// ============================================================================
// Command-line utility to seed Firebase with test data

// IMPORTANT: Load environment variables FIRST before any other imports
import { config } from 'dotenv';
const result = config({ path: '.env.local' });

// Add fetch polyfill for Node.js (required for Firebase)
if (typeof globalThis.fetch === 'undefined') {
  const fetch = await import('node-fetch');
  globalThis.fetch = fetch.default as any;
  globalThis.Headers = fetch.Headers as any;
  globalThis.Request = fetch.Request as any;
  globalThis.Response = fetch.Response as any;
}

// Debug environment loading
console.log(
  'Environment loading result:',
  result.error ? result.error : 'Success'
);
console.log('Firebase API Key found:', !!process.env.VITE_FIREBASE_API_KEY);

// Command line argument parsing
const args = process.argv.slice(2);
const command = args[0];

// Show help
function showHelp() {
  console.log(`
Shepherd CMS - Firebase Data Seeding Tool

USAGE:
  npm run seed <command> [options]

COMMANDS:
  seed          Create all test data (households → members → events)
  clear         Clear all existing Firebase data (DANGEROUS!)
  count         Show current data counts in Firebase
  help          Show this help message
  
SEED OPTIONS:
  --clear           Clear existing data before seeding
  --skip-households Skip household creation
  --skip-members    Skip member creation  
  --skip-events     Skip event creation

EXAMPLES:
  npm run seed seed                    # Create all test data
  npm run seed seed --clear            # Clear existing data and create fresh test data
  npm run seed seed --skip-events      # Create households and members only
  npm run seed count                   # Show current data counts
  npm run seed clear                   # Clear all Firebase data

WHAT DATA IS CREATED:
  📊 6 Households: Smith, Johnson, Williams, Brown, Davis, Miller families
  👥 14 Members: Mix of adults and youth across households with realistic details
  📅 3 Events: Sunday Worship, Bible Study, Youth Group
  🔐 Admin Users: John Smith (admin), Michael Johnson (pastor)

NOTES:
  - This creates realistic test data for beta testing
  - All members have valid email addresses for authentication testing
  - Households have proper addresses in Springfield, IL area
  - Primary contacts are set appropriately
  - Events have realistic timing and capacity limits
`);
}

// Main execution
async function main() {
  if (
    !command ||
    command === 'help' ||
    command === '--help' ||
    command === '-h'
  ) {
    showHelp();
    return;
  }

  // Now import the seeding functions after env is loaded
  const { seedFirebaseData } = await import('./seed-firebase-data');
  const { nodeFirebaseService } = await import(
    '../services/firebase/node-firebase.service'
  );

  try {
    switch (command) {
      case 'count':
        console.log('📊 Checking Firebase data counts...\n');
        const counts = await nodeFirebaseService.getCollectionCounts();
        console.log('CURRENT FIREBASE DATA:');
        console.log(`  Households: ${counts.households}`);
        console.log(`  Members:    ${counts.members}`);
        console.log(`  Events:     ${counts.events}`);
        console.log(
          `  Total:      ${counts.households + counts.members + counts.events} documents`
        );
        break;

      case 'seed':
        const options = {
          clearExisting: args.includes('--clear'),
          skipHouseholds: args.includes('--skip-households'),
          skipMembers: args.includes('--skip-members'),
          skipEvents: args.includes('--skip-events'),
        };

        if (options.clearExisting) {
          console.log(
            '⚠️  WARNING: This will delete existing Firebase data first!\n'
          );
        }

        const seedResult = await seedFirebaseData(options);

        if (seedResult.success) {
          console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
          console.log('\n📋 FINAL SUMMARY:');
          console.log(`Households: ${seedResult.summary.households} created`);
          console.log(`Members:    ${seedResult.summary.members} created`);
          console.log(`Events:     ${seedResult.summary.events} created`);

          if (seedResult.summary.members > 0) {
            console.log('\n🔐 AUTHENTICATION READY:');
            console.log('You can now test Firebase Auth with these accounts:');
            console.log('• john.smith@email.com (Admin)');
            console.log('• michael.johnson@email.com (Pastor)');
            console.log('• sarah.smith@email.com (Member)');
            console.log('• david.williams@email.com (Member)');
            console.log('(Use password reset to set passwords for testing)');
          }

          console.log('\n✅ Your Firebase is now ready for beta testing!');
        } else {
          console.log('\n❌ SEEDING FAILED');
          seedResult.errors.forEach((error) => console.log(`  - ${error}`));
          process.exit(1);
        }
        break;

      case 'clear':
        // Safety check
        const confirmClear =
          process.env.CONFIRM_CLEAR === 'yes' || args.includes('--confirm');
        if (!confirmClear) {
          console.log('⚠️  WARNING: This will delete ALL Firebase data!');
          console.log('To confirm, run: CONFIRM_CLEAR=yes npm run seed clear');
          console.log('Or use: npm run seed clear --confirm');
          process.exit(1);
        }

        console.log('🗑️  Clearing all Firebase data...');
        const clearResult = await seedFirebaseData({
          clearExisting: true,
          skipHouseholds: true,
          skipMembers: true,
          skipEvents: true,
        });

        if (clearResult.success) {
          console.log('✅ All Firebase data cleared successfully');
        } else {
          console.log('❌ Failed to clear data');
          clearResult.errors.forEach((error) => console.log(`  - ${error}`));
          process.exit(1);
        }
        break;

      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('Run "npm run seed help" for available commands');
        process.exit(1);
    }
  } catch (error) {
    console.error(
      '\n❌ Seeding failed:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

// Run if called directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
