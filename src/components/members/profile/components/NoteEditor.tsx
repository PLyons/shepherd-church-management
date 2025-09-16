import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  MemberNote,
  NoteCategory,
  NotePriority,
} from '../../../../types/notes';
import { NOTE_CONFIG, PRIORITY_CONFIG } from '../../../../types/notes';
import { notesService } from '../../../../services/firebase/notes.service';
import { useAuth } from '../../../../hooks/useUnifiedAuth';
import { useToast } from '../../../../contexts/ToastContext';

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  note?: MemberNote | null;
  onSave: (note: MemberNote) => void;
}

export function NoteEditor({
  isOpen,
  onClose,
  memberId,
  note,
  onSave,
}: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NoteCategory>('general');
  const [priority, setPriority] = useState<NotePriority>('normal');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { member: currentUser } = useAuth();
  const { showToast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write your note here...',
      }),
    ],
    content: note?.content || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setCategory(note.category);
      setPriority(note.priority);
      setTags(note.tags);
      setIsPrivate(note.isPrivate);
      editor?.commands.setContent(note.content);
    } else {
      // Reset form for new note
      setTitle('');
      setCategory('general');
      setPriority('normal');
      setTags([]);
      setTagInput('');
      setIsPrivate(false);
      setError(null);
      editor?.commands.setContent('<p></p>');
    }
  }, [note, editor]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleClose = () => {
    // Reset form state
    if (!note) {
      setTitle('');
      setCategory('general');
      setPriority('normal');
      setTags([]);
      setTagInput('');
      setIsPrivate(false);
      setError(null);
      editor?.commands.setContent('<p></p>');
    }
    onClose();
  };

  const handleSave = async () => {
    if (!title.trim() || !editor || !currentUser) {
      setError('Title and content are required');
      return;
    }

    const content = editor.getHTML();
    const plainTextContent = editor.getText();

    if (!plainTextContent.trim()) {
      setError('Note content cannot be empty');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (note) {
        // Update existing note - only send updatable fields
        const updateData = {
          title: title.trim(),
          content,
          plainTextContent,
          category,
          priority,
          tags,
          isPrivate,
          updatedBy: currentUser.id,
          updatedByName: `${currentUser.firstName} ${currentUser.lastName}`,
          // updatedAt is set by the service
        };

        await notesService.updateNote(memberId, note.id, updateData);

        // Create updated note object for UI
        const updatedNote: MemberNote = {
          ...note,
          ...updateData,
          updatedAt: new Date(),
        };
        onSave(updatedNote);
        showToast('Note updated successfully', 'success');
      } else {
        // Create new note
        const newNote: Omit<MemberNote, 'id' | 'createdAt' | 'accessCount'> = {
          memberId,
          title: title.trim(),
          content,
          plainTextContent,
          category,
          priority,
          tags,
          isPrivate,
          createdBy: currentUser.id,
          createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
        };

        const noteId = await notesService.createNote(memberId, newNote);

        // Create note object for UI update with real ID
        const createdNote: MemberNote = {
          ...newNote,
          id: noteId,
          createdAt: new Date(),
          accessCount: 0,
        };

        onSave(createdNote);
        showToast('Note created successfully', 'success');
      }

      // Close modal on successful save
      handleClose();
    } catch (error) {
      console.error('Error saving note:', error);

      // Show error message but still close modal for better UX
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save note';
      if (errorMessage.includes('permissions')) {
        showToast(
          'Permission denied: Please ensure Firebase security rules are deployed',
          'error'
        );
      } else {
        showToast('Failed to save note. Please try again.', 'error');
      }

      // Close modal even on error to prevent stuck state
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {note ? 'Edit Note' : 'Create New Note'}
          </h3>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter note title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as NoteCategory)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(NOTE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as NotePriority)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), handleAddTag())
                  }
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Privacy */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Private Note
                </span>
                <span className="text-sm text-gray-500">
                  (Only visible to creator and admins)
                </span>
              </label>
            </div>

            {/* Rich Text Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <div className="border border-gray-300 rounded-md overflow-hidden">
                {/* Toolbar */}
                <div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-1">
                  <button
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      editor?.isActive('bold')
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    B
                  </button>
                  <button
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={`px-2 py-1 rounded text-sm italic ${
                      editor?.isActive('italic')
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    I
                  </button>
                  <button
                    onClick={() =>
                      editor?.chain().focus().toggleBulletList().run()
                    }
                    className={`px-2 py-1 rounded text-sm ${
                      editor?.isActive('bulletList')
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    •
                  </button>
                </div>

                {/* Editor */}
                <EditorContent editor={editor} />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <div className="h-4 w-4 animate-spin rounded-full border border-white border-t-transparent" />
            )}
            <Save className="h-4 w-4" />
            {note ? 'Update Note' : 'Create Note'}
          </button>
        </div>
      </div>
    </div>
  );
}
