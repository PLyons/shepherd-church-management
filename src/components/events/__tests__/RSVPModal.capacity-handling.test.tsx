import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RSVPModal } from '../RSVPModal';
import { eventRSVPService } from '../../../services/firebase/event-rsvp.service';
import { useAuth } from '../../../contexts/FirebaseAuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { Event, EventRSVP, EventType } from '../../../types/events';

// Mock the services
vi.mock('../../../services/firebase/event-rsvp.service');
vi.mock('../../../contexts/FirebaseAuthContext');
vi.mock('../../../contexts/ToastContext');

const mockEventRSVPService = eventRSVPService as unknown as {
  createRSVP: Mock;
  updateRSVP: Mock;
  getCapacityInfo: Mock;
  getWaitlistPosition: Mock;
  getRSVPByMember: Mock;
};

const mockUseAuth = useAuth as Mock;
const mockUseToast = useToast as Mock;

describe('RSVPModal - Capacity Handling', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const mockShowToast = vi.fn();

  const mockEvent: Event = {
    id: 'event-1',
    title: 'Limited Capacity Event',
    description: 'Test Description',
    eventType: 'workshop' as EventType,
    startDate: new Date('2025-12-01T10:00:00Z'),
    endDate: new Date('2025-12-01T11:00:00Z'),
    location: 'Small Conference Room',
    capacity: 10,
    isPublic: true,
    createdBy: 'admin-user',
    createdAt: new Date('2025-08-01T00:00:00Z'),
    updatedAt: new Date('2025-08-01T00:00:00Z'),
  };

  const mockUnlimitedEvent: Event = {
    ...mockEvent,
    id: 'unlimited-event',
    title: 'Unlimited Event',
    capacity: undefined, // No capacity limit
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

    // Setup default implementations
    mockEventRSVPService.getWaitlistPosition.mockResolvedValue(null);
    mockEventRSVPService.createRSVP.mockResolvedValue({
      id: 'rsvp-1',
      eventId: 'event-1',
      memberId: 'test-user-id',
      status: 'yes',
      numberOfGuests: 0,
      notes: '',
      responseDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('Capacity Information Display', () => {
    it('should show detailed capacity info when event has capacity limit', async () => {
      const capacityInfo = {
        capacity: 10,
        currentAttending: 7,
        spotsRemaining: 3,
        isAtCapacity: false,
        waitlistEnabled: true,
        waitlistCount: 2,
      };
      mockEventRSVPService.getCapacityInfo.mockResolvedValue(capacityInfo);

      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={null}
          onRSVPUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Event Capacity')).toBeInTheDocument();
        expect(screen.getByText('10 people')).toBeInTheDocument(); // Total capacity
        expect(screen.getByText('7 people')).toBeInTheDocument(); // Currently attending
        expect(screen.getByText('3 spots')).toBeInTheDocument(); // Available spots
      });
    });

    it('should not show capacity section for unlimited events', async () => {
      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockUnlimitedEvent}
          currentUserRSVP={null}
          onRSVPUpdate={vi.fn()}
        />
      );

      // Should not call getCapacityInfo for unlimited events
      expect(mockEventRSVPService.getCapacityInfo).not.toHaveBeenCalled();
      expect(screen.queryByText('Event Capacity')).not.toBeInTheDocument();
    });

    it('should handle zero spots remaining correctly', async () => {
      const capacityInfo = {
        capacity: 10,
        currentAttending: 10,
        spotsRemaining: 0,
        isAtCapacity: true,
        waitlistEnabled: true,
        waitlistCount: 5,
      };
      mockEventRSVPService.getCapacityInfo.mockResolvedValue(capacityInfo);

      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={null}
          onRSVPUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('0 spots')).toBeInTheDocument();
        expect(screen.getByText('0 spots').closest('span')).toHaveClass('text-red-600');
      });
    });

    it('should show green color for available spots', async () => {
      const capacityInfo = {
        capacity: 10,
        currentAttending: 5,
        spotsRemaining: 5,
        isAtCapacity: false,
        waitlistEnabled: true,
        waitlistCount: 0,
      };
      mockEventRSVPService.getCapacityInfo.mockResolvedValue(capacityInfo);

      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={null}
          onRSVPUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('5 spots')).toBeInTheDocument();
        expect(screen.getByText('5 spots').closest('span')).toHaveClass('text-green-600');
      });
    });
  });

  describe('At Capacity Scenarios', () => {
    it('should show waitlist warning when at capacity with waitlist enabled', async () => {
      const atCapacityInfo = {
        capacity: 10,
        currentAttending: 10,
        spotsRemaining: 0,
        isAtCapacity: true,
        waitlistEnabled: true,
        waitlistCount: 3,
      };
      mockEventRSVPService.getCapacityInfo.mockResolvedValue(atCapacityInfo);

      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={null}
          onRSVPUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Event is at capacity. New RSVPs will be added to the waitlist.')).toBeInTheDocument();
        const warningElement = screen.getByText('Event is at capacity. New RSVPs will be added to the waitlist.').closest('div');
        expect(warningElement).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
      });
    });

    it('should show no RSVPs accepted when at capacity without waitlist', async () => {
      const atCapacityInfo = {
        capacity: 10,
        currentAttending: 10,
        spotsRemaining: 0,
        isAtCapacity: true,
        waitlistEnabled: false,
        waitlistCount: 0,
      };
      mockEventRSVPService.getCapacityInfo.mockResolvedValue(atCapacityInfo);

      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={null}
          onRSVPUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Event is at capacity. No new RSVPs accepted.')).toBeInTheDocument();
        const errorElement = screen.getByText('Event is at capacity. No new RSVPs accepted.').closest('div');
        expect(errorElement).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
      });
    });

    it('should allow updating existing RSVP even when at capacity', async () => {
      const atCapacityInfo = {
        capacity: 10,
        currentAttending: 10,
        spotsRemaining: 0,
        isAtCapacity: true,
        waitlistEnabled: false,
        waitlistCount: 0,
      };
      mockEventRSVPService.getCapacityInfo.mockResolvedValue(atCapacityInfo);

      const existingRSVP: EventRSVP = {
        id: 'existing-rsvp',
        eventId: 'event-1',
        memberId: 'test-user-id',
        status: 'yes',
        numberOfGuests: 1,
        notes: '',
        responseDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user = userEvent.setup();

      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={existingRSVP}
          onRSVPUpdate={vi.fn()}
        />
      );

      // Should be able to update the RSVP
      const maybeOption = screen.getByLabelText(/Maybe, I might attend/i);
      await user.click(maybeOption);

      const submitButton = screen.getByRole('button', { name: /Save RSVP/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockEventRSVPService.updateRSVP).toHaveBeenCalledWith(
          'event-1',
          'existing-rsvp',
          expect.objectContaining({
            status: 'maybe',
          })
        );
      });
    });
  });

  describe('Waitlist Integration', () => {
    it('should handle automatic waitlist placement when at capacity', async () => {
      const atCapacityInfo = {
        capacity: 10,
        currentAttending: 10,
        spotsRemaining: 0,
        isAtCapacity: true,
        waitlistEnabled: true,
        waitlistCount: 2,
      };
      mockEventRSVPService.getCapacityInfo.mockResolvedValue(atCapacityInfo);

      const waitlistRSVP = {
        id: 'waitlist-rsvp',
        eventId: 'event-1',
        memberId: 'test-user-id',
        status: 'waitlist' as const,
        numberOfGuests: 0,
        notes: '',
        responseDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockEventRSVPService.createRSVP.mockResolvedValue(waitlistRSVP);
      mockEventRSVPService.getWaitlistPosition.mockResolvedValue(3);

      const user = userEvent.setup();

      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={null}
          onRSVPUpdate={vi.fn()}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Save RSVP/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Added to waitlist - you\'ll be notified if a spot opens!',
          'success'
        );
      });

      await waitFor(() => {
        expect(mockEventRSVPService.getWaitlistPosition).toHaveBeenCalledWith('event-1', 'test-user-id');
      });
    });

    it('should display current waitlist position correctly', async () => {
      const waitlistRSVP: EventRSVP = {
        id: 'waitlist-rsvp',
        eventId: 'event-1',
        memberId: 'test-user-id',
        status: 'waitlist',
        numberOfGuests: 0,
        notes: '',
        responseDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEventRSVPService.getWaitlistPosition.mockResolvedValue(5);
      mockEventRSVPService.getCapacityInfo.mockResolvedValue({
        capacity: 10,
        currentAttending: 10,
        spotsRemaining: 0,
        isAtCapacity: true,
        waitlistEnabled: true,
        waitlistCount: 8,
      });

      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={waitlistRSVP}
          onRSVPUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('On Waitlist')).toBeInTheDocument();
        expect(screen.getByText('#5')).toBeInTheDocument();
      });

      // Should show orange styling for waitlist status
      const currentRSVPSection = screen.getByText('Current RSVP').closest('div');
      expect(currentRSVPSection).toHaveClass('bg-orange-50', 'border-orange-200');
    });
  });

  describe('Guest Count and Capacity Validation', () => {
    it('should validate guest count against remaining capacity', async () => {
      const capacityInfo = {
        capacity: 10,
        currentAttending: 8,
        spotsRemaining: 2,
        isAtCapacity: false,
        waitlistEnabled: true,
        waitlistCount: 0,
      };
      mockEventRSVPService.getCapacityInfo.mockResolvedValue(capacityInfo);

      const user = userEvent.setup();

      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={null}
          onRSVPUpdate={vi.fn()}
        />
      );

      const guestInput = screen.getByLabelText(/Number of Additional Guests/i);
      await user.clear(guestInput);
      await user.type(guestInput, '5'); // Would exceed remaining capacity

      const submitButton = screen.getByRole('button', { name: /Save RSVP/i });
      await user.click(submitButton);

      // Should still allow submission - capacity checking happens server-side
      await waitFor(() => {
        expect(mockEventRSVPService.createRSVP).toHaveBeenCalled();
      });
    });

    it('should limit guest count input based on event capacity', async () => {
      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={null}
          onRSVPUpdate={vi.fn()}
        />
      );

      const guestInput = screen.getByLabelText(/Number of Additional Guests/i) as HTMLInputElement;
      
      // Max should be limited by event capacity (10) or default max (10), whichever is lower
      expect(guestInput.getAttribute('max')).toBe('10');
    });

    it('should show capacity information in guest count section', async () => {
      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={null}
          onRSVPUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Event capacity: 10 people total')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Capacity Updates', () => {
    it('should refresh capacity info after successful RSVP creation', async () => {
      const initialCapacity = {
        capacity: 10,
        currentAttending: 7,
        spotsRemaining: 3,
        isAtCapacity: false,
        waitlistEnabled: true,
        waitlistCount: 0,
      };
      
      const updatedCapacity = {
        capacity: 10,
        currentAttending: 8,
        spotsRemaining: 2,
        isAtCapacity: false,
        waitlistEnabled: true,
        waitlistCount: 0,
      };

      mockEventRSVPService.getCapacityInfo
        .mockResolvedValueOnce(initialCapacity) // Initial load
        .mockResolvedValueOnce(updatedCapacity); // After RSVP submission

      const user = userEvent.setup();

      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={null}
          onRSVPUpdate={vi.fn()}
        />
      );

      // Initial capacity load
      await waitFor(() => {
        expect(screen.getByText('7 people')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Save RSVP/i });
      await user.click(submitButton);

      // Should reload capacity info after submission
      await waitFor(() => {
        expect(mockEventRSVPService.getCapacityInfo).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle capacity changes that affect form state', async () => {
      const user = userEvent.setup();
      
      // Start with available spots
      const availableCapacity = {
        capacity: 10,
        currentAttending: 8,
        spotsRemaining: 2,
        isAtCapacity: false,
        waitlistEnabled: true,
        waitlistCount: 0,
      };
      
      // Then simulate someone else filling the event
      const atCapacityInfo = {
        capacity: 10,
        currentAttending: 10,
        spotsRemaining: 0,
        isAtCapacity: true,
        waitlistEnabled: true,
        waitlistCount: 0,
      };

      mockEventRSVPService.getCapacityInfo
        .mockResolvedValueOnce(availableCapacity)
        .mockResolvedValueOnce(atCapacityInfo);

      // Simulate capacity error on submission
      mockEventRSVPService.createRSVP.mockRejectedValue(new Error('Event at capacity'));

      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={null}
          onRSVPUpdate={vi.fn()}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Save RSVP/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Event is at capacity. Please try selecting "Maybe" or check if waitlist is available.')).toBeInTheDocument();
      });
    });
  });
});