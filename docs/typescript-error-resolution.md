# TypeScript Error Resolution & Stabilization Guide

## Document Purpose
This guide provides step-by-step instructions to resolve 105 TypeScript errors in the Shepherd CMS project. The errors primarily stem from naming convention mismatches between Firestore (snake_case) and TypeScript (camelCase), plus optional property handling issues.

## Current Status
- **Error Count**: ~105 TypeScript errors
- **Main Issues**: 
  - snake_case vs camelCase mismatch
  - Optional properties used without null checks
  - Unused React imports
  - MemberForm saves failing

## Architecture Decision
**Maintain TypeScript/React best practices with camelCase throughout the application. Handle snake_case conversion only at the Firestore service boundary.**

### Benefits:
- Clean, idiomatic TypeScript code
- Separation of concerns (database format vs application format)
- Single source of truth for field mapping
- Easy to change database later without touching components

---

## Implementation Steps

### Step 1: Create Field Mapping Utility

**Action**: CREATE new file  
**File**: `/src/utils/firestore-field-mapper.ts`

```typescript
/**
 * Utility functions to convert between camelCase (TypeScript) and snake_case (Firestore)
 */

/**
 * Converts camelCase object to snake_case for Firestore
 */
export function toFirestoreFields<T extends Record<string, any>>(data: T): Record<string, any> {
  const converted: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip undefined values
    if (value === undefined) continue;
    
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    
    // Recursively convert nested objects (except Dates and Timestamps)
    if (value && typeof value === 'object' && !(value instanceof Date) && !value._seconds) {
      if (Array.isArray(value)) {
        converted[snakeKey] = value.map(item => 
          typeof item === 'object' ? toFirestoreFields(item) : item
        );
      } else {
        converted[snakeKey] = toFirestoreFields(value);
      }
    } else {
      converted[snakeKey] = value;
    }
  }
  
  return converted;
}

/**
 * Converts snake_case Firestore document to camelCase for TypeScript
 */
export function fromFirestoreFields<T = any>(data: Record<string, any>): T {
  const converted: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Convert snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    // Recursively convert nested objects
    if (value && typeof value === 'object' && !(value instanceof Date) && !value._seconds) {
      if (Array.isArray(value)) {
        converted[camelKey] = value.map(item => 
          typeof item === 'object' ? fromFirestoreFields(item) : item
        );
      } else {
        converted[camelKey] = fromFirestoreFields(value);
      }
    } else {
      converted[camelKey] = value;
    }
  }
  
  return converted as T;
}

/**
 * Explicit field mappings for special cases
 */
export const fieldMappings = {
  // TypeScript -> Firestore
  toFirestore: {
    id: 'id', // Keep as is
    memberStatus: 'member_status',
    familyName: 'family_name',
    addressLine1: 'address_line1', 
    addressLine2: 'address_line2',
    postalCode: 'postal_code',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    birthDate: 'birth_date',
    anniversaryDate: 'anniversary_date',
    maritalStatus: 'marital_status',
    smsOptIn: 'sms_opt_in',
  },
  // Firestore -> TypeScript
  fromFirestore: {
    id: 'id', // Keep as is
    member_status: 'memberStatus',
    family_name: 'familyName',
    address_line1: 'addressLine1',
    address_line2: 'addressLine2',
    postal_code: 'postalCode',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    birth_date: 'birthDate',
    anniversary_date: 'anniversaryDate',
    marital_status: 'maritalStatus',
    sms_opt_in: 'smsOptIn',
  }
};
```

---

### Step 2: Update TypeScript Types to Use CamelCase

**Action**: UPDATE existing file  
**File**: `/src/types/index.ts`

**Find the Household interface and REPLACE with:**

```typescript
export interface Household {
  id: string;
  familyName: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  createdAt?: Date | any;  // Firestore Timestamp
  updatedAt?: Date | any;  // Firestore Timestamp
}
```

**Find the Member interface and REPLACE with:**

```typescript
export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  birthDate?: Date | any;
  anniversaryDate?: Date | any;
  maritalStatus?: 'single' | 'married' | 'widowed' | 'divorced';
  memberStatus: 'active' | 'inactive';  // Required with default
  role: 'admin' | 'pastor' | 'member';  // Required with default
  household?: Household;  // Optional relationship
  createdAt?: Date | any;
  updatedAt?: Date | any;
  fullName?: string;  // Computed field
}
```

---

### Step 3: Update Members Service with Field Mapping

**Action**: UPDATE existing file  
**File**: `/src/services/firebase/members.service.ts`

**Add imports at the top:**

```typescript
import { fromFirestoreFields, toFirestoreFields } from '../../utils/firestore-field-mapper';
import { serverTimestamp } from 'firebase/firestore';
```

**Find and UPDATE the create method:**

```typescript
async create(memberData: Omit<Member, 'id'>): Promise<string> {
  try {
    // Ensure required fields have defaults
    const dataWithDefaults = {
      ...memberData,
      memberStatus: memberData.memberStatus || 'active',
      role: memberData.role || 'member',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Convert camelCase to snake_case for Firestore
    const firestoreData = toFirestoreFields(dataWithDefaults);
    
    const docRef = await addDoc(collection(this.db, 'members'), firestoreData);
    console.log('Member created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating member:', error);
    throw new Error(`Failed to create member: ${error.message}`);
  }
}
```

**Find and UPDATE the getById method:**

```typescript
async getById(id: string): Promise<Member | null> {
  try {
    const docSnap = await getDoc(doc(this.db, 'members', id));
    
    if (!docSnap.exists()) {
      return null;
    }
    
    // Convert snake_case from Firestore to camelCase
    const data = fromFirestoreFields<Member>(docSnap.data());
    return {
      ...data,
      id: docSnap.id,
      fullName: `${data.firstName} ${data.lastName}`.trim(),
    };
  } catch (error) {
    console.error('Error fetching member:', error);
    throw new Error(`Failed to fetch member: ${error.message}`);
  }
}
```

**Find and UPDATE the update method:**

```typescript
async update(id: string, updates: Partial<Member>): Promise<void> {
  try {
    // Remove computed fields and id
    const { fullName, id: _, ...updateData } = updates;
    
    // Add updated timestamp
    const dataWithTimestamp = {
      ...updateData,
      updatedAt: serverTimestamp(),
    };
    
    // Convert camelCase to snake_case for Firestore
    const firestoreData = toFirestoreFields(dataWithTimestamp);
    
    await updateDoc(doc(this.db, 'members', id), firestoreData);
    console.log('Member updated:', id);
  } catch (error) {
    console.error('Error updating member:', error);
    throw new Error(`Failed to update member: ${error.message}`);
  }
}
```

**Find and UPDATE the getAll method (or list method):**

```typescript
async getAll(): Promise<Member[]> {
  try {
    const querySnapshot = await getDocs(collection(this.db, 'members'));
    
    return querySnapshot.docs.map(doc => {
      const data = fromFirestoreFields<Member>(doc.data());
      return {
        ...data,
        id: doc.id,
        fullName: `${data.firstName} ${data.lastName}`.trim(),
      };
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    throw new Error(`Failed to fetch members: ${error.message}`);
  }
}
```

---

### Step 4: Fix Component Files

#### 4.1 Remove Unused React Imports

**Files to modify:**
- `/src/pages/Households.tsx`
- `/src/pages/MemberProfile.tsx`

**Action**: Remove the line `import React from 'react';` or change to `import {` without React

---

#### 4.2 Fix MemberProfile Component

**Action**: UPDATE existing file  
**File**: `/src/pages/MemberProfile.tsx`

**Find lines with property errors and UPDATE:**

Replace all snake_case property references with camelCase:
- `household.family_name` → `household.familyName`
- `household.address_line1` → `household.addressLine1`
- `household.address_line2` → `household.addressLine2`
- `household.postal_code` → `household.postalCode`

**Around line 76, fix the null handling:**

```typescript
// Change from:
household: householdData ? { /* ... */ } : null

// To:
household: householdData ? { /* ... */ } : undefined
```

**For memberStatus and role usage (lines ~368, ~381):**

Since we made these required with defaults, they should now work without changes. But if still showing errors, use:

```typescript
// Ensure defaults are always present
className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.memberStatus || 'active')}`}
className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role || 'member')}`}
```

---

#### 4.3 Fix Members List Page

**Action**: UPDATE existing file  
**File**: `/src/pages/Members.tsx`

**Around lines 263 and 270, UPDATE:**

```typescript
// Line ~263
className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(memberItem.memberStatus || 'active')}`}

// Line ~270  
className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(memberItem.role || 'member')}`}
```

---

### Step 5: Fix MemberForm Component

**Action**: UPDATE existing file  
**File**: `/src/components/members/MemberForm.tsx`

**Ensure the form uses camelCase field names and proper saving:**

```typescript
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { firebaseService } from '../../services/firebase';
import { Member } from '../../types';
import { useToast } from '../../contexts/ToastContext';

export function MemberForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<Partial<Member>>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      memberStatus: 'active',
      role: 'member',
    }
  });
  
  const onSubmit = async (data: Partial<Member>) => {
    try {
      console.log('Submitting member data:', data);
      
      // Service layer handles snake_case conversion
      const memberId = await firebaseService.members.create({
        firstName: data.firstName!,
        lastName: data.lastName!,
        middleName: data.middleName || '',
        email: data.email || '',
        phone: data.phone || '',
        memberStatus: data.memberStatus || 'active',
        role: data.role || 'member',
      });
      
      console.log('Member created successfully:', memberId);
      toast.success('Member created successfully');
      navigate('/members');
    } catch (error) {
      console.error('Failed to create member:', error);
      toast.error(error.message || 'Failed to create member');
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Member</h1>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          First Name *
        </label>
        <input
          type="text"
          {...register('firstName', { required: 'First name is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.firstName && (
          <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Last Name *
        </label>
        <input
          type="text"
          {...register('lastName', { required: 'Last name is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.lastName && (
          <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          {...register('email')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Phone
        </label>
        <input
          type="tel"
          {...register('phone')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          {...register('memberStatus')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <select
          {...register('role')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="member">Member</option>
          <option value="pastor">Pastor</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Member
        </button>
        <button
          type="button"
          onClick={() => navigate('/members')}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
```

---

## Verification Steps

### Step 1: Check TypeScript Compilation

```bash
# Run type checking
npm run typecheck

# Expected: 0 errors or significantly reduced from 105
# If errors remain, note which ones for troubleshooting
```

### Step 2: Test the Application

```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Step 3: Test Member Creation

1. Navigate to the member creation form
2. Fill in required fields (First Name, Last Name)
3. Submit the form
4. Check browser console for any errors
5. Check Network tab to see Firebase requests
6. Verify member appears in the list

### Step 4: Check Firestore Console

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Check the `members` collection
4. Verify new member document exists with snake_case fields

### Step 5: Verify Specific Error Categories Are Fixed

```bash
# These should all return empty/no results:

# Check for Household property errors
npm run typecheck 2>&1 | grep "Property.*does not exist on type 'Household'"

# Check for string type errors
npm run typecheck 2>&1 | grep "is not assignable to parameter of type 'string'"

# Check for React import errors
npm run typecheck 2>&1 | grep "'React' is declared but its value is never read"

# Check for null assignment errors
npm run typecheck 2>&1 | grep "Type 'null' is not assignable"
```

---

## Troubleshooting

### If TypeScript Errors Persist

1. **Check error count:**
```bash
npm run typecheck 2>&1 | grep "error TS" | wc -l
```

2. **Get first 10 errors:**
```bash
npm run typecheck 2>&1 | head -30
```

3. **Common issues:**
   - Imports not updated
   - Old snake_case references in components
   - Missing service layer updates
   - Cache issues (try `npm run clean && npm install`)

### If Member Creation Fails

1. **Check browser console for errors**
2. **Check Network tab:**
   - Is request being sent to Firebase?
   - What's the request payload?
   - What's the response/error?

3. **Add debug logging:**
```typescript
// In MemberForm onSubmit
console.log('Form data before submit:', data);

// In members.service.ts create method
console.log('Data after conversion:', firestoreData);
```

4. **Verify Firebase configuration:**
   - Authentication is enabled
   - Firestore database is created
   - Security rules allow writes

### If Field Mapping Doesn't Work

Test the utility functions directly:

```typescript
// Add to a test file or component
import { toFirestoreFields, fromFirestoreFields } from './utils/firestore-field-mapper';

const testData = {
  firstName: 'John',
  memberStatus: 'active',
  addressLine1: '123 Main St'
};

console.log('To Firestore:', toFirestoreFields(testData));
// Should output: { first_name: 'John', member_status: 'active', address_line1: '123 Main St' }

const firestoreData = {
  first_name: 'Jane',
  member_status: 'inactive',
  address_line1: '456 Oak Ave'
};

console.log('From Firestore:', fromFirestoreFields(firestoreData));
// Should output: { firstName: 'Jane', memberStatus: 'inactive', addressLine1: '456 Oak Ave' }
```

---

## Success Criteria

- [ ] TypeScript compilation shows 0 errors (or <10 with clear understanding of remaining)
- [ ] Member form displays without console errors
- [ ] Member creation successfully saves to Firestore
- [ ] Created members appear in the members list
- [ ] Member data in Firestore uses snake_case
- [ ] Member data in React components uses camelCase
- [ ] Edit existing member works correctly
- [ ] All member fields save and retrieve properly

---

## Next Steps After Stabilization

Once all TypeScript errors are resolved and basic CRUD operations work:

1. **Phase 0.1**: Enhance member form with additional fields
   - Multiple emails/phones/addresses
   - Prefix/suffix support
   - SMS opt-in for mobile phones

2. **Phase 0.2**: Implement household management
   - Create household entities
   - Link members to households
   - Family relationship management

3. **Phase 0.3**: Add bulk operations
   - Import members from CSV
   - Export member directory
   - Bulk status updates

---

## Notes for AI Coding Partner

- Always use camelCase in TypeScript/React code
- Only use snake_case at the Firestore boundary (in service files)
- Run `npm run typecheck` after each change to verify progress
- Test in browser after fixing compilation errors
- Use browser DevTools to debug runtime issues
- Commit working code frequently to avoid losing progress

---

## Document Version
- **Version**: 1.0
- **Date**: August 2024
- **Project**: Shepherd CMS
- **Purpose**: TypeScript Error Resolution & Stabilization