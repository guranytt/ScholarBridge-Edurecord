import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, UserSquare2, BookOpen, GraduationCap, Loader2, 
  Settings, ShieldCheck, Activity, Calendar, LayoutDashboard, 
  CheckCircle2, AlertCircle, RefreshCw, Key, ShieldAlert
} from 'lucide-react';
import { apiCall } from '../lib/api';

type TabType = 'overview' | 'onboarding' | 'academic' | 'permissions' | 'audits';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Queries
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: () => apiCall('/dashboard'),
  });

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['academic_settings'],
    queryFn: () => apiCall('/academic/settings'),
  });

  const { data: auditLogs, isLoading: loadingAudits } = useQuery({
    queryKey: ['audit_logs'],
    queryFn: () => apiCall('/audit-logs'),
  });

  // Local state for settings form
  const [schoolName, setSchoolName] = useState('Edurecord Academy');
  const [subscriptionPlan, setSubscriptionPlan] = useState('pro');
  const [term, setTerm] = useState('Term 1');
  const [session, setSession] = useState('2025/2026');
  const [allowTeachersEdit, setAllowTeachersEdit] = useState(true);
  const [allowStudentsView, setAllowStudentsView] = useState(true);
  const [strictProctoring, setStrictProctoring] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  // Sync state with loaded settings
  useEffect(() => {
    if (settings) {
      setSchoolName(settings.schoolName || 'Edurecord Academy');
      setSubscriptionPlan(settings.plan || 'pro');
      setTerm(settings.currentTerm || 'Term 1');
      setSession(settings.currentSession || '2025/2026');
      setAllowTeachersEdit(settings.allow_teachers_edit ?? true);
      setAllowStudentsView(settings.allow_students_view ?? true);
      setStrictProctoring(settings.strict_proctoring ?? true);
    }
  }, [settings]);

  // Settings Mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: any) => apiCall('/academic/settings', {
      method: 'POST',
      body: JSON.stringify(newSettings),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic_settings'] });
      queryClient.invalidateQueries({ queryKey: ['audit_logs'] });
      setSuccessMessage('Configuration synchronized and logged successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      schoolName,
      plan: subscriptionPlan,
      currentTerm: term,
      currentSession: session,
      allow_teachers_edit: allowTeachersEdit,
      allow_students_view: allowStudentsView,
      strict_proctoring: strictProctoring,
      allowed_roles: ["admin", "teacher", "student"]
    });
  };

  if (loadingStats || loadingSettings) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50/50">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500">Initializing administrative modules...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { name: 'Enrolled Pupils', value: stats?.students || 0, icon: Users, color: 'bg-indigo-600', desc: 'Active student registry' },
    { name: 'Active Faculty', value: stats?.teachers || 0, icon: UserSquare2, color: 'bg-blue-600', desc: 'Educators & lecturers' },
    { name: 'Standard Classes', value: stats?.classes || 0, icon: BookOpen, color: 'bg-emerald-600', desc: 'Assigned teaching grades' },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            School Configuration & Admin Layer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure school profiles, active dynamic academic terms, roles permission bounds, and review safety audit trials.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-slate-600 uppercase">Institutional Server Online</span>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-gray-200 overflow-x-auto pb-px gap-1">
        {[
          { id: 'overview', name: 'Dashboard Overview', icon: LayoutDashboard },
          { id: 'onboarding', name: 'Institution Profile', icon: Settings },
          { id: 'academic', name: 'Academic Term Hub', icon: Calendar },
          { id: 'permissions', name: 'Role Boundaries', icon: ShieldCheck },
          { id: 'audits', name: 'Audits & Logging', icon: Activity },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                isActive 
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-indigo-600 hover:border-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.name}
            </button>
          );
        })}
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {/* Dynamic Content Views */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Platform Core Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {statCards.map((card) => (
                <div key={card.name} className="relative bg-white p-6 rounded-xl border border-slate-100 shadow-sm overflow-hidden flex items-start gap-4">
                  <div className={`p-3 rounded-lg text-white ${card.color}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-400 block">{card.name}</span>
                    <span className="text-3xl font-extrabold text-slate-900 mt-1 block">{card.value}</span>
                    <span className="text-xs text-slate-500 mt-0.5 block">{card.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-indigo-600" /> Current Academic Session Status
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Active Academic Term:</span>
                    <span className="font-bold text-slate-900">{term}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Active Calendar Session:</span>
                    <span className="font-bold text-slate-900">{session}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Institutional School Name:</span>
                    <span className="font-bold text-slate-900">{schoolName}</span>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Active Safety Rules Check
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Proctoring AI violations threshold:</span>
                    <span className="font-bold text-red-600">3 violations (locks exams)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Allow Teacher Course Note Handouts:</span>
                    <span className={`font-bold ${allowTeachersEdit ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {allowTeachersEdit ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Student grade releases:</span>
                    <span className="font-bold text-emerald-600">Automated Release Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'onboarding' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Institutional Onboarding Profile</h2>
              <p className="text-sm text-slate-500 mt-1">Configure your primary campus profile details and current subscription plans.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Registered Institution Name</label>
                <input 
                  type="text" 
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g. Oakbridge Senior High School"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Subscription Tier Plan</label>
                <select
                  value={subscriptionPlan}
                  onChange={(e) => setSubscriptionPlan(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="basic">Basic Tier (Core Student Management only)</option>
                  <option value="pro">Pro Tier (Complete Timed Exams & Anti-Cheat Engine)</option>
                  <option value="enterprise">Enterprise VIP (Unlimited students & advanced analytics)</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">Enterprise VIP tier yields priority cloud syncing & advanced server backups.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex gap-3 text-xs text-slate-600">
                <ShieldAlert className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block">Is your registration incomplete?</span>
                  Fill settings and hit Update below. The changes are recorded live to SQLite dev database.
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {updateSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Institution Profile
              </button>
            </div>
          </div>
        )}

        {activeTab === 'academic' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Academic Term Setup</h2>
              <p className="text-sm text-slate-500 mt-1">Configure the current active semester, exam period term, and calendar year configuration.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Active Academic Term Setting</label>
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="Term 1">Term 1 (Autumn/Winter)</option>
                  <option value="Term 2">Term 2 (Spring Semester)</option>
                  <option value="Term 3">Term 3 (Summer Finals Period)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Active Academic Calendar Year</label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="2025/2026">2025/2026 Session</option>
                  <option value="2026/2027">2026/2027 Session</option>
                  <option value="2027/2028">2027/2028 Session</option>
                </select>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-xs text-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold block">Warning: Changing active term will shift active grading parameters.</span>
                 All results and exam scores input by educators will align with the selected active term/session records. Ensure you submit ongoing results before changing this.
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={updateSettingsMutation.isPending}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {updateSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Publish Term Configuration Change
            </button>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Role Permissions Boundaries</h2>
              <p className="text-sm text-slate-500 mt-1">Control active platform rules and read/write scopes of educational users.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="max-w-[75%]">
                  <span className="block text-sm font-bold text-slate-900">Allow Faculty Notes Handouts</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Let educators publish study guides and text syllabus notes to classes.</span>
                </div>
                <div>
                  <input 
                    type="checkbox"
                    checked={allowTeachersEdit}
                    onChange={(e) => setAllowTeachersEdit(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="max-w-[75%]">
                  <span className="block text-sm font-bold text-slate-900">Allow Global Pupil Report Cards</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Allow students to query and inspect PDF-style printable progress sheets.</span>
                </div>
                <div>
                  <input 
                    type="checkbox"
                    checked={allowStudentsView}
                    onChange={(e) => setAllowStudentsView(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="max-w-[75%]">
                  <span className="block text-sm font-bold text-slate-900">Strict Timed-Exam Proctoring Engine</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Enable auto-flagging and automated lockouts if pupils violate exam screen limits.</span>
                </div>
                <div>
                  <input 
                    type="checkbox"
                    checked={strictProctoring}
                    onChange={(e) => setStrictProctoring(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                  />
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {updateSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Sync Security Permissions
              </button>
            </div>
          </div>
        )}

        {activeTab === 'audits' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Institution Security Auditing Loop</h2>
                <p className="text-sm text-slate-500 mt-1">Live immutable actions timeline stream logged by staff managers and super-admins.</p>
              </div>
              <button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['audit_logs'] })}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                title="Refresh logs stream"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {loadingAudits ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
              </div>
            ) : !auditLogs || auditLogs.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-lg p-12 text-center text-slate-400">
                <ShieldAlert className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium">No actions logged in the system yet.</p>
              </div>
            ) : (
              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-5 py-3 text-left font-semibold">Logged Incident / Action</th>
                        <th className="px-5 py-3 text-left font-semibold">User Role & Actor</th>
                        <th className="px-5 py-3 text-left font-semibold">Bound Entity</th>
                        <th className="px-5 py-3 text-right font-semibold">Timestamp UTC</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                      {auditLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="font-semibold text-slate-900 block">{log.action}</span>
                            <span className="text-xs text-slate-400 block font-mono mt-0.5">{log.id}</span>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-slate-600">
                            {log.userName}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 uppercase">
                              {log.entity}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
