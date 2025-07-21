# Firebase Migration Guide

This document provides step-by-step instructions for migrating data from Supabase to Firebase Firestore.

## Prerequisites

1. **Firebase Project Setup**: Ensure your Firebase project is created and Firestore is enabled
2. **Firebase Configuration**: Confirm your Firebase config is properly set in `src/lib/firebase.ts`
3. **Environment Variables**: Verify your `.env.local` contains Firebase configuration
4. **Dependencies**: Ensure `tsx` is installed for running TypeScript scripts

## Migration Overview

The migration process follows this order:
1. **Households** - Create household documents first
2. **Members** - Migrate members and link them to households  
3. **Events** - Migrate events and any related RSVP/attendance data

## Migration Commands

All migration commands are run via npm scripts:

```bash
# Test database connections
npm run migrate test

# Check data counts in both systems
npm run migrate count

# Run a dry-run to preview migration
npm run migrate migrate --dry-run

# Run the full migration
npm run migrate migrate

# Verify migration integrity
npm run migrate verify

# Clear all Firebase data (DANGER!)
CONFIRM_CLEAR=yes npm run migrate clear
```

## Step-by-Step Migration Process

### Step 1: Test Connections

Before starting, verify both databases are accessible:

```bash
npm run migrate test
```

**Expected Output:**
```
🔍 Testing database connections...

Supabase: ✅ Connected
Firebase: ✅ Connected
```

If either connection fails, check your configuration files and environment variables.

### Step 2: Check Current Data

See what data exists in both systems:

```bash
npm run migrate count
```

**Expected Output:**
```
📊 Checking data counts...

SUPABASE:
  Households: 6
  Members:    14  
  Events:     3

FIREBASE:
  Households: 0
  Members:    0
  Events:     0
```

### Step 3: Preview Migration (Dry Run)

See what would be migrated without making changes:

```bash
npm run migrate migrate --dry-run
```

This shows you exactly what data will be migrated and identifies any potential issues.

### Step 4: Run Migration

Execute the full migration:

```bash
npm run migrate migrate
```

**Expected Output:**
```
🚀 Starting Supabase to Firebase migration...

1. Testing database connections...
✓ Both databases are accessible

2. Checking data counts...
Supabase: 6 households, 14 members, 3 events
Firebase: 0 households, 0 members, 0 events

3. Migrating households...
✓ Migrated household: Smith Family
✓ Migrated household: Johnson Family
...
Households: 6 migrated, 0 errors

4. Migrating members...
✓ Migrated member: John Smith
✓ Migrated member: Jane Smith
...
Members: 14 migrated, 0 errors

5. Migrating events...
✓ Migrated event: Sunday Service
✓ Migrated event: Bible Study
...
Events: 3 migrated, 0 errors

✅ Migration completed!
Total time: 12s
Total success: 23
Total errors: 0
```

### Step 5: Verify Migration

Confirm all data was migrated correctly:

```bash
npm run migrate verify
```

**Expected Output:**
```
🔍 Verifying migration integrity...

Verification ✅ PASSED
```

If verification fails, it will list specific issues that need attention.

## Data Mapping

### Households
- `id` → Document ID (converted to string)
- `family_name` → `familyName`
- Address fields → Nested `address` object
- `primary_contact_id` → `primaryContactId`
- Timestamps preserved

### Members  
- `id` or `auth_uid` → Document ID
- `first_name` → `firstName`
- `last_name` → `lastName`  
- `household_id` → `householdId`
- `member_status` → `memberStatus`
- `is_primary_contact` → `isPrimaryContact`
- Computed `fullName` field added
- Household relationships maintained

### Events
- `id` → Document ID (converted to string)
- `start_time` → `startTime`
- `end_time` → `endTime`
- `is_public` → `isPublic`
- `max_capacity` → `maxCapacity`
- `created_by` → `createdBy`
- RSVP stats initialized to zero

## Migration Options

You can customize the migration with these flags:

```bash
# Skip specific data types
npm run migrate migrate --skip-households
npm run migrate migrate --skip-members  
npm run migrate migrate --skip-events

# Combine flags
npm run migrate migrate --skip-events --dry-run
```

## Troubleshooting

### Common Issues

**1. Permission Denied Errors**
- Check Firestore security rules
- Verify Firebase authentication is working
- Ensure your Firebase project has proper permissions

**2. Duplicate Key Errors**
- Run migration verification to check for duplicates
- Use `CONFIRM_CLEAR=yes npm run migrate clear` to reset Firebase (DANGER!)
- Check if partial migration occurred and handle conflicts

**3. Connection Timeouts**
- Large datasets may take time to migrate
- Consider running migration in smaller batches
- Check network connectivity

**4. Data Type Mismatches**
- Review converter functions in `src/utils/firestore-converters.ts`
- Check that Supabase and Firebase types align correctly

### Recovery Procedures

**If Migration Fails Partway:**
1. Run `npm run migrate verify` to see current state
2. Check error logs for specific issues
3. Fix issues and re-run migration (it will skip existing data)

**If You Need to Start Over:**
1. Clear Firebase data: `CONFIRM_CLEAR=yes npm run migrate clear`
2. Re-run migration: `npm run migrate migrate`
3. Verify results: `npm run migrate verify`

## Data Validation

After migration, manually verify:

1. **Member Counts**: Household member counts should match actual members
2. **Primary Contacts**: Each household should have correct primary contact  
3. **Relationships**: Members should be linked to correct households
4. **Timestamps**: Created/updated timestamps should be preserved
5. **User Authentication**: Members with Firebase Auth UIDs should be usable for login

## Next Steps

After successful migration:

1. **Update Application Code**: Switch components to use Firebase services
2. **Test Authentication**: Verify login still works with migrated users
3. **Update Security Rules**: Implement proper Firestore security rules
4. **Performance Testing**: Test app performance with Firebase backend
5. **Backup Strategy**: Set up regular Firebase backups

## Migration Script Internals

The migration uses these key files:

- `src/scripts/migrate-to-firebase.ts` - Core migration logic
- `src/scripts/run-migration.ts` - CLI interface
- `src/services/firebase/` - Firebase service layer
- `src/utils/firestore-converters.ts` - Data conversion utilities

## Safety Notes

- **Always run dry-run first** to preview changes
- **Backup your Supabase data** before migration
- **Test with small datasets** before migrating production data
- **The clear command is destructive** - use extreme caution
- **Migration is additive** - it won't delete existing Firebase data

## Support

If you encounter issues:

1. Check the error logs for specific error messages
2. Verify your Firebase configuration and permissions  
3. Test with a smaller subset of data first
4. Review the migration script source code for debugging