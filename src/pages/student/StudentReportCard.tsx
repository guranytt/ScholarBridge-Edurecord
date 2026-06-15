import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../../lib/api';
import { Loader2, Printer } from 'lucide-react';

export default function StudentReportCard() {
  const [term, setTerm] = useState('Term 1');
  const [session, setSession] = useState('2026/2027');

  const { data: reportCards, isLoading } = useQuery({
    queryKey: ['student_report_cards', term, session],
    queryFn: () => apiCall(`/student/report-cards?term=${encodeURIComponent(term)}&session=${encodeURIComponent(session)}`)
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 shadow rounded-lg border border-gray-100 flex justify-between items-center print:hidden">
        <div className="flex gap-4">
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
        <button onClick={handlePrint} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </button>
      </div>

      <div className="bg-white shadow rounded-xl border border-gray-100 p-8 md:p-12 print:shadow-none print:border-none print:p-0">
        <div className="text-center border-b border-gray-200 pb-8 mb-8">
           <h2 className="text-3xl font-bold uppercase tracking-wider text-gray-900">Official Report Card</h2>
           <p className="text-lg text-gray-600 mt-2">{term} - {session}</p>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : (!reportCards || reportCards.length === 0) ? (
          <div className="py-20 text-center text-gray-500">Report card is not ready for the selected term.</div>
        ) : (
          <div className="space-y-8 max-w-3xl mx-auto">
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
               <div className="border-b border-gray-100 pb-2">
                 <span className="font-medium text-gray-500 block text-xs uppercase">Overall Average</span>
                 <span className="text-2xl font-bold text-gray-900">{reportCards[0].overall_average}%</span>
               </div>
               <div className="border-b border-gray-100 pb-2">
                 <span className="font-medium text-gray-500 block text-xs uppercase">Class Position</span>
                 <span className="text-2xl font-bold text-gray-900">{reportCards[0].class_position ? `#${reportCards[0].class_position}` : 'N/A'}</span>
               </div>
            </div>

            <div>
               <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Teacher Remarks</h4>
               <div className="bg-gray-50 rounded-lg p-6 border border-gray-100 italic text-gray-700 leading-relaxed">
                  "{reportCards[0].ai_comment || 'Satisfactory academic performance.'}"
               </div>
            </div>

            <div className="pt-16 flex justify-between px-8">
               <div className="text-center">
                 <div className="w-48 border-b-2 border-gray-800 mb-2"></div>
                 <span className="text-xs uppercase font-medium text-gray-500">Principal Signature</span>
               </div>
               <div className="text-center">
                 <div className="w-48 border-b-2 border-gray-800 mb-2"></div>
                 <span className="text-xs uppercase font-medium text-gray-500">Date</span>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
