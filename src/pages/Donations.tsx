import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useUnifiedAuth';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

type DonationCategory = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

type Member = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type Donation = {
  id: string;
  member_id: string | null;
  category_id: string;
  amount: number;
  donation_date: string;
  method: string | null;
  source_label: string | null;
  note: string | null;
  created_at: string;
  category?: DonationCategory;
  member?: Member;
};

type DonationFormData = {
  member_id: string;
  category_id: string;
  amount: string;
  donation_date: string;
  method: string;
  source_label: string;
  note: string;
};

export default function Donations() {
  const { memberRole } = useAuth();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<DonationCategory[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchMember, setSearchMember] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    member: '',
    minAmount: '',
    maxAmount: '',
    method: ''
  });
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalAmount: 0,
    totalCount: 0,
    averageAmount: 0
  });
  const [formData, setFormData] = useState<DonationFormData>({
    member_id: '',
    category_id: '',
    amount: '',
    donation_date: new Date().toISOString().split('T')[0],
    method: 'cash',
    source_label: '',
    note: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    // Filter members based on search
    if (searchMember.length > 0) {
      const filtered = members.filter(member =>
        `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchMember.toLowerCase()) ||
        member.email.toLowerCase().includes(searchMember.toLowerCase())
      );
      setFilteredMembers(filtered.slice(0, 10)); // Limit to 10 results
    } else {
      setFilteredMembers([]);
    }
  }, [searchMember, members]);

  useEffect(() => {
    // Apply filters to donations
    let filtered = [...donations];

    // Date range filter
    if (filters.startDate) {
      filtered = filtered.filter(d => d.donation_date >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(d => d.donation_date <= filters.endDate);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(d => d.category_id === filters.category);
    }

    // Member filter
    if (filters.member) {
      if (filters.member === 'anonymous') {
        filtered = filtered.filter(d => d.member_id === null);
      } else {
        filtered = filtered.filter(d => d.member_id === filters.member);
      }
    }

    // Amount range filter
    if (filters.minAmount) {
      const minAmount = parseFloat(filters.minAmount);
      filtered = filtered.filter(d => d.amount >= minAmount);
    }
    if (filters.maxAmount) {
      const maxAmount = parseFloat(filters.maxAmount);
      filtered = filtered.filter(d => d.amount <= maxAmount);
    }

    // Method filter
    if (filters.method) {
      filtered = filtered.filter(d => d.method === filters.method);
    }

    setFilteredDonations(filtered);

    // Calculate stats
    const totalAmount = filtered.reduce((sum, d) => sum + d.amount, 0);
    const totalCount = filtered.length;
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;

    setTotalStats({
      totalAmount,
      totalCount,
      averageAmount
    });
  }, [donations, filters]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Fetch donation categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('donation_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch members for lookup
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('id, first_name, last_name, email')
        .order('last_name, first_name');

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Fetch recent donations
      await fetchDonations();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select(`
          *,
          category:donation_categories(name, description),
          member:members(first_name, last_name, email)
        `)
        .order('donation_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setDonations(data || []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load donations', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category_id || !formData.amount || !formData.donation_date) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const donationData = {
        member_id: formData.member_id || null, // null for anonymous donations
        category_id: formData.category_id,
        amount: parseFloat(formData.amount),
        donation_date: formData.donation_date,
        method: formData.method || null,
        source_label: formData.source_label || null,
        note: formData.note || null,
      };

      const { error } = await supabase
        .from('donations')
        .insert(donationData);

      if (error) throw error;

      showToast('Donation recorded successfully', 'success');
      
      // Reset form
      setFormData({
        member_id: '',
        category_id: '',
        amount: '',
        donation_date: new Date().toISOString().split('T')[0],
        method: 'cash',
        source_label: '',
        note: '',
      });
      setSearchMember('');
      setShowForm(false);
      
      // Refresh donations list
      await fetchDonations();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to record donation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMemberSelect = (member: Member) => {
    setFormData(prev => ({ ...prev, member_id: member.id }));
    setSearchMember(`${member.first_name} ${member.last_name}`);
    setFilteredMembers([]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      category: '',
      member: '',
      minAmount: '',
      maxAmount: '',
      method: ''
    });
  };

  const exportToCSV = () => {
    if (filteredDonations.length === 0) {
      showToast('No donations to export', 'error');
      return;
    }

    const headers = ['Date', 'Member', 'Category', 'Amount', 'Method', 'Source/Reference', 'Note'];
    const csvData = [
      headers.join(','),
      ...filteredDonations.map(donation => [
        donation.donation_date,
        donation.member ? `"${donation.member.first_name} ${donation.member.last_name}"` : 'Anonymous',
        `"${donation.category?.name || 'Unknown'}"`,
        donation.amount,
        donation.method || '',
        `"${donation.source_label || ''}"`,
        `"${donation.note || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Donations exported successfully', 'success');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Donations</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredDonations.length === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {showForm ? 'Cancel' : 'Record Donation'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">$</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Amount</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(totalStats.totalAmount)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">#</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Donations</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalStats.totalCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">avg</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Amount</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(totalStats.averageAmount)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Filter Donations</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear All Filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Member Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Member</label>
              <select
                value={filters.member}
                onChange={(e) => setFilters(prev => ({ ...prev, member: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Members</option>
                <option value="anonymous">Anonymous Only</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Min Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={filters.minAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                placeholder="0.00"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Max Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={filters.maxAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                placeholder="0.00"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Method Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select
                value={filters.method}
                onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="card">Credit/Debit Card</option>
                <option value="online">Online Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Donation Entry Form */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Record New Donation</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Member Search */}
              <div>
                <label htmlFor="member" className="block text-sm font-medium text-gray-700">
                  Member (optional for anonymous donations)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchMember}
                    onChange={(e) => setSearchMember(e.target.value)}
                    placeholder="Search by name or email..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {filteredMembers.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                      {filteredMembers.map(member => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => handleMemberSelect(member)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                        >
                          <div className="font-medium">{member.first_name} {member.last_name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount *
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Donation Date *
                </label>
                <input
                  type="date"
                  value={formData.donation_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, donation_date: e.target.value }))}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              {/* Method */}
              <div>
                <label htmlFor="method" className="block text-sm font-medium text-gray-700">
                  Payment Method
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="online">Online Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Source Label */}
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  Source/Reference
                </label>
                <input
                  type="text"
                  value={formData.source_label}
                  onChange={(e) => setFormData(prev => ({ ...prev, source_label: e.target.value }))}
                  placeholder="Check #, transaction ID, etc."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                Note
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Any additional notes..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Recording...
                  </>
                ) : (
                  'Record Donation'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Donations Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Donations History {filteredDonations.length !== donations.length && 
              `(${filteredDonations.length} of ${donations.length})`}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {donations.length === 0 ? 'No donations recorded yet' : 'No donations match the current filters'}
                  </td>
                </tr>
              ) : (
                filteredDonations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(donation.donation_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {donation.member ? 
                        `${donation.member.first_name} ${donation.member.last_name}` : 
                        <span className="text-gray-500 italic">Anonymous</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {donation.category?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(donation.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {donation.method || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {donation.note || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}