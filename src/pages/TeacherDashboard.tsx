import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../lib/api';
import { calculateGrade, cn } from '../lib/utils';
import { Save, Edit2, CheckCircle2, Loader2, AlertCircle, PlayCircle } from 'lucide-react';

export default function TeacherDashboard() {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('Term 1');
  const [selectedSession, setSelectedSession] = useState<string>('2026/2027');
  
  const [isEditing, setIsEditing] = useState(false);
  const [draftScores, setDraftScores] = useState<Record<string, { ca: number; exam: number }>>({});
  const [bulkTestScore, setBulkTestScore] = useState<string>('');
  const [bulkExamScore, setBulkExamScore] = useState<string>('');
  
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: classes, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiCall('/classes')
  });

  const { data: subjects, isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiCall('/subjects')
  });

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => apiCall('/students')
  });

  const saveMutation = useMutation({
    mutationFn: (results: any[]) => apiCall('/results', { method: 'POST', body: JSON.stringify({ results, term: selectedTerm, session: selectedSession }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    }
  });

  // Ensure first selection
  if (classes && classes.length > 0 && !selectedClassId) setSelectedClassId(classes[0].id);
  if (subjects && subjects.length > 0 && !selectedSubjectId) setSelectedSubjectId(subjects[0].id);

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter((s: any) => s.class_id === selectedClassId);
  }, [students, selectedClassId]);

  const hasInvalidScore = useMemo(() => {
    return Object.values(draftScores).some(s => s.ca > 40 || s.ca < 0 || s.exam > 60 || s.exam < 0 || (s.ca + s.exam) > 100);
  }, [draftScores]);

  const handleEditClick = () => {
    const draft: Record<string, { ca: number; exam: number }> = {};
    filteredStudents.forEach((stu: any) => {
       const res = stu.results?.find((r: any) => r.subject_id === selectedSubjectId && r.term === selectedTerm && r.session === selectedSession);
       draft[stu.id] = { ca: res?.test_score || 0, exam: res?.exam_score || 0 };
    });
    setDraftScores(draft);
    setIsEditing(true);
  };

  const currentSubjectObj = subjects?.find((s: any) => s.id === selectedSubjectId);

  const handleSave = async (silent = false) => {
    const payload = Object.keys(draftScores).map(studentId => ({
       student_id: studentId,
       subject_id: selectedSubjectId,
       test_score: draftScores[studentId].ca,
       exam_score: draftScores[studentId].exam
    }));
    await saveMutation.mutateAsync(payload);
    if (!silent) {
       setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing) {
      autoSaveTimerRef.current = setInterval(() => {
        handleSave(true);
      }, 10000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [isEditing, draftScores, selectedSubjectId, selectedTerm, selectedSession]); // rebind if dependencies change

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number, type: 'ca' | 'exam') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      let nextId = '';
      if (type === 'ca') {
         nextId = `input-exam-${currentIndex}`;
      } else {
         nextId = `input-ca-${currentIndex + 1}`;
      }
      const nextInput = document.getElementById(nextId);
      if (nextInput) {
        nextInput.focus();
        (nextInput as HTMLInputElement).select();
      }
    }
  };

  const applyBulkTest = () => {
    const val = parseInt(bulkTestScore);
    if (isNaN(val)) return;
    const boundedVal = Math.min(40, Math.max(0, val));
    setDraftScores(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { next[k] = { ...next[k], ca: boundedVal }; });
      return next;
    });
    setBulkTestScore('');
  };

  const applyBulkExam = () => {
    const val = parseInt(bulkExamScore);
    if (isNaN(val)) return;
    const boundedVal = Math.min(60, Math.max(0, val));
    setDraftScores(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { next[k] = { ...next[k], exam: boundedVal }; });
      return next;
    });
    setBulkExamScore('');
  };

  if (loadingClasses || loadingSubjects || loadingStudents) {
     return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Grade Entry Workspace</h1>
          <p className="mt-1 text-sm text-gray-500">Fast and reliable entry for {currentSubjectObj?.name || 'Selected Subject'}.</p>
        </div>
        <div className="flex items-center gap-2">
          {saveMutation.isSuccess && !isEditing && (
            <span className="text-green-600 text-sm font-medium flex items-center bg-green-50 px-3 py-1 rounded-full">
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Saved successfully
            </span>
          )}
          {isEditing ? (
            <button
               onClick={() => handleSave()}
               disabled={saveMutation.isPending || hasInvalidScore}
               className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {saveMutation.isPending ? <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" /> : <Save className="-ml-1 mr-2 h-4 w-4" />}
              Submit Grades
            </button>
          ) : (
             <button
               onClick={handleEditClick}
               className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Edit2 className="-ml-1 mr-2 h-4 w-4 text-gray-400" />
              Bulk Edit
            </button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="bg-indigo-50 rounded-lg border border-indigo-100 p-4 sm:p-5 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="text-sm font-medium text-indigo-900">Bulk Actions</div>
             <div className="flex items-center gap-2">
                 <input 
                   type="number" 
                   value={bulkTestScore} 
                   onChange={(e) => setBulkTestScore(e.target.value)}
                   max="40" min="0" placeholder="Test / 40" 
                   className="w-24 px-2 py-1.5 text-sm border border-indigo-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                 />
                 <button onClick={applyBulkTest} className="text-xs font-medium bg-white text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-md hover:bg-indigo-100">Set All Tests</button>
             </div>
             <div className="flex items-center gap-2">
                 <input 
                   type="number" 
                   value={bulkExamScore} 
                   onChange={(e) => setBulkExamScore(e.target.value)}
                   max="60" min="0" placeholder="Exam / 60" 
                   className="w-24 px-2 py-1.5 text-sm border border-indigo-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                 />
                 <button onClick={applyBulkExam} className="text-xs font-medium bg-white text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-md hover:bg-indigo-100">Set All Exams</button>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow pointer-events-auto rounded-lg border border-gray-100 p-4 sm:p-5 flex flex-wrap gap-4 items-center sticky top-0 z-10">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Target Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={isEditing}
            className="block w-40 pl-3 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md border disabled:bg-gray-50"
          >
            {classes?.map((c: any) => (
               <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Target Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={isEditing}
            className="block w-40 pl-3 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md border disabled:bg-gray-50"
          >
            {subjects?.map((s: any) => (
               <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Term</label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            disabled={isEditing}
            className="block w-32 pl-3 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md border disabled:bg-gray-50"
          >
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Session</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            disabled={isEditing}
            className="block w-32 pl-3 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md border disabled:bg-gray-50"
          >
            <option value="2025/2026">2025/2026</option>
            <option value="2026/2027">2026/2027</option>
            <option value="2027/2028">2027/2028</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-100">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{currentSubjectObj?.name} Master List</h3>
          <p className="mt-1 text-sm text-gray-500">Auto-grading is powered by the EduRecord calculation engine.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission #</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Test (40)</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Exam (60)</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                      <AlertCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      No students allocated to this class block.
                   </td>
                </tr>
              ) : filteredStudents.map((stu: any, index: number) => {
                const res = stu.results?.find((r: any) => r.subject_id === selectedSubjectId && r.term === selectedTerm && r.session === selectedSession);
                const score = isEditing ? (draftScores[stu.id] || { ca: 0, exam: 0 }) : { ca: res?.test_score || 0, exam: res?.exam_score || 0 };
                const total = (score.ca || 0) + (score.exam || 0);
                const grade = calculateGrade(total);
                
                const isCaInvalid = score.ca > 40 || score.ca < 0;
                const isExamInvalid = score.exam > 60 || score.exam < 0;
                
                return (
                  <tr key={stu.id} className={isEditing ? 'bg-indigo-50/20' : 'hover:bg-gray-50/40 transition-colors'}>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{stu.full_name}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{stu.admission_number}</td>
                    
                    <td className="px-6 py-3 whitespace-nowrap text-right">
                      {isEditing ? (
                        <input 
                          id={`input-ca-${index}`}
                          type="number"
                          min="0"
                          max="40"
                          value={score.ca === 0 && !draftScores[stu.id] ? '' : score.ca}
                          className={cn("w-20 text-right px-2 py-1.5 border rounded-md focus:ring-2 focus:outline-none transition-shadow", isCaInvalid ? "border-red-500 focus:ring-red-500 bg-red-50 text-red-900" : "border-indigo-200 focus:ring-indigo-500 focus:border-indigo-500")}
                          placeholder="-"
                          onKeyDown={(e) => handleKeyDown(e, index, 'ca')}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                            setDraftScores(prev => ({ ...prev, [stu.id]: { ...prev[stu.id], ca: isNaN(val) ? 0 : val } }));
                          }}
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">{score.ca || '-'}</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-3 whitespace-nowrap text-right">
                      {isEditing ? (
                        <input 
                          id={`input-exam-${index}`}
                          type="number"
                          min="0"
                          max="60"
                          value={score.exam === 0 && !draftScores[stu.id] ? '' : score.exam}
                          className={cn("w-20 text-right px-2 py-1.5 border rounded-md focus:ring-2 focus:outline-none transition-shadow", isExamInvalid ? "border-red-500 focus:ring-red-500 bg-red-50 text-red-900" : "border-indigo-200 focus:ring-indigo-500 focus:border-indigo-500")}
                          placeholder="-"
                          onKeyDown={(e) => handleKeyDown(e, index, 'exam')}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                            setDraftScores(prev => ({ ...prev, [stu.id]: { ...prev[stu.id], exam: isNaN(val) ? 0 : val } }));
                          }}
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">{score.exam || '-'}</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                      {total > 0 ? total : '-'}
                    </td>
                    
                    <td className="px-6 py-3 whitespace-nowrap text-right flex justify-end">
                       <span className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-bold capitalize tabular-nums flex items-center justify-center min-w-[32px]",
                        grade === 'A' ? "bg-emerald-100 text-emerald-800" :
                        grade === 'B' ? "bg-blue-100 text-blue-800" :
                        grade === 'C' ? "bg-yellow-100 text-yellow-800" :
                        grade === 'D' ? "bg-orange-100 text-orange-800" :
                        grade === 'E' ? "bg-red-50 text-red-600" :
                        "bg-red-100 text-red-800"
                      )}>
                        {total > 0 ? grade : '-'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
