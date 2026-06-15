import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { BookOpen, Users, LogOut, LayoutDashboard, Database, UserSquare2, ShieldAlert, FileText, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function Layout() {
  const { user, token, logout } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !user) {
      logout();
      navigate('/login');
    }
  }, [token, user, navigate, logout]);

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const role = user.role;

  const navItems = [
    { name: 'Dashboard', path: `/${role}`, icon: LayoutDashboard },
  ];

  if (role === 'admin') {
    navItems.push({ name: 'Students', path: '/admin/students', icon: Users });
    navItems.push({ name: 'Teachers', path: '/admin/teachers', icon: UserSquare2 });
    navItems.push({ name: 'Results', path: '/admin/results', icon: Database });
    navItems.push({ name: 'Study Notes', path: '/admin/notes', icon: FileText });
    navItems.push({ name: 'System Settings', path: '/admin/settings', icon: Settings });
  } else if (role === 'teacher') {
    navItems.push({ name: 'Manage Results', path: '/teacher/results', icon: BookOpen });
    navItems.push({ name: 'Create Tests', path: '/teacher/tests', icon: ShieldAlert });
    navItems.push({ name: 'Notes Hub', path: '/teacher/notes', icon: FileText });
  } else if (role === 'student') {
    navItems.push({ name: 'My Results', path: '/student/results', icon: BookOpen });
    navItems.push({ name: 'Report Card', path: '/student/report-card', icon: Database });
    navItems.push({ name: 'Online Tests', path: '/student/tests', icon: ShieldAlert });
    navItems.push({ name: 'Notes & Files', path: '/student/notes', icon: FileText });
    navItems.push({ name: 'Profile', path: '/student/profile', icon: UserSquare2 });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:flex md:flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="bg-indigo-600 p-1.5 rounded-lg mr-3">
             <BookOpen className="h-5 w-5 text-white font-bold" />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">Edurecord <span className="text-indigo-600">Pro</span></span>
        </div>
        <div className="flex-1 py-4 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path) || (location.pathname === `/${role}` && item.path === `/${role}`);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                )}
              >
                <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-indigo-700" : "text-gray-400")} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center md:hidden">
             <BookOpen className="h-6 w-6 text-indigo-600 font-bold mr-2" />
             <span className="text-lg font-semibold text-gray-900 tracking-tight">Edurecord Pro</span>
          </div>
          <div className="hidden md:block text-xs uppercase tracking-wider text-slate-400 font-extrabold">
            {user.role === 'admin' ? "Institution Administration Office" : user.role === 'teacher' ? "Educator Portal Room" : "Student Academic Portal"}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm border-r border-gray-200 pr-4">
               <span className="font-medium text-gray-900">{user.name}</span>
              <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 rounded-md hover:bg-red-50 flex items-center transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
