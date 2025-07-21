#!/usr/bin/env tsx
// ============================================================================
// MIGRATION RUNNER SCRIPT
// ============================================================================
// Command-line utility to run Supabase to Firebase migration

// IMPORTANT: Load environment variables FIRST before any other imports
import { config } from 'dotenv';
const result = config({ path: '.env.local' });

// Add fetch polyfill for Node.js (required for Supabase)
if (typeof globalThis.fetch === 'undefined') {
  const fetch = await import('node-fetch');
  globalThis.fetch = fetch.default as any;
  globalThis.Headers = fetch.Headers as any;
  globalThis.Request = fetch.Request as any;
  globalThis.Response = fetch.Response as any;
}

// Debug environment loading
console.log('Environment loading result:', result.error ? result.error : 'Success');
console.log('Supabase URL found:', !!process.env.VITE_SUPABASE_URL);
console.log('Firebase API Key found:', !!process.env.VITE_FIREBASE_API_KEY);

// Command line argument parsing
const args = process.argv.slice(2);
const command = args[0];

// Show help
function showHelp() {
  console.log(`
Shepherd CMS - Firebase Migration Tool

USAGE:
  npm run migrate <command> [options]

COMMANDS:
  test          Test connections to both Supabase and Firebase
  count         Show data counts in both databases
  migrate       Run the full migration (households → members → events)
  verify        Verify migration integrity
  clear         Clear all Firebase data (DANGEROUS!)
  
MIGRATE OPTIONS:
  --dry-run           Show what would be migrated without actually migrating
  --skip-households   Skip household migration
  --skip-members      Skip member migration  
  --skip-events       Skip event migration

EXAMPLES:
  npm run migrate test
  npm run migrate count  
  npm run migrate migrate --dry-run
  npm run migrate migrate
  npm run migrate verify
  npm run migrate clear

NOTES:
  - Always run 'test' first to ensure connections work
  - Run 'count' to see current data in both systems
  - Use --dry-run to preview migration without making changes
  - Run 'verify' after migration to check integrity
  - The 'clear' command will delete ALL Firebase data - use with extreme caution
`);
}

// Main execution
async function main() {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  // Now import the migration functions after env is loaded
  const { runMigration, testConnections, getDataCounts, clearFirebaseData, verifyMigration } = await import('./migrate-to-firebase');

  try {
    switch (command) {
      case 'test':
        console.log('🔍 Testing database connections...\n');
        const testResult = await testConnections();
        console.log(`Supabase: ${testResult.supabase ? '✅ Connected' : '❌ Failed'}`);
        console.log(`Firebase: ${testResult.firebase ? '✅ Connected' : '❌ Failed'}`);
        
        if (testResult.errors.length > 0) {
          console.log('\nErrors:');
          testResult.errors.forEach(error => console.log(`  - ${error}`));
          process.exit(1);
        }
        break;

      case 'count':
        console.log('📊 Checking data counts...\n');
        const counts = await getDataCounts();
        console.log('SUPABASE:');
        console.log(`  Households: ${counts.supabase.households}`);
        console.log(`  Members:    ${counts.supabase.members}`);
        console.log(`  Events:     ${counts.supabase.events}`);
        console.log('\nFIREBASE:');
        console.log(`  Households: ${counts.firebase.households}`);
        console.log(`  Members:    ${counts.firebase.members}`);
        console.log(`  Events:     ${counts.firebase.events}`);
        break;

      case 'migrate':
        const options = {
          dryRun: args.includes('--dry-run'),
          skipHouseholds: args.includes('--skip-households'),
          skipMembers: args.includes('--skip-members'),
          skipEvents: args.includes('--skip-events')
        };

        if (options.dryRun) {
          console.log('🔍 DRY RUN MODE - No data will be migrated\n');
        }

        const result = await runMigration(options);
        
        console.log('\n📋 MIGRATION SUMMARY:');
        console.log(`Households: ${result.households.success} migrated, ${result.households.errors.length} errors`);
        console.log(`Members:    ${result.members.success} migrated, ${result.members.errors.length} errors`);
        console.log(`Events:     ${result.events.success} migrated, ${result.events.errors.length} errors`);
        console.log(`Duration:   ${Math.round(result.totalDuration / 1000)}s`);

        if (result.warnings.length > 0) {
          console.log('\n⚠️  WARNINGS:');
          result.warnings.forEach(warning => console.log(`  - ${warning}`));
        }

        // Show errors if any
        const allErrors = [...result.households.errors, ...result.members.errors, ...result.events.errors];
        if (allErrors.length > 0) {
          console.log('\n❌ ERRORS:');
          allErrors.forEach(error => console.log(`  - ID ${error.id}: ${error.error}`));
        }
        break;

      case 'verify':
        const verifyResult = await verifyMigration();
        
        if (verifyResult.isValid) {
          console.log('\n✅ Migration verification PASSED');
        } else {
          console.log('\n❌ Migration verification FAILED');
          process.exit(1);
        }
        break;

      case 'clear':
        // Safety check
        const confirmClear = process.env.CONFIRM_CLEAR === 'yes';
        if (!confirmClear) {
          console.log('⚠️  WARNING: This will delete ALL Firebase data!');
          console.log('To confirm, run: CONFIRM_CLEAR=yes npm run migrate clear');
          process.exit(1);
        }

        await clearFirebaseData();
        break;

      default:
        console.log(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if called directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}