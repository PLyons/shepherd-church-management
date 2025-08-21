# PRP-003: Information Layout Redesign

**Phase:** 0.2 - Member Profile UI Enhancements  
**Status:** Not Started  
**Priority:** High  
**Estimated Effort:** 1.5 days  
**Dependencies:** PRP-002 (Tabbed Navigation)  

## Purpose

Reorganize the Overview tab with improved information architecture using consistent icon patterns, visual grouping, and card-based sections inspired by Planning Center's professional layout.

## Requirements

### Technical Requirements
- Maintain all existing data display functionality
- Use `lucide-react` icons consistently throughout
- Support enhanced contact arrays (emails, phones, addresses)
- Responsive grid layout for different screen sizes
- TypeScript strict typing for all components

### Design Requirements
- Card-based sections with clear visual hierarchy
- Consistent icon + label pattern for all data fields
- Logical grouping: Contact Info, Personal Info, Church Info
- Professional spacing and typography
- Visual separators between sections
- Hover states for interactive elements

### Dependencies
- PRP-002 tabbed navigation completed
- Current member data structure from `src/types/index.ts`
- Enhanced contact arrays implementation
- Existing helper functions (getPrimaryEmail, etc.)

## Context

### Current State
The member profile displays information in a simple grid with mixed data types:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>First Name: {member.firstName}</div>
  <div>Email: {getPrimaryEmail(member)}</div>
  <div>Phone: {getPrimaryPhone(member)}</div>
  // ... more fields mixed together
</div>
```

### Problems with Current Implementation
- No logical grouping of related information
- Inconsistent visual treatment of different data types
- Poor scannability - all fields look the same
- No clear hierarchy between primary and secondary info
- Limited space for additional contact methods
- No visual cues for field types

### Desired State
- Clear sections for different types of information
- Consistent iconography for quick recognition
- Card-based layout for better visual separation
- Expandable sections for multiple contact methods
- Professional appearance matching industry standards
- Better mobile experience with focused sections

## Success Criteria

- [ ] Information grouped into logical sections
- [ ] All fields display with appropriate icons
- [ ] Contact arrays properly display primary + secondary info
- [ ] Responsive layout works on all screen sizes
- [ ] Visual hierarchy makes information easy to scan
- [ ] Card sections have consistent styling
- [ ] Interactive elements have hover states
- [ ] All existing data remains accessible
- [ ] Performance remains unchanged
- [ ] Accessibility standards maintained

## Implementation Procedure

### Step 1: Create Reusable Components

1. **Create InfoCard component:**
   ```bash
   touch src/components/members/profile/common/InfoCard.tsx
   ```

   ```typescript
   interface InfoCardProps {
     title: string;
     icon: LucideIcon;
     children: React.ReactNode;
     className?: string;
   }

   export function InfoCard({ title, icon: Icon, children, className = '' }: InfoCardProps) {
     return (
       <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
         <div className="flex items-center gap-2 mb-4">
           <Icon className="h-5 w-5 text-gray-600" />
           <h3 className="text-lg font-medium text-gray-900">{title}</h3>
         </div>
         <div className="space-y-4">
           {children}
         </div>
       </div>
     );
   }
   ```

2. **Create InfoField component:**
   ```typescript
   interface InfoFieldProps {
     label: string;
     value: string | React.ReactNode;
     icon: LucideIcon;
     secondary?: boolean;
   }

   export function InfoField({ label, value, icon: Icon, secondary = false }: InfoFieldProps) {
     return (
       <div className="flex items-start gap-3">
         <Icon className={`h-4 w-4 mt-0.5 ${secondary ? 'text-gray-400' : 'text-gray-600'}`} />
         <div className="flex-1 min-w-0">
           <dt className="text-sm font-medium text-gray-700">{label}</dt>
           <dd className={`mt-1 text-sm ${secondary ? 'text-gray-500' : 'text-gray-900'}`}>
             {value}
           </dd>
         </div>
       </div>
     );
   }
   ```

3. **Create ContactList component:**
   ```typescript
   interface ContactListProps {
     contacts: Array<{
       type: string;
       value: string;
       primary?: boolean;
       label?: string;
     }>;
     icon: LucideIcon;
     emptyText: string;
   }

   export function ContactList({ contacts, icon: Icon, emptyText }: ContactListProps) {
     if (!contacts?.length) {
       return <InfoField label={emptyText} value="Not provided" icon={Icon} secondary />;
     }

     const primary = contacts.find(c => c.primary) || contacts[0];
     const secondary = contacts.filter(c => c !== primary);

     return (
       <div className="space-y-2">
         <InfoField 
           label={primary.label || primary.type}
           value={primary.value}
           icon={Icon}
         />
         {secondary.length > 0 && (
           <details className="group">
             <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
               Show {secondary.length} more
             </summary>
             <div className="mt-2 space-y-2 pl-7">
               {secondary.map((contact, index) => (
                 <div key={index} className="text-sm text-gray-600">
                   <span className="font-medium">{contact.type}:</span> {contact.value}
                 </div>
               ))}
             </div>
           </details>
         )}
       </div>
     );
   }
   ```

### Step 2: Update OverviewTab Component

1. **Import required icons and components:**
   ```typescript
   import { 
     User, Mail, Phone, MapPin, Calendar, Heart, Users, 
     Badge, Shield, Clock 
   } from 'lucide-react';
   import { InfoCard } from '../common/InfoCard';
   import { InfoField } from '../common/InfoField';
   import { ContactList } from '../common/ContactList';
   ```

2. **Structure the layout:**
   ```jsx
   export default function OverviewTab() {
     const { member } = useContext(MemberContext);
     
     if (!member) return <div>Loading...</div>;

     return (
       <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
         {/* Contact Information */}
         <InfoCard title="Contact Information" icon={Mail} className="lg:col-span-1">
           {/* Contact fields */}
         </InfoCard>

         {/* Personal Information */}
         <InfoCard title="Personal Information" icon={User} className="lg:col-span-1">
           {/* Personal fields */}
         </InfoCard>

         {/* Church Information */}
         <InfoCard title="Church Information" icon={Badge} className="lg:col-span-1 xl:col-span-1">
           {/* Church fields */}
         </InfoCard>
       </div>
     );
   }
   ```

### Step 3: Implement Contact Information Section

1. **Transform email data:**
   ```typescript
   const emailContacts = member.emails?.map(email => ({
     type: email.type,
     value: email.address,
     primary: email.primary,
     label: `${email.type} Email`
   })) || (member.email ? [{
     type: 'email',
     value: member.email,
     primary: true,
     label: 'Email'
   }] : []);
   ```

2. **Transform phone data:**
   ```typescript
   const phoneContacts = member.phones?.map(phone => ({
     type: phone.type,
     value: formatPhoneForDisplay(phone.number),
     primary: phone.primary,
     label: `${phone.type} Phone${phone.smsOptIn ? ' (SMS)' : ''}`
   })) || (member.phone ? [{
     type: 'phone',
     value: formatPhoneForDisplay(member.phone),
     primary: true,
     label: 'Phone'
   }] : []);
   ```

3. **Transform address data:**
   ```typescript
   const addressContacts = member.addresses?.map(address => ({
     type: address.type,
     value: formatAddress(address),
     primary: address.primary,
     label: `${address.type} Address`
   })) || [];

   const formatAddress = (address: any) => {
     const parts = [
       address.addressLine1,
       address.addressLine2,
       [address.city, address.state].filter(Boolean).join(', '),
       address.postalCode,
       address.country
     ].filter(Boolean);
     return parts.join(' ');
   };
   ```

4. **Render contact section:**
   ```jsx
   <InfoCard title="Contact Information" icon={Mail}>
     <ContactList 
       contacts={emailContacts}
       icon={Mail}
       emptyText="Email"
     />
     <ContactList 
       contacts={phoneContacts}
       icon={Phone}
       emptyText="Phone"
     />
     <ContactList 
       contacts={addressContacts}
       icon={MapPin}
       emptyText="Address"
     />
   </InfoCard>
   ```

### Step 4: Implement Personal Information Section

1. **Render personal fields:**
   ```jsx
   <InfoCard title="Personal Information" icon={User}>
     <InfoField 
       label="Full Name"
       value={`${member.firstName} ${member.lastName}`}
       icon={User}
     />
     
     {member.gender && (
       <InfoField 
         label="Gender"
         value={member.gender}
         icon={User}
       />
     )}

     {(member.birthDate || member.birthdate) && (
       <InfoField 
         label="Birth Date"
         value={formatDate(member.birthDate || member.birthdate)}
         icon={Calendar}
       />
     )}

     {member.anniversaryDate && (
       <InfoField 
         label="Anniversary"
         value={formatDate(member.anniversaryDate)}
         icon={Heart}
       />
     )}

     {member.maritalStatus && (
       <InfoField 
         label="Marital Status"
         value={member.maritalStatus}
         icon={Users}
       />
     )}
   </InfoCard>
   ```

### Step 5: Implement Church Information Section

1. **Render church fields:**
   ```jsx
   <InfoCard title="Church Information" icon={Badge}>
     <InfoField 
       label="Member Status"
       value={
         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.memberStatus)}`}>
           {member.memberStatus}
         </span>
       }
       icon={Badge}
     />

     <InfoField 
       label="Role"
       value={
         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role)}`}>
           {member.role}
         </span>
       }
       icon={Shield}
     />

     {member.joinedAt && (
       <InfoField 
         label="Joined"
         value={formatDate(member.joinedAt)}
         icon={Clock}
       />
     )}
   </InfoCard>
   ```

### Step 6: Add Responsive Behavior

1. **Update grid classes for different screens:**
   ```jsx
   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
     {/* Contact - Full width on mobile, half on tablet, third on desktop */}
     <InfoCard title="Contact Information" icon={Mail} className="md:col-span-1">
       
     {/* Personal - Full width on mobile, half on tablet, third on desktop */}
     <InfoCard title="Personal Information" icon={User} className="md:col-span-1">
       
     {/* Church - Full width on mobile, full on tablet, third on desktop */}
     <InfoCard title="Church Information" icon={Badge} className="md:col-span-2 xl:col-span-1">
   </div>
   ```

2. **Optimize for mobile:**
   ```jsx
   // Ensure cards stack nicely on mobile
   <InfoCard className="w-full">
     {/* Content optimized for mobile viewing */}
   </InfoCard>
   ```

### Step 7: Add Interactive Elements

1. **Add hover states to cards:**
   ```jsx
   <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
   ```

2. **Make contact items clickable (future enhancement):**
   ```jsx
   <button className="text-left hover:bg-gray-50 rounded p-1 -m-1 transition-colors">
     <InfoField {...props} />
   </button>
   ```

### Step 8: Add Empty States

1. **Handle missing data gracefully:**
   ```jsx
   {!member.emails?.length && !member.email && (
     <InfoField 
       label="Email"
       value="Not provided"
       icon={Mail}
       secondary
     />
   )}
   ```

2. **Add helpful empty state messages:**
   ```jsx
   const EmptyState = ({ icon: Icon, title, description }: EmptyStateProps) => (
     <div className="text-center py-6">
       <Icon className="mx-auto h-8 w-8 text-gray-400" />
       <p className="mt-2 text-sm text-gray-600">{title}</p>
       {description && (
         <p className="text-xs text-gray-500">{description}</p>
       )}
     </div>
   );
   ```

### Step 9: Performance Optimization

1. **Memoize expensive computations:**
   ```typescript
   const processedContacts = useMemo(() => ({
     emails: processEmails(member.emails, member.email),
     phones: processPhones(member.phones, member.phone),
     addresses: processAddresses(member.addresses)
   }), [member.emails, member.email, member.phones, member.phone, member.addresses]);
   ```

2. **Optimize re-renders:**
   ```typescript
   const ContactSection = memo(({ contacts, icon, emptyText }: ContactSectionProps) => {
     // Component implementation
   });
   ```

## Testing Plan

### Unit Tests
```typescript
// src/components/members/profile/tabs/__tests__/OverviewTab.test.tsx

describe('OverviewTab', () => {
  it('displays all member information correctly');
  it('handles missing contact arrays gracefully');
  it('shows primary contact information prominently');
  it('expands secondary contact information');
  it('formats dates correctly');
  it('displays status and role badges');
  it('handles empty member data');
});

// Component tests
describe('InfoCard', () => {
  it('renders title and icon correctly');
  it('applies custom className');
  it('renders children content');
});

describe('ContactList', () => {
  it('shows primary contact first');
  it('collapses secondary contacts');
  it('handles empty contact list');
  it('formats contact types correctly');
});
```

### Visual Testing Checklist
- [ ] Cards display with proper spacing and borders
- [ ] Icons align consistently across all fields
- [ ] Typography hierarchy is clear and readable
- [ ] Colors match design system
- [ ] Responsive layout works on all screen sizes
- [ ] Hover states work on interactive elements
- [ ] Status badges display with correct colors
- [ ] Contact expansion/collapse works smoothly

### Accessibility Testing
- [ ] Screen reader announces all information correctly
- [ ] Keyboard navigation works through all elements
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG standards
- [ ] Information structure is logical for assistive tech

## Rollback Plan

### Immediate Rollback
1. **Revert OverviewTab.tsx:**
   ```bash
   git checkout HEAD~1 -- src/components/members/profile/tabs/OverviewTab.tsx
   ```

2. **Remove new components:**
   ```bash
   rm -rf src/components/members/profile/common/
   ```

### Data Safety
- No data structure changes
- All existing functionality preserved
- Only visual presentation affected

## Notes

### Design Decisions
- Card-based layout provides clear visual separation
- Icon consistency improves scannability
- Expandable contact lists handle multiple entries elegantly
- Responsive grid adapts to different screen sizes

### Future Enhancements
- Clickable contact information (call, email links)
- Inline editing capabilities
- Contact preference indicators
- Profile photo integration

### Related PRPs
- **PRP-001:** Uses header component for consistent styling
- **PRP-002:** Integrated into tab navigation system
- **PRP-005:** Will add inline editing to these fields
- **PRP-009:** Will be optimized for mobile interaction