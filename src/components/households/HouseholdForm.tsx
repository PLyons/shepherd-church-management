// src/components/households/HouseholdForm.tsx
// Household creation and editing form with member assignment and primary contact management
// Handles household CRUD operations with member search, assignment, and validation workflows
// RELEVANT FILES: src/services/firebase/households.service.ts, src/types/firestore.ts, src/pages/Households.tsx, src/components/members/MemberProfile.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Plus, Search, User } from 'lucide-react';
import { Household, Member } from '../../types/firestore';
import { householdsService } from '../../services/firebase/households.service';
import { membersService } from '../../services/firebase/members.service';
import { useAuth } from '../../hooks/useUnifiedAuth';
import { useToast } from '../../contexts/ToastContext';
import { US_STATES } from '../../constants/states';

interface HouseholdFormProps {
  household?: Household;
  mode: 'create' | 'edit';
}

export function HouseholdForm({ household, mode }: HouseholdFormProps) {
  const navigate = useNavigate();
  const { member: currentUser } = useAuth();
  const { showToast } = useToast();

  // Form state
  const [familyName, setFamilyName] = useState(household?.familyName || '');
  const [address, setAddress] = useState({
    addressLine1: household?.address?.line1 || '',
    addressLine2: household?.address?.line2 || '',
    city: household?.address?.city || '',
    state: household?.address?.state || '',
    postalCode: household?.address?.postalCode || '',
    country: household?.address?.country || 'United States',
  });
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [primaryContactId, setPrimaryContactId] = useState<string>(household?.primaryContactId || '');
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [showMemberSearch, setShowMemberSearch] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);

  useEffect(() => {
    loadAvailableMembers();
    if (mode === 'edit' && household) {
      loadHouseholdMembers();
    }
  }, [mode, household]);

  useEffect(() => {
    if (memberSearchTerm.trim()) {
      const filtered = availableMembers.filter(member =>
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        member.emails?.[0]?.address?.toLowerCase().includes(memberSearchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(availableMembers);
    }
  }, [memberSearchTerm, availableMembers]);

  const loadAvailableMembers = async () => {
    try {
      const allMembers = await membersService.getAll();
      // Filter out members who are already in households (except current household members in edit mode)
      const householdMemberIds = mode === 'edit' && household ? household.memberIds : [];
      const available = allMembers.filter(member => 
        !member.householdId || householdMemberIds.includes(member.id)
      );
      setAvailableMembers(available);
    } catch (error) {
      console.error('Error loading members:', error);
      showToast('Failed to load members', 'error');
    }
  };

  const loadHouseholdMembers = async () => {
    if (!household) return;
    
    try {
      const members = await householdsService.getMembers(household.id);
      setSelectedMembers(members);
    } catch (error) {
      console.error('Error loading household members:', error);
    }
  };

  const handleAddMember = (member: Member) => {
    if (!selectedMembers.find(m => m.id === member.id)) {
      setSelectedMembers([...selectedMembers, member]);
      
      // If this is the first member, make them the primary contact
      if (selectedMembers.length === 0) {
        setPrimaryContactId(member.id);
      }
    }
    setMemberSearchTerm('');
    setShowMemberSearch(false);
  };

  const handleRemoveMember = (memberId: string) => {
    setSelectedMembers(selectedMembers.filter(m => m.id !== memberId));
    
    // If we removed the primary contact, clear it or set to first remaining member
    if (primaryContactId === memberId) {
      const remaining = selectedMembers.filter(m => m.id !== memberId);
      setPrimaryContactId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      showToast('You must be logged in to create households', 'error');
      return;
    }

    if (!familyName.trim()) {
      showToast('Family name is required', 'error');
      return;
    }

    if (selectedMembers.length === 0) {
      showToast('At least one member must be added to the household', 'error');
      return;
    }

    if (!primaryContactId) {
      showToast('A primary contact must be selected', 'error');
      return;
    }

    setSaving(true);

    try {
      const primaryContact = selectedMembers.find(m => m.id === primaryContactId);
      
      const householdData: Omit<Household, 'id' | 'createdAt' | 'updatedAt'> = {
        familyName: familyName.trim(),
        normalizedName: familyName.toLowerCase().trim(),
        status: 'approved',
        createdBy: currentUser.id,
        address: {
          line1: address.addressLine1,
          line2: address.addressLine2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
        },
        primaryContactId,
        primaryContactName: primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : '',
        memberIds: selectedMembers.map(m => m.id),
        memberCount: selectedMembers.length,
      };

      let householdId: string;

      if (mode === 'create') {
        householdId = await householdsService.create(householdData);
        showToast('Household created successfully', 'success');
      } else {
        if (!household) throw new Error('Household data missing for edit mode');
        householdId = household.id;
        await householdsService.update(householdId, householdData);
        showToast('Household updated successfully', 'success');
      }

      // Update member associations
      for (const member of selectedMembers) {
        const isPrimary = member.id === primaryContactId;
        await householdsService.addMember(householdId, member.id, isPrimary);
      }

      navigate(`/households/${householdId}`);
    } catch (error) {
      console.error('Error saving household:', error);
      showToast(`Failed to ${mode} household`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (mode === 'edit' && household) {
      navigate(`/households/${household.id}`);
    } else {
      navigate('/households');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {mode === 'create' ? 'Create New Household' : 'Edit Household'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {mode === 'create' 
              ? 'Add family information and select members to create a new household.'
              : 'Update household information and manage member assignments.'
            }
          </p>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Family Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Family Name *
            </label>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="Enter family name (e.g., Smith, Johnson)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Address Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">Address</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={address.addressLine1}
                  onChange={(e) => setAddress(prev => ({ ...prev, addressLine1: e.target.value }))}
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={address.addressLine2}
                  onChange={(e) => setAddress(prev => ({ ...prev, addressLine2: e.target.value }))}
                  placeholder="Apartment, suite, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    value={address.state}
                    onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select state</option>
                    {US_STATES.map(state => (
                      <option key={state.abbreviation} value={state.abbreviation}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={address.postalCode}
                    onChange={(e) => setAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={address.country}
                    onChange={(e) => setAddress(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Members Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">
                Household Members * ({selectedMembers.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowMemberSearch(true)}
                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Member
              </button>
            </div>

            {/* Selected Members */}
            {selectedMembers.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                <User className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No members selected</p>
                <p className="text-xs text-gray-400">Click "Add Member" to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {member.emails?.[0]?.address || 'No email'}
                        </p>
                      </div>
                      {member.id === primaryContactId && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Primary Contact
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setPrimaryContactId(member.id)}
                        disabled={member.id === primaryContactId}
                        className={`text-xs px-2 py-1 rounded ${
                          member.id === primaryContactId
                            ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-800'
                        }`}
                      >
                        {member.id === primaryContactId ? 'Primary' : 'Make Primary'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Member Search Modal */}
          {showMemberSearch && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Add Member</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMemberSearch(false);
                        setMemberSearchTerm('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-3 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={memberSearchTerm}
                      onChange={(e) => setMemberSearchTerm(e.target.value)}
                      placeholder="Search members..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {filteredMembers.filter(member => !selectedMembers.find(sm => sm.id === member.id)).map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleAddMember(member)}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded-md"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.emails?.[0]?.address || 'No email'}
                      </p>
                    </button>
                  ))}
                  {filteredMembers.filter(member => !selectedMembers.find(sm => sm.id === member.id)).length === 0 && (
                    <p className="text-center py-4 text-gray-500 text-sm">
                      No available members found
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !familyName.trim() || selectedMembers.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center space-x-2"
          >
            {saving && (
              <div className="h-4 w-4 animate-spin rounded-full border border-white border-t-transparent" />
            )}
            <Save className="h-4 w-4" />
            <span>{mode === 'create' ? 'Create Household' : 'Update Household'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}