import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { HouseholdForm } from '../components/households/HouseholdForm';
import { useAuth } from '../hooks/useUnifiedAuth';

export default function CreateHousehold() {
  const { member: currentUser } = useAuth();

  // Role-based access control
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'pastor') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">
            You don't have permission to create households.
          </p>
          <div className="mt-6">
            <Link
              to="/households"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Households
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          to="/households"
          className="inline-flex items-center text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Households
        </Link>
      </div>

      <HouseholdForm mode="create" />
    </div>
  );
}
