# Firestore Data Storage Format Verification

## Expected Data Transformation

### TypeScript Input (from MemberFormEnhanced)
```typescript
const memberData: MemberFormData = {
  prefix: "Dr.",
  firstName: "Jane",
  middleName: "Marie", 
  lastName: "Smith",
  suffix: "Jr.",
  maritalStatus: "married",
  memberStatus: "active",
  role: "pastor",
  emails: [
    {
      type: "home",
      address: "jane.home@example.com",
      primary: true
    },
    {
      type: "work",
      address: "jane.work@company.com", 
      primary: false
    }
  ],
  phones: [
    {
      type: "mobile",
      number: "555-0123",
      primary: true,
      smsOptIn: true
    }
  ],
  addresses: [
    {
      type: "home",
      addressLine1: "123 Main Street",
      addressLine2: "Apt 4B",
      city: "Anytown", 
      state: "CA",
      postalCode: "12345",
      country: "United States",
      primary: true
    }
  ]
};
```

### Expected Firestore Document (snake_case)
```json
{
  "prefix": "Dr.",
  "first_name": "Jane",
  "middle_name": "Marie",
  "last_name": "Smith", 
  "suffix": "Jr.",
  "marital_status": "married",
  "member_status": "active",
  "role": "pastor",
  "emails": [
    {
      "type": "home",
      "address": "jane.home@example.com",
      "primary": true
    },
    {
      "type": "work", 
      "address": "jane.work@company.com",
      "primary": false
    }
  ],
  "phones": [
    {
      "type": "mobile",
      "number": "555-0123", 
      "primary": true,
      "sms_opt_in": true
    }
  ],
  "addresses": [
    {
      "type": "home",
      "address_line1": "123 Main Street",
      "address_line2": "Apt 4B",
      "city": "Anytown",
      "state": "CA", 
      "postal_code": "12345",
      "country": "United States",
      "primary": true
    }
  ],
  "created_at": "Timestamp(2025, 8, 20, ...)",
  "updated_at": "Timestamp(2025, 8, 20, ...)"
}
```

## Field Mapping Verification

### ✅ Root Level Fields
- `firstName` → `first_name`
- `middleName` → `middle_name` 
- `lastName` → `last_name`
- `maritalStatus` → `marital_status`
- `memberStatus` → `member_status`
- `birthDate` → `birth_date`
- `anniversaryDate` → `anniversary_date`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`

### ✅ Nested Array Fields
**Emails Array**: Field name stays `emails`, contents preserved as-is
**Phones Array**: 
- Field name stays `phones`
- `smsOptIn` → `sms_opt_in` within array objects
**Addresses Array**:
- Field name stays `addresses`  
- `addressLine1` → `address_line1`
- `addressLine2` → `address_line2`
- `postalCode` → `postal_code`

### ✅ Special Handling
- **Timestamps**: Converted to Firestore Timestamp objects
- **Empty Arrays**: Removed entirely from document
- **Computed Fields**: `fullName` excluded from storage
- **ID Field**: Excluded from document body (Firestore auto-generates)

## Backward Compatibility

### Legacy Data Support
```json
// Old format member document
{
  "first_name": "John",
  "last_name": "Doe", 
  "email": "john@example.com",     // DEPRECATED
  "phone": "555-0123",             // DEPRECATED
  "member_status": "active",
  "role": "member"
}
```

### Migration Behavior
When editing legacy member:
1. **Load**: Converts `email` → `emails[{type: 'home', address: email, primary: true}]`
2. **Load**: Converts `phone` → `phones[{type: 'mobile', number: phone, primary: true}]`
3. **Save**: Uses new array format, deprecated fields may be preserved

## Data Integrity Checks

### ✅ Required Fields Always Present
- `first_name`: string
- `last_name`: string  
- `member_status`: 'active' | 'inactive'
- `role`: 'admin' | 'pastor' | 'member'
- `created_at`: Timestamp
- `updated_at`: Timestamp

### ✅ Array Validation
- Arrays can be empty or missing
- Array objects have consistent structure
- Primary flags exist and are boolean
- SMS opt-in only on mobile phones

### ✅ Type Safety
- Booleans stored as true/false (not strings)
- Timestamps are proper Firestore Timestamp objects
- Enums stored as exact string values
- Numbers stored as numbers (not strings)

## Debugging Firestore Data

### Firebase Console Navigation
1. Go to https://console.firebase.google.com
2. Select your project
3. Navigate to Firestore Database
4. Find `members` collection
5. Click on a document to inspect

### Key Verification Points
- [ ] All field names are snake_case
- [ ] Arrays maintain internal structure
- [ ] Timestamps show as "Timestamp" type
- [ ] No undefined or null values in required fields
- [ ] Primary flags are boolean true/false
- [ ] Nested field mapping applied (sms_opt_in, address_line1, etc.)

## Common Issues & Solutions

### Issue: camelCase in Firestore
**Problem**: Fields stored as `firstName` instead of `first_name`
**Solution**: Verify `toFirestoreFieldsDeep()` is being used in service

### Issue: Arrays Not Converting
**Problem**: Nested objects in arrays keep camelCase
**Solution**: Deep mapper should recursively convert array contents

### Issue: Missing Timestamps
**Problem**: `created_at`/`updated_at` missing or wrong type
**Solution**: Ensure `serverTimestamp()` used, not `Date.now()`

### Issue: Data Loss on Edit
**Problem**: Some fields disappear after edit
**Solution**: Check form defaultValues and migration logic

## Testing Commands

```bash
# Test the field mapper directly
npx tsx -e "
import { toFirestoreFieldsDeep } from './src/utils/firestore-field-mapper';
const test = {
  firstName: 'John',
  maritalStatus: 'married', 
  emails: [{type: 'home', address: 'test@example.com', primary: true}],
  phones: [{type: 'mobile', number: '555-0123', smsOptIn: true}]
};
console.log(JSON.stringify(toFirestoreFieldsDeep(test), null, 2));
"
```

Expected output:
```json
{
  "first_name": "John",
  "marital_status": "married",
  "emails": [
    {
      "type": "home", 
      "address": "test@example.com",
      "primary": true
    }
  ],
  "phones": [
    {
      "type": "mobile",
      "number": "555-0123", 
      "sms_opt_in": true
    }
  ]
}
```