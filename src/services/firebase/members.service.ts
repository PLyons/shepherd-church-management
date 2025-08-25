// REFACTORED: This file has been restructured using composition pattern
// Original 675-line service split into focused modules in src/services/firebase/members/

// The new architecture provides better maintainability, testability, and separation of concerns:
// - MemberSearch: Search and filtering logic (96 lines)
// - MemberBulkOperations: Import/export operations (149 lines)
// - MemberStatistics: Statistics calculation (95 lines)
// - MemberSubscriptions: Real-time subscription operations (111 lines)
// - MemberPagination: Pagination logic (164 lines)
// - MembersService: Main orchestrating class using composition (285 lines)

// For backward compatibility, all existing functionality is preserved
export * from './members/index';