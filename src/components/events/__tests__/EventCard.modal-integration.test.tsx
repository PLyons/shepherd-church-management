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

const mockUseAuth = useAuth as Mock;
const mockUseToast = useToast as Mock;
const mockRSVPModal = RSVPModal as Mock;

describe('EventCard - Modal Integration Tests', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const mockMember: Member = {
    id: 'member-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumbers: [],
    addresses: [],
    membershipStatus: 'active',
    roles: ['member'],
    createdAt: new Date(),
    updatedAt: new Date(),
    householdId: 'household-1',
  };

  const mockEvent: Event = {
    id: 'event-1',
    title: 'Test Event',
    description: 'Test Description',
    type: 'service' as EventType,
    startDateTime: new Date('2024-01-20T10:00:00'),
    endDateTime: new Date('2024-01-20T12:00:00'),
    location: 'Test Location',
    enableRSVP: true,
    maxAttendees: 10,
    currentAttendees: 5,
    visibility: 'public',
    createdBy: 'test-creator',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      member: mockMember,
    });

    mockUseToast.mockReturnValue({
      showToast: mockShowToast,
    });

    mockEventRSVPService.getRSVPByMember.mockResolvedValue(null);
    mockEventRSVPService.createRSVP.mockResolvedValue({ id: 'rsvp-1' });
    mockEventRSVPService.updateRSVP.mockResolvedValue({});
  });

  const renderEventCard = (props = {}) => {
    return render(
      <BrowserRouter>
        <EventCard
          event={mockEvent}
          currentMember={mockMember}
          canManageEvents={false}
          onEventUpdate={() => {}}
          {...props}
        />
      </BrowserRouter>
    );
  };

  describe('Modal Trigger State Management', () => {
    it('should have modal closed by default', async () => {
      renderEventCard();
      
      await waitFor(() => {
        expect(screen.queryByTestId('rsvp-modal')).not.toBeInTheDocument();
      });
    });

    it('should open modal when RSVP button is clicked', async () => {
      renderEventCard();
      
      // Wait for component to load RSVP data
      await waitFor(() => {
        expect(screen.getByText('RSVP')).toBeInTheDocument();
      });

      const rsvpButton = screen.getByText('RSVP');
      fireEvent.click(rsvpButton);

      await waitFor(() => {
        expect(mockRSVPModal).toHaveBeenCalledWith(
          expect.objectContaining({
            event: mockEvent,
            currentRSVP: null,
            onClose: expect.any(Function),
            onRSVPSubmit: expect.any(Function),
          }),
          expect.anything()
        );
      });
    });

    it('should close modal when onClose callback is called', async () => {
      renderEventCard();
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('RSVP')).toBeInTheDocument();
      });

      // Open modal
      const rsvpButton = screen.getByText('RSVP');
      fireEvent.click(rsvpButton);

      // Get the onClose callback and call it
      const lastCall = mockRSVPModal.mock.calls[mockRSVPModal.mock.calls.length - 1];
      const onCloseCallback = lastCall[0].onClose;
      onCloseCallback();

      // Modal should not be rendered anymore
      await waitFor(() => {
        expect(screen.queryByTestId('rsvp-modal')).not.toBeInTheDocument();
      });
    });

    it('should handle rapid modal open/close without state conflicts', async () => {
      renderEventCard();
      
      await waitFor(() => {
        expect(screen.getByText('RSVP')).toBeInTheDocument();
      });

      const rsvpButton = screen.getByText('RSVP');
      
      // Rapid clicks
      fireEvent.click(rsvpButton);
      fireEvent.click(rsvpButton);
      fireEvent.click(rsvpButton);

      // Should still handle the modal correctly
      await waitFor(() => {
        expect(mockRSVPModal).toHaveBeenCalled();
      });
    });
  });

  describe('RSVP Integration with Modal', () => {
    it('should update RSVP when modal callback is triggered', async () => {
      renderEventCard();
      
      await waitFor(() => {
        expect(screen.getByText('RSVP')).toBeInTheDocument();
      });

      const rsvpButton = screen.getByText('RSVP');
      fireEvent.click(rsvpButton);

      // Get the onRSVPSubmit callback and call it
      const lastCall = mockRSVPModal.mock.calls[mockRSVPModal.mock.calls.length - 1];
      const onRSVPSubmitCallback = lastCall[0].onRSVPSubmit;
      
      await onRSVPSubmitCallback('yes');

      await waitFor(() => {
        expect(mockEventRSVPService.createRSVP).toHaveBeenCalledWith(
          expect.objectContaining({
            eventId: mockEvent.id,
            memberId: mockMember.id,
            status: 'yes',
          })
        );
        expect(mockShowToast).toHaveBeenCalledWith('RSVP updated successfully', 'success');
      });
    });
  });
});