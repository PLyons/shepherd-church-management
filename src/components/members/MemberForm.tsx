import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { membersService } from '../../services/firebase/members.service';
import { Member } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface MemberFormProps {
  onSuccess?: (member: Member) => void;
  onCancel?: () => void;
}

export function MemberForm({ onSuccess, onCancel }: MemberFormProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Partial<Member>>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      memberStatus: 'active',
      role: 'member',
    },
  });

  const onSubmit = async (data: Partial<Member>) => {
    console.log('🔥 FORM SUBMISSION STARTED');
    console.log('📝 Form data received:', data);
    console.log('📝 Form validation errors:', errors);

    try {
      console.log('✅ Starting member creation process...');

      // Create member using base class method
      const memberData = {
        firstName: data.firstName!,
        lastName: data.lastName!,
        email: data.email || '',
        phone: data.phone || '',
        memberStatus: data.memberStatus || 'active',
        role: data.role || 'member',
        fullName: `${data.firstName} ${data.lastName}`,
      };

      console.log('📤 Sending member data to service:', memberData);
      console.log('🔧 Using membersService.create...');

      // Create member - service now returns Member object directly
      const newMember = await membersService.create(memberData);
      console.log('📥 Create result received:', newMember);
      console.log('📥 Result type:', typeof newMember);
      console.log('📥 Result details:', JSON.stringify(newMember, null, 2));

      console.log('🎉 Member created successfully:', newMember);
      console.log('📢 Showing success toast...');
      showToast('Member created successfully', 'success');

      console.log('🔄 Checking for onSuccess callback...');
      if (onSuccess) {
        console.log('📞 Calling onSuccess with member:', newMember);
        onSuccess(newMember);
      } else {
        console.log('🧭 No onSuccess callback, navigating to /members');
        navigate('/members');
      }

      console.log('✅ FORM SUBMISSION COMPLETED SUCCESSFULLY');
    } catch (error) {
      console.log('❌ FORM SUBMISSION FAILED');
      console.error('💥 Error details:', error);
      console.error('💥 Error stack:', (error as Error).stack);
      console.error('💥 Error message:', (error as Error).message);
      console.error('💥 Error type:', typeof error);
      console.error('💥 Error constructor:', error?.constructor?.name);

      const errorMessage =
        (error as Error).message || 'Failed to create member';
      console.log('📢 Showing error toast:', errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 max-w-2xl mx-auto p-6"
    >
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
          <p className="mt-1 text-sm text-red-600">
            {errors.firstName.message}
          </p>
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
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          {...register('email')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
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
        <label className="block text-sm font-medium text-gray-700">Role</label>
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
          onClick={() => console.log('🔴 SUBMIT BUTTON CLICKED')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Member
        </button>
        <button
          type="button"
          onClick={() => (onCancel ? onCancel() : navigate('/members'))}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
