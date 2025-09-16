import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { HouseholdForm } from '../components/households/HouseholdForm';
import { householdsService } from '../services/firebase/households.service';
import { Household } from '../types/firestore';
import { useAuth } from '../hooks/useUnifiedAuth';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export default function EditHousehold() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { member: currentUser } = useAuth();
  const { showToast } = useToast();

  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadHousehold();
    } else {
      navigate('/households');
    }
  }, [id]);

  const loadHousehold = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await householdsService.getById(id);

      if (!data) {
        showToast('Household not found', 'error');
        navigate('/households');
        return;
      }

      setHousehold(data);
    } catch (error) {
      console.error('Error loading household:', error);
      showToast('Failed to load household', 'error');
      navigate('/households');
    } finally {
      setLoading(false);
    }
  };

  // Role-based access control
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'pastor') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">
            You don't have permission to edit households.
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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!household) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Household Not Found
          </h2>
          <p className="mt-2 text-gray-600">
            The household you're trying to edit doesn't exist.
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
          to={`/households/${household.id}`}
          className="inline-flex items-center text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Household
        </Link>
      </div>

      <HouseholdForm mode="edit" household={household} />
    </div>
  );
}
