// src/pages/Households.tsx
// Household management page displaying all church households with search and CRUD operations
// This file exists to provide the main interface for managing household data and relationships
// RELEVANT FILES: src/pages/HouseholdProfile.tsx, src/pages/CreateHousehold.tsx, src/services/firebase/households.service.ts, src/types/index.ts

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Home,
  RefreshCw,
  Edit,
  Trash2,
  UserPlus,
  MapPin,
} from 'lucide-react';
import { Household } from '../types/firestore';
import { householdsService } from '../services/firebase/households.service';
import { useAuth } from '../hooks/useUnifiedAuth';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export default function Households() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHouseholds, setFilteredHouseholds] = useState<Household[]>([]);
  const { member: currentMember } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    loadHouseholds();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = households.filter(
        (household) =>
          household.familyName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          household.address?.city
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          household.primaryContactName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
      setFilteredHouseholds(filtered);
    } else {
      setFilteredHouseholds(households);
    }
  }, [searchTerm, households]);

  const loadHouseholds = async () => {
    try {
      setLoading(true);
      const data = await householdsService.getAllWithMembers();
      setHouseholds(data);
      console.log('Loaded households:', data);
    } catch (error) {
      console.error('Error loading households:', error);
      showToast('Failed to load households', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHousehold = async (household: Household) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the ${household.familyName} household? This will remove all members from the household.`
      )
    ) {
      return;
    }

    try {
      await householdsService.delete(household.id);
      showToast('Household deleted successfully', 'success');
      loadHouseholds();
    } catch (error) {
      console.error('Error deleting household:', error);
      showToast('Failed to delete household', 'error');
    }
  };

  const formatAddress = (household: Household) => {
    if (!household.address) return 'No address provided';

    const { addressLine1, city, state, postalCode } = household.address;
    const parts = [addressLine1, city, state, postalCode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'No address provided';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const canManageHouseholds =
    currentMember?.role === 'admin' || currentMember?.role === 'pastor';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Home className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Households</h1>
            <p className="text-gray-600">
              Manage church families and households
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            {filteredHouseholds.length}{' '}
            {filteredHouseholds.length === 1 ? 'household' : 'households'}
          </div>
          {canManageHouseholds && (
            <Link
              to="/households/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Household
            </Link>
          )}
          <button
            onClick={loadHouseholds}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by family name, address, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Households Grid */}
      {filteredHouseholds.length === 0 ? (
        <div className="text-center py-12">
          <Home className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? 'No households found' : 'No households yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? 'Try adjusting your search criteria.'
              : 'Get started by creating your first household.'}
          </p>
          {!searchTerm && canManageHouseholds && (
            <div className="mt-6">
              <Link
                to="/households/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Household
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHouseholds.map((household) => (
            <div
              key={household.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Home className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <Link
                      to={`/households/${household.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 hover:underline"
                    >
                      {household.familyName} Family
                    </Link>
                    <p className="text-sm text-gray-500">
                      {household.memberCount}{' '}
                      {household.memberCount === 1 ? 'member' : 'members'}
                    </p>
                  </div>
                </div>

                {canManageHouseholds && (
                  <div className="flex items-center space-x-1">
                    <Link
                      to={`/households/${household.id}/edit`}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteHousehold(household)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Primary Contact */}
              {household.primaryContactName && (
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Primary Contact: {household.primaryContactName}
                  </span>
                </div>
              )}

              {/* Address */}
              <div className="flex items-start space-x-2 mb-4">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-sm text-gray-600">
                  {formatAddress(household)}
                </span>
              </div>

              {/* Members List */}
              {household.members && household.members.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Members:
                  </h4>
                  <div className="space-y-1">
                    {household.members.slice(0, 3).map((member) => (
                      <Link
                        key={member.id}
                        to={`/members/${member.id}`}
                        className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {member.firstName} {member.lastName}
                        {member.isPrimaryContact && (
                          <span className="text-gray-500 ml-1">(Primary)</span>
                        )}
                      </Link>
                    ))}
                    {household.members.length > 3 && (
                      <Link
                        to={`/households/${household.id}`}
                        className="block text-sm text-gray-500 hover:text-blue-600"
                      >
                        +{household.members.length - 3} more members
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {canManageHouseholds && (
                <div className="pt-4 border-t border-gray-100">
                  <Link
                    to={`/households/${household.id}/members`}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Manage Members
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
