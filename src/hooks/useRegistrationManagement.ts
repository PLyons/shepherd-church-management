import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/FirebaseAuthContext';
import { useToast } from '../contexts/ToastContext';
import { publicRegistrationService } from '../services/firebase/public-registration.service';
import { registrationApprovalService } from '../services/firebase/registration-approval.service';
import { registrationTokensService } from '../services/firebase/registration-tokens.service';
import { PendingRegistration } from '../types/registration';

interface FilterState {
  status: 'all' | 'pending' | 'approved' | 'rejected';
  tokenId: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
  memberStatus: 'all' | 'member' | 'visitor';
  searchTerm: string;
}

interface RegistrationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export function useRegistrationManagement() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string[]>([]);
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<
    PendingRegistration[]
  >([]);
  const [tokens, setTokens] = useState<{ [key: string]: string }>({});
  const [stats, setStats] = useState<RegistrationStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([]);
  const [expandedRegistration, setExpandedRegistration] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<{
    [key: string]: PendingRegistration[];
  }>({});

  const [filters, setFilters] = useState<FilterState>({
    status: 'pending',
    tokenId: '',
    dateRange: 'all',
    memberStatus: 'all',
    searchTerm: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);

      // Load registrations and tokens in parallel
      const [regsData, tokensData, statsData] = await Promise.all([
        publicRegistrationService.getAll(),
        registrationTokensService.getAll(),
        publicRegistrationService.getRegistrationStatistics(),
      ]);

      // Create token lookup map
      const tokenMap: { [key: string]: string } = {};
      tokensData.forEach((token) => {
        tokenMap[token.id] = token.metadata.purpose || 'Unknown Event';
      });

      // Sort registrations by newest first
      const sortedRegs = regsData.sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );

      // Check for duplicates
      const duplicateMap: { [key: string]: PendingRegistration[] } = {};
      for (const reg of sortedRegs) {
        if (reg.email || reg.phone) {
          const dups = await publicRegistrationService.detectDuplicates(
            reg.email,
            reg.phone
          );
          if (dups.length > 1) {
            duplicateMap[reg.id] = dups;
          }
        }
      }

      setRegistrations(sortedRegs);
      setTokens(tokenMap);
      setStats(statsData);
      setDuplicates(duplicateMap);
    } catch (error) {
      console.error('Error loading registrations:', error);
      showToast('Failed to load registrations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...registrations];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(
        (reg) => reg.approvalStatus === filters.status
      );
    }

    // Filter by token
    if (filters.tokenId) {
      filtered = filtered.filter((reg) => reg.tokenId === filters.tokenId);
    }

    // Filter by member status
    if (filters.memberStatus !== 'all') {
      filtered = filtered.filter(
        (reg) => reg.memberStatus === filters.memberStatus
      );
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const startDate = new Date();

      switch (filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(
        (reg) => new Date(reg.submittedAt) >= startDate
      );
    }

    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (reg) =>
          reg.firstName.toLowerCase().includes(term) ||
          reg.lastName.toLowerCase().includes(term) ||
          (reg.email && reg.email.toLowerCase().includes(term)) ||
          (reg.phone && reg.phone.includes(term))
      );
    }

    setFilteredRegistrations(filtered);
  };

  const handleApprove = async (registrationId: string) => {
    if (!user) return;

    try {
      setProcessing((prev) => [...prev, registrationId]);

      const result = await registrationApprovalService.approveRegistration(
        registrationId,
        user.uid
      );

      if (result.success) {
        showToast('Registration approved successfully!', 'success');
        await loadData(); // Reload data
      } else {
        showToast(result.error || 'Failed to approve registration', 'error');
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      showToast('Failed to approve registration', 'error');
    } finally {
      setProcessing((prev) => prev.filter((id) => id !== registrationId));
    }
  };

  const handleReject = async (registrationId: string, reason: string) => {
    if (!user) return;

    try {
      setProcessing((prev) => [...prev, registrationId]);

      await publicRegistrationService.updateApprovalStatus(
        registrationId,
        'rejected',
        user.uid,
        reason
      );

      showToast('Registration rejected', 'success');
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error rejecting registration:', error);
      showToast('Failed to reject registration', 'error');
    } finally {
      setProcessing((prev) => prev.filter((id) => id !== registrationId));
    }
  };

  const handleBulkApprove = async () => {
    if (!user || selectedRegistrations.length === 0) return;

    try {
      setLoading(true);

      const promises = selectedRegistrations.map((id) =>
        registrationApprovalService.approveRegistration(id, user.uid)
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - successful;

      if (successful > 0) {
        showToast(
          `${successful} registration${successful > 1 ? 's' : ''} approved successfully!`,
          'success'
        );
      }

      if (failed > 0) {
        showToast(
          `${failed} registration${failed > 1 ? 's' : ''} failed to approve`,
          'error'
        );
      }

      setSelectedRegistrations([]);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error bulk approving registrations:', error);
      showToast('Failed to approve registrations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    const pendingRegs = filteredRegistrations.filter(
      (reg) => reg.approvalStatus === 'pending'
    );

    if (selectedRegistrations.length === pendingRegs.length) {
      setSelectedRegistrations([]);
    } else {
      setSelectedRegistrations(pendingRegs.map((reg) => reg.id));
    }
  };

  const handleSelectRegistration = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedRegistrations((prev) => [...prev, id]);
    } else {
      setSelectedRegistrations((prev) => prev.filter((regId) => regId !== id));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [registrations, filters]);

  return {
    // State
    loading,
    processing,
    filteredRegistrations,
    tokens,
    stats,
    selectedRegistrations,
    expandedRegistration,
    duplicates,
    filters,
    
    // Actions
    setFilters,
    setExpandedRegistration,
    handleApprove,
    handleReject,
    handleBulkApprove,
    handleSelectAll,
    handleSelectRegistration,
    loadData,
  };
}