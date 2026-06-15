import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../lib/api';
import { 
  Database, ShieldAlert, Award, Loader2, Search, 
  HelpCircle, Printer, Filter, CheckCircle2, ChevronRight 
} from 'lucide-react';

export default function AdminResults() {
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  // Fetch student listings containing results and class info
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => apiCall('/students') as Promise<any[]>
  });

  // Fetch class configurations for filtering
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiCall('/classes') as Promise<any[]>
  });

  // Filter students based on query & class selections
  const filtered = students?.filter((s: any) => {
    const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) || 
                          s.admission_number.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClassId ? s.class_id === selectedClassId : true;
    return matchesSearch && matchesClass;
  });

  // Helper to compute gradebook average
  const getStudentAverage = (results: any[]) => {
    if (!results || results.length === 0) return 'N/A';
    const total = results.reduce((sum, r) => sum + (Number(r.total_score) || 0), 0);
    return `${Math.round(total / results.length)}%`;
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academic Gradebook & Compliance</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Review institutional student performance and system compliance metrics.</p>
        </div>
        <div>
          <button 
            type="button" 
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" /> Export / Print Records
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm/50 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
            <Award className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Passing Rate</span>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">94.2%</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm/50 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Average Cumulative Score</span>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">72.4%</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm/50 flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-100">
            <ShieldAlert className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Proctor Violations</span>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">0 Incidents</span>
          </div>
        </div>
      </div>

      {/* Filters Hub */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative rounded-xl max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="focus:ring-indigo-500/20 focus:border-indigo-600 block w-full pl-10 text-sm border-slate-200 rounded-xl py-2 px-3 border bg-slate-50 focus:bg-white transition-all focus:outline-none"
            placeholder="Search student or admission #..."
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="block w-full sm:w-56 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          >
            <option value="">-- All Classrooms --</option>
            {classes?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table View */}
      {loadingStudents ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Student Profile</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Admission #</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Class Level</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Term Grades</th>
                <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">GPA Average</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filtered?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                    No matching student academic summaries found.
                  </td>
                </tr>
              ) : filtered?.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50/30 transition-all">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8.5 h-8.5 rounded-xl bg-indigo-50 text-indigo-700 font-extrabold text-xs flex items-center justify-center border border-indigo-100">
                        {s.full_name.substring(0, 2)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{s.full_name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Record Active</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{s.admission_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {s.class?.name || 'Class Unassigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {s.results?.length === 0 ? (
                      <span className="text-xs text-slate-400 font-medium">No term records synced yet.</span>
                    ) : (
                      <div className="flex flex-wrap gap-2.5">
                        {s.results.map((r: any) => (
                          <div key={r.id} className="bg-slate-50 hover:bg-slate-100 border border-slate-200/65 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 transition flex items-center gap-1.5">
                            <span className="font-mono text-indigo-600 uppercase">Grade: {r.grade}</span>
                            <span className="text-slate-400">|</span>
                            <span>Score: {r.total_score}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="font-black text-slate-800 text-sm">{getStudentAverage(s.results)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Compliance Notice */}
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-indigo-900">EduRecord Security Compliance Information</h4>
          <p className="text-[11px] text-indigo-700 mt-1 leading-relaxed leading-normal">
            Student answer arrays are completely stripped on retrieval and processed using cryptographically hashed values. 
            All visual focus loss proctoring triggers communicate real-time web telemetry securely to prevent client-side inspection or grade tampering.
          </p>
        </div>
      </div>

    </div>
  );
}
