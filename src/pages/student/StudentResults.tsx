import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../../lib/api';
import { calculateGrade, cn } from '../../lib/utils';
import { Loader2, TrendingUp, BarChart4, Award, Activity, CalendarDays } from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';

export default function StudentResults() {
  const [term, setTerm] = useState('Term 1');
  const [session, setSession] = useState('2025/2026');
  const [historySubject, setHistorySubject] = useState('all');

  // Fetch results for selected term & session (table view)
  const { data: results, isLoading } = useQuery({
    queryKey: ['student_results', term, session],
    queryFn: () => apiCall(`/student/results?term=${encodeURIComponent(term)}&session=${encodeURIComponent(session)}`)
  });

  // Fetch all results across all semesters for performance trends
  const { data: allResults, isLoading: loadingAll } = useQuery({
    queryKey: ['student_results_all'],
    queryFn: () => apiCall('/student/results') // returns all history!
  });

  // Process data for Recharts chart
  const processHistoryData = () => {
    if (!allResults || allResults.length === 0) return [];

    // Group by term & session combo to get chronological timeline
    // e.g. "Term 1 (2025/2026)", "Term 2 (2025/2026)", etc.
    const chronologicalTerms = [
      { key: 'Term 1_2025/2026', label: 'T1 25/26', term: 'Term 1', session: '2025/2026' },
      { key: 'Term 2_2025/2026', label: 'T2 25/26', term: 'Term 2', session: '2025/2026' },
      { key: 'Term 3_2025/2026', label: 'T3 25/26', term: 'Term 3', session: '2025/2026' },
      { key: 'Term 1_2026/2027', label: 'T1 26/27', term: 'Term 1', session: '2026/2027' },
      { key: 'Term 2_2026/2027', label: 'T2 26/27', term: 'Term 2', session: '2026/2027' },
      { key: 'Term 3_2026/2027', label: 'T3 26/27', term: 'Term 3', session: '2026/2027' },
      { key: 'Term 1_2027/2028', label: 'T1 27/28', term: 'Term 1', session: '2027/2028' },
      { key: 'Term 2_2027/2028', label: 'T2 27/28', term: 'Term 2', session: '2027/2028' },
      { key: 'Term 3_2027/2028', label: 'T3 27/28', term: 'Term 3', session: '2027/2028' },
    ];

    return chronologicalTerms.map(ct => {
      // Find matching results
      const termResults = allResults.filter((r: any) => r.term === ct.term && r.session === ct.session);
      
      if (termResults.length === 0) return null; // skip nodes with no records

      const dataNode: any = { name: ct.label };

      if (historySubject === 'all') {
        // Average score of all subjects for this term
        const sum = termResults.reduce((acc: number, r: any) => acc + r.total_score, 0);
        dataNode.score = Math.round((sum / termResults.length) * 10) / 10;
      } else {
        // Specific subject score
        const subRes = termResults.find((r: any) => r.subject_id === historySubject);
        if (subRes) {
          dataNode.score = subRes.total_score;
          dataNode.test = subRes.test_score;
          dataNode.exam = subRes.exam_score;
        } else {
          return null; // skip if that subject wasn't taken that term
        }
      }

      return dataNode;
    }).filter(Boolean); // Clear empty semesters
  };

  // Get list of unique subjects taken by student to populate history filters
  const getTakenSubjects = () => {
    if (!allResults) return [];
    const seen = new Set();
    const list: any[] = [];
    allResults.forEach((r: any) => {
      if (r.subject && !seen.has(r.subject.id)) {
        seen.add(r.subject.id);
        list.push({ id: r.subject.id, name: r.subject.name });
      }
    });
    return list;
  };

  const chartData = processHistoryData();
  const subjectsList = getTakenSubjects();

  return (
    <div className="space-y-6 font-sans">
      {/* Upper header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Academic Performance Registry
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Query semester class transcripts, inspect scores, and inspect subject level speed metrics.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-lg border border-indigo-100 font-bold text-xs uppercase">
          <Activity className="w-4 h-4 animate-pulse" /> Live Grade Tracker Active
        </div>
      </div>

      {/* Subject Progress History Trend Plot Section (CORE PRODUCT SPEC) */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Progress History per Subject
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Chronological grade growth across consecutive semesters & levels.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">Trace Subject:</span>
            <select
              value={historySubject}
              onChange={(e) => setHistorySubject(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
            >
              <option value="all">Cumulative Semester Average</option>
              {subjectsList.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loadingAll ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <BarChart4 className="w-10 h-10 text-slate-300 mb-2" />
            <span className="text-sm font-bold text-slate-700">Historical trail incomplete</span>
            <span className="text-xs text-slate-500 mt-0.5">Continuous score logs show once multi-term grades are synchronized.</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} stroke="#e2e8f0" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#e2e8f0" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                    labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#1e293b' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    name={historySubject === 'all' ? "Average score (%)" : "Subject Total (%)"}
                    stroke="#4f46e5" 
                    strokeWidth={3} 
                    dot={{ r: 5, strokeWidth: 2, fill: '#ffffff' }}
                    activeDot={{ r: 8 }}
                  />
                  {historySubject !== 'all' && (
                    <>
                      <Line type="monotone" dataKey="test" name="Continuous Assessment (/40)" stroke="#06b6d4" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="exam" name="End-term Exam (/60)" stroke="#10b981" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="3 3" />
                    </>
                  )}
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Table Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Term Selector Side Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 lg:col-span-1">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <CalendarDays className="w-4 h-4 text-indigo-600" />
            Query Parameters
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Calendar Term</label>
              <select 
                value={term} 
                onChange={e => setTerm(e.target.value)} 
                className="w-full border-gray-300 rounded-lg text-sm border px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
              >
                <option value="Term 1">Term 1 (Autumn/Winter)</option>
                <option value="Term 2">Term 2 (Spring Semester)</option>
                <option value="Term 3">Term 3 (Summer Finals)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Academic Session</label>
              <select 
                value={session} 
                onChange={e => setSession(e.target.value)} 
                className="w-full border-gray-300 rounded-lg text-sm border px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
              >
                <option value="2025/2026">2025/2026 Session</option>
                <option value="2026/2027">2026/2027 Session</option>
                <option value="2027/2028">2027/2028 Session</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-500 leading-relaxed font-semibold">
            Grades threshold bounds: <br />
            A (70%+), B (60%+), C (50%+), D (45%+), E (40%+), F (Below 40%).
          </div>
        </div>

        {/* Right detailed table breakdown */}
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden lg:col-span-3">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-base font-bold text-slate-900">Score-Sheet Detailed Breakdown</h3>
              <p className="mt-0.5 text-xs text-slate-400">Class score points matching queried {term} of class {session}.</p>
            </div>
            {!isLoading && results && results.length > 0 && (
              <span className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-full font-bold">
                {results.length} Active Courses
              </span>
            )}
          </div>
          
          {isLoading ? (
            <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/70 text-slate-600">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left font-bold text-xs uppercase tracking-wider">Course / Subject</th>
                    <th scope="col" className="px-6 py-3 text-right font-bold text-xs uppercase tracking-wider">Assessment score (/40)</th>
                    <th scope="col" className="px-6 py-3 text-right font-bold text-xs uppercase tracking-wider">Exam score (/60)</th>
                    <th scope="col" className="px-6 py-3 text-right font-bold text-xs uppercase tracking-wider">Total Final Score (/100)</th>
                    <th scope="col" className="px-6 py-3 text-right font-bold text-xs uppercase tracking-wider">Awarded class Grade</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                  {!results || results.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-semibold text-sm">
                        <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        No results published for {term} ({session}) yet.
                      </td>
                    </tr>
                  ) : results.map((res: any) => {
                     const grade = calculateGrade(res.total_score);
                     return (
                       <tr key={res.id} className="hover:bg-slate-50/20 transition-colors">
                         <td className="px-6 py-4.5 whitespace-nowrap text-sm font-bold text-slate-900">
                            {res.subject?.name || 'Unknown'}
                            <span className="text-xs text-slate-400 block font-normal mt-0.5">{res.subject?.code}</span>
                         </td>
                         <td className="px-6 py-4.5 whitespace-nowrap text-sm text-right text-slate-500 font-medium">{res.test_score}</td>
                         <td className="px-6 py-4.5 whitespace-nowrap text-sm text-right text-slate-500 font-medium">{res.exam_score}</td>
                         <td className="px-6 py-4.5 whitespace-nowrap text-sm text-right font-black text-indigo-900">{res.total_score}</td>
                         <td className="px-6 py-4.5 whitespace-nowrap text-right">
                           <span className={cn(
                             "px-2.5 py-1 rounded-md text-xs font-bold capitalize tabular-nums flex items-center justify-center min-w-[32px] ml-auto w-fit",
                             grade === 'A' ? "bg-emerald-100 text-emerald-800" :
                             grade === 'B' ? "bg-blue-100 text-blue-800" :
                             grade === 'C' ? "bg-yellow-105 text-yellow-800 border border-yellow-200" :
                             grade === 'D' ? "bg-orange-100 text-orange-850" :
                             grade === 'E' ? "bg-amber-100 text-amber-800" :
                             "bg-rose-100 text-rose-800 border border-rose-200"
                           )}>
                             {grade}
                           </span>
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
    </div>
  );
}
