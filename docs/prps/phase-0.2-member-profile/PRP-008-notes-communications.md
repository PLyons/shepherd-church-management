# PRP-008: Notes & Communications Tab

**Phase:** 0.2 - Member Profile UI Enhancements  
**Status:** Not Started  
**Priority:** Medium  
**Estimated Effort:** 1.5 days  
**Dependencies:** PRP-002 (Tabbed Navigation), PRP-005 (Inline Editing)  

## Purpose

Implement a secure notes and communications system for pastoral care and administrative purposes, with proper access control, rich text editing, and comprehensive tracking of member interactions.

## Requirements

### Technical Requirements
- Rich text editor for formatted notes
- Firebase subcollection for secure note storage
- Role-based access control (pastor/admin only)
- Note categorization and tagging system
- Search and filter functionality
- Audit trail for note access and modifications
- Integration with communication logging

### Design Requirements
- Clean note list with preview and metadata
- Rich text editor with formatting toolbar
- Category badges and priority indicators
- Search and filter interface
- Responsive design for mobile access
- Privacy indicators and access controls

### Dependencies
- PRP-002 tab navigation structure
- PRP-005 inline editing patterns
- Auth context for role-based permissions
- Firebase security rules for data protection
- Rich text editor library (TipTap or similar)

## Context

### Current State
No notes or communication tracking exists:
- No pastoral care notes system
- No record of member interactions
- No centralized communication history
- No privacy-protected information storage
- No structured way to track member care

### Problems with Current Implementation
- Pastoral staff have no digital record-keeping system
- Member care information scattered across personal devices
- No continuity when pastoral staff changes
- Cannot track communication history with members
- No secure way to store sensitive pastoral information

### Desired State
- Secure digital notes system for pastoral care
- Structured communication history
- Rich text formatting for detailed notes
- Category system for organization
- Search and filter capabilities
- Proper access controls and privacy protection

## Success Criteria

- [ ] Notes tab only visible to admin/pastor users
- [ ] Rich text editor works with formatting options
- [ ] Note categories and priorities function correctly
- [ ] Search and filter system works effectively
- [ ] Communication logging integrates seamlessly
- [ ] Access controls prevent unauthorized viewing
- [ ] Mobile interface maintains full functionality
- [ ] Audit trail tracks all note activities
- [ ] Privacy indicators clearly show sensitivity levels
- [ ] Performance remains good with large note sets

## Implementation Procedure

### Step 1: Define Note and Communication Types

1. **Create note type definitions:**
   ```bash
   touch src/types/notes.ts
   ```

   ```typescript
   export interface MemberNote {
     id: string;
     memberId: string;
     title: string;
     content: string; // Rich text HTML
     plainTextContent: string; // For search
     category: NoteCategory;
     priority: NotePriority;
     tags: string[];
     isPrivate: boolean;
     
     // Metadata
     createdBy: string;
     createdByName: string;
     createdAt: Date;
     updatedBy?: string;
     updatedByName?: string;
     updatedAt?: Date;
     
     // Access tracking
     lastAccessedBy?: string;
     lastAccessedAt?: Date;
     accessCount: number;
   }

   export type NoteCategory = 
     | 'pastoral_care'
     | 'prayer_request'
     | 'counseling'
     | 'family_situation'
     | 'health_concern'
     | 'administrative'
     | 'follow_up'
     | 'spiritual_growth'
     | 'general';

   export type NotePriority = 'low' | 'normal' | 'high' | 'urgent';

   export interface Communication {
     id: string;
     memberId: string;
     type: CommunicationType;
     direction: 'incoming' | 'outgoing';
     subject?: string;
     summary: string;
     fullContent?: string;
     
     // Contact details
     method: 'email' | 'phone' | 'text' | 'in_person' | 'video_call';
     contactInfo?: string; // phone number, email address
     
     // Metadata
     timestamp: Date;
     duration?: number; // in minutes
     recordedBy: string;
     recordedByName: string;
     
     // Follow-up
     requiresFollowUp: boolean;
     followUpDate?: Date;
     followUpCompleted: boolean;
   }

   export type CommunicationType = 
     | 'pastoral_call'
     | 'counseling_session'
     | 'prayer_support'
     | 'administrative'
     | 'emergency'
     | 'routine_check_in'
     | 'event_coordination'
     | 'volunteer_coordination';

   export interface NoteFilter {
     categories: NoteCategory[];
     priorities: NotePriority[];
     tags: string[];
     dateRange: {
       start: Date | null;
       end: Date | null;
     };
     search: string;
     createdBy: string[];
   }
   ```

2. **Create note configuration:**
   ```typescript
   export const NOTE_CONFIG: Record<NoteCategory, {
     label: string;
     icon: string;
     color: string;
     bgColor: string;
     description: string;
   }> = {
     pastoral_care: {
       label: 'Pastoral Care',
       icon: '❤️',
       color: 'text-red-600',
       bgColor: 'bg-red-100',
       description: 'General pastoral care and support'
     },
     prayer_request: {
       label: 'Prayer Request',
       icon: '🙏',
       color: 'text-purple-600',
       bgColor: 'bg-purple-100',
       description: 'Prayer requests and spiritual support'
     },
     counseling: {
       label: 'Counseling',
       icon: '💬',
       color: 'text-blue-600',
       bgColor: 'bg-blue-100',
       description: 'Counseling sessions and guidance'
     },
     family_situation: {
       label: 'Family Situation',
       icon: '👨‍👩‍👧‍👦',
       color: 'text-green-600',
       bgColor: 'bg-green-100',
       description: 'Family dynamics and situations'
     },
     health_concern: {
       label: 'Health Concern',
       icon: '🏥',
       color: 'text-pink-600',
       bgColor: 'bg-pink-100',
       description: 'Health issues and medical support'
     },
     administrative: {
       label: 'Administrative',
       icon: '📋',
       color: 'text-gray-600',
       bgColor: 'bg-gray-100',
       description: 'Administrative notes and records'
     },
     follow_up: {
       label: 'Follow-up',
       icon: '📅',
       color: 'text-orange-600',
       bgColor: 'bg-orange-100',
       description: 'Follow-up actions and reminders'
     },
     spiritual_growth: {
       label: 'Spiritual Growth',
       icon: '✨',
       color: 'text-indigo-600',
       bgColor: 'bg-indigo-100',
       description: 'Spiritual development and growth'
     },
     general: {
       label: 'General',
       icon: '📝',
       color: 'text-slate-600',
       bgColor: 'bg-slate-100',
       description: 'General notes and observations'
     }
   };

   export const PRIORITY_CONFIG: Record<NotePriority, {
     label: string;
     icon: string;
     color: string;
     bgColor: string;
   }> = {
     low: {
       label: 'Low',
       icon: '🔵',
       color: 'text-blue-600',
       bgColor: 'bg-blue-100'
     },
     normal: {
       label: 'Normal',
       icon: '⚪',
       color: 'text-gray-600',
       bgColor: 'bg-gray-100'
     },
     high: {
       label: 'High',
       icon: '🟡',
       color: 'text-yellow-600',
       bgColor: 'bg-yellow-100'
     },
     urgent: {
       label: 'Urgent',
       icon: '🔴',
       color: 'text-red-600',
       bgColor: 'bg-red-100'
     }
   };
   ```

### Step 2: Create Notes Service

1. **Create notes service:**
   ```bash
   touch src/services/firebase/notes.service.ts
   ```

   ```typescript
   import { 
     collection, 
     addDoc, 
     updateDoc,
     deleteDoc,
     doc,
     query, 
     where, 
     orderBy, 
     limit,
     startAfter,
     getDocs, 
     Timestamp,
     increment
   } from 'firebase/firestore';
   import { db } from '../../lib/firebase';
   import { MemberNote, Communication, NoteFilter } from '../../types/notes';

   class NotesService {
     private getNotesCollection(memberId: string) {
       return collection(db, 'members', memberId, 'notes');
     }

     private getCommunicationsCollection(memberId: string) {
       return collection(db, 'members', memberId, 'communications');
     }

     // Note operations
     async createNote(memberId: string, note: Omit<MemberNote, 'id' | 'createdAt' | 'accessCount'>): Promise<void> {
       try {
         const notesRef = this.getNotesCollection(memberId);
         await addDoc(notesRef, {
           ...note,
           createdAt: Timestamp.now(),
           accessCount: 0
         });
       } catch (error) {
         console.error('Error creating note:', error);
         throw new Error('Failed to create note');
       }
     }

     async updateNote(memberId: string, noteId: string, updates: Partial<MemberNote>): Promise<void> {
       try {
         const noteRef = doc(this.getNotesCollection(memberId), noteId);
         await updateDoc(noteRef, {
           ...updates,
           updatedAt: Timestamp.now()
         });
       } catch (error) {
         console.error('Error updating note:', error);
         throw new Error('Failed to update note');
       }
     }

     async deleteNote(memberId: string, noteId: string): Promise<void> {
       try {
         const noteRef = doc(this.getNotesCollection(memberId), noteId);
         await deleteDoc(noteRef);
       } catch (error) {
         console.error('Error deleting note:', error);
         throw new Error('Failed to delete note');
       }
     }

     async getNotes(
       memberId: string, 
       filters: Partial<NoteFilter> = {},
       pageSize: number = 20,
       lastDoc?: any
     ): Promise<{ notes: MemberNote[]; hasMore: boolean; lastDoc: any }> {
       try {
         let q = query(
           this.getNotesCollection(memberId),
           orderBy('createdAt', 'desc')
         );

         // Apply filters
         if (filters.categories?.length) {
           q = query(q, where('category', 'in', filters.categories));
         }

         if (filters.priorities?.length) {
           q = query(q, where('priority', 'in', filters.priorities));
         }

         if (filters.createdBy?.length) {
           q = query(q, where('createdBy', 'in', filters.createdBy));
         }

         if (filters.dateRange?.start) {
           q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.dateRange.start)));
         }

         if (filters.dateRange?.end) {
           q = query(q, where('createdAt', '<=', Timestamp.fromDate(filters.dateRange.end)));
         }

         // Pagination
         q = query(q, limit(pageSize + 1));
         if (lastDoc) {
           q = query(q, startAfter(lastDoc));
         }

         const snapshot = await getDocs(q);
         const docs = snapshot.docs;
         const hasMore = docs.length > pageSize;
         
         if (hasMore) {
           docs.pop();
         }

         let notes = docs.map(doc => ({
           id: doc.id,
           ...doc.data(),
           createdAt: doc.data().createdAt.toDate(),
           updatedAt: doc.data().updatedAt?.toDate()
         })) as MemberNote[];

         // Apply client-side filters
         if (filters.search) {
           const searchLower = filters.search.toLowerCase();
           notes = notes.filter(note => 
             note.title.toLowerCase().includes(searchLower) ||
             note.plainTextContent.toLowerCase().includes(searchLower) ||
             note.tags.some(tag => tag.toLowerCase().includes(searchLower))
           );
         }

         if (filters.tags?.length) {
           notes = notes.filter(note => 
             filters.tags!.some(tag => note.tags.includes(tag))
           );
         }

         return { notes, hasMore, lastDoc: docs[docs.length - 1] };
       } catch (error) {
         console.error('Error fetching notes:', error);
         throw new Error('Failed to load notes');
       }
     }

     async trackNoteAccess(memberId: string, noteId: string, accessedBy: string): Promise<void> {
       try {
         const noteRef = doc(this.getNotesCollection(memberId), noteId);
         await updateDoc(noteRef, {
           lastAccessedBy: accessedBy,
           lastAccessedAt: Timestamp.now(),
           accessCount: increment(1)
         });
       } catch (error) {
         console.error('Error tracking note access:', error);
         // Don't throw error for access tracking failures
       }
     }

     // Communication operations
     async logCommunication(memberId: string, communication: Omit<Communication, 'id'>): Promise<void> {
       try {
         const communicationsRef = this.getCommunicationsCollection(memberId);
         await addDoc(communicationsRef, {
           ...communication,
           timestamp: Timestamp.now()
         });
       } catch (error) {
         console.error('Error logging communication:', error);
         throw new Error('Failed to log communication');
       }
     }

     async getCommunications(memberId: string, limit: number = 50): Promise<Communication[]> {
       try {
         const q = query(
           this.getCommunicationsCollection(memberId),
           orderBy('timestamp', 'desc'),
           limit(limit)
         );

         const snapshot = await getDocs(q);
         return snapshot.docs.map(doc => ({
           id: doc.id,
           ...doc.data(),
           timestamp: doc.data().timestamp.toDate()
         })) as Communication[];
       } catch (error) {
         console.error('Error fetching communications:', error);
         throw new Error('Failed to load communications');
       }
     }
   }

   export const notesService = new NotesService();
   ```

### Step 3: Create Notes Tab Component

1. **Create the main notes tab:**
   ```bash
   touch src/components/members/profile/tabs/NotesTab.tsx
   ```

   ```typescript
   import { useState, useEffect, useContext } from 'react';
   import { Plus, Filter, Search, MessageSquare } from 'lucide-react';
   import { MemberContext } from '../../../../pages/MemberProfile';
   import { useAuth } from '../../../../contexts/AuthContext';
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
     
     const [activeView, setActiveView] = useState<'notes' | 'communications'>('notes');
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
       createdBy: []
     });

     const canAccessNotes = currentUser?.role === 'admin' || currentUser?.role === 'pastor';

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
           notesService.getCommunications(member.id)
         ]);
         
         setNotes(notesResult.notes);
         setCommunications(communicationsData);
       } catch (error) {
         console.error('Error loading notes data:', error);
       } finally {
         setLoading(false);
       }
     };

     const handleNoteCreated = (note: MemberNote) => {
       setNotes(prev => [note, ...prev]);
       setShowEditor(false);
     };

     const handleNoteUpdated = (updatedNote: MemberNote) => {
       setNotes(prev => prev.map(note => 
         note.id === updatedNote.id ? updatedNote : note
       ));
       setEditingNote(null);
       setShowEditor(false);
     };

     const handleNoteDeleted = (noteId: string) => {
       setNotes(prev => prev.filter(note => note.id !== noteId));
     };

     const handleCommunicationLogged = (communication: Communication) => {
       setCommunications(prev => [communication, ...prev]);
       setShowCommunicationLogger(false);
     };

     if (!canAccessNotes) {
       return (
         <div className="text-center py-12">
           <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
           <h3 className="mt-2 text-sm font-medium text-gray-900">Access Restricted</h3>
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
           <NotesFilters
             filters={filters}
             onFiltersChange={setFilters}
           />
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
         {[1, 2, 3].map(i => (
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
   ```

### Step 4: Create Rich Text Note Editor

1. **Install rich text editor dependency:**
   ```bash
   npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
   ```

2. **Create note editor component:**
   ```bash
   touch src/components/members/profile/components/NoteEditor.tsx
   ```

   ```typescript
   import { useState, useEffect } from 'react';
   import { X, Save, AlertCircle } from 'lucide-react';
   import { useEditor, EditorContent } from '@tiptap/react';
   import StarterKit from '@tiptap/starter-kit';
   import Placeholder from '@tiptap/extension-placeholder';
   import { MemberNote, NoteCategory, NotePriority } from '../../../../types/notes';
   import { NOTE_CONFIG, PRIORITY_CONFIG } from '../../../../types/notes';
   import { notesService } from '../../../../services/firebase/notes.service';
   import { useAuth } from '../../../../contexts/AuthContext';
   import { useToast } from '../../../../contexts/ToastContext';

   interface NoteEditorProps {
     isOpen: boolean;
     onClose: () => void;
     memberId: string;
     note?: MemberNote | null;
     onSave: (note: MemberNote) => void;
   }

   export function NoteEditor({ isOpen, onClose, memberId, note, onSave }: NoteEditorProps) {
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
           placeholder: 'Write your note here...'
         })
       ],
       content: note?.content || '<p></p>',
       editorProps: {
         attributes: {
           class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4'
         }
       }
     });

     useEffect(() => {
       if (note) {
         setTitle(note.title);
         setCategory(note.category);
         setPriority(note.priority);
         setTags(note.tags);
         setIsPrivate(note.isPrivate);
         editor?.commands.setContent(note.content);
       }
     }, [note, editor]);

     const handleAddTag = () => {
       if (tagInput.trim() && !tags.includes(tagInput.trim())) {
         setTags([...tags, tagInput.trim()]);
         setTagInput('');
       }
     };

     const handleRemoveTag = (tagToRemove: string) => {
       setTags(tags.filter(tag => tag !== tagToRemove));
     };

     const handleSave = async () => {
       if (!title.trim() || !editor || !currentUser) {
         setError('Title and content are required');
         return;
       }

       const content = editor.getHTML();
       const plainTextContent = editor.getText();

       setSaving(true);
       setError(null);

       try {
         if (note) {
           // Update existing note
           const updatedNote: MemberNote = {
             ...note,
             title: title.trim(),
             content,
             plainTextContent,
             category,
             priority,
             tags,
             isPrivate,
             updatedBy: currentUser.id,
             updatedByName: `${currentUser.firstName} ${currentUser.lastName}`,
             updatedAt: new Date()
           };

           await notesService.updateNote(memberId, note.id, updatedNote);
           onSave(updatedNote);
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
             createdByName: `${currentUser.firstName} ${currentUser.lastName}`
           };

           await notesService.createNote(memberId, newNote);
           
           // Create note object for UI update
           const createdNote: MemberNote = {
             ...newNote,
             id: 'temp-' + Date.now(), // Temporary ID
             createdAt: new Date(),
             accessCount: 0
           };
           
           onSave(createdNote);
         }

         showToast(note ? 'Note updated successfully' : 'Note created successfully', 'success');
       } catch (error) {
         console.error('Error saving note:', error);
         setError('Failed to save note. Please try again.');
         showToast('Failed to save note', 'error');
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
               onClick={onClose}
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
                   {tags.map(tag => (
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
                     onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
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
                   <span className="text-sm font-medium text-gray-700">Private Note</span>
                   <span className="text-sm text-gray-500">(Only visible to creator and admins)</span>
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
                         editor?.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-200'
                       }`}
                     >
                       B
                     </button>
                     <button
                       onClick={() => editor?.chain().focus().toggleItalic().run()}
                       className={`px-2 py-1 rounded text-sm italic ${
                         editor?.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-200'
                       }`}
                     >
                       I
                     </button>
                     <button
                       onClick={() => editor?.chain().focus().toggleBulletList().run()}
                       className={`px-2 py-1 rounded text-sm ${
                         editor?.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-200'
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
               onClick={onClose}
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
   ```

### Step 5: Create Notes List Component

1. **Create notes list component:**
   ```bash
   touch src/components/members/profile/components/NotesList.tsx
   ```

   ```typescript
   import { useState } from 'react';
   import { format } from 'date-fns';
   import { Edit, Trash2, Eye, Lock, AlertTriangle } from 'lucide-react';
   import { MemberNote } from '../../../../types/notes';
   import { NOTE_CONFIG, PRIORITY_CONFIG } from '../../../../types/notes';
   import { notesService } from '../../../../services/firebase/notes.service';
   import { useAuth } from '../../../../contexts/AuthContext';
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
   ```

### Step 6: Add Firebase Security Rules

1. **Update Firestore rules for notes security:**
   ```javascript
   // Add to firestore.rules
   match /members/{memberId}/notes/{noteId} {
     allow read: if isAuthenticated() && 
       hasRole(['admin', 'pastor']) &&
       (resource.data.isPrivate == false || 
        resource.data.createdBy == request.auth.uid || 
        hasRole(['admin']));
     
     allow create: if isAuthenticated() && 
       hasRole(['admin', 'pastor']) &&
       request.resource.data.keys().hasAll(['memberId', 'title', 'content', 'category', 'priority', 'createdBy']) &&
       request.resource.data.createdBy == request.auth.uid;
     
     allow update: if isAuthenticated() && 
       hasRole(['admin', 'pastor']) &&
       (resource.data.createdBy == request.auth.uid || hasRole(['admin']));
     
     allow delete: if isAuthenticated() && 
       hasRole(['admin', 'pastor']) &&
       (resource.data.createdBy == request.auth.uid || hasRole(['admin']));
   }

   match /members/{memberId}/communications/{commId} {
     allow read, create: if isAuthenticated() && 
       hasRole(['admin', 'pastor']);
     
     allow update, delete: if isAuthenticated() && 
       hasRole(['admin']) ||
       (hasRole(['pastor']) && resource.data.recordedBy == request.auth.uid);
   }
   ```

## Testing Plan

### Unit Tests
```typescript
// src/components/members/profile/tabs/__tests__/NotesTab.test.tsx

describe('NotesTab', () => {
  it('shows access restricted message for non-authorized users');
  it('loads notes and communications on mount');
  it('creates new notes with rich text content');
  it('updates existing notes');
  it('deletes notes with confirmation');
  it('filters notes by category and priority');
  it('tracks note access correctly');
  it('respects privacy settings');
});
```

### Security Tests
```typescript
describe('Notes Security', () => {
  it('prevents unauthorized users from accessing notes');
  it('hides private notes from non-creators');
  it('enforces role-based permissions');
  it('tracks all access attempts');
});
```

### Manual Testing Checklist
- [ ] Tab only visible to admin/pastor users
- [ ] Rich text editor works with formatting
- [ ] Note creation and editing functions properly
- [ ] Category and priority filters work correctly
- [ ] Search functionality works across content
- [ ] Privacy settings are respected
- [ ] Access tracking functions correctly
- [ ] Communication logging works properly
- [ ] Mobile interface maintains functionality
- [ ] Security rules prevent unauthorized access

## Rollback Plan

### Immediate Rollback
1. **Remove notes tab:**
   ```bash
   rm src/components/members/profile/tabs/NotesTab.tsx
   rm -rf src/components/members/profile/components/Note*
   rm -rf src/components/members/profile/components/Communication*
   ```

2. **Remove dependencies:**
   ```bash
   npm uninstall @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
   ```

3. **Revert security rules**

### Data Safety
- Note data remains in Firebase subcollections
- No existing member data affected
- Can re-enable without data loss

## Notes

### Design Decisions
- Rich text editing for comprehensive note formatting
- Role-based access with strict permissions
- Privacy levels for sensitive information
- Audit trail for accountability and compliance

### Future Enhancements
- Note templates for common pastoral situations
- Collaboration features for multiple pastors
- Integration with calendar for follow-up reminders
- Advanced search with full-text indexing
- Note sharing with permission controls

### Related PRPs
- **PRP-002:** Integrates with tab navigation system
- **PRP-005:** Uses inline editing patterns for quick updates
- **PRP-007:** Will log note creation in activity history
- **PRP-010:** Will be tested for accessibility compliance