import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useUnifiedAuth';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Calendar, User, UserPlus, UserMinus, Settings, Clock, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

type VolunteerRole = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

type Event = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string | null;
  is_public: boolean;
};

type VolunteerSlot = {
  id: string;
  event_id: string;
  role_id: string;
  assigned_to: string | null;
  status: 'Open' | 'Filled' | 'Cancelled';
  note: string | null;
  created_at: string;
  updated_at: string;
  role?: VolunteerRole;
  event?: Event;
  assigned_member?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
};

type VolunteerSlotFormData = {
  event_id: string;
  role_id: string;
  note: string;
};

export default function Volunteers() {
  const { user, memberRole } = useAuth();
  const { showToast } = useToast();
  const [volunteerSlots, setVolunteerSlots] = useState<VolunteerSlot[]>([]);
  const [volunteerRoles, setVolunteerRoles] = useState<VolunteerRole[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<'all' | 'my' | 'open'>('all');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [formData, setFormData] = useState<VolunteerSlotFormData>({
    event_id: '',
    role_id: '',
    note: '',
  });

  const canManage = memberRole === 'admin' || memberRole === 'pastor';

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchVolunteerSlots(),
        fetchVolunteerRoles(),
        fetchEvents()
      ]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteerSlots = async () => {
    const { data, error } = await supabase
      .from('volunteer_slots')
      .select(`
        *,
        role:volunteer_roles(id, name, description),
        event:events(id, title, start_time, end_time, location, is_public),
        assigned_member:members(id, first_name, last_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setVolunteerSlots(data || []);
  };

  const fetchVolunteerRoles = async () => {
    const { data, error } = await supabase
      .from('volunteer_roles')
      .select('*')
      .order('name');

    if (error) throw error;
    setVolunteerRoles(data || []);
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, start_time, end_time, location, is_public')
      .gte('start_time', new Date().toISOString())
      .order('start_time');

    if (error) throw error;
    setEvents(data || []);
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.event_id || !formData.role_id) {
      showToast('Please select both an event and role', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('volunteer_slots')
        .insert({
          event_id: formData.event_id,
          role_id: formData.role_id,
          note: formData.note || null,
          status: 'Open'
        });

      if (error) throw error;

      showToast('Volunteer slot created successfully', 'success');
      
      // Reset form
      setFormData({
        event_id: '',
        role_id: '',
        note: '',
      });
      setShowForm(false);
      
      // Refresh data
      await fetchVolunteerSlots();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create volunteer slot', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('volunteer_slots')
        .update({
          assigned_to: user?.id,
          status: 'Filled',
          updated_at: new Date().toISOString()
        })
        .eq('id', slotId)
        .eq('status', 'Open'); // Only allow claiming open slots

      if (error) throw error;

      showToast('Successfully signed up for volunteer slot!', 'success');
      await fetchVolunteerSlots();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to claim volunteer slot', 'error');
    }
  };

  const handleUnclaimSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('volunteer_slots')
        .update({
          assigned_to: null,
          status: 'Open',
          updated_at: new Date().toISOString()
        })
        .eq('id', slotId)
        .eq('assigned_to', user?.id); // Only allow unclaiming own slots

      if (error) throw error;

      showToast('Successfully removed from volunteer slot', 'success');
      await fetchVolunteerSlots();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to remove from volunteer slot', 'error');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this volunteer slot?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('volunteer_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      showToast('Volunteer slot deleted successfully', 'success');
      await fetchVolunteerSlots();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete volunteer slot', 'error');
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getFilteredSlots = () => {
    let filtered = volunteerSlots;

    if (selectedEvent) {
      filtered = filtered.filter(slot => slot.event_id === selectedEvent);
    }

    switch (view) {
      case 'my':
        filtered = filtered.filter(slot => slot.assigned_to === user?.id);
        break;
      case 'open':
        filtered = filtered.filter(slot => slot.status === 'Open');
        break;
      default:
        break;
    }

    return filtered;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'Filled':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-yellow-100 text-yellow-800';
      case 'Filled':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSlots = getFilteredSlots();
  const mySlots = volunteerSlots.filter(slot => slot.assigned_to === user?.id);
  const openSlots = volunteerSlots.filter(slot => slot.status === 'Open');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Volunteer Management</h1>
          <p className="mt-2 text-gray-600">
            Coordinate volunteer opportunities and manage event staffing.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {showForm ? 'Cancel' : 'Create Volunteer Slot'}
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Slots</dt>
                  <dd className="text-lg font-medium text-gray-900">{volunteerSlots.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Open Slots</dt>
                  <dd className="text-lg font-medium text-gray-900">{openSlots.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">My Commitments</dt>
                  <dd className="text-lg font-medium text-gray-900">{mySlots.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Event</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title} - {formatDateTime(event.start_time)}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
            <select
              value={view}
              onChange={(e) => setView(e.target.value as 'all' | 'my' | 'open')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">All Slots</option>
              <option value="open">Open Slots</option>
              <option value="my">My Commitments</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create Slot Form */}
      {showForm && canManage && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Create Volunteer Slot</h2>
          
          <form onSubmit={handleCreateSlot} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="event" className="block text-sm font-medium text-gray-700">
                  Event *
                </label>
                <select
                  value={formData.event_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_id: e.target.value }))}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select an event</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {formatDateTime(event.start_time)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Volunteer Role *
                </label>
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, role_id: e.target.value }))}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select a role</option>
                  {volunteerRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Special instructions or requirements..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Slot
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Volunteer Slots List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Volunteer Opportunities
            {filteredSlots.length !== volunteerSlots.length && (
              <span className="text-sm font-normal text-gray-500">
                ({filteredSlots.length} of {volunteerSlots.length})
              </span>
            )}
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredSlots.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {view === 'my' ? 'No volunteer commitments' : 
                 view === 'open' ? 'No open volunteer slots' : 
                 'No volunteer slots available'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {view === 'my' ? 'Sign up for volunteer opportunities to help serve!' : 
                 view === 'open' ? 'All volunteer positions are currently filled.' : 
                 canManage ? 'Create your first volunteer slot to get started!' : 'Check back soon for volunteer opportunities.'}
              </p>
            </div>
          ) : (
            filteredSlots.map((slot) => (
              <div key={slot.id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {slot.role?.name}
                      </h3>
                      <div className="ml-3 flex items-center">
                        {getStatusIcon(slot.status)}
                        <span className={`ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(slot.status)}`}>
                          {slot.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">{slot.event?.title}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{formatDateTime(slot.event?.start_time || '')}</span>
                      </div>
                      {slot.event?.location && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{slot.event.location}</span>
                        </div>
                      )}
                      {slot.assigned_member && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{slot.assigned_member.first_name} {slot.assigned_member.last_name}</span>
                        </div>
                      )}
                    </div>
                    
                    {slot.role?.description && (
                      <p className="mt-2 text-sm text-gray-700">
                        {slot.role.description}
                      </p>
                    )}
                    
                    {slot.note && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-700">
                          <strong>Note:</strong> {slot.note}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-6 flex flex-col gap-2 flex-shrink-0">
                    {slot.status === 'Open' && !slot.assigned_to && (
                      <button
                        onClick={() => handleClaimSlot(slot.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Sign Up
                      </button>
                    )}
                    
                    {slot.assigned_to === user?.id && (
                      <button
                        onClick={() => handleUnclaimSlot(slot.id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    )}
                    
                    {canManage && (
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}