import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../lib/api';
import { 
  Settings, ShieldAlert, History, Key, Check, Loader2, Save,
  Database, UserCheck, CheckCircle2, Sliders, Calendar, Play
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [logSearch, setLogSearch] = useState('');

  // Local settings form state
  const [currentTerm, setCurrentTerm] = useState('Term 1');
  const [currentSession, setCurrentSession] = useState('2025/2026');
  const [allowTeachersEdit, setAllowTeachersEdit] = useState(true);
  const [allowStudentsView, setAllowStudentsView] = useState(true);
  const [strictProctoring, setStrictProctoring] = useState(true);

  // Fetch current settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['academic_settings'],
    queryFn: async () => {
      const data = await apiCall('/academic/settings');
      if (data) {
        setCurrentTerm(data.currentTerm || 'Term 1');
        setCurrentSession(data.currentSession || '2025/2026');
        setAllowTeachersEdit(data.allow_teachers_edit !== false);
        setAllowStudentsView(data.allow_students_view !== false);
        setStrictProctoring(data.strict_proctoring !== false);
      }
      return data;
    }
  });

  // Fetch audit logs
  const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['audit_logs'],
    queryFn: () => apiCall('/audit-logs')
  });

  const saveMutation = useMutation({
    mutationFn: (newSettings: any) => apiCall('/academic/settings', {
      method: 'POST',
      body: JSON.stringify(newSettings)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic_settings'] });
      queryClient.invalidateQueries({ queryKey: ['audit_logs'] });
      setSuccessMsg('System settings successfully updated & logged audit trail.');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Server error updating rules.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      currentTerm,
      currentSession,
      allow_teachers_edit: allowTeachersEdit,
      allow_students_view: allowStudentsView,
      strict_proctoring: strictProctoring
    });
  };

  const filteredLogs = logs.filter((log: any) => {
    return log.action.toLowerCase().includes(logSearch.toLowerCase()) || 
           log.entity.toLowerCase().includes(logSearch.toLowerCase()) ||
           (log.userName && log.userName.toLowerCase().includes(logSearch.toLowerCase()));
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-600" />
          Institution & Governance Control
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure active academic frames, roles permission sets and oversee cloud security audit archives.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings Module */}
        <div className="lg:col-span-1 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-fit">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Academic setup</h2>
            </div>

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs px-3.5 py-2 rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Academic Session */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" /> Academic Session
              </label>
              <select
                value={currentSession}
                onChange={(e) => setCurrentSession(e.target.value)}
                className="block w-full text-xs font-semibold px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all"
              >
                <option value="2025/2026">2025/2026 Academic Session</option>
                <option value="2026/2027">2026/2027 Academic Session</option>
                <option value="2027/2028">2027/2028 Academic Session</option>
              </select>
            </div>

            {/* Academic Term */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-gray-400" /> Current active Term
              </label>
              <select
                value={currentTerm}
                onChange={(e) => setCurrentTerm(e.target.value)}
                className="block w-full text-xs font-semibold px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all"
              >
                <option value="Term 1">First Term (Term 1)</option>
                <option value="Term 2">Second Term (Term 2)</option>
                <option value="Term 3">Third Term (Term 3)</option>
              </select>
            </div>

            {/* Role Governance & Permissions Policy */}
            <div className="space-y-4 pt-4 border-t border-gray-50">
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-gray-400 tracking-wider">
                <Key className="w-3.5 h-3.5" /> Governance Policies
              </div>

              {/* Toggle 1: Allow score uploads */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-800">Direct Educator score input</span>
                  <p className="text-[10px] text-gray-400">Enable teachers to add/modify course sheets.</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowTeachersEdit}
                  onChange={(e) => setAllowTeachersEdit(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                />
              </div>

              {/* Toggle 2: Allow student view logs */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-800">Student result publication</span>
                  <p className="text-[10px] text-gray-400">Allow student logins to review graded reports.</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowStudentsView}
                  onChange={(e) => setAllowStudentsView(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                />
              </div>

              {/* Toggle 3: Strict Proctoring enforcement */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-800">Strict online test proctoring</span>
                  <p className="text-[10px] text-gray-400">Auto-flag students on tab change infractions.</p>
                </div>
                <input
                  type="checkbox"
                  checked={strictProctoring}
                  onChange={(e) => setStrictProctoring(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition duration-150 shadow-md shadow-indigo-150 disabled:bg-indigo-400 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Logging and deploying...' : 'Save & Publish Rules'}
            </button>
          </form>
        </div>

        {/* Audit Trail Logging Module */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4 flex-1">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-50 pb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Security Audit archives</h2>
              </div>

              <input
                type="text"
                placeholder="Search audit trail logs..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="block text-xs font-medium px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {isLoadingLogs ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                <Database className="w-10 h-10 text-gray-200 mb-2" />
                <p className="text-xs font-bold text-gray-600">No logs match searching keywords</p>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto pr-2 divide-y divide-gray-50">
                {filteredLogs.map((log: any) => (
                  <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-900">{log.action}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                          {log.entity}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <span className="font-bold text-indigo-700">{log.userName}</span>
                        <span>•</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-gray-400 truncate max-w-xs bg-gray-50 px-2 py-1 rounded">
                      ID: {log.id.substring(0, 8)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
