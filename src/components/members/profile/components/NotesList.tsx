import { useState } from 'react';
import { format } from 'date-fns';
import { Edit, Trash2, Eye, Lock } from 'lucide-react';
import { MemberNote } from '../../../../types/notes';
import { NOTE_CONFIG, PRIORITY_CONFIG } from '../../../../types/notes';
import { notesService } from '../../../../services/firebase/notes.service';
import { useAuth } from '../../../../hooks/useUnifiedAuth';
import { useToast } from '../../../../contexts/ToastContext';

interface NotesListProps {
  notes: MemberNote[];
  onEdit: (note: MemberNote) => void;
  onDelete: (noteId: string) => void;
  memberId: string;
}

export function NotesList({ notes, onEdit, onDelete, memberId }: NotesListProps) {
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [deletingNote, setDeletingNote] = useState<string | null>(null);
  
  const { member: currentUser } = useAuth();
  const { showToast } = useToast();

  const handleViewNote = async (note: MemberNote) => {
    if (expandedNote === note.id) {
      setExpandedNote(null);
    } else {
      setExpandedNote(note.id);
      
      // Track note access
      if (currentUser) {
        await notesService.trackNoteAccess(memberId, note.id, currentUser.id);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    setDeletingNote(noteId);
    try {
      await notesService.deleteNote(memberId, noteId);
      onDelete(noteId);
      showToast('Note deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting note:', error);
      showToast('Failed to delete note', 'error');
    } finally {
      setDeletingNote(null);
    }
  };

  const canEditNote = (note: MemberNote) => {
    return currentUser?.role === 'admin' || note.createdBy === currentUser?.id;
  };

  const canDeleteNote = (note: MemberNote) => {
    return currentUser?.role === 'admin' || note.createdBy === currentUser?.id;
  };

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">📝</div>
        <h3 className="text-sm font-medium text-gray-900">No Notes Yet</h3>
        <p className="text-sm text-gray-500">
          Create your first note to start tracking pastoral care information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map(note => {
        const categoryConfig = NOTE_CONFIG[note.category];
        const priorityConfig = PRIORITY_CONFIG[note.priority];
        const isExpanded = expandedNote === note.id;

        return (
          <div key={note.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Note Header */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Category Badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${categoryConfig.bgColor} ${categoryConfig.color}`}>
                      <span>{categoryConfig.icon}</span>
                      {categoryConfig.label}
                    </span>

                    {/* Priority Badge */}
                    {note.priority !== 'normal' && (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                        <span>{priorityConfig.icon}</span>
                        {priorityConfig.label}
                      </span>
                    )}

                    {/* Private Indicator */}
                    {note.isPrivate && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        <Lock className="h-3 w-3" />
                        Private
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {note.title}
                  </h4>
                  
                  <div className="text-xs text-gray-500 mb-2">
                    Created by {note.createdByName} on {format(note.createdAt, 'PPP')}
                    {note.updatedAt && (
                      <span> • Updated {format(note.updatedAt, 'PPP')}</span>
                    )}
                  </div>

                  {/* Tags */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {note.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Preview */}
                  {!isExpanded && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {note.plainTextContent}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => handleViewNote(note)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  {canEditNote(note) && (
                    <button
                      onClick={() => onEdit(note)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      title="Edit Note"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}

                  {canDeleteNote(note) && (
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={deletingNote === note.id}
                      className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-50"
                      title="Delete Note"
                    >
                      {deletingNote === note.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
                  
                  {/* Access Info */}
                  <div className="mt-4 pt-2 border-t border-gray-100 text-xs text-gray-500">
                    Viewed {note.accessCount} times
                    {note.lastAccessedAt && (
                      <span> • Last accessed {format(note.lastAccessedAt, 'PPp')}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}