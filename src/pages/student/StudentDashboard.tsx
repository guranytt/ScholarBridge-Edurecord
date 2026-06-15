import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../../lib/api';
import { Loader2, Award, TrendingUp, BookOpen, Star } from 'lucide-react';
import { calculateGrade } from '../../lib/utils';

export default function StudentDashboard() {
  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ['student_me'],
    queryFn: () => apiCall('/student/me')
  });

  const term = 'Term 1';
  const session = '2026/2027';

  const { data: reportCards } = useQuery({
    queryKey: ['student_report_cards', term, session],
    queryFn: () => apiCall(`/student/report-cards?term=${encodeURIComponent(term)}&session=${encodeURIComponent(session)}`)
  });

  const currentTermResults = student?.results?.filter((r: any) => r.term === term && r.session === session) || [];
  const averageScore = currentTermResults.length > 0 
    ? currentTermResults.reduce((acc: number, r: any) => acc + r.total_score, 0) / currentTermResults.length 
    : 0;

  if (loadingStudent) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg border border-gray-100 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {student?.full_name}!</h1>
        <p className="text-gray-500 mt-1">Here's your academic overview for the current term.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 shadow rounded-lg border border-gray-100 flex items-center">
          <BookOpen className="w-10 h-10 text-indigo-500 bg-indigo-50 p-2 rounded-lg" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Current Class</p>
            <p className="text-xl font-bold text-gray-900">{student?.class?.name || 'N/A'}</p>
          </div>
        </div>

        <div className="bg-white p-6 shadow rounded-lg border border-gray-100 flex items-center">
          <Star className="w-10 h-10 text-yellow-500 bg-yellow-50 p-2 rounded-lg" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Performance Status</p>
            <p className="text-xl font-bold text-gray-900">Good</p>
          </div>
        </div>

        <div className="bg-white p-6 shadow rounded-lg border border-gray-100 flex items-center">
          <TrendingUp className="w-10 h-10 text-emerald-500 bg-emerald-50 p-2 rounded-lg" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Average Score</p>
            <p className="text-xl font-bold text-gray-900">{currentTermResults.length > 0 ? `${averageScore.toFixed(1)}%` : '--%'}</p>
          </div>
        </div>

        <div className="bg-white p-6 shadow rounded-lg border border-gray-100 flex items-center">
          <Award className="w-10 h-10 text-blue-500 bg-blue-50 p-2 rounded-lg" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Class Position</p>
            <p className="text-xl font-bold text-gray-900">{reportCards?.[0]?.class_position || '--'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
