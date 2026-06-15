import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../../lib/api';
import { Loader2, User } from 'lucide-react';

export default function StudentProfile() {
  const { data: student, isLoading } = useQuery({
    queryKey: ['student_me'],
    queryFn: () => apiCall('/student/me')
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
        <div className="bg-indigo-600 h-32"></div>
        <div className="px-6 sm:px-8 pb-8">
          <div className="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
            <div className="flex">
              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full ring-4 ring-white bg-gray-100 flex items-center justify-center overflow-hidden bg-white">
                {student?.profile_image_url ? (
                  <img src={student.profile_image_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-gray-400" />
                )}
              </div>
            </div>
            <div className="mt-6 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
              <div className="sm:hidden md:block mt-6 min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-gray-900 truncate">{student?.full_name}</h1>
                <p className="text-gray-500 font-medium">{student?.admission_number}</p>
              </div>
            </div>
          </div>
          
          <div className="hidden sm:block md:hidden mt-6 min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{student?.full_name}</h1>
            <p className="text-gray-500 font-medium">{student?.admission_number}</p>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Class Enrolled</dt>
                <dd className="mt-1 text-sm text-gray-900 font-semibold">{student?.class?.name || 'Unassigned'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Student ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{student?.id}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
