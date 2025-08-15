import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { QrCode, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { registrationTokensService } from '../services/firebase/registration-tokens.service';
import { publicRegistrationService } from '../services/firebase/public-registration.service';
import { RegistrationToken, RegistrationFormData, TokenValidationResult } from '../types/registration';

export default function QRRegistration() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState<RegistrationToken | null>(null);
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthdate: '',
    gender: '',
    memberStatus: 'visitor',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'USA',
    },
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

      const result: TokenValidationResult = await registrationTokensService.validateToken(tokenValue);

      if (!result.isValid) {
        showToast(result.error || 'Invalid registration link', 'error');
        return;
      }

      setToken(result.token!);
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

    if (!formData.firstName || !formData.lastName) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setSubmitting(true);

      // Get client IP and user agent for tracking
      const metadata = {
        ipAddress: undefined, // Would need server-side implementation to get real IP
        userAgent: navigator.userAgent,
      };

      // Submit registration
      const result = await publicRegistrationService.submitRegistration(
        token.id,
        formData,
        metadata
      );

      if (!result.success) {
        showToast(result.error || 'Registration failed', 'error');
        return;
      }

      // Increment token usage
      await registrationTokensService.incrementUsage(token.id);

      showToast(result.message, 'success');

      // Redirect to a welcome page
      setTimeout(() => {
        navigate('/?message=registration_complete');
      }, 2000);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Registration failed',
        'error'
      );
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Personal Information
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="birthdate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Birth Date
                  </label>
                  <input
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        birthdate: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium text-gray-700"
                >
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      gender: e.target.value as 'Male' | 'Female' | '',
                    }))
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            {/* Member Status */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Member Status
              </h3>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Are you a member or visitor?
                </label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="memberStatus"
                      value="member"
                      checked={formData.memberStatus === 'member'}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          memberStatus: e.target.value as 'member' | 'visitor',
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Member - I am already a member of this church
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="memberStatus"
                      value="visitor"
                      checked={formData.memberStatus === 'visitor'}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          memberStatus: e.target.value as 'member' | 'visitor',
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Visitor - I am visiting this church
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Address Information (Optional)
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.address.line1}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: {
                          ...prev.address,
                          line1: e.target.value,
                        },
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="address2"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Apartment, suite, etc.
                  </label>
                  <input
                    type="text"
                    value={formData.address.line2}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: {
                          ...prev.address,
                          line2: e.target.value,
                        },
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-gray-700"
                    >
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: {
                            ...prev.address,
                            city: e.target.value,
                          },
                        }))
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-medium text-gray-700"
                    >
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: {
                            ...prev.address,
                            state: e.target.value,
                          },
                        }))
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="postal_code"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.address.postalCode}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: {
                          ...prev.address,
                          postalCode: e.target.value,
                        },
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
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
