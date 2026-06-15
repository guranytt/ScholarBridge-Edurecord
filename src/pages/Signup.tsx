import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useStore } from '../store';
import { 
  BookOpen, ShieldCheck, HelpCircle, 
  ArrowRight, Sparkles, AlertTriangle, Building, User, Mail, Lock, CheckCircle2 
} from 'lucide-react';
import { apiCall } from '../lib/api';

export default function Signup() {
  const [instName, setInstName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { user, setUser } = useStore();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName.trim() || !adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      setError('Please fill out all fields to register your school.');
      return;
    }

    if (adminPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await apiCall('/auth/register-institution', {
        method: 'POST',
        body: JSON.stringify({
          name: instName,
          adminName,
          adminEmail,
          adminPassword
        })
      });
      
      setSuccess(true);
      // Wait slightly for confirmation display, then update store
      setTimeout(() => {
        setUser(data.user, data.token);
        navigate('/admin');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to complete registration. Try custom admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 sm:px-12 flex justify-between items-center sticky top-0 z-30 shadow-sm/50">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md shadow-indigo-200">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">EduRecord</span>
            <span className="text-[10px] uppercase font-bold text-indigo-600 ml-1 bg-indigo-50 px-1.5 py-0.5 rounded-md tracking-wider">Multi-Tenant setup</span>
          </div>
        </div>
        <div>
          <Link
            to="/login"
            className="text-xs text-indigo-700 font-bold bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-all border border-indigo-100"
          >
            Sign In Instead
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-lg mx-auto w-full px-4 py-12 flex flex-col justify-center">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-6 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Building className="w-36 h-36 text-indigo-900" />
          </div>

          <div className="space-y-2 relative z-10 text-center">
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-indigo-600" /> Institution Signup
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Register Your Institution</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Create a custom isolated school workspace and configure your primary admin dashboard profile in seconds.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-4 py-4 rounded-xl flex flex-col items-center gap-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 flex-shrink-0 animate-bounce" />
              <div>
                <span className="font-bold block text-sm">Institution Registered!</span>
                <span className="opacity-95">Pre-generating core Grade 9 & 10 classes and baseline subjects...</span>
              </div>
            </div>
          )}

          {!success && (
            <form className="space-y-4 relative z-10" onSubmit={handleSignup}>
              {/* Institution Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" /> School / Institution Name
                </label>
                <input
                  type="text"
                  required
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  placeholder="e.g., Global Academy"
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all shadow-sm"
                />
              </div>

              {/* Admin Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Super-Admin Full Name
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g., Principal John Doe"
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all shadow-sm"
                />
              </div>

              {/* Admin Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Institutional Email Address
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="e.g., administrator@school.com"
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all shadow-sm"
                />
              </div>

              {/* Admin Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Admin Access Password
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-100 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:bg-indigo-400 cursor-pointer"
              >
                {loading ? 'Bootstrapping tenant database...' : 'Register and Configure Portal'}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </button>
            </form>
          )}

          {/* Guidelines info box */}
          <div className="border-t border-slate-100 pt-5 text-center">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Safe SSL secure sandbox isolation.
            </span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
        <div>&copy; 2026 EduRecord Academic Core Systems. All school nodes protected.</div>
      </footer>
    </div>
  );
}
