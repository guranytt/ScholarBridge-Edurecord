import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../lib/api';
import { Loader2, Plus, Trash2, Search } from 'lucide-react';

export default function AdminStudents() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Forms
  const [fullName, setFullName] = useState('');
  const [admissionNum, setAdmissionNum] = useState('');
  const [classId, setClassId] = useState('');

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => apiCall('/students')
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiCall('/classes')
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiCall('/students', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
      setIsAdding(false);
      setFullName('');
      setAdmissionNum('');
      setClassId('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiCall(`/students/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    }
  });

  const filteredStudents = students?.filter((s: any) => 
    s.full_name.toLowerCase().includes(search.toLowerCase()) || 
    s.admission_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Student Directory</h1>
          <p className="mt-1 text-sm text-gray-500">Manage student enrollment and records.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition"
        >
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          {isAdding ? "Cancel" : "Add Student"}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white shadow rounded-lg border border-gray-100 p-5">
           <h3 className="text-lg font-medium text-gray-900 mb-4">Enroll New Student</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
               <input 
                 autoFocus
                 type="text" 
                 value={fullName}
                 onChange={e => setFullName(e.target.value)}
                 className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                 placeholder="e.g. John Doe" 
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Admission Number</label>
               <input 
                 type="text" 
                 value={admissionNum}
                 onChange={e => setAdmissionNum(e.target.value)}
                 className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                 placeholder="e.g. ADM2026101" 
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Class Assignment</label>
               <select
                 value={classId}
                 onChange={e => setClassId(e.target.value)}
                 className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
               >
                 <option value="" disabled>Select Class</option>
                 {classes?.map((c: any) => (
                   <option key={c.id} value={c.id}>{c.name}</option>
                 ))}
               </select>
             </div>
           </div>
           
           {addMutation.isError && (
             <div className="mt-3 text-red-600 text-sm">
                {(addMutation.error as Error).message}
             </div>
           )}

           <div className="mt-4 flex justify-end">
             <button
                onClick={() => addMutation.mutate({ full_name: fullName, admission_number: admissionNum, class_id: classId })}
                disabled={addMutation.isPending || !fullName || !admissionNum || !classId}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50"
             >
               {addMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
               Save Core Profile
             </button>
           </div>
        </div>
      )}

      {loadingStudents ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="relative rounded-md shadow-sm max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                placeholder="Search students..."
              />
            </div>
            <span className="text-sm text-gray-500">{filteredStudents?.length} total records</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission #</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Level</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                      No students found matching your search.
                    </td>
                  </tr>
                ) : filteredStudents?.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase mr-3">
                           {s.full_name.substring(0, 2)}
                        </div>
                        <div className="text-sm font-medium text-gray-900">{s.full_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {s.admission_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {s.class?.name || 'Class Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                         onClick={() => {
                           if(window.confirm(`Are you sure you want to completely remove ${s.full_name}? This action deletes all grades and records.`)) {
                             deleteMutation.mutate(s.id);
                           }
                         }}
                         disabled={deleteMutation.isPending && deleteMutation.variables === s.id}
                         className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 disabled:opacity-50"
                      >
                         <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
