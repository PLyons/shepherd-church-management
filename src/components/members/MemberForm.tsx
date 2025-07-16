import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Member, Household } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { X, User, Save } from 'lucide-react';

interface MemberFormProps {
  onClose: () => void;
  onSubmit: (member: Member) => void;
  member?: Member | null;
}

export function MemberForm({ onClose, onSubmit, member }: MemberFormProps) {
  const { member: currentMember } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    household_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birthdate: '',
    gender: '' as 'Male' | 'Female' | '',
    role: 'member' as 'admin' | 'pastor' | 'member',
    member_status: 'active' as 'active' | 'inactive' | 'visitor'
  });

  useEffect(() => {
    fetchHouseholds();
    if (member) {
      setFormData({
        household_id: member.household_id,
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        phone: member.phone || '',
        birthdate: member.birthdate || '',
        gender: member.gender || '',
        role: member.role,
        member_status: member.member_status
      });
    }
  }, [member]);

  const fetchHouseholds = async () => {
    try {
      const { data, error } = await supabase
        .from('households')
        .select('*')
        .order('family_name');

      if (error) throw error;
      setHouseholds(data || []);
    } catch (error) {
      console.error('Error fetching households:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (member) {
        // Update existing member
        const { data, error } = await supabase
          .from('members')
          .update({
            household_id: formData.household_id,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone || null,
            birthdate: formData.birthdate || null,
            gender: formData.gender || null,
            role: formData.role,
            member_status: formData.member_status
          })
          .eq('id', member.id)
          .select()
          .single();

        if (error) throw error;
        onSubmit(data);
      } else {
        // Create new member
        const { data, error } = await supabase
          .from('members')
          .insert({
            household_id: formData.household_id,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone || null,
            birthdate: formData.birthdate || null,
            gender: formData.gender || null,
            role: formData.role,
            member_status: formData.member_status,
            joined_at: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (error) throw error;
        onSubmit(data);
      }
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Error saving member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canEditRole = currentMember?.role === 'admin' || currentMember?.role === 'pastor';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5" />
            {member ? 'Edit Member' : 'Add New Member'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birthdate
              </label>
              <input
                type="date"
                value={formData.birthdate}
                onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' | '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Household *
              </label>
              <select
                required
                value={formData.household_id}
                onChange={(e) => setFormData({ ...formData, household_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select household</option>
                {households.map((household) => (
                  <option key={household.id} value={household.id}>
                    {household.family_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                required
                value={formData.member_status}
                onChange={(e) => setFormData({ ...formData, member_status: e.target.value as 'active' | 'inactive' | 'visitor' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="visitor">Visitor</option>
              </select>
            </div>

            {canEditRole && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'pastor' | 'member' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="pastor">Pastor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? 'Saving...' : (member ? 'Update Member' : 'Add Member')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}