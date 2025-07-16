import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Member, MemberEvent } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Home, 
  Shield, 
  Edit, 
  Save, 
  X,
  ArrowLeft,
  Clock,
  MapPin
} from 'lucide-react';

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const { user, member: currentMember } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [memberEvents, setMemberEvents] = useState<MemberEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Member>>({});

  useEffect(() => {
    if (id) {
      fetchMemberData();
    }
  }, [id]);

  const fetchMemberData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select(`
          *,
          household:households!household_id (
            id,
            family_name,
            address_line1,
            address_line2,
            city,
            state,
            postal_code,
            country
          )
        `)
        .eq('id', id)
        .single();

      if (memberError) throw memberError;

      const { data: eventsData, error: eventsError } = await supabase
        .from('member_events')
        .select('*')
        .eq('member_id', id)
        .order('event_date', { ascending: false });

      if (eventsError) throw eventsError;

      setMember(memberData);
      setMemberEvents(eventsData || []);
      setFormData(memberData);
    } catch (error) {
      console.error('Error fetching member data:', error);
    } finally {
      setLoading(false);
    }
  };

  const canEdit = currentMember?.role === 'admin' || currentMember?.role === 'pastor' || currentMember?.id === id;

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    if (!id || !formData) return;

    try {
      const { error } = await supabase
        .from('members')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          birthdate: formData.birthdate,
          gender: formData.gender,
          member_status: formData.member_status,
          role: formData.role
        })
        .eq('id', id);

      if (error) throw error;

      setMember({ ...member!, ...formData });
      setEditing(false);
    } catch (error) {
      console.error('Error updating member:', error);
    }
  };

  const handleCancel = () => {
    setFormData(member || {});
    setEditing(false);
  };

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
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Member not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The member you're looking for doesn't exist or you don't have permission to view it.
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/members"
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {member.first_name} {member.last_name}
          </h1>
        </div>
        {canEdit && !editing && (
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        )}
        {editing && (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{member.first_name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{member.last_name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                {editing ? (
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{member.email}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{member.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Birthdate
                </label>
                {editing ? (
                  <input
                    type="date"
                    value={formData.birthdate || ''}
                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">
                      {member.birthdate ? formatDate(member.birthdate) : 'Not provided'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                {editing ? (
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                ) : (
                  <span className="text-gray-900">{member.gender || 'Not specified'}</span>
                )}
              </div>
            </div>
          </div>

          {memberEvents.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg p-6 mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Life Events</h2>
              <div className="space-y-3">
                {memberEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 capitalize">{event.event_type}</span>
                        <span className="text-sm text-gray-500">{formatDate(event.event_date)}</span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Member Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                {editing ? (
                  <select
                    value={formData.member_status || ''}
                    onChange={(e) => setFormData({ ...formData, member_status: e.target.value as 'active' | 'inactive' | 'visitor' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="visitor">Visitor</option>
                  </select>
                ) : (
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.member_status)}`}>
                    {member.member_status}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                {editing && (currentMember?.role === 'admin' || currentMember?.role === 'pastor') ? (
                  <select
                    value={formData.role || ''}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'pastor' | 'member' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="member">Member</option>
                    <option value="pastor">Pastor</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Joined
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{formatDate(member.joined_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {member.household && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Household Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Family Name
                  </label>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-gray-400" />
                    <Link
                      to={`/households/${member.household.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {member.household.family_name}
                    </Link>
                  </div>
                </div>

                {(member.household.address_line1 || member.household.city || member.household.state) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                      <div className="text-gray-900">
                        {member.household.address_line1 && <div>{member.household.address_line1}</div>}
                        {member.household.address_line2 && <div>{member.household.address_line2}</div>}
                        {(member.household.city || member.household.state || member.household.postal_code) && (
                          <div>
                            {member.household.city && `${member.household.city}, `}
                            {member.household.state && `${member.household.state} `}
                            {member.household.postal_code}
                          </div>
                        )}
                        {member.household.country && <div>{member.household.country}</div>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}