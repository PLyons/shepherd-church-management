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

describe('RSVPModal - Service Integration', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const mockShowToast = vi.fn();

  const mockEvent: Event = {
    id: 'event-1',
    title: 'Test Event',
    description: 'Test Description',
    eventType: 'service' as EventType,
    startDate: new Date('2025-12-01T10:00:00Z'),
    endDate: new Date('2025-12-01T11:00:00Z'),
    location: 'Test Location',
    capacity: 50,
    isPublic: true,
    createdBy: 'admin-user',
    createdAt: new Date('2025-08-01T00:00:00Z'),
    updatedAt: new Date('2025-08-01T00:00:00Z'),
  };

  const mockRSVP: EventRSVP = {
    id: 'rsvp-1',
    eventId: 'event-1',
    memberId: 'test-user-id',
    status: 'yes',
    numberOfGuests: 2,
    notes: 'Looking forward to it!',
    responseDate: new Date('2025-08-15T00:00:00Z'),
    createdAt: new Date('2025-08-15T00:00:00Z'),
    updatedAt: new Date('2025-08-15T00:00:00Z'),
  };

  const mockCapacityInfo = {
    capacity: 50,
    currentAttending: 25,
    spotsRemaining: 25,
    isAtCapacity: false,
    waitlistEnabled: true,
    waitlistCount: 0,
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

    // Setup default mock implementations
    mockEventRSVPService.getCapacityInfo.mockResolvedValue(mockCapacityInfo);
    mockEventRSVPService.getWaitlistPosition.mockResolvedValue(null);
    mockEventRSVPService.createRSVP.mockResolvedValue(mockRSVP);
    mockEventRSVPService.updateRSVP.mockResolvedValue();
  });

  describe('Capacity Information Loading', () => {
    it('should load capacity information when modal opens', async () => {
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
        expect(mockEventRSVPService.getCapacityInfo).toHaveBeenCalledWith(
          'event-1'
        );
      });

      // Check if capacity information is displayed
      expect(screen.getByText('Event Capacity')).toBeInTheDocument();
      await waitFor(
        () => {
          expect(screen.getByText(/25 people/)).toBeInTheDocument(); // Current attending
          expect(screen.getByText(/25 spots/)).toBeInTheDocument(); // Available spots
        },
        { timeout: 3000 }
      );
    });

    it('should show loading state while fetching capacity', async () => {
      // Mock a delayed response
      mockEventRSVPService.getCapacityInfo.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockCapacityInfo), 100)
          )
      );

      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={null}
          onRSVPUpdate={vi.fn()}
        />
      );

      expect(
        screen.getByText('Loading capacity information...')
      ).toBeInTheDocument();

      await waitFor(
        () => {
          expect(
            screen.queryByText('Loading capacity information...')
          ).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should handle capacity loading errors gracefully', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockEventRSVPService.getCapacityInfo.mockRejectedValue(
        new Error('Network error')
      );

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
        expect(consoleError).toHaveBeenCalledWith(
          'Error loading capacity info:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('At Capacity Scenarios', () => {
    it('should show at capacity warning when event is full', async () => {
      const atCapacityInfo = {
        ...mockCapacityInfo,
        currentAttending: 50,
        spotsRemaining: 0,
        isAtCapacity: true,
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
        expect(
          screen.getByText(
            'Event is at capacity. New RSVPs will be added to the waitlist.'
          )
        ).toBeInTheDocument();
      });
    });

    it('should show no RSVPs accepted when at capacity without waitlist', async () => {
      const atCapacityInfo = {
        ...mockCapacityInfo,
        currentAttending: 50,
        spotsRemaining: 0,
        isAtCapacity: true,
        waitlistEnabled: false,
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
        expect(
          screen.getByText('Event is at capacity. No new RSVPs accepted.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Waitlist Position Handling', () => {
    it('should load waitlist position for waitlisted users', async () => {
      const waitlistedRSVP = { ...mockRSVP, status: 'waitlist' as const };
      mockEventRSVPService.getWaitlistPosition.mockResolvedValue(3);

      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={waitlistedRSVP}
          onRSVPUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(mockEventRSVPService.getWaitlistPosition).toHaveBeenCalledWith(
          'event-1',
          'test-user-id'
        );
      });

      await waitFor(() => {
        expect(screen.getByText('#3')).toBeInTheDocument();
      });
    });

    it('should not load waitlist position for non-waitlisted users', async () => {
      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={mockRSVP}
          onRSVPUpdate={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(mockEventRSVPService.getWaitlistPosition).not.toHaveBeenCalled();
      });
    });
  });

  describe('RSVP Creation', () => {
    it('should create new RSVP successfully', async () => {
      const user = userEvent.setup();
      const onRSVPUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <RSVPModal
          isOpen={true}
          onClose={onClose}
          event={mockEvent}
          currentUserRSVP={null}
          onRSVPUpdate={onRSVPUpdate}
        />
      );

      // Fill out the form
      const guestInput = screen.getByLabelText(/Number of Additional Guests/i);
      await user.clear(guestInput);
      await user.type(guestInput, '2');

      const notesTextarea = screen.getByLabelText(/Additional Notes/i);
      await user.type(notesTextarea, 'Looking forward to this event!');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Save RSVP/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockEventRSVPService.createRSVP).toHaveBeenCalledWith(
          'event-1',
          'test-user-id',
          {
            status: 'yes',
            numberOfGuests: 2,
            notes: 'Looking forward to this event!',
            dietaryRestrictions: '',
          }
        );
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        'RSVP submitted successfully!',
        'success'
      );
      expect(onRSVPUpdate).toHaveBeenCalledWith(mockRSVP);
      expect(onClose).toHaveBeenCalled();
    });

    it('should handle waitlist placement notification', async () => {
      const user = userEvent.setup();
      const waitlistRSVP = { ...mockRSVP, status: 'waitlist' as const };
      mockEventRSVPService.createRSVP.mockResolvedValue(waitlistRSVP);

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
          "Added to waitlist - you'll be notified if a spot opens!",
          'success'
        );
      });
    });
  });

  describe('RSVP Updates', () => {
    it('should update existing RSVP successfully', async () => {
      const user = userEvent.setup();
      const onRSVPUpdate = vi.fn();

      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={mockRSVP}
          onRSVPUpdate={onRSVPUpdate}
        />
      );

      // Change the RSVP status
      const maybeOption = screen.getByLabelText(/Maybe, I might attend/i);
      await user.click(maybeOption);

      const submitButton = screen.getByRole('button', { name: /Save RSVP/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockEventRSVPService.updateRSVP).toHaveBeenCalledWith(
          'event-1',
          'rsvp-1',
          expect.objectContaining({
            status: 'maybe',
          })
        );
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        'RSVP updated successfully!',
        'success'
      );
    });
  });

  describe('Optimistic Updates and Rollback', () => {
    it('should show optimistic updates during submission', async () => {
      const user = userEvent.setup();

      // Mock a delayed response to test optimistic updates
      mockEventRSVPService.createRSVP.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockRSVP), 100))
      );

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

      // Should show submitting state
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(
        () => {
          expect(screen.queryByText('Submitting...')).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should rollback optimistic updates on error', async () => {
      const user = userEvent.setup();
      mockEventRSVPService.createRSVP.mockRejectedValue(
        new Error('Network error')
      );

      render(
        <RSVPModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          currentUserRSVP={mockRSVP}
          onRSVPUpdate={vi.fn()}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Save RSVP/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to submit RSVP. Please try again.')
        ).toBeInTheDocument();
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        'Failed to submit RSVP',
        'error'
      );
    });

    it('should handle capacity exceeded errors', async () => {
      const user = userEvent.setup();
      mockEventRSVPService.createRSVP.mockRejectedValue(
        new Error('Event at capacity')
      );

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
        expect(
          screen.getByText(
            'Event is at capacity. Please try selecting "Maybe" or check if waitlist is available.'
          )
        ).toBeInTheDocument();
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        'Event is at capacity',
        'error'
      );
    });
  });

  describe('Real-time Capacity Updates', () => {
    it('should reload capacity info after successful RSVP submission', async () => {
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
        expect(mockEventRSVPService.getCapacityInfo).toHaveBeenCalledTimes(2); // Initial load + reload after submit
      });
    });

    it('should reload waitlist position after waitlist placement', async () => {
      const user = userEvent.setup();
      const waitlistRSVP = { ...mockRSVP, status: 'waitlist' as const };
      mockEventRSVPService.createRSVP.mockResolvedValue(waitlistRSVP);

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
        expect(mockEventRSVPService.getWaitlistPosition).toHaveBeenCalled();
      });
    });
  });

  describe('Form Validation and Service Integration', () => {
    it('should prevent submission when user is not logged in', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
      });

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
        expect(
          screen.getByText('You must be logged in to RSVP')
        ).toBeInTheDocument();
      });

      expect(mockEventRSVPService.createRSVP).not.toHaveBeenCalled();
    });

    it('should validate guest count limits', async () => {
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
      await user.type(guestInput, '15'); // Exceeds max of 10

      const submitButton = screen.getByRole('button', { name: /Save RSVP/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Maximum 10 guests allowed')
        ).toBeInTheDocument();
      });

      expect(mockEventRSVPService.createRSVP).not.toHaveBeenCalled();
    });
  });
});
