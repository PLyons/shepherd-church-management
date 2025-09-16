import { Search, Check } from 'lucide-react';

interface FilterState {
  status: 'all' | 'pending' | 'approved' | 'rejected';
  tokenId: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
  memberStatus: 'all' | 'member' | 'visitor';
  searchTerm: string;
}

interface RegistrationFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  tokens: { [key: string]: string };
  selectedCount: number;
  onBulkApprove: () => void;
}

export function RegistrationFilters({
  filters,
  setFilters,
  tokens,
  selectedCount,
  onBulkApprove,
}: RegistrationFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Filter Registrations
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))
              }
              className="w-full pl-10 py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Token Filter */}
        <div>
          <select
            value={filters.tokenId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, tokenId: e.target.value }))
            }
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Events</option>
            {Object.entries(tokens).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value as
                  | 'all'
                  | 'pending'
                  | 'approved'
                  | 'rejected',
              }))
            }
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Member Status Filter */}
        <div>
          <select
            value={filters.memberStatus}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                memberStatus: e.target.value as 'all' | 'visitor' | 'member',
              }))
            }
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="visitor">Visitors</option>
            <option value="member">Members</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <select
            value={filters.dateRange}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                dateRange: e.target.value as 'all' | 'today' | 'week' | 'month',
              }))
            }
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={onBulkApprove}
            className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Check className="w-4 h-4 mr-2" />
            Approve {selectedCount} Registration{selectedCount > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}
