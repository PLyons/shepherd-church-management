import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { PlayCircle, Download, Calendar, User, Upload, Search, Filter } from 'lucide-react';

type Sermon = {
  id: string;
  title: string;
  speaker_name: string;
  date_preached: string;
  notes: string | null;
  media_url: string | null;
  created_by: string;
  created_at: string;
  created_by_member?: {
    first_name: string;
    last_name: string;
  };
};

type SermonFormData = {
  title: string;
  speaker_name: string;
  date_preached: string;
  notes: string;
  media_file: File | null;
};

export default function Sermons() {
  const { user, memberRole } = useAuth();
  const { showToast } = useToast();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [speakerFilter, setSpeakerFilter] = useState('');
  const [filteredSermons, setFilteredSermons] = useState<Sermon[]>([]);
  const [speakers, setSpeakers] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState<SermonFormData>({
    title: '',
    speaker_name: '',
    date_preached: new Date().toISOString().split('T')[0],
    notes: '',
    media_file: null,
  });

  const canUpload = memberRole === 'admin' || memberRole === 'pastor';

  useEffect(() => {
    fetchSermons();
  }, []);

  useEffect(() => {
    // Filter sermons based on search and speaker filter
    let filtered = [...sermons];

    if (searchTerm) {
      filtered = filtered.filter(sermon =>
        sermon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sermon.speaker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sermon.notes && sermon.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (speakerFilter) {
      filtered = filtered.filter(sermon => sermon.speaker_name === speakerFilter);
    }

    setFilteredSermons(filtered);
  }, [sermons, searchTerm, speakerFilter]);

  const fetchSermons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sermons')
        .select(`
          *,
          created_by_member:members!created_by(first_name, last_name)
        `)
        .order('date_preached', { ascending: false });

      if (error) throw error;
      
      const sermonsData = data || [];
      setSermons(sermonsData);
      
      // Extract unique speakers
      const uniqueSpeakers = [...new Set(sermonsData.map(s => s.speaker_name))].sort();
      setSpeakers(uniqueSpeakers);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load sermons', 'error');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `sermons/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // If bucket doesn't exist, create it
        if (uploadError.message.includes('The resource was not found')) {
          const { error: bucketError } = await supabase.storage
            .createBucket('media', {
              public: true,
              allowedMimeTypes: ['audio/*', 'video/*'],
              fileSizeLimit: 52428800 // 50MB
            });

          if (bucketError && !bucketError.message.includes('already exists')) {
            throw bucketError;
          }

          // Retry upload after creating bucket
          const { error: retryError } = await supabase.storage
            .from('media')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (retryError) throw retryError;
        } else {
          throw uploadError;
        }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.speaker_name || !formData.date_preached) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setSubmitting(true);
      setUploadProgress(0);

      let mediaUrl = null;
      
      // Upload media file if provided
      if (formData.media_file) {
        setUploadProgress(25);
        mediaUrl = await uploadFile(formData.media_file);
        setUploadProgress(75);
      }

      // Create sermon record
      const sermonData = {
        title: formData.title,
        speaker_name: formData.speaker_name,
        date_preached: formData.date_preached,
        notes: formData.notes || null,
        media_url: mediaUrl,
        created_by: user?.id,
      };

      const { error } = await supabase
        .from('sermons')
        .insert(sermonData);

      if (error) throw error;

      setUploadProgress(100);
      showToast('Sermon uploaded successfully', 'success');
      
      // Reset form
      setFormData({
        title: '',
        speaker_name: '',
        date_preached: new Date().toISOString().split('T')[0],
        notes: '',
        media_file: null,
      });
      setShowForm(false);
      setUploadProgress(0);
      
      // Refresh sermons list
      await fetchSermons();
    } catch (err) {
      setUploadProgress(0);
      showToast(err instanceof Error ? err.message : 'Failed to upload sermon', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (50MB limit)
      if (file.size > 52428800) {
        showToast('File size must be less than 50MB', 'error');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        showToast('Please select an audio or video file', 'error');
        return;
      }
      
      setFormData(prev => ({ ...prev, media_file: file }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Sermons</h1>
          <p className="mt-2 text-gray-600">
            Listen to our latest messages and explore our sermon archive. All sermons are freely available for listening and download.
          </p>
        </div>
        {canUpload && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Upload className="w-4 h-4 mr-2" />
            {showForm ? 'Cancel' : 'Upload Sermon'}
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
                  <PlayCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Sermons</dt>
                  <dd className="text-lg font-medium text-gray-900">{sermons.length}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Speakers</dt>
                  <dd className="text-lg font-medium text-gray-900">{speakers.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Download className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Available</dt>
                  <dd className="text-lg font-medium text-gray-900">{sermons.filter(s => s.media_url).length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search sermons by title, speaker, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={speakerFilter}
                onChange={(e) => setSpeakerFilter(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Speakers</option>
                {speakers.map(speaker => (
                  <option key={speaker} value={speaker}>
                    {speaker}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      {showForm && canUpload && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Upload New Sermon</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Sermon Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter sermon title"
                />
              </div>

              <div>
                <label htmlFor="speaker" className="block text-sm font-medium text-gray-700">
                  Speaker Name *
                </label>
                <input
                  type="text"
                  value={formData.speaker_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, speaker_name: e.target.value }))}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Pastor John Smith"
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Date Preached *
                </label>
                <input
                  type="date"
                  value={formData.date_preached}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_preached: e.target.value }))}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="media" className="block text-sm font-medium text-gray-700">
                  Audio/Video File (Max 50MB)
                </label>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {formData.media_file && (
                  <p className="mt-1 text-sm text-gray-600">
                    Selected: {formData.media_file.name} ({formatFileSize(formData.media_file.size)})
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Sermon Notes & Scripture References
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Scripture references, main points, and sermon notes..."
              />
            </div>

            {/* Upload Progress */}
            {submitting && uploadProgress > 0 && (
              <div>
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="mt-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Sermon
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sermons List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Sermon Archive 
            {filteredSermons.length !== sermons.length && (
              <span className="text-sm font-normal text-gray-500">
                ({filteredSermons.length} of {sermons.length})
              </span>
            )}
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredSermons.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <PlayCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {sermons.length === 0 ? 'No sermons available' : 'No sermons match your search'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {sermons.length === 0 ? (
                  canUpload ? 'Upload your first sermon to get started!' : 'Check back soon for new messages.'
                ) : (
                  'Try adjusting your search terms or filters.'
                )}
              </p>
            </div>
          ) : (
            filteredSermons.map((sermon) => (
              <div key={sermon.id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {sermon.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-4 space-x-6">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">{sermon.speaker_name}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{formatDate(sermon.date_preached)}</span>
                      </div>
                      {sermon.media_url && (
                        <div className="flex items-center">
                          <PlayCircle className="w-4 h-4 mr-2 text-green-500" />
                          <span className="text-green-600 font-medium">Audio Available</span>
                        </div>
                      )}
                    </div>
                    {sermon.notes && (
                      <div className="text-sm text-gray-700 mt-4">
                        <details className="group">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium mb-2 flex items-center">
                            <span>View Sermon Notes & Scripture</span>
                            <svg className="w-4 h-4 ml-2 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </summary>
                          <div className="bg-gray-50 rounded-lg p-4 mt-2 border-l-4 border-blue-500">
                            <div className="whitespace-pre-wrap text-gray-700">{sermon.notes}</div>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                  
                  {sermon.media_url && (
                    <div className="ml-6 flex flex-col gap-3 flex-shrink-0">
                      <a
                        href={sermon.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Listen Now
                      </a>
                      <a
                        href={sermon.media_url}
                        download
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </div>
                  )}
                </div>
                
                {!sermon.media_url && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800">
                          Audio recording coming soon for this message. Check back later or contact us for more information.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}