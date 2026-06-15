import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../../lib/api';
import { 
  ClipboardList, Clock, CheckCircle2, AlertTriangle, 
  HelpCircle, ArrowRight, Loader2, PlayCircle, ShieldAlert 
} from 'lucide-react';

interface Attempt {
  id: string;
  test_id: string;
  student_id: string;
  score: number | null;
  status: string; // ongoing, submitted, flagged_cheating
  tab_focus_violations: number;
  started_at: string;
}

interface Test {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  subject: { name: string };
  attempts: Attempt[];
}

export default function StudentTests() {
  const queryClient = useQueryClient();
  const [activeTest, setActiveTest] = useState<any | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<Attempt | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [violationAlert, setViolationAlert] = useState<string | null>(null);
  const [submittingTest, setSubmittingTest] = useState(false);

  // Use refs for tracking current state inside event listeners to avoid stale values
  const attemptIdRef = useRef<string | null>(null);
  const activeTestIdRef = useRef<string | null>(null);
  const isTransitioningRef = useRef<boolean>(false);

  // Fetch published tests for student
  const { data: tests, isLoading } = useQuery<Test[]>({
    queryKey: ['student_tests'],
    queryFn: () => apiCall('/student/tests')
  });

  // Start test mutation
  const startMutation = useMutation({
    mutationFn: (testId: string) => apiCall(`/student/tests/${testId}/start`, { method: 'POST' }),
    onSuccess: (data: any) => {
      setActiveTest(data.test);
      setActiveAttempt(data.attempt);
      attemptIdRef.current = data.attempt.id;
      activeTestIdRef.current = data.test.id;
      setSelectedAnswers({});

      // Set up remaining duration based on start time
      const startTime = new Date(data.attempt.started_at).getTime();
      const limitMs = data.test.duration_minutes * 60 * 1000;
      const elapsedMs = Date.now() - startTime;
      const remainingSecs = Math.max(0, Math.floor((limitMs - elapsedMs) / 1000));
      setTimeRemaining(remainingSecs);
      isTransitioningRef.current = false;
    }
  });

  // Report tab violation immediately to server database
  const violateMutation = useMutation({
    mutationFn: (attemptId: string) => apiCall(`/student/tests/attempts/${attemptId}/violate`, { method: 'POST' }),
    onSuccess: (data: any) => {
      if (activeAttempt) {
        setActiveAttempt(prev => prev ? { ...prev, tab_focus_violations: data.violations } : null);
      }
      // Re-trigger visual alert for immediate registration
      setViolationAlert(`⚠️ PROCTOR ALERT: Window unfocused or minimized! This violation has been registered immediately. (${data.violations} warning(s))`);
    }
  });

  // Submit test mutation
  const submitMutation = useMutation({
    mutationFn: ({ attemptId, answers }: { attemptId: string; answers: any }) => 
      apiCall(`/student/tests/attempts/${attemptId}/submit`, { 
        method: 'POST', 
        body: JSON.stringify({ answers }) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student_tests'] });
      setActiveTest(null);
      setActiveAttempt(null);
      attemptIdRef.current = null;
      activeTestIdRef.current = null;
      setSubmittingTest(false);
    }
  });

  const handleStartTest = (testId: string) => {
    if (window.confirm("IMPORTANT PROCTOR WARNING: Once this timed test starts, you cannot minimize this window, open other tabs, or click outside the page. Doing so will immediately register a security violation with your teacher.\n\nAre you ready to begin?")) {
      isTransitioningRef.current = true;
      startMutation.mutate(testId);
    }
  };

  // Immediate detection & server sync on minimization/change of focus
  useEffect(() => {
    const handleInactivityAndOffscreen = () => {
      // Check if there is an active assessment and we're not undergoing submission
      if (!attemptIdRef.current || isTransitioningRef.current) return;

      const isHidden = document.hidden;
      const isWindowUnfocused = !document.hasFocus();

      if (isHidden || isWindowUnfocused) {
        const id = attemptIdRef.current;
        violateMutation.mutate(id);
      }
    };

    // Bind immediate event listeners
    window.addEventListener('blur', handleInactivityAndOffscreen);
    document.addEventListener('visibilitychange', handleInactivityAndOffscreen);

    return () => {
      window.removeEventListener('blur', handleInactivityAndOffscreen);
      document.removeEventListener('visibilitychange', handleInactivityAndOffscreen);
    };
  }, []);

  // Time Countdown handling
  useEffect(() => {
    if (!activeTest || timeRemaining <= 0) {
      if (activeTest && timeRemaining === 0 && !submittingTest) {
        // Auto-submit on time limits
        handleAutoSubmit();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTest, timeRemaining]);

  const handleSelectOption = (qIndex: number, oIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: oIndex }));
  };

  const handleAutoSubmit = () => {
    if (submittingTest || !attemptIdRef.current) return;
    setSubmittingTest(true);
    isTransitioningRef.current = true;
    submitMutation.mutate({ 
      attemptId: attemptIdRef.current, 
      answers: selectedAnswers 
    });
    alert("Time has expired! Your answers have been submitted automatically.");
  };

  const handleManualSubmit = () => {
    if (!attemptIdRef.current) return;
    
    const unselected = activeTest.questions.length - Object.keys(selectedAnswers).length;
    let message = "Are you sure you want to finish and submit your test?";
    if (unselected > 0) {
      message = `You have ${unselected} unanswered questions. Are you sure you want to finish and submit your test?`;
    }

    if (window.confirm(message)) {
      setSubmittingTest(true);
      isTransitioningRef.current = true;
      submitMutation.mutate({ 
        attemptId: attemptIdRef.current, 
        answers: selectedAnswers 
      });
    }
  };

  const formatTime = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Active testing portal layout
  if (activeTest && activeAttempt) {
    const warningCount = activeAttempt.tab_focus_violations;
    const isCriticalCheating = warningCount >= 3;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Anti-cheat banner */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="text-sm">
            <span className="font-bold text-red-800 uppercase">Live Proctor Active</span>: Clicking off, changing tabs, or resizing/minimizing the window registers immediately on the master grade log. Keep your cursor inside the browser center.
          </div>
        </div>

        {/* Focus Loss Warning Banner */}
        {violationAlert && (
          <div className="bg-amber-100 border-2 border-amber-400 p-4 rounded-xl flex items-center justify-between animate-bounce">
            <span className="text-sm font-bold text-amber-900">{violationAlert}</span>
            <button 
              onClick={() => setViolationAlert(null)} 
              className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 px-2 py-1.5 rounded-md font-bold"
            >
              Acknowledge
            </button>
          </div>
        )}

        {/* Test title & Sticky Timer Controls */}
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{activeTest.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{activeTest.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${
              timeRemaining < 60 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-indigo-50 text-indigo-700'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="tabular-nums text-lg">{formatTime(timeRemaining)}</span>
            </div>
            <div className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase ${
              isCriticalCheating ? 'bg-red-100 text-red-700 font-extrabold animate-pulse' : 'bg-gray-100 text-gray-700'
            }`}>
              Warnings: {warningCount} / 3 Max
            </div>
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-6">
          {activeTest.questions.map((q: any, qIdx: number) => {
            const isAnswered = selectedAnswers[qIdx] !== undefined;
            return (
              <div key={qIdx} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
                <div className="flex justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Question {qIdx + 1} of {activeTest.questions.length}</span>
                  {isAnswered ? (
                    <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded inline-block">Answer Selected</span>
                  ) : (
                    <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded inline-block">Not Answered Yet</span>
                  )}
                </div>
                <h3 className="text-md font-semibold text-gray-900">{q.text}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {q.options.map((option: string, oIdx: number) => {
                    const isSelected = selectedAnswers[qIdx] === oIdx;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(qIdx, oIdx)}
                        className={`text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 ${
                          isSelected 
                            ? 'bg-indigo-50/70 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20'
                            : 'bg-white border-gray-100 hover:border-gray-200 text-gray-700 hover:bg-gray-50/50'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                          isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Controls footer */}
        <div className="flex justify-end p-4">
          <button
            onClick={handleManualSubmit}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-lg text-base font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Finish & Submit Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Interactive Tests Portal</h1>
        <p className="mt-1 text-sm text-gray-500">Take scheduled examinations and view details of finished online assessments.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tests?.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500 shadow-sm">
            <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <h3 className="font-semibold text-gray-700 text-md">No Tests Available</h3>
            <p className="text-sm text-gray-400 mt-1">Assignments assigned by your course teachers will appear here.</p>
          </div>
        ) : (
          tests?.map((test) => {
            const lastAttempt = test.attempts?.[0];
            const isCompleted = lastAttempt && lastAttempt.status !== 'ongoing';
            const isOngoing = lastAttempt && lastAttempt.status === 'ongoing';
            const wasFlagged = lastAttempt && lastAttempt.status === 'flagged_cheating';

            return (
              <div key={test.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {test.subject?.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {test.duration_minutes} min
                    </div>
                  </div>

                  <h3 className="text-md font-bold text-gray-900 line-clamp-1">{test.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{test.description || 'No instruction details specified.'}</p>

                  {isCompleted && (
                    <div className="border-t border-gray-50 pt-3 mt-3 flex items-center justify-between">
                      <div>
                        <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Result Score</span>
                        <span className="text-lg font-extrabold text-indigo-600">{lastAttempt.score}%</span>
                      </div>
                      <div>
                        {wasFlagged ? (
                          <span className="inline-flex items-center text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 shadow-sm uppercase">
                            FLAGGED CHEATING
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">
                            COMPLETED
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex justify-end">
                  {isCompleted ? (
                    <button 
                      disabled
                      className="inline-flex items-center text-xs font-semibold text-gray-400 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg"
                    >
                      Attempt Locked
                    </button>
                  ) : isOngoing ? (
                    <button
                      onClick={() => handleStartTest(test.id)}
                      className="inline-flex items-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      <PlayCircle className="w-3.5 h-3.5 mr-1" />
                      Resume Test
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartTest(test.id)}
                      className="inline-flex items-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5 mr-1" />
                      Start Test
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
