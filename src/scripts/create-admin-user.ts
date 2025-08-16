import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// ============================================================================
// CREATE INITIAL ADMIN USER FOR BETA TESTING
// ============================================================================
// Run this script with: npm run create-admin

const ADMIN_EMAIL = 'admin@shepherdchurch.com';
const ADMIN_PASSWORD = 'ShepherdAdmin2024!'; // Strong password for beta testing
const ADMIN_FIRST_NAME = 'Admin';
const ADMIN_LAST_NAME = 'User';

// Firebase configuration
const firebaseConfig = {
  apiKey:
    process.env.VITE_FIREBASE_API_KEY ||
    'AIzaSyDuWQ35Fwb-ljb1Jq-GH5dzIHhTLDpgJxc',
  authDomain:
    process.env.VITE_FIREBASE_AUTH_DOMAIN ||
    'shepherd-cms-ba981.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'shepherd-cms-ba981',
  storageBucket:
    process.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'shepherd-cms-ba981.firebasestorage.app',
  messagingSenderId:
    process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '280357223841',
  appId:
    process.env.VITE_FIREBASE_APP_ID ||
    '1:280357223841:web:73c9fb5edf2c0471b45fe0',
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-L4YXRH7NJJ',
};

async function createAdminUser() {
  console.log('🔧 Creating administrative user for beta testing...\n');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('📧 Admin Email:', ADMIN_EMAIL);
    console.log('🔑 Admin Password:', ADMIN_PASSWORD);
    console.log(
      '\n⚠️  IMPORTANT: Change this password immediately after first login!\n'
    );

    // Create the user in Firebase Auth
    console.log('Creating user in Firebase Authentication...');
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      ADMIN_EMAIL,
      ADMIN_PASSWORD
    );

    const user = userCredential.user;
    console.log('✅ User created successfully with ID:', user.uid);

    // Create the member document in Firestore
    console.log('\nCreating member profile in Firestore...');
    const memberData = {
      id: user.uid,
      email: ADMIN_EMAIL,
      firstName: ADMIN_FIRST_NAME,
      lastName: ADMIN_LAST_NAME,
      role: 'admin', // Set as admin
      roleUpdatedAt: new Date().toISOString(),
      status: 'active',
      membershipDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      // Beta testing fields
      isBetaTester: true,
      betaTestingNotes: 'Initial admin user for beta testing',
      // Contact info
      phoneNumbers: {
        mobile: '555-0100',
        home: '',
      },
      address: {
        line1: '123 Church Street',
        line2: '',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62701',
        country: 'USA',
      },
      // Additional admin metadata
      adminSince: new Date().toISOString(),
      permissions: {
        canManageRoles: true,
        canViewFinancials: true,
        canManageMembers: true,
        canManageEvents: true,
        canViewAuditLogs: true,
        canExportData: true,
      },
    };

    await setDoc(doc(db, 'members', user.uid), memberData);
    console.log('✅ Member profile created successfully');

    // Create an audit log entry for this admin creation
    console.log('\nCreating audit log entry...');
    const auditEntry = {
      timestamp: new Date().toISOString(),
      userId: 'SYSTEM',
      userEmail: 'system@shepherdchurch.com',
      userName: 'System Setup',
      userRole: 'system',
      action: 'role_assigned',
      targetResource: 'user_role',
      targetResourceId: user.uid,
      targetResourceName: `${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}`,
      details: {
        targetUserId: user.uid,
        targetEmail: ADMIN_EMAIL,
        targetName: `${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}`,
        oldRole: null,
        newRole: 'admin',
        reason: 'Initial admin user creation for beta testing',
        changeType: 'initial_assignment',
      },
      result: 'SUCCESS',
      riskLevel: 'CRITICAL',
      metadata: {
        setupScript: true,
        betaTesting: true,
      },
    };

    await setDoc(doc(db, 'audit_logs', `setup_${Date.now()}`), auditEntry);
    console.log('✅ Audit log entry created');

    console.log('\n🎉 Admin user created successfully!\n');
    console.log('==================================================');
    console.log('BETA TESTING CREDENTIALS:');
    console.log('==================================================');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('Role: Administrator');
    console.log('==================================================');
    console.log('\n⚠️  Security Reminders:');
    console.log('1. Change the password immediately after first login');
    console.log('2. Enable two-factor authentication if available');
    console.log('3. Do not share these credentials');
    console.log('4. All actions are logged for security auditing');
    console.log('==================================================\n');

    process.exit(0);
  } catch (error: unknown) {
    console.error(
      '\n❌ Error creating admin user:',
      error instanceof Error ? error.message : 'Unknown error'
    );

    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 'auth/email-already-in-use'
    ) {
      console.log('\n📝 Note: This email is already registered.');
      console.log(
        'If you need to reset the password, use the password reset feature.'
      );
      console.log(
        'To assign admin role to existing user, use the role management interface.\n'
      );
    } else if (error.code === 'auth/weak-password') {
      console.log(
        '\n📝 Note: The password is too weak. Please use a stronger password.'
      );
    } else if (error.code === 'auth/invalid-email') {
      console.log('\n📝 Note: The email address is invalid.');
    }

    process.exit(1);
  }
}

// Run the script
createAdminUser();
