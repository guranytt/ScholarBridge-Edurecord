import { BookOpen } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../store';

export default function StudentDashboard() {
  const { user } = useStore();

  if (user?.role !== 'student') {
    return <Navigate to={`/${user?.role || 'login'}`} replace />;
  }

  return (
    <div className="flex h-64 flex-col items-center justify-center space-y-4">
      <BookOpen className="h-12 w-12 text-indigo-600" />
      <h2 className="text-xl font-bold text-gray-900">Student Portal Offline</h2>
      <p className="text-gray-500">The student view is not available in the current preview module.</p>
    </div>
  );
}
