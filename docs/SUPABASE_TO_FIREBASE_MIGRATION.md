# Supabase to Firebase Migration Plan

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Migration Strategy](#migration-strategy)
4. [Phase 1: Firebase Setup & Authentication](#phase-1-firebase-setup--authentication)
5. [Phase 2: Database Migration](#phase-2-database-migration)
6. [Phase 3: Storage Migration](#phase-3-storage-migration)
7. [Phase 4: Code Migration](#phase-4-code-migration)
8. [Phase 5: Testing & Deployment](#phase-5-testing--deployment)
9. [Cost Analysis](#cost-analysis)
10. [Risk Mitigation](#risk-mitigation)
11. [Timeline](#timeline)

## Executive Summary

This document outlines the migration plan from Supabase to Firebase for the Shepherd Church Management System. After 16+ hours of debugging Supabase authentication issues, particularly with password reset functionality, migrating to Firebase offers a more reliable solution with proven authentication and storage capabilities.

### Key Benefits of Migration
- **Reliable Authentication**: Firebase Auth works out of the box with email/password, social logins, and password reset
- **Better Local Development**: No Docker requirements, no hanging APIs
- **Proven Storage Solution**: Firebase Storage with automatic CDN and scaling
- **Firestore Database**: NoSQL with real-time capabilities and offline support
- **Generous Free Tier**: Sufficient for 20 churches with 5 users each

### Migration Scope
- **20 files** using Supabase imports
- **10 database tables** to migrate to Firestore
- **Authentication system** including password reset
- **Storage system** for sermon media files
- **Estimated effort**: 20-30 hours

## Current State Analysis

### Supabase Usage Inventory

#### Authentication
- Email/password authentication
- Magic link authentication
- Password reset (currently broken)
- Session management
- Role-based access (admin, pastor, member)

#### Database Tables (PostgreSQL)
1. `households` - Family units
2. `members` - Individual church members
3. `events` - Church events
4. `event_attendance` - Event participation tracking
5. `donations` - Financial contributions
6. `donation_categories` - Donation types
7. `sermons` - Sermon records
8. `volunteer_roles` - Volunteer positions
9. `volunteer_slots` - Volunteer scheduling
10. `member_events` - Member-specific events

#### Storage
- Sermon media files (audio/video)
- Public access for sermon downloads
- 50MB file size limit

#### Files Using Supabase (20 total)
- Authentication: `AuthContext.tsx`, `AuthCallback.tsx`, `PasswordReset.tsx`, `SetPassword.tsx`
- Data Access: `Dashboard.tsx`, `Members.tsx`, `Events.tsx`, `Donations.tsx`, etc.
- Core Library: `lib/supabase.ts`

## Migration Strategy

### Approach: Incremental Migration
1. **Keep Supabase running** during migration
2. **Start with authentication** (highest priority)
3. **Migrate data in phases**
4. **Test thoroughly** before switching
5. **Maintain rollback capability**

### Data Architecture Translation

#### PostgreSQL → Firestore Mapping

**Relational (Supabase) → Document-based (Firebase)**

```
PostgreSQL                    →  Firestore
├── households               →  /households/{householdId}
├── members                  →  /members/{memberId}
├── events                   →  /events/{eventId}
├── event_attendance         →  /events/{eventId}/attendance/{memberId}
├── donations                →  /donations/{donationId}
├── donation_categories      →  /settings/donationCategories
├── sermons                  →  /sermons/{sermonId}
├── volunteer_roles          →  /volunteerRoles/{roleId}
├── volunteer_slots          →  /volunteerRoles/{roleId}/slots/{slotId}
└── member_events           →  /members/{memberId}/events/{eventId}
```

## Phase 1: Firebase Setup & Authentication

### 1.1 Firebase Project Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init
# Select: Firestore, Authentication, Storage, Hosting (optional)
```

### 1.2 Install Dependencies

```bash
npm install firebase
npm install react-firebase-hooks # Optional but recommended
```

### 1.3 Firebase Configuration

Create `src/lib/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators in development
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

### 1.4 New Authentication Context

Create `src/contexts/FirebaseAuthContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'pastor' | 'member';
  householdId: string;
}

interface AuthContextType {
  user: User | null;
  member: Member | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Subscribe to member data changes
  useEffect(() => {
    if (!user) {
      setMember(null);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'members', user.uid),
      (doc) => {
        if (doc.exists()) {
          setMember({ id: doc.id, ...doc.data() } as Member);
        } else {
          setMember(null);
        }
      },
      (error) => {
        console.error('Error fetching member data:', error);
        setMember(null);
      }
    );

    return unsubscribe;
  }, [user]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Send verification email
    await sendEmailVerification(user);
    
    // Create member document with default data
    await setDoc(doc(db, 'members', user.uid), {
      email: user.email,
      firstName: '',
      lastName: '',
      role: 'member',
      householdId: '',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  };

  const resetPassword = async (email: string) => {
    // Firebase handles all email sending automatically!
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/login`
    });
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) throw new Error('No user logged in');
    await firebaseUpdatePassword(user, newPassword);
  };

  const value = {
    user,
    member,
    loading,
    signIn,
    signUp,
    signOut: () => signOut(auth),
    resetPassword,
    updatePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within FirebaseAuthProvider');
  }
  return context;
};
```

### 1.5 User Migration Script

```typescript
// scripts/migrateUsers.ts
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../src/lib/firebase';

async function migrateUsers() {
  // Fetch users from Supabase
  const { data: supabaseMembers } = await supabase
    .from('members')
    .select('*');

  for (const member of supabaseMembers) {
    try {
      // Create Firebase Auth user
      const { user } = await createUserWithEmailAndPassword(
        auth,
        member.email,
        generateTempPassword() // Users will need to reset
      );

      // Create Firestore member document
      await setDoc(doc(db, 'members', user.uid), {
        email: member.email,
        firstName: member.first_name,
        lastName: member.last_name,
        role: member.role,
        householdId: member.household_id,
        phone: member.phone,
        birthdate: member.birthdate,
        gender: member.gender,
        memberStatus: member.member_status,
        joinedAt: member.joined_at,
        createdAt: member.created_at,
        updatedAt: member.updated_at
      });

      console.log(`Migrated user: ${member.email}`);
    } catch (error) {
      console.error(`Failed to migrate ${member.email}:`, error);
    }
  }
}
```

## Phase 2: Database Migration

### 2.1 Firestore Data Models

#### Households Collection
```typescript
interface Household {
  id: string;
  familyName: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  primaryContactId: string;
  memberIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Members Collection
```typescript
interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'pastor' | 'member';
  householdId: string;
  phone?: string;
  birthdate?: Timestamp;
  gender?: 'Male' | 'Female';
  memberStatus?: string;
  joinedAt?: Timestamp;
  isPrimaryContact: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Events Collection
```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  startTime: Timestamp;
  endTime: Timestamp;
  location: string;
  category: string;
  createdBy: string;
  attendeeIds: string[]; // Denormalized for performance
  attendeeCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Subcollection: /events/{eventId}/attendance/{memberId}
interface EventAttendance {
  memberId: string;
  memberName: string; // Denormalized
  attendedAt: Timestamp;
  checkedInBy: string;
}
```

#### Donations Collection
```typescript
interface Donation {
  id: string;
  memberId: string;
  memberName: string; // Denormalized
  householdId: string;
  amount: number;
  categoryId: string;
  categoryName: string; // Denormalized
  date: Timestamp;
  method: 'cash' | 'check' | 'online' | 'other';
  notes?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Sermons Collection
```typescript
interface Sermon {
  id: string;
  title: string;
  speakerName: string;
  datePreached: Timestamp;
  notes?: string;
  mediaUrl?: string;
  mediaType?: 'audio' | 'video';
  duration?: number;
  downloadCount: number;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2.2 Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
        get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isPastor() {
      return isSignedIn() && 
        get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role in ['admin', 'pastor'];
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Members collection
    match /members/{memberId} {
      allow read: if isSignedIn();
      allow create: if isAdmin();
      allow update: if isAdmin() || isOwner(memberId);
      allow delete: if isAdmin();
    }
    
    // Households collection
    match /households/{householdId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // Events collection
    match /events/{eventId} {
      allow read: if true; // Public events
      allow write: if isPastor();
      
      // Event attendance subcollection
      match /attendance/{attendeeId} {
        allow read: if isPastor();
        allow write: if isPastor();
      }
    }
    
    // Donations collection
    match /donations/{donationId} {
      allow read: if isAdmin() || 
        (isSignedIn() && resource.data.memberId == request.auth.uid);
      allow write: if isAdmin();
    }
    
    // Sermons collection
    match /sermons/{sermonId} {
      allow read: if true; // Public access
      allow write: if isPastor();
    }
    
    // Volunteer roles
    match /volunteerRoles/{roleId} {
      allow read: if isSignedIn();
      allow write: if isPastor();
      
      match /slots/{slotId} {
        allow read: if isSignedIn();
        allow write: if isPastor() || 
          (isSignedIn() && resource.data.volunteerId == request.auth.uid);
      }
    }
    
    // Settings collections
    match /settings/{document} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
  }
}
```

### 2.3 Data Migration Scripts

```typescript
// scripts/migrateData.ts
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { supabase } from '../src/lib/supabase';

async function migrateHouseholds() {
  const { data: households } = await supabase
    .from('households')
    .select('*');

  const batch = writeBatch(db);
  
  for (const household of households) {
    const ref = doc(db, 'households', household.id);
    batch.set(ref, {
      familyName: household.family_name,
      address: {
        line1: household.address_line1,
        line2: household.address_line2,
        city: household.city,
        state: household.state,
        postalCode: household.postal_code,
        country: household.country
      },
      primaryContactId: household.primary_contact_id || '',
      memberIds: [], // Will be populated separately
      createdAt: new Date(household.created_at),
      updatedAt: new Date(household.updated_at)
    });
  }
  
  await batch.commit();
  console.log(`Migrated ${households.length} households`);
}

async function migrateEvents() {
  const { data: events } = await supabase
    .from('events')
    .select('*');

  for (const event of events) {
    // Get attendance count
    const { count } = await supabase
      .from('event_attendance')
      .select('*', { count: 'exact' })
      .eq('event_id', event.id);

    await setDoc(doc(db, 'events', event.id), {
      title: event.title,
      description: event.description,
      startTime: new Date(event.start_time),
      endTime: new Date(event.end_time),
      location: event.location,
      category: event.category,
      createdBy: event.created_by,
      attendeeCount: count || 0,
      attendeeIds: [], // Will be populated from attendance
      createdAt: new Date(event.created_at),
      updatedAt: new Date(event.updated_at)
    });
  }
}

async function migrateDonations() {
  const { data: donations } = await supabase
    .from('donations')
    .select(`
      *,
      members!donations_member_id_fkey(first_name, last_name),
      donation_categories!donations_category_id_fkey(name)
    `);

  const batch = writeBatch(db);
  let count = 0;
  
  for (const donation of donations) {
    const ref = doc(db, 'donations', donation.id);
    batch.set(ref, {
      memberId: donation.member_id,
      memberName: `${donation.members.first_name} ${donation.members.last_name}`,
      householdId: donation.household_id,
      amount: donation.amount,
      categoryId: donation.category_id,
      categoryName: donation.donation_categories.name,
      date: new Date(donation.date),
      method: donation.method,
      notes: donation.notes,
      createdBy: donation.created_by,
      createdAt: new Date(donation.created_at),
      updatedAt: new Date(donation.updated_at)
    });
    
    count++;
    // Firestore batch limit is 500
    if (count % 500 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  
  await batch.commit();
  console.log(`Migrated ${donations.length} donations`);
}
```

## Phase 3: Storage Migration

### 3.1 Firebase Storage Setup

```typescript
// src/lib/storage.ts
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadSermonMedia(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Create storage reference
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name}`;
  const storageRef = ref(storage, `sermons/${fileName}`);
  
  // Upload file with progress tracking
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}

export async function deleteSermonMedia(mediaUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = mediaUrl.split('/o/')[1];
    const filePath = decodeURIComponent(urlParts.split('?')[0]);
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}
```

### 3.2 Storage Security Rules

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isPastor() {
      return isSignedIn() && 
        firestore.get(/databases/(default)/documents/members/$(request.auth.uid)).data.role in ['admin', 'pastor'];
    }
    
    // Sermon media files
    match /sermons/{fileName} {
      // Anyone can read sermon files
      allow read: if true;
      
      // Only pastors/admins can upload
      allow write: if isPastor() && 
        request.resource.size < 50 * 1024 * 1024 && // 50MB limit
        request.resource.contentType.matches('audio/.*|video/.*');
    }
    
    // Profile pictures (future feature)
    match /profiles/{userId}/{fileName} {
      allow read: if true;
      allow write: if isSignedIn() && 
        request.auth.uid == userId &&
        request.resource.size < 5 * 1024 * 1024 && // 5MB limit
        request.resource.contentType.matches('image/.*');
    }
  }
}
```

### 3.3 Media Migration Script

```typescript
// scripts/migrateMedia.ts
import { supabase } from '../src/lib/supabase';
import { uploadSermonMedia } from '../src/lib/storage';

async function migrateSermonMedia() {
  // Get all sermons with media
  const { data: sermons } = await supabase
    .from('sermons')
    .select('*')
    .not('media_url', 'is', null);

  for (const sermon of sermons) {
    try {
      // Download from Supabase storage
      const { data: fileData } = await supabase.storage
        .from('media')
        .download(sermon.media_url);
      
      if (!fileData) continue;
      
      // Convert blob to File
      const file = new File([fileData], 'sermon-media', {
        type: fileData.type
      });
      
      // Upload to Firebase Storage
      const newUrl = await uploadSermonMedia(file);
      
      // Update Firestore document
      await updateDoc(doc(db, 'sermons', sermon.id), {
        mediaUrl: newUrl
      });
      
      console.log(`Migrated media for sermon: ${sermon.title}`);
    } catch (error) {
      console.error(`Failed to migrate media for ${sermon.title}:`, error);
    }
  }
}
```

## Phase 4: Code Migration

### 4.1 Update Authentication Components

#### Login Page Update
```typescript
// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/FirebaseAuthContext';
import { FirebaseError } from 'firebase/app';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
            setError('No account found with this email');
            break;
          case 'auth/wrong-password':
            setError('Incorrect password');
            break;
          case 'auth/invalid-email':
            setError('Invalid email address');
            break;
          default:
            setError('Failed to sign in');
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  // ... rest of component
}
```

#### Password Reset Update
```typescript
// src/pages/PasswordReset.tsx
import { useState } from 'react';
import { useAuth } from '../contexts/FirebaseAuthContext';

export default function PasswordReset() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { resetPassword } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      await resetPassword(email);
      setMessage('Password reset email sent! Check your inbox.');
      setIsSuccess(true);
    } catch (error) {
      setMessage('Failed to send reset email. Please try again.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };
  
  // ... rest of component
}
```

### 4.2 Update Data Access Patterns

#### Members Page Update
```typescript
// src/pages/Members.tsx
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Real-time subscription to members
    const q = query(
      collection(db, 'members'),
      orderBy('lastName'),
      orderBy('firstName')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const membersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];
      
      setMembers(membersList);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const deleteMember = async (memberId: string) => {
    try {
      await deleteDoc(doc(db, 'members', memberId));
      showToast('Member deleted successfully');
    } catch (error) {
      showToast('Failed to delete member', 'error');
    }
  };
  
  // ... rest of component
}
```

#### Events with Attendance Update
```typescript
// src/pages/EventDetail.tsx
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function EventDetail({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [attendance, setAttendance] = useState<EventAttendance[]>([]);
  
  const checkInMember = async (memberId: string, memberName: string) => {
    try {
      // Add attendance record
      await addDoc(collection(db, 'events', eventId, 'attendance'), {
        memberId,
        memberName,
        attendedAt: serverTimestamp(),
        checkedInBy: auth.currentUser?.uid
      });
      
      // Update event attendee count
      await updateDoc(doc(db, 'events', eventId), {
        attendeeCount: increment(1),
        attendeeIds: arrayUnion(memberId)
      });
      
      showToast('Member checked in successfully');
    } catch (error) {
      showToast('Failed to check in member', 'error');
    }
  };
  
  // ... rest of component
}
```

### 4.3 Sermons with Storage Update
```typescript
// src/pages/Sermons.tsx
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { uploadSermonMedia } from '../lib/storage';

export default function Sermons() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const handleSermonSubmit = async (formData: SermonFormData) => {
    setUploading(true);
    
    try {
      let mediaUrl = null;
      
      // Upload media if provided
      if (formData.media_file) {
        mediaUrl = await uploadSermonMedia(
          formData.media_file,
          setUploadProgress
        );
      }
      
      // Create sermon document
      await addDoc(collection(db, 'sermons'), {
        title: formData.title,
        speakerName: formData.speaker_name,
        datePreached: new Date(formData.date_preached),
        notes: formData.notes,
        mediaUrl,
        mediaType: formData.media_file?.type.startsWith('video/') ? 'video' : 'audio',
        downloadCount: 0,
        createdBy: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      showToast('Sermon uploaded successfully');
      setShowForm(false);
    } catch (error) {
      showToast('Failed to upload sermon', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  
  // ... rest of component
}
```

### 4.4 Remove Supabase Dependencies

1. Remove `@supabase/supabase-js` from package.json
2. Delete `src/lib/supabase.ts`
3. Remove `supabase/` directory
4. Update all imports from `AuthContext` to `FirebaseAuthContext`
5. Remove `.env.local` Supabase variables
6. Add Firebase environment variables

## Phase 5: Testing & Deployment

### 5.1 Testing Checklist

#### Authentication Testing
- [ ] User registration with email verification
- [ ] Login with email/password
- [ ] Password reset flow (IT WORKS!)
- [ ] Session persistence
- [ ] Role-based access control
- [ ] Logout functionality

#### Data Operations Testing
- [ ] Create operations for all collections
- [ ] Read operations with proper filtering
- [ ] Update operations with validation
- [ ] Delete operations with cascading
- [ ] Real-time subscriptions
- [ ] Offline support

#### Storage Testing
- [ ] File upload with progress
- [ ] File download
- [ ] File deletion
- [ ] Size limits enforcement
- [ ] Content type validation

#### Performance Testing
- [ ] Page load times
- [ ] Query performance
- [ ] Image/media loading
- [ ] Bundle size impact

### 5.2 Migration Execution Plan

#### Day 1-2: Setup & Authentication
1. Create Firebase project
2. Configure authentication providers
3. Implement new auth context
4. Test all auth flows
5. Migrate test users

#### Day 3-4: Database Schema
1. Create Firestore collections
2. Implement security rules
3. Test security rules
4. Create data migration scripts
5. Migrate test data

#### Day 5: Storage & Media
1. Configure Firebase Storage
2. Implement storage rules
3. Create upload/download functions
4. Migrate media files

#### Day 6-7: Code Migration
1. Update all components
2. Replace Supabase calls
3. Update error handling
4. Test all features

#### Day 8: Final Testing
1. End-to-end testing
2. Performance testing
3. Security audit
4. User acceptance testing

### 5.3 Rollback Strategy

1. **Keep Supabase running** throughout migration
2. **Feature flags** to switch between providers
3. **Data sync** during transition period
4. **Backup all data** before migration
5. **Gradual rollout** to users

### 5.4 Deployment Steps

```bash
# 1. Build and test locally
npm run build
npm run preview

# 2. Deploy to Firebase Hosting (optional)
firebase deploy --only hosting

# 3. Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# 4. Run production migrations
NODE_ENV=production npm run migrate:users
NODE_ENV=production npm run migrate:data
NODE_ENV=production npm run migrate:media

# 5. Update DNS/domains if using Firebase Hosting
```

## Cost Analysis

### Firebase Spark Plan (Free Tier)
- **Authentication**: 10,000 verifications/month
- **Firestore**: 
  - 1GB storage
  - 50,000 reads/day
  - 20,000 writes/day
  - 20,000 deletes/day
- **Storage**: 5GB storage, 1GB/day download
- **Hosting**: 10GB storage, 360MB/day transfer

### Estimated Usage (20 churches × 5 users = 100 users)
- **Auth**: ~300 sign-ins/day = 9,000/month ✓
- **Database**: 
  - Reads: ~2,000/day ✓
  - Writes: ~500/day ✓
- **Storage**: < 1GB sermon media ✓
- **Total Cost**: $0 (well within free tier)

### When You'll Need to Pay
- Over 500 active users
- Over 5GB of sermon media
- Heavy real-time usage
- Advanced features (ML, Functions)

## Risk Mitigation

### Technical Risks
1. **Data Loss**
   - Mitigation: Complete backups before migration
   - Test migrations on copy of data first

2. **Authentication Issues**
   - Mitigation: Test with small user group first
   - Have password reset ready for all users

3. **Performance Degradation**
   - Mitigation: Implement proper indexes
   - Use Firestore best practices

### Business Risks
1. **User Disruption**
   - Mitigation: Clear communication
   - Migration during low-usage period

2. **Feature Parity**
   - Mitigation: Feature comparison matrix
   - Phased rollout

## Timeline

### Total Estimated Time: 20-30 hours

#### Week 1 (10-15 hours)
- Firebase setup: 2 hours
- Authentication migration: 4 hours
- Database schema design: 4 hours
- Initial testing: 2-5 hours

#### Week 2 (10-15 hours)
- Data migration scripts: 4 hours
- Storage migration: 2 hours
- Code updates: 4 hours
- Final testing: 2-5 hours

### Critical Path
1. Authentication (must work first)
2. Core data (members, households)
3. Features (events, donations)
4. Storage (sermons)

## Conclusion

Migrating from Supabase to Firebase will solve the authentication reliability issues while providing:
- ✅ Working password reset (finally!)
- ✅ Better local development experience
- ✅ Proven scalability
- ✅ Generous free tier
- ✅ Excellent documentation

The migration is substantial but straightforward, with clear benefits outweighing the effort required.

## Next Steps

1. **Get stakeholder approval** for migration
2. **Create Firebase project**
3. **Start with authentication** migration
4. **Test with small user group**
5. **Proceed with full migration**

Remember: The password reset will work on Firebase. No more 16-hour debugging sessions!