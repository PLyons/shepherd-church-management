import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import * as readline from 'readline';

// ============================================================================
// INTERACTIVE ADMIN SETUP SCRIPT
// ============================================================================
// Run this script with: npm run setup-admin

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): {
  isValid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter',
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter',
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
    };
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return {
      isValid: false,
      message:
        'Password must contain at least one special character (!@#$%^&*)',
    };
  }
  return { isValid: true };
}

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

async function setupAdmin() {
  console.log('🏛️  Shepherd Church Management - Admin Setup\n');
  console.log('This script will help you create an administrative user.\n');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Check if we're updating an existing user or creating a new one
    const setupMode = await question(
      'Are you (1) creating a new admin or (2) promoting an existing user? [1/2]: '
    );

    if (setupMode === '2') {
      // Promote existing user
      console.log('\n📋 Promoting Existing User to Admin\n');

      const email = await question('Enter the email of the user to promote: ');
      if (!validateEmail(email)) {
        console.error('❌ Invalid email format');
        process.exit(1);
      }

      // Find the user
      const membersQuery = query(
        collection(db, 'members'),
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(membersQuery);

      if (querySnapshot.empty) {
        console.error('❌ No user found with that email');
        process.exit(1);
      }

      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;
      const userData = userDoc.data();

      console.log(`\nFound user: ${userData.firstName} ${userData.lastName}`);
      const confirm = await question('Promote this user to admin? [y/N]: ');

      if (confirm.toLowerCase() !== 'y') {
        console.log('❌ Operation cancelled');
        process.exit(0);
      }

      // Update the user's role
      await setDoc(doc(db, 'members', userId), {
        ...userData,
        role: 'admin',
        roleUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        adminSince: new Date().toISOString(),
        permissions: {
          canManageRoles: true,
          canViewFinancials: true,
          canManageMembers: true,
          canManageEvents: true,
          canViewAuditLogs: true,
          canExportData: true,
        },
      });

      console.log('\n✅ User successfully promoted to admin!');
      console.log(`Email: ${email}`);
      console.log('Role: Administrator');
    } else {
      // Create new admin user
      console.log('\n👤 Creating New Admin User\n');

      // Get user details
      const email = await question('Admin email address: ');
      if (!validateEmail(email)) {
        console.error('❌ Invalid email format');
        process.exit(1);
      }

      const password = await question(
        'Admin password (min 8 chars, uppercase, lowercase, number, special char): '
      );
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        console.error(`❌ ${passwordValidation.message}`);
        process.exit(1);
      }

      const firstName = await question('First name: ');
      const lastName = await question('Last name: ');
      const phone = (await question('Phone number (optional): ')) || '';

      console.log('\n📝 Review Admin Details:');
      console.log(`Email: ${email}`);
      console.log(`Name: ${firstName} ${lastName}`);
      console.log(`Phone: ${phone || 'Not provided'}`);
      console.log('Role: Administrator\n');

      const confirm = await question('Create this admin user? [y/N]: ');
      if (confirm.toLowerCase() !== 'y') {
        console.log('❌ Operation cancelled');
        process.exit(0);
      }

      // Create the user
      console.log('\nCreating user account...');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Create member profile
      console.log('Creating member profile...');
      const memberData = {
        id: user.uid,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: 'admin',
        roleUpdatedAt: new Date().toISOString(),
        status: 'active',
        membershipDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        phoneNumbers: {
          mobile: phone,
          home: '',
        },
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

      console.log('\n✅ Admin user created successfully!');
      console.log('\n==================================================');
      console.log('ADMIN CREDENTIALS:');
      console.log('==================================================');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log('Role: Administrator');
      console.log('==================================================\n');
    }

    // Create audit log
    console.log('Creating audit log entry...');
    const auditEntry = {
      timestamp: new Date().toISOString(),
      userId: 'SYSTEM',
      userEmail: 'system@shepherdchurch.com',
      userName: 'System Setup',
      userRole: 'system',
      action: 'role_assigned',
      targetResource: 'user_role',
      details: {
        setupScript: true,
        setupMode: setupMode === '2' ? 'promotion' : 'creation',
      },
      result: 'SUCCESS',
      riskLevel: 'CRITICAL',
    };

    await setDoc(doc(db, 'audit_logs', `setup_${Date.now()}`), auditEntry);

    console.log('\n⚠️  Important Security Reminders:');
    console.log('1. Keep admin credentials secure');
    console.log('2. Change passwords regularly');
    console.log('3. All admin actions are logged');
    console.log('4. Use role-based access control wisely\n');

    rl.close();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);

    if (error.code === 'auth/email-already-in-use') {
      console.log(
        '\n💡 Tip: This email is already registered. Use option 2 to promote existing user.'
      );
    }

    rl.close();
    process.exit(1);
  }
}

// Run the script
setupAdmin();
