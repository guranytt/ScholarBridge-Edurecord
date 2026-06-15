import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../lib/api';
import { 
  Plus, Edit3, Trash2, Eye, EyeOff, Clock, User, 
  AlertTriangle, CheckSquare, Save, X, ChevronRight, Loader2, ArrowLeft 
} from 'lucide-react';

interface Question {
  text: string;
  options: string[];
  correctOption: number;
}

interface Test {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  class_id: string;
  subject_id: string;
  is_published: boolean;
  questions_json: string;
  class: { id: string; name: string };
  subject: { id: string; name: string };
  attempts: any[];
}

export default function TeacherTests() {
  const queryClient = useQueryClient();
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [viewingAttemptsTest, setViewingAttemptsTest] = useState<Test | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [targetClass, setTargetClass] = useState('');
  const [targetSubject, setTargetSubject] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    { text: 'Sample Question', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 0 }
  ]);

  // Fetch lists
  const { data: tests, isLoading: loadingTests } = useQuery({
    queryKey: ['tests'],
    queryFn: () => apiCall('/tests') as Promise<Test[]>
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiCall('/classes') as Promise<any[]>
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiCall('/subjects') as Promise<any[]>
  });

  const { data: attempts, isLoading: loadingAttempts } = useQuery({
    queryKey: ['test_attempts', viewingAttemptsTest?.id],
    queryFn: () => apiCall(`/tests/${viewingAttemptsTest?.id}/attempts`) as Promise<any[]>,
    enabled: !!viewingAttemptsTest
  });

  // Sync state keys with fetched defaults
  useEffect(() => {
    if (classes && classes.length > 0 && !targetClass) {
      setTargetClass(classes[0].id);
    }
  }, [classes, targetClass]);

  useEffect(() => {
    if (subjects && subjects.length > 0 && !targetSubject) {
      setTargetSubject(subjects[0].id);
    }
  }, [subjects, targetSubject]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newTest: any) => apiCall('/tests', { method: 'POST', body: JSON.stringify(newTest) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updated: any) => apiCall(`/tests/${updated.id}`, { method: 'PUT', body: JSON.stringify(updated) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiCall(`/tests/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
    }
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDuration(30);
    if (classes && classes.length > 0) setTargetClass(classes[0].id);
    if (subjects && subjects.length > 0) setTargetSubject(subjects[0].id);
    setIsPublished(false);
    setQuestions([{ text: '', options: ['', '', '', ''], correctOption: 0 }]);
    setShowForm(false);
    setIsEditing(false);
    setActiveTestId(null);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (test: Test) => {
    resetForm();
    setActiveTestId(test.id);
    setTitle(test.title);
    setDescription(test.description);
    setDuration(test.duration_minutes);
    setTargetClass(test.class_id);
    setTargetSubject(test.subject_id);
    setIsPublished(test.is_published);
    try {
      setQuestions(JSON.parse(test.questions_json));
    } catch (e) {
      setQuestions([{ text: '', options: ['', '', '', ''], correctOption: 0 }]);
    }
    setIsEditing(true);
    setShowForm(true);
  };

  // Add/remove/edit questions
  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: '', options: ['', '', '', ''], correctOption: 0 }
    ]);
  };

  const removeQuestion = (qIndex: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== qIndex));
  };

  const updateQuestionText = (qIndex: number, text: string) => {
    setQuestions(
      questions.map((q, idx) => (idx === qIndex ? { ...q, text } : q))
    );
  };

  const updateOptionText = (qIndex: number, oIndex: number, optText: string) => {
    setQuestions(
      questions.map((q, idx) => {
        if (idx !== qIndex) return q;
        const opts = [...q.options];
        opts[oIndex] = optText;
        return { ...q, options: opts };
      })
    );
  };

  const updateCorrectOption = (qIndex: number, correctIdx: number) => {
    setQuestions(
      questions.map((q, idx) => (idx === qIndex ? { ...q, correctOption: correctIdx } : q))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const payload = {
      id: activeTestId,
      title,
      description,
      duration_minutes: duration,
      class_id: targetClass || (classes && classes[0]?.id),
      subject_id: targetSubject || (subjects && subjects[0]?.id),
      is_published: isPublished,
      questions
    };

    if (isEditing && activeTestId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (loadingTests) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!showForm && !viewingAttemptsTest && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Classroom Tests</h1>
              <p className="mt-1 text-sm text-gray-500">Create tests, set timers, and track focus compliance in real time.</p>
            </div>
            <button
              onClick={startCreate}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="-ml-1 mr-2 h-4 w-4" />
              New Test
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {tests?.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-md font-semibold text-gray-700">No Tests Created Yet</h3>
                <p className="text-sm text-gray-500 mt-1">Start by creating your first timed classroom assessment.</p>
                <button
                  onClick={startCreate}
                  className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                >
                  Create Test
                </button>
              </div>
            ) : (
              tests?.map((test) => (
                <div key={test.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium inline-block mb-2">
                          {test.subject?.name || 'Unknown Subject'}
                        </span>
                        <h2 className="text-lg font-bold text-gray-900">{test.title}</h2>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{test.description || 'No description provided.'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {test.is_published ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-md bg-green-50 text-green-700 border border-green-100">
                            <Eye className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-md bg-gray-50 text-gray-600 border border-gray-200">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Draft
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-4 mt-4 text-xs font-medium text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        {test.duration_minutes} min
                      </div>
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        Class: {test.class?.name}
                      </div>
                      <div className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-gray-400 mr-1" />
                        {test.attempts?.length || 0} Attempts
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-3 flex justify-between gap-2">
                    <button
                      onClick={() => setViewingAttemptsTest(test)}
                      className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View Submissions
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={() => startEdit(test)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                        title="Edit Test"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this test and all its answers/attempts? This cannot be undone.')) {
                            deleteMutation.mutate(test.id);
                          }
                        }}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Delete Test"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Viewing Submissions Tab */}
      {viewingAttemptsTest && (
        <div className="space-y-6">
          <button
            onClick={() => setViewingAttemptsTest(null)}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Tests
          </button>

          <div className="bg-white shadow rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{viewingAttemptsTest.title} - Submissions</h2>
              <p className="text-sm text-gray-500 mt-1">
                Real-time Focus Monitoring Log. Flags students who clicked away, minimized, or opened tabs during timed sessions.
              </p>
            </div>

            {loadingAttempts ? (
              <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : !attempts || attempts.length === 0 ? (
              <div className="py-12 text-center text-gray-400 font-medium">No students have attempted this test yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Admission #</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Score</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Tab Violations</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Start Time</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">System Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-sm">
                    {attempts.map((attempt: any) => {
                      const cheats = attempt.tab_focus_violations >= 3;
                      const hasOngoing = attempt.status === 'ongoing';
                      
                      return (
                        <tr key={attempt.id} className={cheats ? 'bg-red-50/20' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{attempt.student?.full_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">{attempt.student?.admission_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-gray-900">
                            {hasOngoing ? '--' : `${attempt.score}%`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              attempt.tab_focus_violations === 0 ? 'bg-green-50 text-green-700' :
                              attempt.tab_focus_violations < 3 ? 'bg-yellow-50 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {attempt.tab_focus_violations > 0 && <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
                              {attempt.tab_focus_violations} violations
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {new Date(attempt.started_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {hasOngoing ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded bg-amber-50 text-amber-600 border border-amber-100">Ongoing</span>
                            ) : attempt.status === 'flagged_cheating' ? (
                              <span className="px-2 py-1 text-xs font-bold rounded bg-red-100 text-red-700 border border-red-200 shadow-sm uppercase tracking-wider">CHEMISTRY FLAGGED (CHEATED)</span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded bg-green-50 text-green-700 border border-green-100">Clean Submit</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form modal/tab */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">
              {isEditing ? 'Edit timed assessment' : 'Build timed assessment'}
            </h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-gray-500">Test Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Mathematics Term 1 Mini-Test"
                  className="w-full border-gray-200 border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-gray-500">Time Limit (minutes)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full border-gray-200 border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold uppercase text-gray-500">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief guidance for the student during the test (e.g. Topics covered, rules against switching tabs)"
                  rows={2}
                  className="w-full border-gray-200 border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-gray-500">Target Class</label>
                <select
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  className="w-full border-gray-200 border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  {classes?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-gray-500">Target Subject</label>
                <select
                  value={targetSubject}
                  onChange={(e) => setTargetSubject(e.target.value)}
                  className="w-full border-gray-200 border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                >
                  {subjects?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 py-2.5 px-4 rounded-lg inline-flex">
              <input
                id="publish-toggle"
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="publish-toggle" className="text-sm font-semibold text-gray-700 cursor-pointer">
                Publish test immediately for student access
              </label>
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-bold text-gray-900 uppercase tracking-wide">Test Question Set</h3>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Question
                </button>
              </div>

              {questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-gray-50/50 rounded-xl border border-gray-100 p-5 space-y-4 relative">
                  <div className="flex justify-between items-center mr-8">
                    <span className="text-xs font-bold text-gray-500 uppercase">Question {qIndex + 1}</span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    value={q.text}
                    onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                    placeholder="Type question content here..."
                    className="w-full border-gray-200 border bg-white rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {q.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={q.correctOption === oIndex}
                          onChange={() => updateCorrectOption(qIndex, oIndex)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          required
                          value={option}
                          onChange={(e) => updateOptionText(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                          className="flex-1 text-xs border-gray-200 border bg-white rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 italic flex items-center">
                    <CheckSquare className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                    Correct answer is selected by checking the corresponding radio button on the left of each option input.
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-5 py-2 text-sm font-bold border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Save Test
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
