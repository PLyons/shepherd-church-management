# PRP-005: Inline Editing Foundation

**Phase:** 0.2 - Member Profile UI Enhancements  
**Status:** Not Started  
**Priority:** High  
**Estimated Effort:** 2 days  
**Dependencies:** PRP-003 (Information Layout)  

## Purpose

Create a comprehensive inline editing system for member profile fields that allows users to edit information directly in the profile view without navigation, featuring optimistic updates, auto-save, and comprehensive validation.

## Requirements

### Technical Requirements
- Reusable inline editing components for different field types
- Optimistic updates with rollback on failure
- Debounced auto-save (500ms after typing stops)
- TypeScript strict typing for all field types
- Integration with existing Firebase services
- Comprehensive validation and error handling

### Design Requirements
- Click-to-edit interaction pattern
- Visual feedback during save operations
- Error states with clear messaging
- Consistent styling across all field types
- Keyboard shortcuts (Enter to save, Escape to cancel)
- Accessibility with proper focus management

### Dependencies
- Enhanced InfoField component from PRP-003
- Existing members.service.ts for data operations
- Current validation patterns from MemberFormEnhanced
- Auth context for permission checking

## Context

### Current State
All member editing requires navigation to a separate form:
```jsx
<button onClick={() => navigate(`/members/edit/${id}`)}>
  Edit Profile
</button>
```

Users must:
1. Click edit button
2. Navigate to form page
3. Make changes
4. Submit entire form
5. Navigate back to profile

### Problems with Current Implementation
- Poor user experience with full page navigation
- Slow workflow for simple edits
- Loss of context when editing
- All-or-nothing form submission
- No quick corrections for typos
- Inefficient for single field updates

### Desired State
- Click any field to edit in place
- Immediate visual feedback
- Auto-save without form submission
- Optimistic updates for responsiveness
- Validation and error handling
- Keyboard navigation support
- Permission-based editing restrictions

## Success Criteria

- [ ] All editable fields show edit affordance on hover
- [ ] Click activates inline edit mode
- [ ] Auto-save works 500ms after typing stops
- [ ] Optimistic updates provide immediate feedback
- [ ] Validation errors display clearly
- [ ] Save states show with visual indicators
- [ ] Keyboard shortcuts work (Enter/Escape)
- [ ] Permission system prevents unauthorized edits
- [ ] Works across all field types (text, select, date, arrays)
- [ ] Rollback works when save operations fail

## Implementation Procedure

### Step 1: Create Base Inline Edit Component

1. **Create the foundation component:**
   ```bash
   mkdir -p src/components/common/inline-edit
   touch src/components/common/inline-edit/InlineEditField.tsx
   ```

2. **Define core interfaces:**
   ```typescript
   interface InlineEditFieldProps<T = string> {
     value: T;
     onSave: (newValue: T) => Promise<void>;
     displayValue?: string;
     placeholder?: string;
     validation?: (value: T) => string | null;
     canEdit?: boolean;
     fieldType?: 'text' | 'email' | 'phone' | 'select' | 'date' | 'textarea';
     options?: Array<{ label: string; value: string }>;
     className?: string;
     icon?: LucideIcon;
     label?: string;
   }

   interface EditState {
     isEditing: boolean;
     isSaving: boolean;
     error: string | null;
     currentValue: string;
   }
   ```

3. **Implement base component structure:**
   ```typescript
   import { useState, useRef, useEffect, useCallback } from 'react';
   import { Check, X, Edit3, AlertCircle } from 'lucide-react';

   export function InlineEditField<T = string>({
     value,
     onSave,
     displayValue,
     placeholder = "Click to edit",
     validation,
     canEdit = true,
     fieldType = 'text',
     options = [],
     className = '',
     icon: Icon,
     label
   }: InlineEditFieldProps<T>) {
     const [state, setState] = useState<EditState>({
       isEditing: false,
       isSaving: false,
       error: null,
       currentValue: String(value || '')
     });

     const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);
     const timeoutRef = useRef<NodeJS.Timeout>();

     // Component implementation continues...
   }
   ```

### Step 2: Implement Edit State Management

1. **Handle edit mode activation:**
   ```typescript
   const startEditing = useCallback(() => {
     if (!canEdit) return;
     
     setState(prev => ({
       ...prev,
       isEditing: true,
       error: null,
       currentValue: String(value || '')
     }));
   }, [canEdit, value]);

   const cancelEditing = useCallback(() => {
     setState(prev => ({
       ...prev,
       isEditing: false,
       error: null,
       currentValue: String(value || '')
     }));
     
     if (timeoutRef.current) {
       clearTimeout(timeoutRef.current);
     }
   }, [value]);
   ```

2. **Implement auto-save with debouncing:**
   ```typescript
   const debouncedSave = useCallback((newValue: string) => {
     if (timeoutRef.current) {
       clearTimeout(timeoutRef.current);
     }

     timeoutRef.current = setTimeout(async () => {
       await handleSave(newValue);
     }, 500);
   }, []);

   const handleSave = useCallback(async (newValue: string) => {
     // Validation
     if (validation) {
       const error = validation(newValue as T);
       if (error) {
         setState(prev => ({ ...prev, error }));
         return;
       }
     }

     // Skip save if value unchanged
     if (newValue === String(value)) {
       setState(prev => ({ ...prev, isEditing: false, error: null }));
       return;
     }

     setState(prev => ({ ...prev, isSaving: true, error: null }));

     try {
       await onSave(newValue as T);
       setState(prev => ({ 
         ...prev, 
         isEditing: false, 
         isSaving: false, 
         error: null 
       }));
     } catch (error) {
       setState(prev => ({ 
         ...prev, 
         isSaving: false, 
         error: error instanceof Error ? error.message : 'Save failed',
         currentValue: String(value) // Rollback
       }));
     }
   }, [value, onSave, validation]);
   ```

3. **Handle input changes:**
   ```typescript
   const handleInputChange = useCallback((newValue: string) => {
     setState(prev => ({ ...prev, currentValue: newValue, error: null }));
     debouncedSave(newValue);
   }, [debouncedSave]);
   ```

### Step 3: Create Display and Edit Views

1. **Implement display mode:**
   ```typescript
   const DisplayMode = () => (
     <div 
       className={`
         group flex items-center gap-2 p-2 rounded-md cursor-pointer
         ${canEdit ? 'hover:bg-gray-50' : ''}
         ${className}
       `}
       onClick={startEditing}
     >
       {Icon && <Icon className="h-4 w-4 text-gray-500" />}
       <div className="flex-1 min-w-0">
         {label && (
           <div className="text-sm font-medium text-gray-700">{label}</div>
         )}
         <div className="text-sm text-gray-900">
           {displayValue || value || (
             <span className="text-gray-500 italic">{placeholder}</span>
           )}
         </div>
       </div>
       {canEdit && (
         <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
       )}
     </div>
   );
   ```

2. **Implement edit mode:**
   ```typescript
   const EditMode = () => (
     <div className={`flex items-center gap-2 p-2 rounded-md border border-blue-200 bg-blue-50 ${className}`}>
       {Icon && <Icon className="h-4 w-4 text-gray-500" />}
       <div className="flex-1 min-w-0">
         {label && (
           <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
         )}
         {renderInput()}
         {state.error && (
           <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
             <AlertCircle className="h-3 w-3" />
             {state.error}
           </div>
         )}
       </div>
       <div className="flex items-center gap-1">
         {state.isSaving ? (
           <div className="h-4 w-4 animate-spin rounded-full border border-blue-600 border-t-transparent" />
         ) : (
           <>
             <button
               onClick={() => handleSave(state.currentValue)}
               className="p-1 text-green-600 hover:bg-green-100 rounded"
               title="Save (Enter)"
             >
               <Check className="h-3 w-3" />
             </button>
             <button
               onClick={cancelEditing}
               className="p-1 text-red-600 hover:bg-red-100 rounded"
               title="Cancel (Escape)"
             >
               <X className="h-3 w-3" />
             </button>
           </>
         )}
       </div>
     </div>
   );
   ```

### Step 4: Implement Input Renderers

1. **Create input renderer function:**
   ```typescript
   const renderInput = () => {
     const baseProps = {
       ref: inputRef,
       value: state.currentValue,
       onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
         handleInputChange(e.target.value),
       onKeyDown: handleKeyDown,
       autoFocus: true,
       className: "w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
     };

     switch (fieldType) {
       case 'textarea':
         return (
           <textarea
             {...baseProps}
             rows={3}
             className={`${baseProps.className} resize-none`}
           />
         );
       
       case 'select':
         return (
           <select {...baseProps}>
             <option value="">Select an option</option>
             {options.map(option => (
               <option key={option.value} value={option.value}>
                 {option.label}
               </option>
             ))}
           </select>
         );
       
       case 'date':
         return (
           <input
             {...baseProps}
             type="date"
           />
         );
       
       case 'email':
         return (
           <input
             {...baseProps}
             type="email"
           />
         );
       
       case 'phone':
         return (
           <input
             {...baseProps}
             type="tel"
           />
         );
       
       default:
         return (
           <input
             {...baseProps}
             type="text"
           />
         );
     }
   };
   ```

2. **Handle keyboard shortcuts:**
   ```typescript
   const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
     if (e.key === 'Enter' && !e.shiftKey) {
       e.preventDefault();
       handleSave(state.currentValue);
     } else if (e.key === 'Escape') {
       e.preventDefault();
       cancelEditing();
     }
   }, [state.currentValue, handleSave, cancelEditing]);
   ```

### Step 5: Create Specialized Field Components

1. **Create text field component:**
   ```typescript
   // src/components/common/inline-edit/InlineEditText.tsx
   interface InlineEditTextProps {
     value: string;
     onSave: (value: string) => Promise<void>;
     label: string;
     icon?: LucideIcon;
     validation?: (value: string) => string | null;
     canEdit?: boolean;
     placeholder?: string;
   }

   export function InlineEditText(props: InlineEditTextProps) {
     return <InlineEditField {...props} fieldType="text" />;
   }
   ```

2. **Create select field component:**
   ```typescript
   // src/components/common/inline-edit/InlineEditSelect.tsx
   interface InlineEditSelectProps {
     value: string;
     onSave: (value: string) => Promise<void>;
     options: Array<{ label: string; value: string }>;
     label: string;
     icon?: LucideIcon;
     canEdit?: boolean;
   }

   export function InlineEditSelect(props: InlineEditSelectProps) {
     return <InlineEditField {...props} fieldType="select" />;
   }
   ```

3. **Create date field component:**
   ```typescript
   // src/components/common/inline-edit/InlineEditDate.tsx
   interface InlineEditDateProps {
     value: string | Date;
     onSave: (value: string) => Promise<void>;
     label: string;
     icon?: LucideIcon;
     canEdit?: boolean;
   }

   export function InlineEditDate({ value, ...props }: InlineEditDateProps) {
     const dateValue = value instanceof Date ? value.toISOString().split('T')[0] : value;
     
     return (
       <InlineEditField 
         {...props} 
         value={dateValue} 
         fieldType="date"
         displayValue={value ? formatDate(value) : undefined}
       />
     );
   }
   ```

### Step 6: Create Array Field Editor

1. **Create array field component:**
   ```typescript
   // src/components/common/inline-edit/InlineEditArray.tsx
   interface InlineEditArrayProps {
     items: Array<{ type: string; value: string; primary?: boolean }>;
     onSave: (items: Array<{ type: string; value: string; primary?: boolean }>) => Promise<void>;
     label: string;
     icon: LucideIcon;
     canEdit?: boolean;
     itemTypes: Array<{ label: string; value: string }>;
     validation?: (value: string) => string | null;
   }

   export function InlineEditArray({
     items,
     onSave,
     label,
     icon: Icon,
     canEdit = true,
     itemTypes,
     validation
   }: InlineEditArrayProps) {
     const [isEditing, setIsEditing] = useState(false);
     const [editItems, setEditItems] = useState(items);

     const addItem = () => {
       setEditItems([...editItems, { type: itemTypes[0].value, value: '', primary: false }]);
     };

     const removeItem = (index: number) => {
       setEditItems(editItems.filter((_, i) => i !== index));
     };

     const updateItem = (index: number, field: string, value: any) => {
       const updated = [...editItems];
       updated[index] = { ...updated[index], [field]: value };
       setEditItems(updated);
     };

     const handleSave = async () => {
       const validItems = editItems.filter(item => item.value.trim());
       await onSave(validItems);
       setIsEditing(false);
     };

     // Implementation continues with display and edit modes...
   }
   ```

### Step 7: Integrate with Member Profile

1. **Update OverviewTab to use inline editing:**
   ```typescript
   // In OverviewTab.tsx
   import { InlineEditText, InlineEditSelect, InlineEditDate } from '../common/inline-edit';
   import { membersService } from '../../../../services/firebase/members.service';

   const handleFieldSave = useCallback(async (field: string, value: any) => {
     if (!member?.id) return;
     
     try {
       await membersService.update(member.id, { [field]: value });
       // Update local state or trigger refetch
     } catch (error) {
       console.error(`Error updating ${field}:`, error);
       throw error;
     }
   }, [member?.id]);
   ```

2. **Replace static fields with inline edit components:**
   ```jsx
   // Replace InfoField components with InlineEdit versions
   <InlineEditText
     value={member.firstName}
     onSave={(value) => handleFieldSave('firstName', value)}
     label="First Name"
     icon={User}
     canEdit={canEdit}
     validation={(value) => value.trim() ? null : 'First name is required'}
   />

   <InlineEditText
     value={member.lastName}
     onSave={(value) => handleFieldSave('lastName', value)}
     label="Last Name"
     icon={User}
     canEdit={canEdit}
     validation={(value) => value.trim() ? null : 'Last name is required'}
   />

   <InlineEditSelect
     value={member.gender || ''}
     onSave={(value) => handleFieldSave('gender', value)}
     options={[
       { label: 'Male', value: 'Male' },
       { label: 'Female', value: 'Female' }
     ]}
     label="Gender"
     icon={User}
     canEdit={canEdit}
   />
   ```

### Step 8: Add Permission Integration

1. **Create permission hook:**
   ```typescript
   const useEditPermissions = (memberId: string) => {
     const { member: currentUser } = useAuth();
     
     return useMemo(() => {
       const isAdmin = currentUser?.role === 'admin';
       const isPastor = currentUser?.role === 'pastor';
       const isOwnProfile = currentUser?.id === memberId;
       
       return {
         canEditBasicInfo: isAdmin || isPastor || isOwnProfile,
         canEditRole: isAdmin,
         canEditStatus: isAdmin || isPastor,
         canEditChurchInfo: isAdmin || isPastor
       };
     }, [currentUser, memberId]);
   };
   ```

2. **Apply permissions to fields:**
   ```jsx
   const permissions = useEditPermissions(member.id);

   <InlineEditText
     value={member.firstName}
     onSave={(value) => handleFieldSave('firstName', value)}
     label="First Name"
     icon={User}
     canEdit={permissions.canEditBasicInfo}
   />
   ```

### Step 9: Add Success Feedback

1. **Create success toast integration:**
   ```typescript
   const handleFieldSave = useCallback(async (field: string, value: any) => {
     if (!member?.id) return;
     
     try {
       await membersService.update(member.id, { [field]: value });
       showToast('Field updated successfully', 'success');
     } catch (error) {
       console.error(`Error updating ${field}:`, error);
       showToast('Failed to update field', 'error');
       throw error;
     }
   }, [member?.id, showToast]);
   ```

2. **Add visual success indicators:**
   ```typescript
   const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());

   const handleFieldSave = useCallback(async (field: string, value: any) => {
     // ... save logic
     
     // Show temporary success indicator
     setRecentlyUpdated(prev => new Set([...prev, field]));
     setTimeout(() => {
       setRecentlyUpdated(prev => {
         const next = new Set(prev);
         next.delete(field);
         return next;
       });
     }, 2000);
   }, []);
   ```

## Testing Plan

### Unit Tests
```typescript
// src/components/common/inline-edit/__tests__/InlineEditField.test.tsx

describe('InlineEditField', () => {
  it('displays value in read mode');
  it('switches to edit mode on click');
  it('saves value on Enter key');
  it('cancels edit on Escape key');
  it('shows validation errors');
  it('handles save failures gracefully');
  it('debounces auto-save correctly');
  it('respects canEdit permission');
  it('shows loading state during save');
  it('rollbacks on save failure');
});
```

### Integration Tests
```typescript
describe('Profile Inline Editing', () => {
  it('updates member data via Firebase service');
  it('shows success feedback after save');
  it('maintains permissions across field types');
  it('handles concurrent edits appropriately');
});
```

### Manual Testing Checklist
- [ ] Click-to-edit works on all field types
- [ ] Auto-save triggers 500ms after typing stops
- [ ] Keyboard shortcuts work (Enter/Escape)
- [ ] Validation errors display correctly
- [ ] Permission system prevents unauthorized edits
- [ ] Loading states show during save operations
- [ ] Error states handle failures gracefully
- [ ] Success feedback appears after saves
- [ ] Rollback works when saves fail

### Accessibility Testing
- [ ] Screen reader announces edit mode changes
- [ ] Keyboard navigation works through all components
- [ ] Focus management works correctly
- [ ] Error messages are announced
- [ ] Save/cancel actions are accessible

## Rollback Plan

### Immediate Rollback
1. **Remove inline editing components:**
   ```bash
   rm -rf src/components/common/inline-edit/
   ```

2. **Revert OverviewTab to use InfoField:**
   ```bash
   git checkout HEAD~1 -- src/components/members/profile/tabs/OverviewTab.tsx
   ```

### Incremental Rollback
1. **Add feature flag:**
   ```typescript
   const useInlineEditing = process.env.VITE_INLINE_EDITING === 'true';
   ```

2. **Conditional rendering:**
   ```jsx
   {useInlineEditing ? (
     <InlineEditText {...props} />
   ) : (
     <InfoField {...props} />
   )}
   ```

## Notes

### Design Decisions
- Optimistic updates for better perceived performance
- Auto-save with debouncing to reduce server requests
- Visual feedback for all states (editing, saving, error)
- Permission-based editing restrictions
- Keyboard shortcuts for power users

### Future Enhancements
- Bulk edit mode for multiple fields
- Undo/redo functionality
- Conflict resolution for concurrent edits
- Rich text editing for notes
- Custom validation rules per field

### Related PRPs
- **PRP-003:** Builds on information layout structure
- **PRP-006:** Will integrate with membership selector
- **PRP-008:** Will enable note editing capabilities
- **PRP-010:** Will be tested for accessibility compliance