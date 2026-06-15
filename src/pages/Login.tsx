import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { 
  BookOpen, ShieldCheck, Award, Users, 
  ArrowRight, CheckCircle2, Lock, Sparkles, AlertTriangle 
} from 'lucide-react';
import { apiCall } from '../lib/api';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123'); // Demo default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  
  const { user, setUser } = useStore();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setUser(data.user, data.token);
      navigate(`/${data.user.role}`);
    } catch(err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const loginAsRole = async (roleEmail: string) => {
    setLoading(true);
    setError('');
    
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: roleEmail, password: 'password123' })
      });
      setUser(data.user, data.token);
      navigate(`/${data.user.role}`);
    } catch(err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white">
      {/* Upper Navigation Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border-b border-slate-100 py-4 px-6 sm:px-12 flex justify-between items-center sticky top-0 z-30 shadow-sm/50"
      >
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md shadow-indigo-200">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg animate-pulse">Edurecord</span>
            <span className="text-[10px] uppercase font-bold text-indigo-600 ml-1 bg-indigo-50 px-1.5 py-0.5 rounded-md tracking-wider">Proctored Core</span>
          </div>
        </div>

        {/* Dynamic Interactive Demo Dropdown Hub */}
        <div className="relative">
          <button 
            type="button"
            id="demo-trigger-btn"
            onClick={() => setDemoMenuOpen(!demoMenuOpen)}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-150 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            Launch Instant Demo
            <span className={`text-[9px] transition-transform duration-200 ${demoMenuOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {demoMenuOpen && (
            <>
              {/* Overlay clickable background to handle click-away behavior */}
              <div 
                className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[1px]" 
                id="demo-overlay"
                onClick={() => setDemoMenuOpen(false)} 
              />
              
              <div 
                className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 p-4 space-y-4 animate-fadeIn"
                id="demo-dropdown-panel"
              >
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-500" /> Quick Role Logins
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Bypass login and enter simulated personas immediately:</p>
                </div>
                
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      loginAsRole('admin@school.com');
                      setDemoMenuOpen(false);
                    }}
                    id="login-btn-admin"
                    className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all flex items-center justify-between border border-transparent hover:border-indigo-150/35 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-sm" />
                      School Administrator
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">Gov Hub</span>
                  </button>

                  <button
                    onClick={() => {
                      loginAsRole('teacher@school.com');
                      setDemoMenuOpen(false);
                    }}
                    id="login-btn-teacher"
                    className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all flex items-center justify-between border border-transparent hover:border-indigo-150/35 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                      Faculty Educator
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">Syllabi</span>
                  </button>

                  <button
                    onClick={() => {
                      loginAsRole('adm001@student.com');
                      setDemoMenuOpen(false);
                    }}
                    id="login-btn-student"
                    className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all flex items-center justify-between border border-transparent hover:border-indigo-150/35 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
                      Enrolled Pupil Student
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">Exams</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Useful Platform Links</h4>
                </div>

                <div className="space-y-1.5">
                  <a
                    href="https://ai.studio/build"
                    target="_blank"
                    rel="noreferrer"
                    id="link-ai-studio"
                    className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition font-semibold"
                  >
                    <span>Google AI Studio Build</span>
                    <span className="text-[9px] text-slate-400">αi portal ↗</span>
                  </a>

                  <Link
                    to="/signup"
                    id="link-register"
                    onClick={() => setDemoMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition font-semibold"
                  >
                    <span>Register New Institution</span>
                    <span className="text-[9px] text-slate-400">Onboarding ↗</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      fillDemoCredentials('admin@school.com');
                      setDemoMenuOpen(false);
                      const emailInput = document.getElementById('email');
                      if (emailInput) emailInput.focus();
                    }}
                    id="link-credentials-picker"
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition font-semibold text-left cursor-pointer"
                  >
                    <span>View Shared Demo Accounts</span>
                    <span className="text-[9px] text-slate-400">Prefill text</span>
                  </button>
                </div>

                <div className="text-[9px] bg-indigo-50/40 text-indigo-700/80 p-2.5 rounded-xl text-center border border-indigo-100/30 font-medium leading-relaxed">
                  Experience secured active-tab exam listeners, comprehensive classroom study files downloads, and visual progress grids!
                </div>
              </div>
            </>
          )}
        </div>
      </motion.header>

      {/* Main Container Grid */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left Column: Premium Pitch / Copy */}
        <motion.section 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-7 space-y-8"
        >
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 text-xs text-indigo-800 font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Empowering Modern Classrooms
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-none">
              The secure academic platform for <span className="text-indigo-600">hybrid education</span>.
            </h1>
            <p className="text-base sm:text-lg text-slate-500 leading-relaxed font-normal">
              A comprehensive portal engineered to seamlessly balance student record management, custom timing features, and live active test proctoring.
            </p>
          </div>

          {/* Three core pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4" id="features">
            <div className="flex gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 h-12 w-12 flex items-center justify-center text-indigo-600 flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Window Proctoring</h3>
                <p className="text-xs text-slate-500 mt-1 leading-normal">Failsafe active focus and visibility listeners immediately register tab minimize and clicks as violations.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 h-12 w-12 flex items-center justify-center text-indigo-600 flex-shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Encrypted Results Store</h3>
                <p className="text-xs text-slate-500 mt-1 leading-normal">Student answers and physical grades are securely stored to guarantee tamper-proof transcript delivery.</p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="border-t border-slate-200/60 pt-8 grid grid-cols-3 gap-4" id="stats">
            <div>
              <span className="block text-2xl font-black text-slate-900">100%</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Verifiable Audit Logs</span>
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-900">256-Bit</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Passcode Hash Strength</span>
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-900">&lt; 1s</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Latency Record Sinks</span>
            </div>
          </div>
        </motion.section>

        {/* Right Column: Beautiful Login Console */}
        <motion.section 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <BookOpen className="w-40 h-40 text-indigo-900" />
          </div>

          <div className="space-y-1 relative z-10">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Access Edurecord</h2>
            <p className="text-xs text-slate-500 font-medium">Please authenticate using your institutional password credentials.</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Actual Log-in Form */}
          <form className="space-y-4 relative z-10" onSubmit={handleLogin}>
            <div className="space-y-1">
              <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Educational Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., admin@school.com"
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Security Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-100 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:bg-indigo-400 cursor-pointer"
            >
              {loading ? 'Validating account...' : 'Sign In to Dashboard'}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </button>
            <div className="text-center pt-2">
              <span className="text-xs text-slate-400">Need a secure school portal? </span>
              <Link to="/signup" className="text-xs font-bold text-indigo-600 hover:underline transition">
                Register Institution
              </Link>
            </div>
          </form>

          {/* Quick interactive one-click accounts picker (CTA) */}
          <div className="border-t border-slate-100 pt-6 space-y-3 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Quick Selection Demo Accounts
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin@school.com')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                  email === 'admin@school.com' 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                Admin
              </button>

              <button
                type="button"
                onClick={() => fillDemoCredentials('teacher@school.com')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                  email === 'teacher@school.com' 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                Teacher
              </button>

              <button
                type="button"
                onClick={() => fillDemoCredentials('adm001@student.com')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                  email === 'adm001@student.com' 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                Student
              </button>
            </div>
            <div className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1 bg-slate-50 py-1.5 rounded-lg border border-slate-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
              Tap any demo card above to prefill, then select "Sign In".
            </div>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 px-4 text-center text-xs text-slate-400">
        <div>&copy; 2026 Edurecord Academic Integrity Systems. All educational benchmarks verified.</div>
      </footer>
    </div>
  );
}
