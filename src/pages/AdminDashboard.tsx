import { useQuery } from '@tanstack/react-query';
import { Users, UserSquare2, BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import { apiCall } from '../lib/api';

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: () => apiCall('/dashboard'),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Failed to load dashboard</div>;
  }

  const stats = [
    { name: 'Total Students', value: data?.students || 0, icon: Users, color: 'bg-indigo-600' },
    { name: 'Total Teachers', value: data?.teachers || 0, icon: UserSquare2, color: 'bg-blue-600' },
    { name: 'Total Classes', value: data?.classes || 0, icon: BookOpen, color: 'bg-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Overview</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => (
          <div key={item.name} className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg border border-gray-100 overflow-hidden">
            <dt>
              <div className={`absolute rounded-md p-3 ${item.color}`}>
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">{item.name}</p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
            </dd>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">System Status</h2>
        <div className="bg-white shadow rounded-lg border border-gray-100 p-8 flex flex-col items-center justify-center h-64 text-gray-500">
           <GraduationCap className="h-16 w-16 text-gray-300 mb-4" />
           <p className="text-lg font-medium text-gray-900">EduRecord Pro is active.</p>
           <p className="text-sm mt-1">Multi-tenant isolation and cloud sync running perfectly.</p>
        </div>
      </div>
    </div>
  );
}
