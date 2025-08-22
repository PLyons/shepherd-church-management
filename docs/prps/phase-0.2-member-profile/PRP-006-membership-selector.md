# PRP-006: Membership Type Selector

**Phase:** 0.2 - Member Profile UI Enhancements  
**Status:** ✅ Completed  
**Priority:** Medium  
**Estimated Effort:** 1 day  
**Dependencies:** PRP-001 (Header Redesign), PRP-005 (Inline Editing)  
**Completed:** 2025-08-22  

## Purpose

Implement a dropdown selector in the member profile header for quick membership type and status changes, with comprehensive history tracking and audit trail similar to Planning Center's membership management.

## Requirements

### Technical Requirements
- Dropdown component integrated into profile header
- Firebase subcollection for status change history
- Role-based permissions (admin/pastor only)
- Optimistic updates with rollback capability
- TypeScript interfaces for membership types and history
- Integration with existing member status system

### Design Requirements
- Professional dropdown with current status display
- Confirmation dialog for status changes
- Optional reason/note input for changes
- History modal showing timeline of changes
- Visual indicators for different membership types
- Consistent styling with header design

### Dependencies
- PRP-001 header component structure
- PRP-005 inline editing patterns for optimistic updates
- Existing member status system
- Auth context for role-based permissions
- Firebase services for data persistence

## Context

### Current State
Member status is displayed as a static badge in the profile:
```jsx
<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.memberStatus)}`}>
  {member.memberStatus}
</span>
```

Status changes require:
1. Navigate to edit form
2. Change status dropdown
3. Submit entire form
4. Navigate back to profile

### Problems with Current Implementation
- No quick way to change membership status
- No audit trail of status changes
- No context for why status was changed
- Inefficient workflow for common administrative task
- No visibility into membership history

### Desired State
- Quick dropdown selector in profile header
- Confirmation dialog with reason field
- Audit trail of all status changes
- History view showing timeline
- Proper permissions and validation
- Optimistic updates for responsiveness

## Success Criteria

- [ ] Dropdown displays current membership status
- [ ] Shows available status options based on permissions
- [ ] Confirmation dialog appears for status changes
- [ ] Reason field allows context input
- [ ] Status history is tracked in Firebase
- [ ] History modal shows timeline of changes
- [ ] Only authorized users can change status
- [ ] Optimistic updates provide immediate feedback
- [ ] Changes are logged with user and timestamp
- [ ] Rollback works when changes fail

## Implementation Procedure

### Step 1: Define Membership Types and Constants

1. **Create membership types constants:**
   ```bash
   touch src/constants/membershipTypes.ts
   ```

   ```typescript
   export interface MembershipType {
     value: string;
     label: string;
     description: string;
     icon: string;
     color: {
       bg: string;
       text: string;
       border: string;
     };
     permissions: {
       canChangeTo: string[]; // roles that can set this status
       canChangeFrom: string[]; // roles that can change from this status
     };
   }

   export const MEMBERSHIP_TYPES: Record<string, MembershipType> = {
     member: {
       value: 'member',
       label: 'Member',
       description: 'Full church member',
       icon: '👤',
       color: {
         bg: 'bg-green-100',
         text: 'text-green-800',
         border: 'border-green-200'
       },
       permissions: {
         canChangeTo: ['admin', 'pastor'],
         canChangeFrom: ['admin', 'pastor']
       }
     },
     regular_attender: {
       value: 'regular_attender',
       label: 'Regular Attender',
       description: 'Attends regularly but not yet a member',
       icon: '🔄',
       color: {
         bg: 'bg-blue-100',
         text: 'text-blue-800',
         border: 'border-blue-200'
       },
       permissions: {
         canChangeTo: ['admin', 'pastor'],
         canChangeFrom: ['admin', 'pastor']
       }
     },
     visitor: {
       value: 'visitor',
       label: 'Visitor',
       description: 'First time or occasional visitor',
       icon: '👋',
       color: {
         bg: 'bg-yellow-100',
         text: 'text-yellow-800',
         border: 'border-yellow-200'
       },
       permissions: {
         canChangeTo: ['admin', 'pastor'],
         canChangeFrom: ['admin', 'pastor']
       }
     },
     participant: {
       value: 'participant',
       label: 'Participant',
       description: 'Participates in activities but not regular attender',
       icon: '🎯',
       color: {
         bg: 'bg-purple-100',
         text: 'text-purple-800',
         border: 'border-purple-200'
       },
       permissions: {
         canChangeTo: ['admin', 'pastor'],
         canChangeFrom: ['admin', 'pastor']
       }
     },
     inactive: {
       value: 'inactive',
       label: 'Inactive',
       description: 'No longer actively participating',
       icon: '⏸️',
       color: {
         bg: 'bg-gray-100',
         text: 'text-gray-800',
         border: 'border-gray-200'
       },
       permissions: {
         canChangeTo: ['admin', 'pastor'],
         canChangeFrom: ['admin', 'pastor']
       }
     },
     not_set: {
       value: 'not_set',
       label: 'Not Set',
       description: 'Membership status not yet determined',
       icon: '❓',
       color: {
         bg: 'bg-gray-50',
         text: 'text-gray-600',
         border: 'border-gray-100'
       },
       permissions: {
         canChangeTo: ['admin', 'pastor'],
         canChangeFrom: ['admin', 'pastor']
       }
     }
   };

   export const getAvailableStatusOptions = (currentRole: string, currentStatus: string) => {
     return Object.values(MEMBERSHIP_TYPES).filter(type => 
       type.permissions.canChangeTo.includes(currentRole) &&
       type.value !== currentStatus
     );
   };
   ```

### Step 2: Create Status Change History Interface

1. **Define history data structure:**
   ```typescript
   // Add to src/types/index.ts
   export interface MembershipStatusChange {
     id: string;
     memberId: string;
     previousStatus: string;
     newStatus: string;
     reason?: string;
     changedBy: string;
     changedByName: string;
     changedAt: Date;
     metadata?: {
       userAgent?: string;
       ipAddress?: string;
       source: 'profile' | 'admin_panel' | 'bulk_import';
     };
   }
   ```

2. **Create history service:**
   ```bash
   touch src/services/firebase/membershipHistory.service.ts
   ```

   ```typescript
   import { 
     collection, 
     addDoc, 
     query, 
     orderBy, 
     getDocs, 
     Timestamp 
   } from 'firebase/firestore';
   import { db } from '../../lib/firebase';
   import { MembershipStatusChange } from '../../types';

   class MembershipHistoryService {
     private getHistoryCollection(memberId: string) {
       return collection(db, 'members', memberId, 'statusHistory');
     }

     async addStatusChange(change: Omit<MembershipStatusChange, 'id' | 'changedAt'>): Promise<void> {
       try {
         const historyRef = this.getHistoryCollection(change.memberId);
         await addDoc(historyRef, {
           ...change,
           changedAt: Timestamp.now()
         });
       } catch (error) {
         console.error('Error adding status change:', error);
         throw new Error('Failed to record status change');
       }
     }

     async getStatusHistory(memberId: string): Promise<MembershipStatusChange[]> {
       try {
         const historyRef = this.getHistoryCollection(memberId);
         const q = query(historyRef, orderBy('changedAt', 'desc'));
         const snapshot = await getDocs(q);
         
         return snapshot.docs.map(doc => ({
           id: doc.id,
           ...doc.data(),
           changedAt: doc.data().changedAt.toDate()
         })) as MembershipStatusChange[];
       } catch (error) {
         console.error('Error fetching status history:', error);
         throw new Error('Failed to load status history');
       }
     }
   }

   export const membershipHistoryService = new MembershipHistoryService();
   ```

### Step 3: Create Membership Type Selector Component

1. **Create the selector component:**
   ```bash
   touch src/components/members/profile/MembershipTypeSelector.tsx
   ```

   ```typescript
   import { useState, useRef } from 'react';
   import { ChevronDown, Clock, AlertCircle } from 'lucide-react';
   import { Member } from '../../../types';
   import { MEMBERSHIP_TYPES, getAvailableStatusOptions } from '../../../constants/membershipTypes';
   import { useAuth } from '../../../contexts/AuthContext';
   import { useToast } from '../../../contexts/ToastContext';
   import { membersService } from '../../../services/firebase/members.service';
   import { membershipHistoryService } from '../../../services/firebase/membershipHistory.service';

   interface MembershipTypeSelectorProps {
     member: Member;
     onStatusChange?: (newStatus: string) => void;
   }

   export function MembershipTypeSelector({ member, onStatusChange }: MembershipTypeSelectorProps) {
     const [isOpen, setIsOpen] = useState(false);
     const [showConfirmDialog, setShowConfirmDialog] = useState(false);
     const [pendingStatus, setPendingStatus] = useState<string | null>(null);
     const [reason, setReason] = useState('');
     const [isChanging, setIsChanging] = useState(false);
     const [showHistory, setShowHistory] = useState(false);

     const { member: currentUser } = useAuth();
     const { showToast } = useToast();
     const dropdownRef = useRef<HTMLDivElement>(null);

     const currentStatus = member.memberStatus || 'not_set';
     const currentType = MEMBERSHIP_TYPES[currentStatus];
     const canChangeStatus = currentUser?.role === 'admin' || currentUser?.role === 'pastor';
     const availableOptions = getAvailableStatusOptions(currentUser?.role || '', currentStatus);

     // Component methods continue...
   }
   ```

2. **Implement status change logic:**
   ```typescript
   const handleStatusSelect = (newStatus: string) => {
     setIsOpen(false);
     setPendingStatus(newStatus);
     setShowConfirmDialog(true);
     setReason('');
   };

   const confirmStatusChange = async () => {
     if (!pendingStatus || !currentUser) return;

     setIsChanging(true);
     try {
       // Optimistic update
       if (onStatusChange) {
         onStatusChange(pendingStatus);
       }

       // Update member status
       await membersService.update(member.id, { memberStatus: pendingStatus });

       // Record history
       await membershipHistoryService.addStatusChange({
         memberId: member.id,
         previousStatus: currentStatus,
         newStatus: pendingStatus,
         reason: reason.trim() || undefined,
         changedBy: currentUser.id,
         changedByName: `${currentUser.firstName} ${currentUser.lastName}`,
         metadata: {
           source: 'profile',
           userAgent: navigator.userAgent
         }
       });

       showToast('Membership status updated successfully', 'success');
       setShowConfirmDialog(false);
       setPendingStatus(null);
       setReason('');
     } catch (error) {
       // Rollback optimistic update
       if (onStatusChange) {
         onStatusChange(currentStatus);
       }
       
       console.error('Error updating membership status:', error);
       showToast('Failed to update membership status', 'error');
     } finally {
       setIsChanging(false);
     }
   };

   const cancelStatusChange = () => {
     setShowConfirmDialog(false);
     setPendingStatus(null);
     setReason('');
   };
   ```

### Step 4: Implement Dropdown UI

1. **Create dropdown render:**
   ```jsx
   return (
     <div className="relative" ref={dropdownRef}>
       {/* Current status button */}
       <button
         onClick={() => canChangeStatus && setIsOpen(!isOpen)}
         disabled={!canChangeStatus}
         className={`
           inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors
           ${currentType.color.bg} ${currentType.color.text} ${currentType.color.border}
           ${canChangeStatus 
             ? 'hover:opacity-80 cursor-pointer' 
             : 'cursor-not-allowed opacity-75'
           }
         `}
       >
         <span>{currentType.icon}</span>
         <span>{currentType.label}</span>
         {canChangeStatus && (
           <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
         )}
       </button>

       {/* Dropdown menu */}
       {isOpen && canChangeStatus && (
         <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
           <div className="p-2">
             <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
               Change Membership Status
             </div>
             {availableOptions.map(option => (
               <button
                 key={option.value}
                 onClick={() => handleStatusSelect(option.value)}
                 className="w-full flex items-center gap-3 px-2 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
               >
                 <span className="text-lg">{option.icon}</span>
                 <div className="flex-1">
                   <div className="text-sm font-medium text-gray-900">
                     {option.label}
                   </div>
                   <div className="text-xs text-gray-500">
                     {option.description}
                   </div>
                 </div>
               </button>
             ))}
           </div>
           
           <div className="border-t border-gray-100 p-2">
             <button
               onClick={() => {
                 setIsOpen(false);
                 setShowHistory(true);
               }}
               className="w-full flex items-center gap-2 px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
             >
               <Clock className="h-4 w-4" />
               View Status History
             </button>
           </div>
         </div>
       )}
     </div>
   );
   ```

### Step 5: Create Confirmation Dialog

1. **Add confirmation dialog:**
   ```jsx
   {/* Confirmation Dialog */}
   {showConfirmDialog && pendingStatus && (
     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
       <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
         <div className="flex items-center gap-3 mb-4">
           <AlertCircle className="h-6 w-6 text-amber-600" />
           <h3 className="text-lg font-medium text-gray-900">
             Confirm Status Change
           </h3>
         </div>
         
         <div className="mb-4">
           <p className="text-sm text-gray-600 mb-3">
             Change membership status from{' '}
             <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${currentType.color.bg} ${currentType.color.text}`}>
               {currentType.icon} {currentType.label}
             </span>
             {' '}to{' '}
             <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${MEMBERSHIP_TYPES[pendingStatus].color.bg} ${MEMBERSHIP_TYPES[pendingStatus].color.text}`}>
               {MEMBERSHIP_TYPES[pendingStatus].icon} {MEMBERSHIP_TYPES[pendingStatus].label}
             </span>
             ?
           </p>
           
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Reason for change (optional)
             </label>
             <textarea
               value={reason}
               onChange={(e) => setReason(e.target.value)}
               placeholder="e.g., Completed membership class, Moved away, etc."
               className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
               rows={3}
             />
           </div>
         </div>
         
         <div className="flex gap-3 justify-end">
           <button
             onClick={cancelStatusChange}
             disabled={isChanging}
             className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
           >
             Cancel
           </button>
           <button
             onClick={confirmStatusChange}
             disabled={isChanging}
             className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center gap-2"
           >
             {isChanging && (
               <div className="h-4 w-4 animate-spin rounded-full border border-white border-t-transparent" />
             )}
             Confirm Change
           </button>
         </div>
       </div>
     </div>
   )}
   ```

### Step 6: Create Status History Modal

1. **Create history modal component:**
   ```bash
   touch src/components/members/profile/MembershipHistoryModal.tsx
   ```

   ```typescript
   import { useState, useEffect } from 'react';
   import { X, Clock, User } from 'lucide-react';
   import { MEMBERSHIP_TYPES } from '../../../constants/membershipTypes';
   import { membershipHistoryService } from '../../../services/firebase/membershipHistory.service';
   import { MembershipStatusChange } from '../../../types';

   interface MembershipHistoryModalProps {
     memberId: string;
     isOpen: boolean;
     onClose: () => void;
   }

   export function MembershipHistoryModal({ memberId, isOpen, onClose }: MembershipHistoryModalProps) {
     const [history, setHistory] = useState<MembershipStatusChange[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
       if (!isOpen) return;

       const loadHistory = async () => {
         try {
           setLoading(true);
           const historyData = await membershipHistoryService.getStatusHistory(memberId);
           setHistory(historyData);
         } catch (err) {
           setError('Failed to load status history');
         } finally {
           setLoading(false);
         }
       };

       loadHistory();
     }, [isOpen, memberId]);

     if (!isOpen) return null;

     return (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
           <div className="flex items-center justify-between p-6 border-b border-gray-200">
             <h3 className="text-lg font-medium text-gray-900">
               Membership Status History
             </h3>
             <button
               onClick={onClose}
               className="p-1 text-gray-400 hover:text-gray-600 rounded"
             >
               <X className="h-5 w-5" />
             </button>
           </div>
           
           <div className="p-6 overflow-y-auto max-h-80">
             {loading ? (
               <div className="text-center py-8">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                 <p className="mt-2 text-sm text-gray-600">Loading history...</p>
               </div>
             ) : error ? (
               <div className="text-center py-8 text-red-600">
                 {error}
               </div>
             ) : history.length === 0 ? (
               <div className="text-center py-8">
                 <Clock className="mx-auto h-8 w-8 text-gray-400" />
                 <p className="mt-2 text-sm text-gray-600">No status changes recorded</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {history.map((change, index) => (
                   <StatusChangeItem key={change.id} change={change} isLatest={index === 0} />
                 ))}
               </div>
             )}
           </div>
         </div>
       </div>
     );
   }

   function StatusChangeItem({ change, isLatest }: { change: MembershipStatusChange; isLatest: boolean }) {
     const fromType = MEMBERSHIP_TYPES[change.previousStatus];
     const toType = MEMBERSHIP_TYPES[change.newStatus];

     return (
       <div className={`flex gap-4 p-4 rounded-lg ${isLatest ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
         <div className="flex-shrink-0">
           <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center border">
             <User className="h-4 w-4 text-gray-600" />
           </div>
         </div>
         <div className="flex-1 min-w-0">
           <div className="flex items-center gap-2 mb-1">
             <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${fromType.color.bg} ${fromType.color.text}`}>
               {fromType.icon} {fromType.label}
             </span>
             <span className="text-gray-400">→</span>
             <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${toType.color.bg} ${toType.color.text}`}>
               {toType.icon} {toType.label}
             </span>
           </div>
           <div className="text-sm text-gray-600">
             Changed by <span className="font-medium">{change.changedByName}</span>
           </div>
           <div className="text-xs text-gray-500">
             {change.changedAt.toLocaleString()}
           </div>
           {change.reason && (
             <div className="mt-2 text-sm text-gray-700 italic">
               "{change.reason}"
             </div>
           )}
         </div>
       </div>
     );
   }
   ```

### Step 7: Integrate with Header Component

1. **Update MemberProfileHeader to include selector:**
   ```typescript
   // In MemberProfileHeader.tsx
   import { MembershipTypeSelector } from './MembershipTypeSelector';

   // Add to header actions section
   <div className="flex items-center gap-2">
     <MembershipTypeSelector 
       member={member}
       onStatusChange={(newStatus) => {
         // Update local state optimistically
         // This will be used for optimistic updates
       }}
     />
     
     {/* Existing edit and actions buttons */}
   </div>
   ```

### Step 8: Add Click Outside Handler

1. **Implement click outside logic:**
   ```typescript
   useEffect(() => {
     const handleClickOutside = (event: MouseEvent) => {
       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
         setIsOpen(false);
       }
     };

     document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);
   ```

### Step 9: Add Firebase Security Rules

1. **Update Firestore rules for status history:**
   ```javascript
   // Add to firestore.rules
   match /members/{memberId}/statusHistory/{historyId} {
     allow read: if isAuthenticated() && 
       (resource.data.changedBy == request.auth.uid || 
        hasRole(['admin', 'pastor']) ||
        memberId == request.auth.uid);
     
     allow create: if isAuthenticated() && 
       hasRole(['admin', 'pastor']) &&
       request.resource.data.keys().hasAll(['memberId', 'previousStatus', 'newStatus', 'changedBy', 'changedByName', 'changedAt']) &&
       request.resource.data.changedBy == request.auth.uid;
     
     allow update, delete: if false; // History should be immutable
   }
   ```

## Testing Plan

### Unit Tests
```typescript
// src/components/members/profile/__tests__/MembershipTypeSelector.test.tsx

describe('MembershipTypeSelector', () => {
  it('displays current membership status correctly');
  it('shows dropdown options for authorized users');
  it('hides dropdown for unauthorized users');
  it('opens confirmation dialog on status selection');
  it('records status change with history');
  it('handles optimistic updates correctly');
  it('rolls back on save failure');
  it('shows status history modal');
});
```

### Integration Tests
```typescript
describe('Membership Status Management', () => {
  it('updates member status in Firebase');
  it('creates history record in subcollection');
  it('maintains proper permissions');
  it('handles concurrent status changes');
});
```

### Manual Testing Checklist
- [ ] Dropdown displays current status with correct styling
- [ ] Only admin/pastor users can change status
- [ ] Confirmation dialog shows before changes
- [ ] Reason field accepts optional input
- [ ] Status changes save to Firebase correctly
- [ ] History records are created with proper data
- [ ] History modal displays timeline correctly
- [ ] Optimistic updates work smoothly
- [ ] Rollback works when saves fail
- [ ] Click outside closes dropdown

## Rollback Plan

### Immediate Rollback
1. **Remove selector component:**
   ```bash
   rm src/components/members/profile/MembershipTypeSelector.tsx
   rm src/components/members/profile/MembershipHistoryModal.tsx
   ```

2. **Remove constants:**
   ```bash
   rm src/constants/membershipTypes.ts
   ```

3. **Revert header integration:**
   ```bash
   git checkout HEAD~1 -- src/components/members/profile/MemberProfileHeader.tsx
   ```

### Data Safety
- History data remains in Firebase (no data loss)
- Member status changes are reversible
- Can re-enable feature without affecting existing data

## Notes

### Design Decisions
- Separate confirmation dialog prevents accidental changes
- History tracking provides audit trail for administrative purposes
- Optimistic updates improve perceived performance
- Role-based permissions ensure proper access control

### Future Enhancements
- Bulk status changes for multiple members
- Custom membership types per organization
- Email notifications for status changes
- Integration with membership renewal workflows
- Export membership history reports

### Related PRPs
- **PRP-001:** Integrates with header component design
- **PRP-005:** Uses optimistic update patterns
- **PRP-008:** May integrate with notes for status change context
- **PRP-010:** Will be tested for accessibility compliance