import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../lib/api';
import { useStore } from '../store';
import { 
  FileText, Search, Plus, Trash2, Download, BookOpen, 
  X, AlertTriangle, FileUp, Sparkles, CheckCircle2, ChevronRight, Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function NotesHub() {
  const { user } = useStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');

  // Creation form state
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [error, setError] = useState('');

  // Reader state
  const [readingNote, setReadingNote] = useState<any>(null);

  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ['notes'],
    queryFn: () => apiCall('/notes')
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiCall('/classes')
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiCall('/subjects')
  });

  const createMutation = useMutation({
    mutationFn: (newNote: any) => apiCall('/notes', {
      method: 'POST',
      body: JSON.stringify(newNote)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsCreating(false);
      setTitle('');
      setClassId('');
      setSubjectId('');
      setFileName('');
      setFileContent('');
      setError('');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to publish materials');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => apiCall(`/notes/${noteId}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      if (readingNote && readingNote.id) {
        setReadingNote(null);
      }
    }
  });

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !classId || !subjectId || !fileContent.trim()) {
      setError('Please provide a title, class, subject, and notes content.');
      return;
    }
    createMutation.mutate({
      title,
      class_id: classId,
      subject_id: subjectId,
      file_name: fileName.trim() || `${title.toLowerCase().replace(/\s+/g, '_')}_notes.txt`,
      file_content: fileContent
    });
  };

  const handleDownloadFile = (note: any) => {
    const element = document.createElement("a");
    const file = new Blob([note.file_content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = note.file_name || "study_guide.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const isAuthoritative = user?.role === 'admin' || user?.role === 'teacher';

  const filteredNotes = notes.filter((note: any) => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (note.file_name && note.file_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesClass = selectedClassId === 'all' || note.class_id === selectedClassId;
    const matchesSubject = selectedSubjectId === 'all' || note.subject_id === selectedSubjectId;
    return matchesSearch && matchesClass && matchesSubject;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Classroom Notes & Study Files
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access, read and download official institutional syllabi, study guides and files.
          </p>
        </div>

        {isAuthoritative && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-100 transition duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Upload Study Material
          </button>
        )}
      </div>

      {/* Filter Options */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm/50 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search documents by title or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all shadow-sm/30"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full md:w-44 text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
          >
            <option value="all">All Classes</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full md:w-44 text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid Content */}
      {isLoadingNotes ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 px-4 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-bold text-sm">No Study materials matching criteria</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Once {isAuthoritative ? "you publish a note" : "teachers upload study documents"}, they will populate here for classroom downloads.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note: any) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-150 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {note.subjectName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">{note.className}</span>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-snug">{note.title}</h3>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1.5 font-medium">
                    <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{note.file_name}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pt-1">
                  {note.file_content}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-4">
                <button
                  onClick={() => setReadingNote(note)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  Read Material <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleDownloadFile(note)}
                    title="Download Attachment File"
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {isAuthoritative && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove this published note "${note.title}"?`)) {
                          deleteMutation.mutate(note.id);
                        }
                      }}
                      title="Delete Note"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dialog for Uploading Note */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsCreating(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div className="text-center">
                  <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Syllabus Scribe
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">Publish Study Materials</h2>
                  <p className="text-xs text-slate-500">Provide direct study documents, files or notes for student classrooms.</p>
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span className="font-semibold">{error}</span>
                  </div>
                )}

                <form onSubmit={handleCreateNote} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Material Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Grade 9 Algebra Summary"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="block w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Target Class
                      </label>
                      <select
                        required
                        value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                        className="block w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600"
                      >
                        <option value="">Select target...</option>
                        {classes.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Subject
                      </label>
                      <select
                        required
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        className="block w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600"
                      >
                        <option value="">Select subject...</option>
                        {subjects.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Custom File Download Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., unit1_algebra_notes.txt"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="block w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Notes Content (Will be downloadable as .txt file file format)
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Type details, summaries, references or formulas..."
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all shadow-sm font-mono text-xs leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-100 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:bg-indigo-400 cursor-pointer"
                  >
                    {createMutation.isPending ? 'Publishing core notes...' : 'Verify Notes and Publish'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Material Reader Modal */}
      <AnimatePresence>
        {readingNote && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col justify-between"
            >
              <button
                onClick={() => setReadingNote(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto pr-2 space-y-4 mb-6">
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                      {readingNote.subjectName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-extrabold">
                      {readingNote.className}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1.5">{readingNote.title}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="font-semibold">{readingNote.file_name}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100/60 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[45vh] overflow-y-auto">
                  {readingNote.file_content}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Published: {new Date(readingNote.created_at).toLocaleDateString()}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadFile(readingNote)}
                    className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold px-3.5 py-2 rounded-xl transition"
                  >
                    <Download className="w-4 h-4" />
                    Download Note Attachment
                  </button>

                  <button
                    onClick={() => setReadingNote(null)}
                    className="inline-flex items-center text-xs font-bold text-slate-500 hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 transition"
                  >
                    Close Reader
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
