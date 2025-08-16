import React, { useState, useEffect } from 'react';
import {
  Plus,
  QrCode,
  Download,
  Eye,
  EyeOff,
  Calendar,
  Users,
  Hash,
  Printer,
  Copy,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../hooks/useUnifiedAuth';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { registrationTokensService } from '../../services/firebase/registration-tokens.service';
import { RegistrationToken, RegistrationStats } from '../../types/registration';
import { TokenManager } from '../../components/registration/TokenManager';
import { QRCodeDisplay } from '../../components/registration/QRCodeDisplay';

export default function RegistrationTokens() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<RegistrationToken[]>([]);
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedToken, setSelectedToken] = useState<RegistrationToken | null>(
    null
  );
  const [showQRCode, setShowQRCode] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tokensData, statsData] = await Promise.all([
        registrationTokensService.getAll({
          orderBy: { field: 'createdAt', direction: 'desc' },
        }),
        registrationTokensService.getRegistrationStats(),
      ]);
      setTokens(tokensData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading registration data:', error);
      showToast('Failed to load registration data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async (tokenData: {
    createdBy: string;
    expiresAt?: string;
    maxUses?: number;
    metadata: {
      purpose: string;
      notes?: string;
      eventDate?: string;
      location?: string;
    };
  }) => {
    try {
      await registrationTokensService.createRegistrationToken({
        createdBy: user?.uid || '',
        ...tokenData,
      });
      showToast('Registration token created successfully', 'success');
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      showToast('Failed to create registration token', 'error');
    }
  };

  const handleDeactivateToken = async (tokenId: string) => {
    try {
      await registrationTokensService.deactivateToken(tokenId);
      showToast('Token deactivated successfully', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to deactivate token', 'error');
    }
  };

  const handleCopyUrl = (token: string) => {
    const url = registrationTokensService.createRegistrationUrl(token);
    navigator.clipboard.writeText(url);
    showToast('Registration URL copied to clipboard', 'success');
  };

  const handlePrintQRCode = (token: RegistrationToken) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const url = registrationTokensService.createRegistrationUrl(token.token);

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${token.metadata.purpose}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px; 
            }
            .qr-container { 
              margin: 20px auto; 
              display: inline-block; 
            }
            .title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px; 
            }
            .purpose { 
              font-size: 18px; 
              margin-bottom: 20px; 
              color: #666; 
            }
            .instructions { 
              font-size: 14px; 
              margin-top: 20px; 
              color: #888; 
            }
          </style>
        </head>
        <body>
          <div class="title">Church Registration</div>
          <div class="purpose">${token.metadata.purpose}</div>
          <div class="qr-container" id="qr-code"></div>
          <div class="instructions">
            Scan this QR code with your phone camera to register
          </div>
        </body>
      </html>
    `);

    // Note: In a real implementation, we'd need to generate the QR code here
    // For now, we'll show a placeholder
    printWindow.document.getElementById('qr-code')!.innerHTML =
      `<div style="width: 200px; height: 200px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">QR Code for ${url}</div>`;

    printWindow.document.close();
    printWindow.print();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTokenStatus = (token: RegistrationToken) => {
    if (!token.isActive)
      return { text: 'Inactive', color: 'text-gray-500 bg-gray-100' };
    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      return { text: 'Expired', color: 'text-red-700 bg-red-100' };
    }
    if (token.maxUses > 0 && token.currentUses >= token.maxUses) {
      return { text: 'Used Up', color: 'text-orange-700 bg-orange-100' };
    }
    return { text: 'Active', color: 'text-green-700 bg-green-100' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Registration Tokens
              </h1>
              <p className="text-gray-600 mt-2">
                Generate and manage QR codes for visitor registration
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Token
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <QrCode className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Tokens</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalTokens}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Tokens</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.activeTokens}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Registrations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalRegistrations}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingApprovals}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tokens Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Registration Tokens
            </h2>
          </div>

          {tokens.length === 0 ? (
            <div className="p-8 text-center">
              <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                No registration tokens created yet
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 text-blue-600 hover:text-blue-500 font-medium"
              >
                Create your first token
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tokens.map((token) => {
                    const status = getTokenStatus(token);
                    return (
                      <tr key={token.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {token.metadata.purpose}
                              </div>
                              {token.metadata.notes && (
                                <div className="text-sm text-gray-500">
                                  {token.metadata.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}
                          >
                            {status.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Hash className="w-4 h-4 text-gray-400 mr-1" />
                            {token.currentUses}
                            {token.maxUses > 0 && ` / ${token.maxUses}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                            {formatDate(token.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {token.expiresAt ? (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                              {formatDate(token.expiresAt)}
                            </div>
                          ) : (
                            <span className="text-gray-400">Never</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setShowQRCode(token.token)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopyUrl(token.token)}
                              className="text-green-600 hover:text-green-900"
                              title="Copy URL"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePrintQRCode(token)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Print QR Code"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {token.isActive && (
                              <button
                                onClick={() => handleDeactivateToken(token.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Deactivate Token"
                              >
                                <EyeOff className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Token Modal */}
      {showCreateForm && (
        <TokenManager
          onSubmit={handleCreateToken}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* QR Code Display Modal */}
      {showQRCode && (
        <QRCodeDisplay token={showQRCode} onClose={() => setShowQRCode(null)} />
      )}
    </div>
  );
}
