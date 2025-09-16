import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RSVPModal } from '../RSVPModal';
import { eventRSVPService } from '../../../services/firebase/event-rsvp.service';
import { useAuth } from '../../../contexts/FirebaseAuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { Event, EventType } from '../../../types/events';

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

describe('RSVPModal - Basic Tests', () => {
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
    mockEventRSVPService.getCapacityInfo.mockResolvedValue({
      capacity: 50,
      currentAttending: 25,
      spotsRemaining: 25,
      isAtCapacity: false,
      waitlistEnabled: true,
      waitlistCount: 0,
    });
    mockEventRSVPService.getWaitlistPosition.mockResolvedValue(null);
  });

  it('should render modal when open', () => {
    render(
      <RSVPModal
        isOpen={true}
        onClose={vi.fn()}
        event={mockEvent}
        currentUserRSVP={null}
        onRSVPUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('RSVP to Test Event')).toBeInTheDocument();
    expect(screen.getByText('Event Details')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <RSVPModal
        isOpen={false}
        onClose={vi.fn()}
        event={mockEvent}
        currentUserRSVP={null}
        onRSVPUpdate={vi.fn()}
      />
    );

    expect(screen.queryByText('RSVP to Test Event')).not.toBeInTheDocument();
  });

  it('should show event details', () => {
    render(
      <RSVPModal
        isOpen={true}
        onClose={vi.fn()}
        event={mockEvent}
        currentUserRSVP={null}
        onRSVPUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('12/1/2025')).toBeInTheDocument(); // Date
    expect(screen.getByText('Test Location')).toBeInTheDocument(); // Location
    expect(screen.getByText('50 people')).toBeInTheDocument(); // Capacity
  });

  it('should show RSVP form options', () => {
    render(
      <RSVPModal
        isOpen={true}
        onClose={vi.fn()}
        event={mockEvent}
        currentUserRSVP={null}
        onRSVPUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('Yes, I will attend')).toBeInTheDocument();
    expect(screen.getByText('Maybe, I might attend')).toBeInTheDocument();
    expect(screen.getByText('No, I cannot attend')).toBeInTheDocument();
  });

  it('should call getCapacityInfo when modal opens with capacity', () => {
    render(
      <RSVPModal
        isOpen={true}
        onClose={vi.fn()}
        event={mockEvent}
        currentUserRSVP={null}
        onRSVPUpdate={vi.fn()}
      />
    );

    expect(mockEventRSVPService.getCapacityInfo).toHaveBeenCalledWith(
      'event-1'
    );
  });

  it('should not call getCapacityInfo for unlimited events', () => {
    const unlimitedEvent = { ...mockEvent, capacity: undefined };

    render(
      <RSVPModal
        isOpen={true}
        onClose={vi.fn()}
        event={unlimitedEvent}
        currentUserRSVP={null}
        onRSVPUpdate={vi.fn()}
      />
    );

    expect(mockEventRSVPService.getCapacityInfo).not.toHaveBeenCalled();
  });
});
