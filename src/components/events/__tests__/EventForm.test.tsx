import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { EventForm } from '../EventForm';
import { eventsService } from '../../../services/firebase';
import { useAuth } from '../../../contexts/FirebaseAuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { EventType, Event } from '../../../types';

// Mock the services and contexts
vi.mock('../../../services/firebase', () => ({
  eventsService: {
    getById: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
  },
}));
vi.mock('../../../contexts/FirebaseAuthContext');
vi.mock('../../../contexts/ToastContext');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
  };
});

const mockEventsService = eventsService as unknown as {
  getById: Mock;
  createEvent: Mock;
  updateEvent: Mock;
};

const mockUseAuth = useAuth as Mock;
const mockUseToast = useToast as Mock;

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('EventForm', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'admin@test.com',
    displayName: 'Test Admin',
  };

  const mockShowToast = vi.fn();

  const mockEventData: Event = {
    id: 'event-1',
    title: 'Test Event',
    description: 'Test Description',
    eventType: 'service' as EventType,
    startDate: new Date('2025-12-01T10:00:00Z'),
    endDate: new Date('2025-12-01T11:00:00Z'),
    location: 'Test Location',
    capacity: 50,
    isPublic: true,
    isAllDay: false,
    requiredRoles: [],
    enableWaitlist: true,
    createdBy: 'admin-user',
    createdAt: new Date('2025-08-01T00:00:00Z'),
    updatedAt: new Date('2025-08-01T00:00:00Z'),
    isActive: true,
    isCancelled: false,
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
  });

  describe('Rendering', () => {
    it('should render create event form', () => {
      render(
        <TestWrapper>
          <EventForm />
        </TestWrapper>
      );

      expect(screen.getByText('Create New Event')).toBeInTheDocument();
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Date & Time')).toBeInTheDocument();
      expect(screen.getByText('Visibility & Access')).toBeInTheDocument();
      expect(screen.getByText('Capacity Management')).toBeInTheDocument();
    });

    it('should render edit event form with event ID', () => {
      render(
        <TestWrapper>
          <EventForm eventId="event-1" />
        </TestWrapper>
      );

      expect(screen.getByText('Edit Event')).toBeInTheDocument();
    });

    it('should show loading spinner when loading event data', () => {
      mockEventsService.getById.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TestWrapper>
          <EventForm eventId="event-1" />
        </TestWrapper>
      );

      expect(
        screen.getByTestId('loading-spinner') || screen.getByRole('status')
      ).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render all required form fields', () => {
      render(
        <TestWrapper>
          <EventForm />
        </TestWrapper>
      );

      // Basic Information fields
      expect(screen.getByLabelText(/event title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/event type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();

      // Date & Time fields
      expect(screen.getByLabelText(/all day event/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start.*date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end.*date/i)).toBeInTheDocument();

      // Visibility field
      expect(screen.getByLabelText(/public event/i)).toBeInTheDocument();

      // Capacity field
      expect(screen.getByLabelText(/maximum capacity/i)).toBeInTheDocument();
    });

    it('should populate event type dropdown with all options', () => {
      render(
        <TestWrapper>
          <EventForm />
        </TestWrapper>
      );

      const eventTypeSelect = screen.getByLabelText(
        /event type/i
      ) as HTMLSelectElement;
      const options = Array.from(eventTypeSelect.options).map(
        (option) => option.value
      );

      expect(options).toContain('service');
      expect(options).toContain('bible_study');
      expect(options).toContain('prayer_meeting');
      expect(options).toContain('youth_group');
      expect(options).toContain('special_event');
      expect(options).toContain('other');
    });

    it('should show waitlist option when capacity is set', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EventForm />
        </TestWrapper>
      );

      const capacityInput = screen.getByLabelText(/maximum capacity/i);
      await user.type(capacityInput, '50');

      await waitFor(() => {
        expect(screen.getByLabelText(/enable waitlist/i)).toBeInTheDocument();
      });
    });
  });

  describe('Date/Time Handling', () => {
    it('should switch input type when all-day is toggled', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EventForm />
        </TestWrapper>
      );

      const allDayCheckbox = screen.getByLabelText(/all day event/i);
      const startDateInput = screen.getByLabelText(/start.*date/i);

      // Initially should be datetime-local
      expect(startDateInput).toHaveAttribute('type', 'datetime-local');

      await user.click(allDayCheckbox);

      // Should change to date after clicking all-day
      await waitFor(() => {
        expect(startDateInput).toHaveAttribute('type', 'date');
      });
    });
  });

  describe('Form Validation', () => {
    it('should show required field errors on empty submission', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EventForm />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Create Event');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/event title is required/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/location is required/i)).toBeInTheDocument();
        expect(screen.getByText(/start date is required/i)).toBeInTheDocument();
        expect(screen.getByText(/end date is required/i)).toBeInTheDocument();
      });
    });

    it('should validate minimum title length', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EventForm />
        </TestWrapper>
      );

      const titleInput = screen.getByLabelText(/event title/i);
      await user.type(titleInput, 'ab'); // Only 2 characters

      const submitButton = screen.getByText('Create Event');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/title must be at least 3 characters long/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate capacity is positive', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EventForm />
        </TestWrapper>
      );

      const capacityInput = screen.getByLabelText(/maximum capacity/i);
      await user.type(capacityInput, '0');

      const submitButton = screen.getByText('Create Event');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/capacity must be at least 1/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate end date is after start date', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EventForm />
        </TestWrapper>
      );

      const startDateInput = screen.getByLabelText(/start.*date/i);
      const endDateInput = screen.getByLabelText(/end.*date/i);

      await user.type(startDateInput, '2025-12-01T10:00');
      await user.type(endDateInput, '2025-12-01T09:00'); // Earlier than start

      const submitButton = screen.getByText('Create Event');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/end date must be after start date/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      title: 'Test Event',
      location: 'Test Location',
      startDate: '2025-12-01T10:00',
      endDate: '2025-12-01T11:00',
      eventType: 'service',
    };

    it('should call create service for new events', async () => {
      const user = userEvent.setup();
      mockEventsService.createEvent.mockResolvedValueOnce('new-event-id');

      render(
        <TestWrapper>
          <EventForm />
        </TestWrapper>
      );

      // Fill out form
      await user.type(
        screen.getByLabelText(/event title/i),
        validFormData.title
      );
      await user.type(
        screen.getByLabelText(/location/i),
        validFormData.location
      );
      await user.type(
        screen.getByLabelText(/start.*date/i),
        validFormData.startDate
      );
      await user.type(
        screen.getByLabelText(/end.*date/i),
        validFormData.endDate
      );

      const submitButton = screen.getByText('Create Event');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockEventsService.createEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            title: validFormData.title,
            location: validFormData.location,
            createdBy: mockUser.uid,
          })
        );
        expect(mockShowToast).toHaveBeenCalledWith(
          'Event created successfully!',
          'success'
        );
      });
    });

    it('should call update service for existing events', async () => {
      const user = userEvent.setup();
      mockEventsService.getById.mockResolvedValueOnce(mockEventData);
      mockEventsService.updateEvent.mockResolvedValueOnce(undefined);

      render(
        <TestWrapper>
          <EventForm eventId="event-1" />
        </TestWrapper>
      );

      // Wait for event to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Update Event');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockEventsService.updateEvent).toHaveBeenCalledWith(
          'event-1',
          expect.objectContaining({
            title: 'Test Event',
            location: 'Test Location',
          })
        );
        expect(mockShowToast).toHaveBeenCalledWith(
          'Event updated successfully!',
          'success'
        );
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockEventsService.createEvent.mockImplementation(
        () => new Promise(() => {})
      ); // Never resolves

      render(
        <TestWrapper>
          <EventForm />
        </TestWrapper>
      );

      // Fill out form
      await user.type(
        screen.getByLabelText(/event title/i),
        validFormData.title
      );
      await user.type(
        screen.getByLabelText(/location/i),
        validFormData.location
      );
      await user.type(
        screen.getByLabelText(/start.*date/i),
        validFormData.startDate
      );
      await user.type(
        screen.getByLabelText(/end.*date/i),
        validFormData.endDate
      );

      const submitButton = screen.getByText('Create Event');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
    });

    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup();
      mockEventsService.createEvent.mockRejectedValueOnce(
        new Error('Network error')
      );

      render(
        <TestWrapper>
          <EventForm />
        </TestWrapper>
      );

      // Fill out form
      await user.type(
        screen.getByLabelText(/event title/i),
        validFormData.title
      );
      await user.type(
        screen.getByLabelText(/location/i),
        validFormData.location
      );
      await user.type(
        screen.getByLabelText(/start.*date/i),
        validFormData.startDate
      );
      await user.type(
        screen.getByLabelText(/end.*date/i),
        validFormData.endDate
      );

      const submitButton = screen.getByText('Create Event');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Error saving event. Please try again.',
          'error'
        );
      });
    });
  });

  describe('Event Loading', () => {
    it('should populate form with existing event data', async () => {
      mockEventsService.getById.mockResolvedValueOnce(mockEventData);

      render(
        <TestWrapper>
          <EventForm eventId="event-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Location')).toBeInTheDocument();
        expect(
          screen.getByDisplayValue('Test Description')
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue('service')).toBeInTheDocument();
      });
    });

    it('should handle event loading errors', async () => {
      mockEventsService.getById.mockRejectedValueOnce(
        new Error('Event not found')
      );

      render(
        <TestWrapper>
          <EventForm eventId="event-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Error loading event details',
          'error'
        );
      });
    });
  });

  describe('Form Interaction', () => {
    const validFormData = {
      title: 'Test Event',
      location: 'Test Location',
      startDate: '2025-12-01T10:00',
      endDate: '2025-12-01T11:00',
      eventType: 'service',
    };

    it('should call onSubmit prop when provided', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(
        <TestWrapper>
          <EventForm onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      // Fill out form
      await user.type(
        screen.getByLabelText(/event title/i),
        validFormData.title
      );
      await user.type(
        screen.getByLabelText(/location/i),
        validFormData.location
      );
      await user.type(
        screen.getByLabelText(/start.*date/i),
        validFormData.startDate
      );
      await user.type(
        screen.getByLabelText(/end.*date/i),
        validFormData.endDate
      );

      const submitButton = screen.getByText('Create Event');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: validFormData.title,
            location: validFormData.location,
          })
        );
      });
    });

    it('should call onCancel prop when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnCancel = vi.fn();

      render(
        <TestWrapper>
          <EventForm onCancel={mockOnCancel} />
        </TestWrapper>
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });
});
