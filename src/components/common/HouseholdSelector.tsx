import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Check, X, Clock } from 'lucide-react';
import Fuse from 'fuse.js';
import { Household } from '../../types';
import { householdsService } from '../../services/firebase';
import { useAuth } from '../../contexts/FirebaseAuthContext';

interface HouseholdSelectorProps {
  value?: string; // Selected household ID
  onSelect: (householdId: string, household: Household) => void;
  onCreateNew?: (familyName: string) => void;
  placeholder?: string;
  allowCreateNew?: boolean;
  requireApproval?: boolean;
  className?: string;
  disabled?: boolean;
}

export function HouseholdSelector({
  value,
  onSelect,
  onCreateNew,
  placeholder = 'Search for a family...',
  allowCreateNew = true,
  requireApproval = true,
  className = '',
  disabled = false,
}: HouseholdSelectorProps) {
  const { member: currentMember } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [households, setHouseholds] = useState<Household[]>([]);
  const [filteredHouseholds, setFilteredHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(
    null
  );
  const [fuse, setFuse] = useState<Fuse<Household> | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Fuse.js for fuzzy search
  useEffect(() => {
    if (households.length > 0) {
      const fuseInstance = new Fuse(households, {
        keys: ['familyName', 'normalizedName'],
        threshold: 0.3, // Adjust for more/less fuzzy matching
        includeScore: true,
        includeMatches: true,
      });
      setFuse(fuseInstance);
    }
  }, [households]);

  // Load households on component mount
  useEffect(() => {
    loadHouseholds();
  }, []);

  // Find selected household when value changes
  useEffect(() => {
    if (value && households.length > 0) {
      const household = households.find((h) => h.id === value);
      setSelectedHousehold(household || null);
      if (household) {
        setSearchTerm(household.familyName);
      }
    } else {
      setSelectedHousehold(null);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  }, [value, households, isOpen]);

  // Filter households based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredHouseholds(households.slice(0, 10)); // Show first 10 when no search
      return;
    }

    if (fuse) {
      const results = fuse.search(searchTerm);
      setFilteredHouseholds(results.map((result) => result.item).slice(0, 10));
    } else {
      // Fallback simple filter
      const filtered = households
        .filter((household) =>
          household.familyName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 10);
      setFilteredHouseholds(filtered);
    }
  }, [searchTerm, households, fuse]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Reset search term to selected household name or empty
        if (selectedHousehold) {
          setSearchTerm(selectedHousehold.familyName);
        } else {
          setSearchTerm('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedHousehold]);

  const loadHouseholds = async () => {
    try {
      setLoading(true);

      // Get approved households for everyone
      const approvedHouseholds =
        await householdsService.searchWithFuzzyMatching('', {
          limit: 100,
          statusFilter: 'approved',
        });

      // Get pending households created by current user
      let userPendingHouseholds: Household[] = [];
      if (currentMember) {
        const allPending = await householdsService.getPendingHouseholds();
        userPendingHouseholds = allPending.filter(
          (h) => h.createdBy === currentMember.id
        );
      }

      // Combine and deduplicate
      const allHouseholds = [...approvedHouseholds, ...userPendingHouseholds];
      setHouseholds(allHouseholds);
    } catch (error) {
      console.error('Error loading households:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleHouseholdSelect = (household: Household) => {
    setSelectedHousehold(household);
    setSearchTerm(household.familyName);
    setIsOpen(false);
    onSelect(household.id, household);
  };

  const handleCreateNew = async () => {
    if (!searchTerm.trim()) {
      alert('Please enter a family name.');
      return;
    }

    if (!currentMember) {
      alert('You must be logged in to create a family.');
      return;
    }

    console.log(
      'Creating family:',
      searchTerm.trim(),
      'for user:',
      currentMember.id
    );

    try {
      if (onCreateNew) {
        console.log('Using onCreateNew callback');
        await onCreateNew(searchTerm.trim());
        // After callback, reload households to include the new one
        await loadHouseholds();
        // Close dropdown after creation
        setIsOpen(false);
        // Clear search term since the selection will be handled by the parent
        setSearchTerm('');
      } else {
        // Default behavior: create household with validation
        console.log('Calling householdsService.createWithValidation...');
        const newHousehold = await householdsService.createWithValidation(
          { familyName: searchTerm.trim() },
          currentMember.id,
          requireApproval
        );

        console.log('✅ Successfully created household:', newHousehold);

        // Select the household regardless of approval status
        console.log('Selecting the new household...');
        handleHouseholdSelect(newHousehold);

        // Reload households to include the new one
        console.log('Reloading households...');
        await loadHouseholds();

        // Show appropriate message based on status
        if (newHousehold.status === 'pending') {
          console.log('Showing pending approval message');
          alert(
            'Your family name has been submitted for approval. You can continue adding the member, and both will be reviewed together.'
          );
        } else {
          console.log('Showing success message');
          alert('Family created successfully!');
        }

        console.log('✅ Family creation flow completed successfully');
      }
    } catch (error) {
      console.error('❌ Error in handleCreateNew:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      alert(error instanceof Error ? error.message : 'Failed to create family');
    }
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const showCreateOption =
    allowCreateNew &&
    searchTerm.trim() &&
    !loading &&
    !filteredHouseholds.some(
      (h) => h.familyName.toLowerCase() === searchTerm.toLowerCase().trim()
    );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md
            focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${
              selectedHousehold
                ? selectedHousehold.status === 'pending'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-green-50'
                : ''
            }
          `}
        />
        {selectedHousehold && (
          <>
            {selectedHousehold.status === 'pending' ? (
              <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-yellow-500" />
            ) : (
              <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
          </>
        )}
        {!selectedHousehold && searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedHousehold(null);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-600">
              Loading families...
            </div>
          )}

          {!loading && filteredHouseholds.length === 0 && !showCreateOption && (
            <div className="px-4 py-3 text-sm text-gray-600">
              No families found
            </div>
          )}

          {!loading &&
            filteredHouseholds.map((household) => (
              <button
                key={household.id}
                type="button"
                onClick={() => handleHouseholdSelect(household)}
                className={`
                w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                flex items-center justify-between
                ${selectedHousehold?.id === household.id ? 'bg-blue-50 text-blue-700' : ''}
              `}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{household.familyName}</span>
                    {household.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        <Clock className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                  </div>
                  {household.primaryContactName && (
                    <div className="text-sm text-gray-600">
                      Contact: {household.primaryContactName}
                    </div>
                  )}
                  {household.memberCount && household.memberCount > 0 && (
                    <div className="text-sm text-gray-500">
                      {household.memberCount} member
                      {household.memberCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                {selectedHousehold?.id === household.id && (
                  <Check className="h-4 w-4 text-blue-700" />
                )}
              </button>
            ))}

          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-t border-gray-200 text-blue-600"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Create "{searchTerm.trim()}"</span>
              </div>
              {requireApproval && (
                <div className="text-xs text-gray-500 mt-1">
                  (Subject to admin approval)
                </div>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
