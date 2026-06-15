import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { 
  BookOpen, ShieldCheck, Award, Users, 
  ArrowRight, CheckCircle2, Lock, Sparkles, AlertTriangle,
  TrendingUp, Layers, Settings, Activity, ChevronRight, 
  Calendar, ArrowUpRight, Check, FileText, Plus
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

  const handleScrollToLogin = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const emailInput = document.getElementById('email');
    if (emailInput) {
      setTimeout(() => emailInput.focus(), 300);
    }
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
            <span className="font-black text-slate-900 tracking-tight text-lg">Edurecord <span className="text-indigo-600 font-extrabold">Pro</span></span>
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

      {/* Main Container Grid & Expanded Sections */}
      <main className="flex-grow w-full">
        {/* HERO SECTION: Headline, Subheadline, Login Console & Section 1 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Premium Headline, Subheadline & Section 1 */}
          <motion.section 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7 space-y-10"
          >
            <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100/60 rounded-full px-3 py-1 text-xs text-indigo-800 font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Empowering Modern Classrooms
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                School records and grading made simple for <span className="text-indigo-600 bg-indigo-50/50 px-2.5 py-1 rounded-2xl block sm:inline-block mt-1 sm:mt-0">modern schools</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                A secure system for managing student data, grades, attendance, and reports with speed and accuracy across your entire school
              </p>
            </div>

            {/* SECTION 1: What schools gain immediately */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm/50 relative overflow-hidden">
              <div className="absolute right-0 top-0 bg-indigo-50/50 text-[10px] text-indigo-600 px-3.5 py-1.5 rounded-bl-xl font-bold uppercase tracking-wider">
                Immediate Gain Matrix
              </div>
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> What schools gain immediately
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="bg-indigo-50 text-indigo-600 p-1 rounded-full mt-0.5"><Check className="w-3.5 h-3.5" /></span>
                  <span className="text-sm text-slate-700 font-semibold">Faster grading process across all classes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-indigo-50 text-indigo-600 p-1 rounded-full mt-0.5"><Check className="w-3.5 h-3.5" /></span>
                  <span className="text-sm text-slate-700 font-semibold">Central record system for student data</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-indigo-50 text-indigo-600 p-1 rounded-full mt-0.5"><Check className="w-3.5 h-3.5" /></span>
                  <span className="text-sm text-slate-700 font-semibold">Reduced manual paperwork and errors</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-indigo-50 text-indigo-600 p-1 rounded-full mt-0.5"><Check className="w-3.5 h-3.5" /></span>
                  <span className="text-sm text-slate-700 font-semibold">Instant report generation for parents and administration</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-indigo-50 text-indigo-600 p-1 rounded-full mt-0.5"><Check className="w-3.5 h-3.5" /></span>
                  <span className="text-sm text-slate-700 font-semibold">Clear tracking of academic progress per term</span>
                </li>
              </ul>
            </div>
          </motion.section>

          {/* Right Column: Beautiful Login Console */}
          <motion.section 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6 relative overflow-hidden"
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
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 animate-bounce" />
                Tap any demo card above to prefill, then select "Sign In".
              </div>
            </div>
          </motion.section>
        </div>

        {/* SECTION 2: Built for school workflows */}
        <section className="bg-white border-y border-slate-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
              <span className="text-xs uppercase font-extrabold text-indigo-600 tracking-widest block">Role Matrix</span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Built for school workflows</h2>
              <p className="text-sm text-slate-500 font-medium">Coordinate classrooms, verify assessments, and review indicators on standard workflows.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative flex flex-col justify-between">
                <div>
                  <div className="bg-indigo-600 text-white text-xs font-extrabold w-8 h-8 rounded-full flex items-center justify-center mb-4">
                    1
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">Teachers</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">Teachers enter scores in a clean interface</p>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-4">Grading System</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative flex flex-col justify-between">
                <div>
                  <div className="bg-indigo-600 text-white text-xs font-extrabold w-8 h-8 rounded-full flex items-center justify-center mb-4">
                    2
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">Administrators</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">Administrators oversee records from one dashboard</p>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-4">Command Center</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative flex flex-col justify-between">
                <div>
                  <div className="bg-indigo-600 text-white text-xs font-extrabold w-8 h-8 rounded-full flex items-center justify-center mb-4">
                    3
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">Students</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">Students access results and performance history</p>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-4">Personal Portal</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative flex flex-col justify-between">
                <div>
                  <div className="bg-indigo-600 text-white text-xs font-extrabold w-8 h-8 rounded-full flex items-center justify-center mb-4">
                    4
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">Reports</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">Reports follow a consistent school format</p>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-4">A4 Print Standard</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Problems schools face and how this system solves them */}
        <section className="bg-slate-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
              <span className="text-xs uppercase font-extrabold text-rose-500 tracking-widest block">Comparative Solutions</span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Problems schools face and how this system solves them</h2>
              <p className="text-sm text-slate-500 font-medium font-sans">Standardizing metrics and eliminating structural friction in institutional environments.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Problem 1 */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                <div className="h-2 bg-rose-500 w-full" />
                <div className="p-6 flex-grow flex flex-col justify-between space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block">Friction Scenario</span>
                    <h3 className="text-base font-bold text-slate-900">Manual grading slows academic operations</h3>
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-100/50 p-4.5 rounded-2xl space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Core Solution
                    </span>
                    <p className="text-sm font-semibold text-slate-700">This system standardizes score entry and calculation</p>
                  </div>
                </div>
              </div>

              {/* Problem 2 */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                <div className="h-2 bg-rose-500 w-full" />
                <div className="p-6 flex-grow flex flex-col justify-between space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block">Friction Scenario</span>
                    <h3 className="text-base font-bold text-slate-900">Lost records disrupt decision making</h3>
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-100/50 p-4.5 rounded-2xl space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Core Solution
                    </span>
                    <p className="text-sm font-semibold text-slate-700">Digital storage keeps every student record organized and searchable</p>
                  </div>
                </div>
              </div>

              {/* Problem 3 */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                <div className="h-2 bg-rose-500 w-full" />
                <div className="p-6 flex-grow flex flex-col justify-between space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block">Friction Scenario</span>
                    <h3 className="text-base font-bold text-slate-900">Delayed report cards affect parent trust</h3>
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-100/50 p-4.5 rounded-2xl space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Core Solution
                    </span>
                    <p className="text-sm font-semibold text-slate-700">Automated report generation produces results on schedule</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Core features */}
        <section className="bg-white py-16 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
              <span className="text-xs uppercase font-extrabold text-indigo-600 tracking-widest block">Feature Suite</span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Core features</h2>
              <p className="text-sm text-slate-500 font-medium">Engineered specifically to maximize security and scale efficiently.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-slate-50 hover:bg-white border border-slate-200/85 hover:border-indigo-150 rounded-2xl p-6 transition-all shadow-xs flex gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900">Student information management</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Track demographics, admission, level groupings, and active registry status values.</p>
                </div>
              </div>

              <div className="bg-slate-50 hover:bg-white border border-slate-200/85 hover:border-indigo-150 rounded-2xl p-6 transition-all shadow-xs flex gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900">Grade entry and calculation system</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Continuous assessments weights out of 40 and end-of-term examinations out of 60.</p>
                </div>
              </div>

              <div className="bg-slate-50 hover:bg-white border border-slate-200/85 hover:border-indigo-150 rounded-2xl p-6 transition-all shadow-xs flex gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900">Attendance tracking</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Monitor classroom attendance records directly alongside daily academic dashboards.</p>
                </div>
              </div>

              <div className="bg-slate-50 hover:bg-white border border-slate-200/85 hover:border-indigo-150 rounded-2xl p-6 transition-all shadow-xs flex gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900">Term and session reporting</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Instantly aggregate scores, average weights, and compile formal PDF printable sheets.</p>
                </div>
              </div>

              <div className="bg-slate-50 hover:bg-white border border-slate-200/85 hover:border-indigo-150 rounded-2xl p-6 transition-all shadow-xs flex gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900">Role based access for staff</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Distinct system environments separated by school admin, teaching faculty, and student pupils.</p>
                </div>
              </div>

              <div className="bg-slate-50 hover:bg-white border border-slate-200/85 hover:border-indigo-150 rounded-2xl p-6 transition-all shadow-xs flex gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900">Secure data storage</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Encrypted record storage ensuring integrity of institutional benchmarks and pupil identities.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: Designed for school growth */}
        <section className="bg-slate-55 border-b border-slate-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-indigo-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
              <div className="absolute right-0 bottom-0 p-8 opacity-10 pointer-events-none">
                <Layers className="w-64 h-64 text-white" />
              </div>
              
              <div className="max-w-2xl space-y-6 relative z-10">
                <span className="text-[11px] font-black uppercase tracking-widest text-indigo-200 bg-indigo-800/65 px-3 py-1 rounded-md">Growth & Scale</span>
                <h3 className="text-3xl font-black text-white tracking-tight">Designed for school growth</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                  <div className="space-y-1.5 border-l-2 border-indigo-400 pl-4">
                    <h5 className="text-sm font-black text-indigo-200">Universal Fit</h5>
                    <p className="text-xs font-semibold leading-relaxed text-indigo-100">Works across small schools and large institutions</p>
                  </div>

                  <div className="space-y-1.5 border-l-2 border-indigo-400 pl-4">
                    <h5 className="text-sm font-black text-indigo-200">Multiclass ready</h5>
                    <p className="text-xs font-semibold leading-relaxed text-indigo-100">Supports multi class and multi subject structures</p>
                  </div>

                  <div className="space-y-1.5 border-l-2 border-indigo-400 pl-4">
                    <h5 className="text-sm font-black text-indigo-200">Zero Lag</h5>
                    <p className="text-xs font-semibold leading-relaxed text-indigo-100">Handles large student populations without performance loss</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: Outcome for your school */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
              <span className="text-xs uppercase font-extrabold text-indigo-600 tracking-widest block font-mono">Value Proposition</span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Outcome for your school</h2>
              <p className="text-sm text-slate-500 font-medium">Clear visibility, automated tasks, and strengthened parent partnership.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                <span className="text-3xl font-black text-slate-300 block">01</span>
                <span className="text-sm font-bold text-slate-900 block leading-snug">Less time on administration</span>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                <span className="text-3xl font-black text-slate-300 block">02</span>
                <span className="text-sm font-bold text-slate-900 block leading-snug">More time on teaching</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                <span className="text-3xl font-black text-slate-300 block">03</span>
                <span className="text-sm font-bold text-slate-900 block leading-snug">Clear academic visibility for leadership</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                <span className="text-3xl font-black text-slate-300 block">04</span>
                <span className="text-sm font-bold text-slate-900 block leading-snug">Faster communication with parents</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                <span className="text-3xl font-black text-slate-300 block">05</span>
                <span className="text-sm font-bold text-slate-900 block leading-snug">Stronger data driven decisions for improvement</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: Call to action */}
        <section className="bg-slate-50/80 py-16 border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 text-xs text-indigo-800 font-bold uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-indigo-600" /> Start Digitizing Your School Workflow Today
            </span>
            
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
                Bring structure to your school records
              </h2>
              <p className="text-base text-slate-650 max-w-xl mx-auto font-medium leading-relaxed">
                Configure your terms, input examination scores, and review dynamic student performance history records instantly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button 
                type="button" 
                onClick={handleScrollToLogin}
                className="w-full sm:w-auto text-sm bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold px-6 py-3.5 rounded-xl cursor-pointer shadow-md shadow-indigo-150 inline-flex items-center justify-center gap-1.5 transition"
              >
                Set up a demo session <ArrowRight className="w-4 h-4" />
              </button>
              
              <button 
                type="button" 
                onClick={handleScrollToLogin}
                className="w-full sm:w-auto text-sm bg-white hover:bg-slate-100 text-slate-800 font-bold px-6 py-3.5 rounded-xl border border-slate-200 transition"
              >
                Access System Now
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500 font-semibold">
        <div>&copy; 2026 Edurecord School Information Management Systems. All rights reserved.</div>
      </footer>
    </div>
  );
}
