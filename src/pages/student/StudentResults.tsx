import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../../lib/api';
import { calculateGrade, cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export default function StudentResults() {
  const [term, setTerm] = useState('Term 1');
  const [session, setSession] = useState('2026/2027');

  const { data: results, isLoading } = useQuery({
    queryKey: ['student_results', term, session],
    queryFn: () => apiCall(`/student/results?term=${encodeURIComponent(term)}&session=${encodeURIComponent(session)}`)
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 shadow rounded-lg border border-gray-100 flex gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Term</label>
          <select value={term} onChange={e => setTerm(e.target.value)} className="border-gray-300 rounded-md text-sm border px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500">
            <option>Term 1</option>
            <option>Term 2</option>
            <option>Term 3</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Session</label>
          <select value={session} onChange={e => setSession(e.target.value)} className="border-gray-300 rounded-md text-sm border px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500">
            <option>2025/2026</option>
            <option>2026/2027</option>
            <option>2027/2028</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Academic Results</h3>
          <p className="mt-1 text-sm text-gray-500">Detailed breakdown of your performance by subject.</p>
        </div>
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Test (/40)</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Exam (/60)</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total (/100)</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!results || results.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500 text-sm">No results published for this term yet.</td></tr>
                ) : results.map((res: any) => {
                   const grade = calculateGrade(res.total_score);
                   return (
                     <tr key={res.id}>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{res.subject?.name || 'Unknown'}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{res.test_score}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{res.exam_score}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">{res.total_score}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-right">
                         <span className={cn(
                           "px-2.5 py-1 rounded-md text-xs font-bold capitalize tabular-nums flex items-center justify-center min-w-[32px] ml-auto w-fit",
                           grade === 'A' ? "bg-emerald-100 text-emerald-800" :
                           grade === 'B' ? "bg-blue-100 text-blue-800" :
                           grade === 'C' ? "bg-yellow-100 text-yellow-800" :
                           grade === 'D' ? "bg-orange-100 text-orange-800" :
                           grade === 'E' ? "bg-red-50 text-red-600 border border-red-200" :
                           "bg-red-100 text-red-800"
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
  );
}
