# 1. List all TypeScript files
src/App.tsx
src/main.tsx
src/types/firestore.ts
src/types/index.ts
src/types/registration.ts
src/contexts/FirebaseAuthContext.tsx
src/contexts/ToastContext.tsx
src/contexts/ThemeContext.tsx
src/contexts/AuthProviderWrapper.tsx
src/config/features.ts
src/utils/token-generator.ts
src/utils/logger.ts
src/utils/firestore-converters.ts
src/utils/member-form-utils.ts
src/components/registration/TokenManager.tsx
src/components/registration/QRCodeDisplay.tsx
src/components/forms/EmailInput.tsx
src/components/forms/PhoneInput.tsx
src/components/forms/BirthdateInput.tsx
src/components/auth/QRRegistration.tsx

# 2. Check what types exist
paul@Paul-Admins-Mac-mini shepherd % ls -la src/types/
total 48
drwxr-xr-x@  5 paul  staff    160 Aug 18 16:52 .
drwxr-xr-x@ 18 paul  staff    576 Aug 14 13:20 ..
-rw-r--r--@  1 paul  staff  14238 Aug 18 16:52 firestore.ts
-rw-r--r--@  1 paul  staff   2333 Aug 18 16:51 index.ts
-rw-r--r--@  1 paul  staff   2676 Aug 16 00:56 registration.ts

# 3. Check Firebase service structure
paul@Paul-Admins-Mac-mini shepherd % ls -la src/services/firebase/

total 360
drwxr-xr-x@ 14 paul  staff    448 Aug 18 17:34 .
drwxr-xr-x@  4 paul  staff    128 Aug 14 15:00 ..
-rw-r--r--@  1 paul  staff  11577 Aug 16 00:56 analytics.service.ts
-rw-r--r--@  1 paul  staff  19083 Aug 16 00:56 base.service.ts
-rw-r--r--@  1 paul  staff  10831 Aug 18 17:01 dashboard.service.ts
-rw-r--r--@  1 paul  staff  15866 Aug 16 00:56 follow-up.service.ts
-rw-r--r--@  1 paul  staff  20813 Aug 15 16:48 households.service.ts
-rw-r--r--@  1 paul  staff  12560 Aug 16 00:56 index.ts
-rw-r--r--@  1 paul  staff  17863 Aug 18 17:24 members.service.ts
-rw-r--r--@  1 paul  staff   2372 Jul 23 13:19 node-firebase.service.ts
-rw-r--r--@  1 paul  staff  10525 Aug 16 00:56 public-registration.service.ts
-rw-r--r--@  1 paul  staff  13933 Aug 16 00:56 registration-approval.service.ts
-rw-r--r--@  1 paul  staff  10057 Aug 18 17:34 registration-tokens.service.ts
-rw-r--r--@  1 paul  staff  14021 Aug 18 17:27 roles.service.ts

# 4. Show first 5 TypeScript errors
paul@Paul-Admins-Mac-mini shepherd % npm run typecheck 2>&1 | head -20

> shepherd@0.1.0 typecheck
> tsc --noEmit

src/pages/Households.tsx(1,1): error TS6133: 'React' is declared but its value is never read.
src/pages/MemberProfile.tsx(1,8): error TS6133: 'React' is declared but its value is never read.
src/pages/MemberProfile.tsx(66,44): error TS2339: Property 'addressLine1' does not exist on type 'Household'.
src/pages/MemberProfile.tsx(67,44): error TS2339: Property 'addressLine2' does not exist on type 'Household'.
src/pages/MemberProfile.tsx(68,35): error TS2339: Property 'city' does not exist on type 'Household'.
src/pages/MemberProfile.tsx(69,36): error TS2339: Property 'state' does not exist on type 'Household'.
src/pages/MemberProfile.tsx(70,42): error TS2339: Property 'postalCode' does not exist on type 'Household'.
src/pages/MemberProfile.tsx(71,38): error TS2339: Property 'country' does not exist on type 'Household'.
src/pages/MemberProfile.tsx(76,17): error TS2345: Argument of type '{ household: { id: string; family_name: string; address_line1: any; address_line2: any; city: any; state: any; postal_code: any; country: any; } | null; id: string; firstName: string; lastName: string; ... 12 more ...; fullName?: string; }' is not assignable to parameter of type 'SetStateAction<Member | null>'.
  Type '{ household: { id: string; family_name: string; address_line1: any; address_line2: any; city: any; state: any; postal_code: any; country: any; } | null; id: string; firstName: string; lastName: string; ... 12 more ...; fullName?: string; }' is not assignable to type 'Member'.
    Types of property 'household' are incompatible.
      Type '{ id: string; family_name: string; address_line1: any; address_line2: any; city: any; state: any; postal_code: any; country: any; } | null' is not assignable to type 'Household | undefined'.
        Type 'null' is not assignable to type 'Household | undefined'.
src/pages/MemberProfile.tsx(368,105): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/pages/MemberProfile.tsx(381,105): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.

# 5. Check if member-related components exist
paul@Paul-Admins-Mac-mini shepherd % find src -name "*member*" -o -name "*Member*"
src/utils/member-form-utils.ts
src/components/dashboard/MemberDashboard.tsx
src/components/households/HouseholdMembers.tsx
src/components/members
src/components/members/MemberProfile.tsx
src/components/members/MemberForm.tsx
src/components/members/MemberFormShared.tsx
src/components/members/MemberEvents.tsx
src/components/members/MemberCard.tsx
src/components/members/MemberSearch.tsx
src/components/members/MemberList.tsx
src/pages/MemberProfile.tsx
src/pages/Members.tsx
src/services/firebase/members.service.ts

# 6. Check current package.json for dependencies
paul@Paul-Admins-Mac-mini shepherd % cat package.json | grep -A 20 "dependencies"
  "dependencies": {
    "date-fns": "^3.0.0",
    "firebase": "^12.0.0",
    "fuse.js": "^7.1.0",
    "jspdf": "^3.0.1",
    "lucide-react": "^0.294.0",
    "papaparse": "^5.4.1",
    "qrcode.react": "^4.2.0",
    "react": "^18.2.0",
    "react-calendar": "^4.8.0",
    "react-dom": "^18.2.0",
    "react-firebase-hooks": "^5.1.1",
    "react-hook-form": "^7.48.0",
    "react-router-dom": "^6.20.0",
    "recharts": "^3.1.2"
  },
  "devDependencies": {
    "@types/node-fetch": "^2.6.12",
    "@types/react": "^18.2.43",
    "@types/react-calendar": "^3.9.0",
    "@types/react-dom": "^18.2.17",