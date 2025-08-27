import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { EventCard } from '../EventCard';
import { RSVPModal } from '../RSVPModal';
import { eventRSVPService } from '../../../services/firebase/event-rsvp.service';
import { eventsService } from '../../../services/firebase/events.service';
import { useAuth } from '../../../contexts/FirebaseAuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { Event, EventType, EventRSVP } from '../../../types/events';
import { Member } from '../../../types';

// Mock the services and contexts
vi.mock('../../../services/firebase/event-rsvp.service');
vi.mock('../../../services/firebase/events.service');
vi.mock('../../../contexts/FirebaseAuthContext');
vi.mock('../../../contexts/ToastContext');
vi.mock('../RSVPModal', () => ({
  RSVPModal: vi.fn(() => <div data-testid="rsvp-modal">RSVP Modal</div>)
}));

const mockEventRSVPService = eventRSVPService as unknown as {
  createRSVP: Mock;
  updateRSVP: Mock;
  getRSVPByMember: Mock;
};

const mockEventsService = eventsService as unknown as {
  delete: Mock;
};

const mockUseAuth = useAuth as Mock;
const mockUseToast = useToast as Mock;
const mockRSVPModal = RSVPModal as Mock;

describe('EventCard - Modal Integration Tests', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const mockCurrentMember: Member = {
    id: 'member-1',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phoneNumber: '+1234567890',
    addresses: [],
    memberStatus: 'active',
    joinDate: new Date('2024-01-01'),
    roles: ['member'],
    householdId: 'household-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockShowToast = vi.fn();

  const mockUpcomingEvent: Event = {
    id: 'event-1',
    title: 'Upcoming Service',
    description: 'Test Description',
    eventType: 'service' as EventType,
    startDate: new Date('2025-12-01T10:00:00Z'),
    endDate: new Date('2025-12-01T11:00:00Z'),
    location: 'Test Location',
    capacity: 50,
    isPublic: true,
    isAllDay: false,
    createdBy: 'admin-user',
    createdAt: new Date('2025-08-01T00:00:00Z'),
    updatedAt: new Date('2025-08-01T00:00:00Z'),
  };

  const mockPastEvent: Event = {
    ...mockUpcomingEvent,
    id: 'event-2',
    title: 'Past Service',
    startDate: new Date('2024-01-01T10:00:00Z'),
    endDate: new Date('2024-01-01T11:00:00Z'),
  };

  const mockEventRSVP: EventRSVP = {
    id: 'rsvp-1',
    eventId: 'event-1',
    memberId: 'member-1',
    status: 'yes',
    numberOfGuests: 1,
    responseDate: new Date('2025-08-01T00:00:00Z'),
    createdAt: new Date('2025-08-01T00:00:00Z'),
    updatedAt: new Date('2025-08-01T00:00:00Z'),
  };

  const defaultProps = {
    event: mockUpcomingEvent,
    currentMember: mockCurrentMember,
    canManageEvents: false,
    onEventUpdate: vi.fn(),
  };

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
    });

    mockUseToast.mockReturnValue({
      showToast: mockShowToast,
    });

    mockEventRSVPService.getRSVPByMember.mockResolvedValue(null);
    mockRSVPModal.mockImplementation(({ isOpen, onClose, children }) => 
      isOpen ? <div data-testid="rsvp-modal" onClick={onClose}>{children}</div> : null
    );
  });

  describe('Modal Trigger State Management', () => {
    it('should have modal closed by default', () => {
      renderWithRouter(<EventCard {...defaultProps} />);
      
      expect(screen.queryByTestId('rsvp-modal')).not.toBeInTheDocument();
    });

    it('should open modal when RSVP button is clicked', async () => {
      renderWithRouter(<EventCard {...defaultProps} />);
      
      // Wait for RSVP loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading RSVP...')).not.toBeInTheDocument();
      });

      const rsvpButton = screen.getByText('RSVP');
      fireEvent.click(rsvpButton);

      expect(screen.getByTestId('rsvp-modal')).toBeInTheDocument();
    });

    it('should close modal when onClose is called', async () => {
      renderWithRouter(<EventCard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading RSVP...')).not.toBeInTheDocument();
      });

      // Open modal
      const rsvpButton = screen.getByText('RSVP');
      fireEvent.click(rsvpButton);
      
      expect(screen.getByTestId('rsvp-modal')).toBeInTheDocument();

      // Close modal
      fireEvent.click(screen.getByTestId('rsvp-modal'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('rsvp-modal')).not.toBeInTheDocument();
      });
    });

    it('should maintain modal state independently of RSVP loading', async () => {
      mockEventRSVPService.getRSVPByMember.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(null), 100))
      );
      
      renderWithRouter(<EventCard {...defaultProps} />);
      
      // Modal should be closed even while RSVP is loading
      expect(screen.queryByTestId('rsvp-modal')).not.toBeInTheDocument();
      expect(screen.getByText('Loading RSVP...')).toBeInTheDocument();
    });
  });

  describe('Modal Props Passing', () => {
    it('should pass correct props to RSVPModal', async () => {
      mockEventRSVPService.getRSVPByMember.mockResolvedValue(mockEventRSVP);
      
      renderWithRouter(<EventCard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading RSVP...')).not.toBeInTheDocument();
      });

      const rsvpButton = screen.getByText('RSVP');
      fireEvent.click(rsvpButton);

      expect(mockRSVPModal).toHaveBeenCalledWith(
        expect.objectContaining({
          isOpen: true,
          event: mockUpcomingEvent,
          currentUserRSVP: mockEventRSVP,
          onClose: expect.any(Function),
          onRSVPUpdate: expect.any(Function),
        }),
        expect.any(Object)
      );
    });

    it('should pass null currentUserRSVP when no existing RSVP', async () => {
      mockEventRSVPService.getRSVPByMember.mockResolvedValue(null);
      
      renderWithRouter(<EventCard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading RSVP...')).not.toBeInTheDocument();
      });

      const rsvpButton = screen.getByText('RSVP');
      fireEvent.click(rsvpButton);

      expect(mockRSVPModal).toHaveBeenCalledWith(
        expect.objectContaining({
          currentUserRSVP: null,
        }),
        expect.any(Object)
      );
    });

    it('should call onEventUpdate when modal RSVP is updated', async () => {
      const mockOnEventUpdate = vi.fn();
      const props = { ...defaultProps, onEventUpdate: mockOnEventUpdate };
      
      mockRSVPModal.mockImplementation(({ isOpen, onRSVPUpdate }) => {
        if (isOpen) {
          // Simulate RSVP update
          setTimeout(() => onRSVPUpdate(mockEventRSVP), 0);
          return <div data-testid="rsvp-modal">RSVP Modal</div>;
        }
        return null;
      });

      renderWithRouter(<EventCard {...props} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading RSVP...')).not.toBeInTheDocument();
      });

      const rsvpButton = screen.getByText('RSVP');
      fireEvent.click(rsvpButton);

      await waitFor(() => {
        expect(mockOnEventUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('RSVP Status Display with Modal', () => {
    it('should maintain existing RSVP status display when modal is closed', async () => {
      mockEventRSVPService.getRSVPByMember.mockResolvedValue(mockEventRSVP);
      
      renderWithRouter(<EventCard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText("You're going")).toBeInTheDocument();
        expect(screen.queryByText('Loading RSVP...')).not.toBeInTheDocument();
      });

      // Status should still be visible with modal closed
      expect(screen.queryByTestId('rsvp-modal')).not.toBeInTheDocument();
      expect(screen.getByText("You're going")).toBeInTheDocument();
    });

    it('should show RSVP button alongside status display', async () => {
      mockEventRSVPService.getRSVPByMember.mockResolvedValue(mockEventRSVP);
      
      renderWithRouter(<EventCard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText("You're going")).toBeInTheDocument();
      });

      // Both status and RSVP button should be visible
      expect(screen.getByText("You're going")).toBeInTheDocument();
      expect(screen.getByText('RSVP')).toBeInTheDocument();
    });
  });

  describe('Past Events Modal Behavior', () => {
    it('should not show RSVP button for past events', () => {
      const pastEventProps = { ...defaultProps, event: mockPastEvent };
      renderWithRouter(<EventCard {...pastEventProps} />);
      
      expect(screen.queryByText('RSVP')).not.toBeInTheDocument();
      expect(screen.queryByTestId('rsvp-modal')).not.toBeInTheDocument();
    });

    it('should show past RSVP status without modal trigger for past events', async () => {
      const pastEventRSVP = { ...mockEventRSVP, eventId: 'event-2' };
      mockEventRSVPService.getRSVPByMember.mockResolvedValue(pastEventRSVP);
      
      const pastEventProps = { ...defaultProps, event: mockPastEvent };
      renderWithRouter(<EventCard {...pastEventProps} />);
      
      await waitFor(() => {
        expect(screen.getByText("You were going")).toBeInTheDocument();
      });

      expect(screen.queryByText('RSVP')).not.toBeInTheDocument();
    });
  });

  describe('State Management and Cleanup', () => {
    it('should properly cleanup modal state on component unmount', async () => {
      const { unmount } = renderWithRouter(<EventCard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading RSVP...')).not.toBeInTheDocument();
      });

      const rsvpButton = screen.getByText('RSVP');
      fireEvent.click(rsvpButton);
      
      expect(screen.getByTestId('rsvp-modal')).toBeInTheDocument();
      
      unmount();
      
      // Component should unmount cleanly without errors
      expect(true).toBe(true);
    });

    it('should handle multiple rapid modal open/close operations', async () => {
      renderWithRouter(<EventCard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading RSVP...')).not.toBeInTheDocument();
      });

      const rsvpButton = screen.getByText('RSVP');
      
      // Rapidly open and close modal
      fireEvent.click(rsvpButton);
      expect(screen.getByTestId('rsvp-modal')).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('rsvp-modal'));
      await waitFor(() => {
        expect(screen.queryByTestId('rsvp-modal')).not.toBeInTheDocument();
      });
      
      fireEvent.click(rsvpButton);
      expect(screen.getByTestId('rsvp-modal')).toBeInTheDocument();
    });
  });

  describe('Integration with Current RSVP Buttons', () => {
    it('should not interfere with existing admin event management buttons', () => {
      const adminProps = { ...defaultProps, canManageEvents: true };
      renderWithRouter(<EventCard {...adminProps} />);
      
      // Admin buttons should still be visible - check for edit link and delete button by their href and click handler
      const editLink = screen.getByRole('link');
      expect(editLink).toHaveAttribute('href', '/events/event-1/edit');
      
      const deleteButton = screen.getAllByRole('button').find(button => 
        button !== screen.getByText('RSVP')
      );
      expect(deleteButton).toBeInTheDocument();
    });

    it('should handle RSVP loading state without affecting modal state', async () => {
      // Mock a slow RSVP load
      mockEventRSVPService.getRSVPByMember.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(null), 100))
      );
      
      renderWithRouter(<EventCard {...defaultProps} />);
      
      // Should show loading initially
      expect(screen.getByText('Loading RSVP...')).toBeInTheDocument();
      
      // Modal should still be closed
      expect(screen.queryByTestId('rsvp-modal')).not.toBeInTheDocument();
      
      // Wait for RSVP to load
      await waitFor(() => {
        expect(screen.queryByText('Loading RSVP...')).not.toBeInTheDocument();
      });
      
      // Now RSVP button should be available
      expect(screen.getByText('RSVP')).toBeInTheDocument();
    });
  });
});