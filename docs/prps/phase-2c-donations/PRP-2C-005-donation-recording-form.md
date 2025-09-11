# PRP-2C-005: Donation Recording Form

**Phase**: 2C Donation Tracking & Financial Reports  
**Task**: 2C.5  
**Priority**: HIGH - Core UI for donation recording/editing  
**Estimated Time**: 4-5 hours  
**TDD Implementation**: REQUIRED - Component + Integration testing  

## Purpose

Implement the DonationForm component for creating and editing donations, following Shepherd's form patterns with React Hook Form, comprehensive validation, and role-based field visibility. This component will be the primary interface for admin/pastor users to record and manage donations with support for member lookup and batch entry.

## Context Required

**Essential Files to Read:**
- `CLAUDE.md` - Form patterns and React Hook Form standards
- `src/components/members/MemberFormEnhanced.tsx` - Form pattern reference
- `src/components/households/HouseholdForm.tsx` - Recent form implementation
- `src/components/events/EventForm.tsx` - Latest form implementation patterns
- `docs/prps/phase-2c-donations/PRP-2C-001-donation-data-model.md` - Donation types and interfaces
- Output from PRP-2C-001 (`src/types/donations.ts`) - Donation and form data types
- Output from PRP-2C-002 (`src/services/firebase/donations.service.ts`) - Donations service
- Output from PRP-2C-003 (`src/services/firebase/donation-categories.service.ts`) - Categories service

**Key Patterns to Follow:**
- React Hook Form with comprehensive validation
- Collapsible sections for form organization
- Role-based field access and visibility
- Professional styling with TailwindCSS
- Member lookup functionality
- Real-time amount formatting and validation

## Requirements

**Dependencies:**
- **MUST complete PRP-2C-001, PRP-2C-002, PRP-2C-003, PRP-2C-004 first**
- DonationFormData interface and Donation types
- DonationsService implementation
- DonationCategoriesService implementation
- Security rules deployed

**Critical Requirements:**
1. **Form Validation**: Comprehensive field validation with helpful error messages
2. **Role Integration**: Admin/pastor only access with role-appropriate fields
3. **Member Lookup**: Search and select members with anonymous donation support
4. **Batch Entry**: Support for recording multiple donations at once
5. **Amount Formatting**: Real-time currency formatting and validation
6. **Category Integration**: Dynamic category dropdown from service
7. **Payment Methods**: Support for all payment types with method-specific fields

## TDD Requirements

**Test Coverage Targets:**
- **Minimum Coverage**: 85% overall for UI components
- **Critical Path Coverage**: 90% for form validation and submission flows
- **High-Risk Areas**: 95% for currency handling and data validation
- **User Interaction Coverage**: 90% for form workflows

**Testing Strategy:**
- **Component Tests**: Form rendering, validation, user interactions
- **Integration Tests**: Service integration, data submission flows
- **Validation Tests**: Currency formatting, form validation rules
- **Accessibility Tests**: Form accessibility and error handling

**Test File Structure:**
```
src/components/donations/
├── __tests__/
│   ├── DonationForm.test.tsx              # Component behavior tests
│   ├── DonationForm.validation.test.tsx   # Form validation tests
│   ├── DonationForm.integration.test.tsx  # Service integration tests
│   └── MemberLookup.test.tsx              # Member lookup component tests
├── DonationForm.tsx
└── index.ts
```

**TDD Success Criteria:**
- [ ] All tests written before implementation (RED phase)
- [ ] All tests pass after implementation (GREEN phase)
- [ ] Code refactored for clarity and performance (REFACTOR phase)
- [ ] Coverage targets met: `npm run test:coverage`
- [ ] No regression in existing tests: `npm run test`
- [ ] Form validation scenarios comprehensively tested
- [ ] Currency handling edge cases covered
- [ ] User interaction workflows validated

**Key Test Scenarios:**
1. **Form Rendering**: Component renders with proper initial state
2. **Field Validation**: All validation rules trigger correct error messages
3. **Currency Formatting**: Real-time formatting and parsing accuracy
4. **Member Lookup**: Search functionality and selection behavior
5. **Batch Entry**: Multiple donation entry and removal
6. **Form Submission**: Data formatting and service integration
7. **Error Handling**: Network errors and validation failures
8. **Role Access**: Admin/pastor only access verification

## Detailed Procedure

### Step 0: TDD Setup (MANDATORY FIRST STEP)

**Create Test Files First:**

Create `src/components/donations/__tests__/DonationForm.test.tsx`:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DonationForm } from '../DonationForm';
import { TestProviders } from '../../__tests__/test-providers';
import { donationsService, donationCategoriesService } from '../../../services/firebase';

// Mock services
vi.mock('../../../services/firebase', () => ({
  donationsService: {
    create: vi.fn(),
    update: vi.fn(),
    getById: vi.fn(),
    createBatch: vi.fn(),
  },
  donationCategoriesService: {
    getActive: vi.fn(),
  },
  membersService: {
    search: vi.fn(),
    getById: vi.fn(),
  },
}));

describe('DonationForm', () => {
  const mockOnSubmit = vi.fn();
  const mockCategories = [
    { id: 'cat-1', name: 'Tithe', isActive: true },
    { id: 'cat-2', name: 'Offering', isActive: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    donationCategoriesService.getActive.mockResolvedValue(mockCategories);
  });

  const renderForm = (props = {}) => {
    return render(
      <TestProviders>
        <DonationForm onSubmit={mockOnSubmit} {...props} />
      </TestProviders>
    );
  };

  describe('Form Rendering', () => {
    it('should render donation form with all required fields', async () => {
      renderForm();
      
      await waitFor(() => {
        expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument();
      });
    });

    it('should render anonymous donation toggle', async () => {
      renderForm();
      
      await waitFor(() => {
        expect(screen.getByLabelText(/anonymous donation/i)).toBeInTheDocument();
      });
    });

    it('should render batch mode when enabled', () => {
      renderForm({ batchMode: true });
      
      expect(screen.getByText(/record multiple donations/i)).toBeInTheDocument();
      expect(screen.getByText(/add entry/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for invalid amount', async () => {
      renderForm();
      
      const amountInput = screen.getByLabelText(/amount/i);
      fireEvent.change(amountInput, { target: { value: '-100' } });
      fireEvent.click(screen.getByRole('button', { name: /record donation/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/amount must be greater than/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for missing category', async () => {
      renderForm();
      
      const categorySelect = screen.getByLabelText(/category/i);
      fireEvent.change(categorySelect, { target: { value: '' } });
      fireEvent.click(screen.getByRole('button', { name: /record donation/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/category is required/i)).toBeInTheDocument();
      });
    });

    it('should require check number when payment method is check', async () => {
      renderForm();
      
      const methodSelect = screen.getByLabelText(/payment method/i);
      fireEvent.change(methodSelect, { target: { value: 'check' } });
      
      await waitFor(() => {
        expect(screen.getByLabelText(/check number/i)).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByRole('button', { name: /record donation/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/check number is required/i)).toBeInTheDocument();
      });
    });
  });

  // Additional test scenarios...
});
```

Create `src/components/donations/__tests__/DonationForm.validation.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrency, isValidCurrency } from '../../../utils/currency-utils';

describe('Currency Validation', () => {
  describe('formatCurrency', () => {
    it('should format valid amounts correctly', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0.01)).toBe('$0.01');
    });

    it('should handle zero amount', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });

  describe('parseCurrency', () => {
    it('should parse currency strings correctly', () => {
      expect(parseCurrency('$100.00')).toBe(100);
      expect(parseCurrency('1,234.56')).toBe(1234.56);
      expect(parseCurrency('$1,000')).toBe(1000);
    });

    it('should handle invalid input gracefully', () => {
      expect(parseCurrency('')).toBe(0);
      expect(parseCurrency('abc')).toBe(0);
      expect(parseCurrency('$')).toBe(0);
    });
  });

  describe('isValidCurrency', () => {
    it('should validate currency amounts', () => {
      expect(isValidCurrency(100)).toBe(true);
      expect(isValidCurrency('$100.00')).toBe(true);
      expect(isValidCurrency(-100)).toBe(false);
      expect(isValidCurrency(1000000)).toBe(true);
      expect(isValidCurrency(1000001)).toBe(false);
    });
  });
});
```

**Run Initial Tests (Should Fail):**
```bash
npm run test -- src/components/donations/__tests__/DonationForm.test.tsx
# Expected: All tests fail with "component not implemented" errors
```

### Step 1: Create Donation Form Component

Create `src/components/donations/DonationForm.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { DonationFormData, PaymentMethod, Member } from '../../types';
import { donationsService, donationCategoriesService, membersService } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, parseCurrency } from '../../utils/currency-utils';
import { MemberLookup } from '../common/MemberLookup';

interface DonationFormProps {
  donationId?: string;
  onSubmit?: (donationData: DonationFormData) => void;
  onCancel?: () => void;
  batchMode?: boolean;
}

export const DonationForm: React.FC<DonationFormProps> = ({
  donationId,
  onSubmit,
  onCancel,
  batchMode = false
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDonation, setIsLoadingDonation] = useState(!!donationId);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; isActive: boolean }>>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
    control
  } = useForm<DonationFormData>({
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      paymentMethod: 'cash' as PaymentMethod,
      categoryId: '',
      notes: '',
      isAnonymous: false,
      checkNumber: '',
      batch: batchMode ? [{
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash' as PaymentMethod,
        categoryId: '',
        memberId: '',
        isAnonymous: false,
        notes: '',
        checkNumber: ''
      }] : undefined
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'batch'
  });

  const watchPaymentMethod = watch('paymentMethod');
  const watchAmount = watch('amount');

  // Payment method options
  const paymentMethodOptions: { value: PaymentMethod; label: string }[] = [
    { value: 'cash', label: 'Cash' },
    { value: 'check', label: 'Check' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'online', label: 'Online Payment' },
    { value: 'other', label: 'Other' },
  ];

  // Load donation categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load existing donation for editing
  useEffect(() => {
    if (donationId) {
      loadDonation();
    }
  }, [donationId]);

  // Format amount display
  useEffect(() => {
    if (watchAmount && typeof watchAmount === 'number') {
      const formatted = formatCurrency(watchAmount);
      // Update display without triggering validation
      document.querySelector('input[name="amount"]')?.setAttribute('data-formatted', formatted);
    }
  }, [watchAmount]);

  const loadCategories = async () => {
    try {
      const categoriesData = await donationCategoriesService.getActive();
      setCategories(categoriesData);
      
      // Set default category if available
      if (categoriesData.length > 0 && !donationId) {
        const generalCategory = categoriesData.find(cat => cat.name.toLowerCase().includes('general')) 
          || categoriesData[0];
        setValue('categoryId', generalCategory.id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      showToast('Error loading donation categories', 'error');
    }
  };

  const loadDonation = async () => {
    if (!donationId) return;
    
    try {
      setIsLoadingDonation(true);
      const donation = await donationsService.getById(donationId);
      
      if (donation) {
        // Load member if donation has memberId
        if (donation.memberId && !donation.isAnonymous) {
          const member = await membersService.getById(donation.memberId);
          setSelectedMember(member);
        }
        
        setIsAnonymous(donation.isAnonymous);
        
        reset({
          amount: donation.amount,
          date: donation.date.toISOString().split('T')[0],
          paymentMethod: donation.paymentMethod,
          categoryId: donation.categoryId,
          notes: donation.notes || '',
          isAnonymous: donation.isAnonymous,
          checkNumber: donation.checkNumber || '',
        });
      }
    } catch (error) {
      console.error('Error loading donation:', error);
      showToast('Error loading donation details', 'error');
    } finally {
      setIsLoadingDonation(false);
    }
  };

  const handleMemberSelect = (member: Member | null) => {
    setSelectedMember(member);
    if (member && !isAnonymous) {
      setValue('memberId', member.id);
    }
  };

  const handleAnonymousToggle = (anonymous: boolean) => {
    setIsAnonymous(anonymous);
    setValue('isAnonymous', anonymous);
    if (anonymous) {
      setSelectedMember(null);
      setValue('memberId', '');
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseCurrency(value);
    setValue('amount', numericValue);
  };

  const handleFormSubmit = async (data: DonationFormData) => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Validate member selection for non-anonymous donations
      if (!data.isAnonymous && !selectedMember) {
        showToast('Please select a member or mark as anonymous', 'error');
        return;
      }

      // Prepare donation data
      const donationData = {
        ...data,
        memberId: data.isAnonymous ? undefined : selectedMember?.id,
        recordedBy: user.uid,
        recordedAt: new Date(),
      };

      if (onSubmit) {
        onSubmit(donationData);
      } else if (batchMode && data.batch) {
        // Handle batch submission
        const batchData = data.batch.map(item => ({
          ...item,
          recordedBy: user.uid,
          recordedAt: new Date(),
          date: new Date(item.date),
        }));
        await donationsService.createBatch(batchData);
        showToast(`${batchData.length} donations recorded successfully!`, 'success');
        navigate('/donations');
      } else if (donationId) {
        await donationsService.update(donationId, donationData);
        showToast('Donation updated successfully!', 'success');
        navigate('/donations');
      } else {
        await donationsService.create(donationData);
        showToast('Donation recorded successfully!', 'success');
        navigate('/donations');
      }
    } catch (error) {
      console.error('Error saving donation:', error);
      showToast('Error saving donation. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/donations');
    }
  };

  const addBatchEntry = () => {
    append({
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash' as PaymentMethod,
      categoryId: categories[0]?.id || '',
      memberId: '',
      isAnonymous: false,
      notes: '',
      checkNumber: ''
    });
  };

  if (isLoadingDonation) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {batchMode 
              ? 'Record Multiple Donations' 
              : donationId 
                ? 'Edit Donation' 
                : 'Record New Donation'}
          </h2>
          {batchMode && (
            <p className="mt-1 text-sm text-gray-500">
              Use batch mode to quickly record multiple donations from the same service or event.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-8">
          {!batchMode && (
            <>
              {/* Donor Information Section */}
              <section>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Donor Information</h3>
                
                {/* Anonymous Toggle */}
                <div className="mb-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => handleAnonymousToggle(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Anonymous donation</span>
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    Check this box if the donor wishes to remain anonymous
                  </p>
                </div>

                {/* Member Lookup */}
                {!isAnonymous && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Member *
                    </label>
                    <MemberLookup
                      onSelect={handleMemberSelect}
                      selectedMember={selectedMember}
                      placeholder="Search for member by name, email, or phone..."
                      required={!isAnonymous}
                    />
                    {!selectedMember && !isAnonymous && (
                      <p className="mt-1 text-sm text-red-600">Please select a member</p>
                    )}
                  </div>
                )}
              </section>

              {/* Donation Details Section */}
              <section>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Donation Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="text"
                        {...register('amount', {
                          required: 'Donation amount is required',
                          validate: (value) => {
                            const num = typeof value === 'string' ? parseCurrency(value) : value;
                            if (num <= 0) return 'Amount must be greater than $0';
                            if (num > 100000) return 'Amount cannot exceed $100,000';
                            return true;
                          }
                        })}
                        onChange={handleAmountChange}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      {...register('date', { required: 'Date is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      {...register('categoryId', { required: 'Category is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method *
                    </label>
                    <select
                      {...register('paymentMethod', { required: 'Payment method is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {paymentMethodOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.paymentMethod && (
                      <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
                    )}
                  </div>
                </div>

                {/* Check Number (if payment method is check) */}
                {watchPaymentMethod === 'check' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check Number *
                    </label>
                    <input
                      type="text"
                      {...register('checkNumber', {
                        required: watchPaymentMethod === 'check' ? 'Check number is required for check payments' : false
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter check number"
                    />
                    {errors.checkNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.checkNumber.message}</p>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes about this donation (optional)"
                  />
                </div>
              </section>
            </>
          )}

          {/* Batch Mode Section */}
          {batchMode && (
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Donation Entries</h3>
                <button
                  type="button"
                  onClick={addBatchEntry}
                  className="px-3 py-1 text-sm border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  + Add Entry
                </button>
              </div>

              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-gray-200 rounded-md relative">
                    <div className="absolute top-2 right-2">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={fields.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="text"
                            {...register(`batch.${index}.amount`, {
                              required: 'Amount is required',
                              validate: (value) => {
                                const num = typeof value === 'string' ? parseCurrency(value) : value;
                                if (num <= 0) return 'Amount must be greater than $0';
                                return true;
                              }
                            })}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category *
                        </label>
                        <select
                          {...register(`batch.${index}.categoryId`, { required: 'Category is required' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Method *
                        </label>
                        <select
                          {...register(`batch.${index}.paymentMethod`, { required: 'Payment method is required' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {paymentMethodOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </>
              ) : batchMode ? (
                `Record ${fields.length} Donation${fields.length !== 1 ? 's' : ''}`
              ) : donationId ? (
                'Update Donation'
              ) : (
                'Record Donation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

**TDD Implementation:**
1. **RED**: Write failing test for form rendering
2. **GREEN**: Implement component structure to pass basic rendering tests
3. **REFACTOR**: Optimize component organization and performance

### Step 2: Create Donation Pages

Create `src/pages/RecordDonation.tsx`:

```typescript
import React from 'react';
import { DonationForm } from '../components/donations/DonationForm';
import { RequireRole } from '../components/auth/RequireRole';

export const RecordDonation: React.FC = () => {
  return (
    <RequireRole allowedRoles={['admin', 'pastor']}>
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <DonationForm />
        </div>
      </div>
    </RequireRole>
  );
};
```

Create `src/pages/BatchRecordDonations.tsx`:

```typescript
import React from 'react';
import { DonationForm } from '../components/donations/DonationForm';
import { RequireRole } from '../components/auth/RequireRole';

export const BatchRecordDonations: React.FC = () => {
  return (
    <RequireRole allowedRoles={['admin', 'pastor']}>
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <DonationForm batchMode={true} />
        </div>
      </div>
    </RequireRole>
  );
};
```

Create `src/pages/EditDonation.tsx`:

```typescript
import React from 'react';
import { useParams } from 'react-router-dom';
import { DonationForm } from '../components/donations/DonationForm';
import { RequireRole } from '../components/auth/RequireRole';

export const EditDonation: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <RequireRole allowedRoles={['admin', 'pastor']}>
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <DonationForm donationId={id} />
        </div>
      </div>
    </RequireRole>
  );
};
```

**TDD Implementation:**
1. **RED**: Write tests for page routing and role protection
2. **GREEN**: Implement pages with proper role guards
3. **REFACTOR**: Optimize routing structure

### Step 3: Create Utility Components

Create `src/components/common/MemberLookup.tsx`:

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { membersService } from '../../services/firebase';
import { Member } from '../../types';

interface MemberLookupProps {
  onSelect: (member: Member | null) => void;
  selectedMember: Member | null;
  placeholder?: string;
  required?: boolean;
}

export const MemberLookup: React.FC<MemberLookupProps> = ({
  onSelect,
  selectedMember,
  placeholder = "Search for member...",
  required = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedMember) {
      setSearchTerm(`${selectedMember.firstName} ${selectedMember.lastName}`);
    }
  }, [selectedMember]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchMembers = async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const members = await membersService.search(term);
      setResults(members.slice(0, 10)); // Limit to 10 results
      setShowDropdown(true);
    } catch (error) {
      console.error('Error searching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (!selectedMember || value !== `${selectedMember.firstName} ${selectedMember.lastName}`) {
      onSelect(null);
      searchMembers(value);
    }
  };

  const handleSelectMember = (member: Member) => {
    setSearchTerm(`${member.firstName} ${member.lastName}`);
    setShowDropdown(false);
    onSelect(member);
  };

  const handleClear = () => {
    setSearchTerm('');
    setResults([]);
    setShowDropdown(false);
    onSelect(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
          required={required}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-gray-500">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full mr-2"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            results.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleSelectMember(member)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              >
                <div className="font-medium">{member.firstName} {member.lastName}</div>
                {member.email && (
                  <div className="text-sm text-gray-500">{member.email}</div>
                )}
              </button>
            ))
          ) : searchTerm.length >= 2 ? (
            <div className="px-3 py-2 text-gray-500">No members found</div>
          ) : (
            <div className="px-3 py-2 text-gray-500">Type at least 2 characters to search</div>
          )}
        </div>
      )}
    </div>
  );
};
```

**TDD Implementation:**
1. **RED**: Write tests for member search and selection
2. **GREEN**: Implement search functionality with debouncing
3. **REFACTOR**: Optimize performance and accessibility

### Step 4: Create Currency Utilities

Create `src/utils/currency-utils.ts`:

```typescript
/**
 * Format a number as currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Parse a currency string to a number
 */
export const parseCurrency = (value: string): number => {
  // Remove currency symbols, spaces, and commas
  const cleanValue = value.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
};

/**
 * Validate currency amount
 */
export const isValidCurrency = (value: string | number): boolean => {
  const amount = typeof value === 'string' ? parseCurrency(value) : value;
  return !isNaN(amount) && amount >= 0 && amount <= 1000000;
};
```

**TDD Implementation:**
1. **RED**: Write comprehensive tests for currency formatting/parsing
2. **GREEN**: Implement utility functions to pass all tests
3. **REFACTOR**: Optimize for edge cases and performance

### Step 5: TDD Validation & Final Testing

**Comprehensive Testing:**
```bash
# Run all donation form tests
npm run test -- src/components/donations

# Check coverage
npm run test:coverage -- src/components/donations

# Run specific test scenarios
npm run test -- --grep="DonationForm validation"
npm run test -- --grep="currency utilities"
npm run test -- --grep="member lookup"

# Integration test with services
npm run test -- --grep="integration"
```

**Coverage Validation:**
- [ ] Overall coverage ≥ 85%
- [ ] Form validation ≥ 90%
- [ ] Currency utilities ≥ 95%
- [ ] User interactions ≥ 90%

## Success Criteria

**Technical Validation:**
- [ ] TypeScript compiles without errors
- [ ] All tests pass consistently
- [ ] Test coverage meets targets (85%/90%/95%)

**TDD Validation:**
- [ ] Test coverage meets targets (85%/90%/95%)
- [ ] All tests pass consistently
- [ ] Tests written before implementation
- [ ] Form validation scenarios comprehensively tested
- [ ] Currency handling edge cases covered
- [ ] Member lookup functionality fully tested
- [ ] Integration tests validate service interactions
- [ ] Error handling tested for all scenarios

**Functional Validation:**
- [ ] Form records single donations successfully
- [ ] Batch mode records multiple donations correctly
- [ ] Form updates existing donations properly
- [ ] Member lookup searches and selects correctly
- [ ] Anonymous donations work without member selection
- [ ] Currency formatting displays and validates properly
- [ ] All validation rules work with helpful error messages
- [ ] Payment method-specific fields show/hide correctly

**UI/UX Validation:**
- [ ] Form follows Shepherd's design patterns
- [ ] Loading states display correctly during operations
- [ ] Error messages are clear and helpful
- [ ] Form is responsive across device sizes
- [ ] Member lookup dropdown works smoothly
- [ ] Batch entry interface is intuitive
- [ ] Currency input formats in real-time

**Integration:**
- [ ] Form integrates with DonationsService
- [ ] Member lookup integrates with MembersService
- [ ] Category dropdown loads from DonationCategoriesService
- [ ] Navigation works correctly after form actions
- [ ] Toast notifications display properly
- [ ] Form data maps to Donation types correctly
- [ ] Role-based access restrictions enforced

## Files Created/Modified

**New Files:**
- `src/components/donations/DonationForm.tsx`
- `src/components/common/MemberLookup.tsx`
- `src/pages/RecordDonation.tsx`
- `src/pages/BatchRecordDonations.tsx`
- `src/pages/EditDonation.tsx`
- `src/utils/currency-utils.ts`

**Test Files:**
- `src/components/donations/__tests__/DonationForm.test.tsx`
- `src/components/donations/__tests__/DonationForm.validation.test.tsx`
- `src/components/donations/__tests__/DonationForm.integration.test.tsx`
- `src/components/donations/__tests__/MemberLookup.test.tsx`
- `src/utils/__tests__/currency-utils.test.ts`

## Next Task

After completion, proceed to **PRP-2C-006: Member Donation History** which will implement the UI for browsing, searching, and managing recorded donations.

## Notes

- Form follows React Hook Form patterns established in other Shepherd forms
- Member lookup provides smooth search experience with debounced queries
- Batch entry mode optimizes workflow for recording multiple donations
- Currency utilities ensure consistent formatting and validation
- Anonymous donation support maintains donor privacy when requested
- All validation is comprehensive with helpful error messages
- Component is fully responsive and follows accessibility best practices
- Role-based access ensures only admin/pastor can record donations
- **TDD implementation ensures 85%+ test coverage with comprehensive validation testing**

## TDD Implementation Log

**Test Development:**
- [ ] Component tests created: [DATE] - [DEVELOPER]
- [ ] Validation tests created: [DATE] - [DEVELOPER]
- [ ] Integration tests created: [DATE] - [DEVELOPER]
- [ ] Currency utility tests created: [DATE] - [DEVELOPER]

**Implementation Progress:**
- [ ] RED phase completed: [DATE] - All tests failing as expected
- [ ] GREEN phase completed: [DATE] - All tests passing
- [ ] REFACTOR phase completed: [DATE] - Code optimized, tests still passing

**Coverage Achievement:**
- [ ] 85% overall coverage achieved: [DATE]
- [ ] 90% form validation coverage achieved: [DATE]
- [ ] 95% currency utilities coverage achieved: [DATE]