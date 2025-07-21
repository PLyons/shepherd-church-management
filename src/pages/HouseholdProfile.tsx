import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Household, Member } from '../types';
import { useAuth } from '../hooks/useUnifiedAuth';
import { 
  Home, 
  MapPin, 
  Users, 
  User, 
  Mail, 
  Phone, 
  ArrowLeft, 
  Crown,
  Shield,
  Clock
} from 'lucide-react';

export default function HouseholdProfile() {
  const { id } = useParams<{ id: string }>();
  const { member: currentMember } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchHouseholdData();
    }
  }, [id]);

  const fetchHouseholdData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('households')
        .select(`
          *,
          members:members!household_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            birthdate,
            gender,
            role,
            member_status,
            joined_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setHousehold(data);
    } catch (error) {
      console.error('Error fetching household data:', error);
    } finally {
      setLoading(false);
    }
  };

  const canView = currentMember?.role === 'admin' || currentMember?.role === 'pastor';

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'pastor':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'visitor':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateAge = (birthdate: string) => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  if (!canView) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have permission to view household information.
        </p>
        <Link
          to="/dashboard"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="text-center py-12">
        <Home className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Household not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The household you're looking for doesn't exist.
        </p>
        <Link
          to="/members"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Members
        </Link>
      </div>
    );
  }

  const primaryContact = household.members?.find(m => m.id === household.primary_contact_id);
  const sortedMembers = household.members?.sort((a, b) => {
    if (a.id === household.primary_contact_id) return -1;
    if (b.id === household.primary_contact_id) return 1;
    return a.first_name.localeCompare(b.first_name);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/members"
          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Home className="h-6 w-6" />
          {household.family_name} Household
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Household Members ({household.members?.length || 0})
            </h2>
            
            {sortedMembers && sortedMembers.length > 0 ? (
              <div className="space-y-4">
                {sortedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </h3>
                          {member.id === household.primary_contact_id && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              <Crown className="h-3 w-3" />
                              Primary Contact
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </div>
                          {member.phone && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.member_status)}`}>
                            {member.member_status}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role)}`}>
                            {member.role}
                          </span>
                          {member.birthdate && (
                            <span className="text-xs text-gray-500">
                              Age {calculateAge(member.birthdate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/members/${member.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This household doesn't have any members yet.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Household Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Family Name
                </label>
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900 font-medium">{household.family_name}</span>
                </div>
              </div>

              {primaryContact && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Contact
                  </label>
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-blue-500" />
                    <Link
                      to={`/members/${primaryContact.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {primaryContact.first_name} {primaryContact.last_name}
                    </Link>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{formatDate(household.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {(household.address_line1 || household.city || household.state) && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Address</h2>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <div className="text-gray-900">
                  {household.address_line1 && <div>{household.address_line1}</div>}
                  {household.address_line2 && <div>{household.address_line2}</div>}
                  {(household.city || household.state || household.postal_code) && (
                    <div>
                      {household.city && `${household.city}, `}
                      {household.state && `${household.state} `}
                      {household.postal_code}
                    </div>
                  )}
                  {household.country && <div>{household.country}</div>}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Members</span>
                <span className="font-medium text-gray-900">{household.members?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Members</span>
                <span className="font-medium text-green-600">
                  {household.members?.filter(m => m.member_status === 'active').length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Visitors</span>
                <span className="font-medium text-blue-600">
                  {household.members?.filter(m => m.member_status === 'visitor').length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}