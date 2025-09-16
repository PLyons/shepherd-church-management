import { useState, useEffect, useContext } from 'react';
import { Plus, Filter, MessageSquare } from 'lucide-react';
import { MemberContext } from '../../../../pages/MemberProfile';
import { useAuth } from '../../../../hooks/useUnifiedAuth';
import { notesService } from '../../../../services/firebase/notes.service';
import { MemberNote, Communication, NoteFilter } from '../../../../types/notes';
import { NoteEditor } from '../components/NoteEditor';
import { NotesList } from '../components/NotesList';
import { NotesFilters } from '../components/NotesFilters';
import { CommunicationsList } from '../components/CommunicationsList';
import { CommunicationLogger } from '../components/CommunicationLogger';

export default function NotesTab() {
  const { member } = useContext(MemberContext);
  const { member: currentUser } = useAuth();

  const [activeView, setActiveView] = useState<'notes' | 'communications'>(
    'notes'
  );
  const [notes, setNotes] = useState<MemberNote[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<MemberNote | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCommunicationLogger, setShowCommunicationLogger] = useState(false);

  const [filters, setFilters] = useState<NoteFilter>({
    categories: [],
    priorities: [],
    tags: [],
    dateRange: { start: null, end: null },
    search: '',
    createdBy: [],
  });

  const canAccessNotes =
    currentUser?.role === 'admin' || currentUser?.role === 'pastor';

  useEffect(() => {
    if (!member?.id || !canAccessNotes) return;
    loadData();
  }, [member?.id, canAccessNotes, filters]);

  const loadData = async () => {
    if (!member?.id) return;

    try {
      setLoading(true);
      const [notesResult, communicationsData] = await Promise.all([
        notesService.getNotes(member.id, filters),
        notesService.getCommunications(member.id),
      ]);

      setNotes(notesResult.notes);
      setCommunications(communicationsData);
    } catch (error) {
      console.error('Error loading notes data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNoteCreated = async (note: MemberNote) => {
    // Reload notes to get fresh data from server
    await loadData();
    setShowEditor(false);
  };

  const handleNoteUpdated = async (updatedNote: MemberNote) => {
    // Reload notes to get fresh data from server
    await loadData();
    setEditingNote(null);
    setShowEditor(false);
  };

  const handleNoteDeleted = (noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  const handleCommunicationLogged = (communication: Communication) => {
    setCommunications((prev) => [communication, ...prev]);
    setShowCommunicationLogger(false);
  };

  if (!canAccessNotes) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Access Restricted
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have permission to view notes and communications.
        </p>
      </div>
    );
  }

  if (!member) {
    return <div>Loading member data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Notes & Communications
          </h2>
          <p className="text-sm text-gray-500">
            Private pastoral care notes and communication history
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeView === 'notes' ? (
            <button
              onClick={() => setShowEditor(true)}
              className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Note
            </button>
          ) : (
            <button
              onClick={() => setShowCommunicationLogger(true)}
              className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Log Communication
            </button>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveView('notes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeView === 'notes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveView('communications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeView === 'communications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Communications ({communications.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      {showFilters && activeView === 'notes' && (
        <NotesFilters filters={filters} onFiltersChange={setFilters} />
      )}

      {/* Content */}
      {loading ? (
        <NotesLoadingState />
      ) : activeView === 'notes' ? (
        <NotesList
          notes={notes}
          onEdit={(note) => {
            setEditingNote(note);
            setShowEditor(true);
          }}
          onDelete={handleNoteDeleted}
          memberId={member.id}
        />
      ) : (
        <CommunicationsList
          communications={communications}
          memberId={member.id}
        />
      )}

      {/* Note Editor Modal */}
      {showEditor && (
        <NoteEditor
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setEditingNote(null);
          }}
          memberId={member.id}
          note={editingNote}
          onSave={editingNote ? handleNoteUpdated : handleNoteCreated}
        />
      )}

      {/* Communication Logger Modal */}
      {showCommunicationLogger && (
        <CommunicationLogger
          isOpen={showCommunicationLogger}
          onClose={() => setShowCommunicationLogger(false)}
          memberId={member.id}
          onSave={handleCommunicationLogged}
        />
      )}
    </div>
  );
}

function NotesLoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-6 w-6 bg-gray-200 rounded"></div>
              <div className="h-4 w-48 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-200 rounded"></div>
              <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
