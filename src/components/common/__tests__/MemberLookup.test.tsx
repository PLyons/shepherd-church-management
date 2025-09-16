/**
 * TDD RED Phase: Comprehensive test suite for MemberLookup component
 * Tests written BEFORE implementation to define expected behavior
 * Target: 90% coverage for user interaction scenarios
 */

import { describe, it, expect, beforeEach, vi, Mock, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberLookup } from '../MemberLookup';
import { MemberSearch } from '../../../services/firebase/members/member-search';
import { Member } from '../../../types';

// Mock the MemberSearch service
vi.mock('../../../services/firebase/members/member-search', () => ({
  MemberSearch: {
    searchMembers: vi.fn(),
  },
}));

const mockMemberSearch = MemberSearch as unknown as {
  searchMembers: Mock;
};

// Test data - realistic member objects
const mockMembers: Member[] = [
  {
    id: 'member-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-0123',
    memberStatus: 'active',
    role: 'member',
    fullName: 'John Doe',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'member-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '555-0456',
    memberStatus: 'active',
    role: 'pastor',
    fullName: 'Jane Smith',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'member-3',
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'bob.johnson@example.com',
    phone: '555-0789',
    memberStatus: 'active',
    role: 'admin',
    fullName: 'Robert Johnson',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'member-4',
    firstName: 'Mary',
    lastName: 'Williams',
    email: 'mary.williams@example.com',
    memberStatus: 'visitor',
    role: 'member',
    fullName: 'Mary Williams',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
];

describe('MemberLookup', () => {
  const mockOnSelect = vi.fn();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockMemberSearch.searchMembers.mockReturnValue(mockMembers);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Component rendering and initial state tests
  describe('Component Rendering', () => {
    it('should render with default props', () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Search for a member...')
      ).toBeInTheDocument();
      expect(screen.queryByTestId('member-dropdown')).not.toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      const customPlaceholder = 'Find a church member';
      render(
        <MemberLookup
          onSelect={mockOnSelect}
          selectedMember={null}
          placeholder={customPlaceholder}
        />
      );

      expect(
        screen.getByPlaceholderText(customPlaceholder)
      ).toBeInTheDocument();
    });

    it('should display selected member when provided', () => {
      render(
        <MemberLookup onSelect={mockOnSelect} selectedMember={mockMembers[0]} />
      );

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    it('should show required indicator when required prop is true', () => {
      render(
        <MemberLookup
          onSelect={mockOnSelect}
          selectedMember={null}
          required={true}
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should show clear button when member is selected', () => {
      render(
        <MemberLookup onSelect={mockOnSelect} selectedMember={mockMembers[0]} />
      );

      expect(
        screen.getByRole('button', { name: /clear/i })
      ).toBeInTheDocument();
    });
  });

  // Search input functionality tests
  describe('Search Input Functionality', () => {
    it('should not search with less than 2 characters', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'j');

      // Fast-forward timers to simulate debounce completion
      vi.advanceTimersByTime(500);

      expect(mockMemberSearch.searchMembers).not.toHaveBeenCalled();
      expect(screen.queryByTestId('member-dropdown')).not.toBeInTheDocument();
    });

    it('should debounce search queries', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');

      // Type multiple characters quickly
      await user.type(input, 'joh');

      // Should not search immediately
      expect(mockMemberSearch.searchMembers).not.toHaveBeenCalled();

      // Fast-forward timers to simulate debounce completion
      vi.advanceTimersByTime(300);

      expect(mockMemberSearch.searchMembers).toHaveBeenCalledWith(
        expect.any(Array),
        'joh'
      );
    });

    it('should search after typing stops for debounce period', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'john');

      vi.advanceTimersByTime(300);

      expect(mockMemberSearch.searchMembers).toHaveBeenCalledWith(
        expect.any(Array),
        'john'
      );
    });

    it('should cancel previous search when typing continues', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');

      // Start typing
      await user.type(input, 'jo');
      vi.advanceTimersByTime(200);

      // Continue typing before debounce completes
      await user.type(input, 'hn');
      vi.advanceTimersByTime(300);

      // Should only search once with the final term
      expect(mockMemberSearch.searchMembers).toHaveBeenCalledTimes(1);
      expect(mockMemberSearch.searchMembers).toHaveBeenCalledWith(
        expect.any(Array),
        'john'
      );
    });
  });

  // Dropdown display and interactions tests
  describe('Dropdown Display and Interactions', () => {
    it('should show dropdown with search results', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'john');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByTestId('member-dropdown')).toBeInTheDocument();
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('should display member information correctly in dropdown items', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'jane');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
        expect(screen.getByText('Pastor')).toBeInTheDocument(); // Role display
      });
    });

    it('should highlight matching search terms in results', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'john');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByTestId('highlighted-text')).toBeInTheDocument();
      });
    });

    it('should show "Anonymous" option when no search term is entered', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.click(input); // Focus input without typing

      await waitFor(() => {
        expect(screen.getByText('Anonymous')).toBeInTheDocument();
      });
    });

    it('should show "No members found" when search returns empty results', async () => {
      mockMemberSearch.searchMembers.mockReturnValue([]);

      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'nonexistent');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('No members found')).toBeInTheDocument();
      });
    });
  });

  // Member selection tests
  describe('Member Selection', () => {
    it('should select member when clicked in dropdown', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'john');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      await user.click(screen.getByText('John Doe'));

      expect(mockOnSelect).toHaveBeenCalledWith(mockMembers[0]);
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.queryByTestId('member-dropdown')).not.toBeInTheDocument();
    });

    it('should select anonymous when Anonymous option is clicked', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('Anonymous')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Anonymous'));

      expect(mockOnSelect).toHaveBeenCalledWith(null);
      expect(screen.getByDisplayValue('Anonymous')).toBeInTheDocument();
      expect(screen.queryByTestId('member-dropdown')).not.toBeInTheDocument();
    });

    it('should update input value when member is selected', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'jane');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Jane Smith'));

      expect(input.value).toBe('Jane Smith');
    });
  });

  // Clear button functionality tests
  describe('Clear Button Functionality', () => {
    it('should clear selection when clear button is clicked', async () => {
      render(
        <MemberLookup onSelect={mockOnSelect} selectedMember={mockMembers[0]} />
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(mockOnSelect).toHaveBeenCalledWith(null);
    });

    it('should focus input after clearing selection', async () => {
      render(
        <MemberLookup onSelect={mockOnSelect} selectedMember={mockMembers[0]} />
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('should hide clear button when no member is selected', () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      expect(
        screen.queryByRole('button', { name: /clear/i })
      ).not.toBeInTheDocument();
    });
  });

  // Click outside to close dropdown tests
  describe('Click Outside Behavior', () => {
    it('should close dropdown when clicking outside', async () => {
      render(
        <div>
          <MemberLookup onSelect={mockOnSelect} selectedMember={null} />
          <div data-testid="outside-element">Outside</div>
        </div>
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'john');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByTestId('member-dropdown')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('outside-element'));

      expect(screen.queryByTestId('member-dropdown')).not.toBeInTheDocument();
    });

    it('should not close dropdown when clicking inside dropdown', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'john');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByTestId('member-dropdown')).toBeInTheDocument();
      });

      const dropdown = screen.getByTestId('member-dropdown');
      await user.click(dropdown);

      expect(screen.getByTestId('member-dropdown')).toBeInTheDocument();
    });
  });

  // Keyboard navigation tests
  describe('Keyboard Navigation', () => {
    it('should navigate dropdown with arrow keys', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'jo');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByTestId('member-dropdown')).toBeInTheDocument();
      });

      // Press Arrow Down to select first item
      fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });

      expect(screen.getByTestId('dropdown-item-0')).toHaveClass('bg-blue-50');

      // Press Arrow Down again to select second item
      fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });

      expect(screen.getByTestId('dropdown-item-1')).toHaveClass('bg-blue-50');
    });

    it('should select member with Enter key', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'john');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByTestId('member-dropdown')).toBeInTheDocument();
      });

      // Navigate to first item and press Enter
      fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockOnSelect).toHaveBeenCalledWith(mockMembers[0]);
    });

    it('should close dropdown with Escape key', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'john');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByTestId('member-dropdown')).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      expect(screen.queryByTestId('member-dropdown')).not.toBeInTheDocument();
    });

    it('should wrap navigation at dropdown boundaries', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'jo');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByTestId('member-dropdown')).toBeInTheDocument();
      });

      // Press Arrow Up from first position should go to last
      fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });

      const dropdownItems = screen.getAllByTestId(/dropdown-item-/);
      const lastItemIndex = dropdownItems.length - 1;
      expect(screen.getByTestId(`dropdown-item-${lastItemIndex}`)).toHaveClass(
        'bg-blue-50'
      );
    });
  });

  // Loading states tests
  describe('Loading States', () => {
    it('should show loading indicator during search', async () => {
      // Mock a delayed search response
      mockMemberSearch.searchMembers.mockImplementation(() => {
        return new Promise((resolve) =>
          setTimeout(() => resolve(mockMembers), 100)
        );
      });

      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'john');
      vi.advanceTimersByTime(300);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should hide loading indicator after search completes', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'john');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    it('should handle search service errors gracefully', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockMemberSearch.searchMembers.mockImplementation(() => {
        throw new Error('Search service unavailable');
      });

      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'john');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('Error searching members')).toBeInTheDocument();
      });

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('should recover from error state on new search', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // First search fails
      mockMemberSearch.searchMembers.mockImplementationOnce(() => {
        throw new Error('Search service unavailable');
      });

      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'john');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('Error searching members')).toBeInTheDocument();
      });

      // Second search succeeds
      mockMemberSearch.searchMembers.mockReturnValue(mockMembers);

      await user.clear(input);
      await user.type(input, 'jane');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(
          screen.queryByText('Error searching members')
        ).not.toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });
  });

  // Required field validation tests
  describe('Required Field Validation', () => {
    it('should show validation error when required and no member selected', async () => {
      render(
        <MemberLookup
          onSelect={mockOnSelect}
          selectedMember={null}
          required={true}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab(); // Focus away to trigger validation

      expect(screen.getByText('Please select a member')).toBeInTheDocument();
    });

    it('should clear validation error when member is selected', async () => {
      render(
        <MemberLookup
          onSelect={mockOnSelect}
          selectedMember={null}
          required={true}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab();

      expect(screen.getByText('Please select a member')).toBeInTheDocument();

      // Type and select a member
      await user.type(input, 'john');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      await user.click(screen.getByText('John Doe'));

      expect(
        screen.queryByText('Please select a member')
      ).not.toBeInTheDocument();
    });

    it('should not show validation error when not required', async () => {
      render(
        <MemberLookup
          onSelect={mockOnSelect}
          selectedMember={null}
          required={false}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab();

      expect(
        screen.queryByText('Please select a member')
      ).not.toBeInTheDocument();
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update ARIA attributes when dropdown is open', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'john');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
        expect(input).toHaveAttribute(
          'aria-owns',
          expect.stringContaining('member-dropdown')
        );
      });
    });

    it('should have proper role and aria-label for dropdown items', async () => {
      render(<MemberLookup onSelect={mockOnSelect} selectedMember={null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'john');
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        const dropdownItems = screen.getAllByRole('option');
        expect(dropdownItems[0]).toHaveAttribute(
          'aria-label',
          'John Doe - john.doe@example.com'
        );
      });
    });
  });
});
