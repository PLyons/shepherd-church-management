import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { QrCode, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

type RegistrationToken = {
  id: string;
  token: string;
  household_id: string | null;
  created_by: string;
  expires_at: string;
  used_at: string | null;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
};

type RegistrationFormData = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birthdate: string;
  gender: 'Male' | 'Female' | '';
  join_household: boolean;
  household_name: string;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

export default function QRRegistration() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState<RegistrationToken | null>(null);
  const [formData, setFormData] = useState<RegistrationFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birthdate: '',
    gender: '',
    join_household: false,
    household_name: '',
    address_line1: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'USA',
  });

  const tokenParam = searchParams.get('token');

  useEffect(() => {
    if (tokenParam) {
      validateToken(tokenParam);
    } else {
      setLoading(false);
    }
  }, [tokenParam]);

  const validateToken = async (tokenValue: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('registration_tokens')
        .select('*')
        .eq('token', tokenValue)
        .eq('is_active', true)
        .single();

      if (error) {
        showToast('Invalid or expired registration link', 'error');
        return;
      }

      // Check if token is expired
      if (new Date(data.expires_at) < new Date()) {
        showToast('Registration link has expired', 'error');
        return;
      }

      // Check if token has reached max uses
      if (data.current_uses >= data.max_uses) {
        showToast('Registration link has reached maximum uses', 'error');
        return;
      }

      setToken(data);
    } catch (err) {
      showToast('Error validating registration link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      showToast('Invalid registration token', 'error');
      return;
    }

    if (!formData.first_name || !formData.last_name || !formData.email) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setSubmitting(true);

      let householdId = token.household_id;

      // Create new household if not joining existing one
      if (!formData.join_household || !householdId) {
        const { data: householdData, error: householdError } = await supabase
          .from('households')
          .insert({
            family_name: formData.household_name || `${formData.last_name} Family`,
            address_line1: formData.address_line1,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code,
            country: formData.country,
          })
          .select()
          .single();

        if (householdError) throw householdError;
        householdId = householdData.id;
      }

      // Create member record
      const memberData = {
        household_id: householdId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        birthdate: formData.birthdate || null,
        gender: formData.gender || null,
        role: 'member',
        member_status: 'visitor', // Start as visitor, can be upgraded later
        joined_at: new Date().toISOString().split('T')[0],
      };

      const { data: memberResult, error: memberError } = await supabase
        .from('members')
        .insert(memberData)
        .select()
        .single();

      if (memberError) throw memberError;

      // Update household primary contact if this is the first member
      if (!token.household_id || !formData.join_household) {
        await supabase
          .from('households')
          .update({ primary_contact_id: memberResult.id })
          .eq('id', householdId);
      }

      // Update token usage
      await supabase
        .from('registration_tokens')
        .update({
          current_uses: token.current_uses + 1,
          used_at: new Date().toISOString(),
        })
        .eq('id', token.id);

      showToast('Registration completed successfully! Welcome to our church!', 'success');
      
      // Redirect to a welcome page or login
      setTimeout(() => {
        navigate('/login?message=registration_complete');
      }, 2000);

    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!tokenParam) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <QrCode className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              QR Registration
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              This page requires a valid registration token.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Invalid Registration Link
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              This registration link is invalid, expired, or has been used.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <UserPlus className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Our Church!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please complete your registration to join our community
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => setFormData(prev => ({ ...prev, birthdate: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'Male' | 'Female' | '' }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            {/* Household Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Household Information</h3>
              
              {token.household_id && (
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.join_household}
                      onChange={(e) => setFormData(prev => ({ ...prev, join_household: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Join existing household (recommended if you live with the person who invited you)
                    </span>
                  </label>
                </div>
              )}

              {(!formData.join_household || !token.household_id) && (
                <>
                  <div className="mb-4">
                    <label htmlFor="household_name" className="block text-sm font-medium text-gray-700">
                      Household Name
                    </label>
                    <input
                      type="text"
                      value={formData.household_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, household_name: e.target.value }))}
                      placeholder={`${formData.last_name} Family`}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.address_line1}
                        onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                          State
                        </label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={formData.postal_code}
                        onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Registration
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}