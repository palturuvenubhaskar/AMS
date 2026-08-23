import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../NotificationBell';
import {
  LayoutDashboard, ClipboardCheck, Clock, Calendar, Users, FileText,
  Settings, LogOut, Search, Camera, Hexagon, Filter, Plus, AlertCircle
, Sun , Moon } from 'lucide-react';

const navItems = [
  { to: '/faculty', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/faculty/take-attendance', icon: ClipboardCheck, label: 'Take Attendance' },
  { to: '/faculty/history', icon: Clock, label: 'Attendance History' },
  { to: '/faculty/timetable', icon: Calendar, label: 'Schedule' },
  { to: '/faculty/classes', icon: Users, label: 'Classes' },
  { to: '/faculty/leaves', icon: FileText, label: 'Leave Inbox' },
  { to: '/faculty/disputes', icon: AlertCircle, label: 'Disputes' },
  { to: '/faculty/frs-registration', icon: Camera, label: 'FRS Registration' },
];

export default function FacultyLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const handleLogout = async () => { await logout(); navigate('/login'); };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  return (
    <div className="flex min-h-screen bg-[#FDFDFD] dark:bg-[#0f172a] font-sans overflow-hidden">
      
      {/* Background ambient mesh gradients */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pastel-purple/40 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pastel-pink/30 blur-[100px] pointer-events-none" />

      {/* ====== SIDEBAR ====== */}
      <aside className="w-[260px] bg-[#DCD0FF]/70 dark:bg-gray-900/70 backdrop-blur-xl flex flex-col fixed top-0 left-0 bottom-0 z-50 border-r border-[#DCD0FF]/50 dark:border-gray-800 shadow-[4px_0_24px_rgba(0,0,0,0.03)]">
        {/* Brand */}
        <div className="px-8 py-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-purple flex items-center justify-center text-white shadow-lg shadow-brand-purple/30">
            <Hexagon size={24} fill="currentColor" strokeWidth={1} />
          </div>
          <h1 className="text-gray-900 dark:text-gray-100 font-black text-xl tracking-tight">AMS</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto mt-2">
          <p className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Main Menu</p>
          <div className="space-y-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={() =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 group relative ${
                      isActive
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-glass'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100 hover:bg-white/50 dark:bg-gray-800/50'
                    }`
                  }
                >
                  {isActive && <div className="absolute left-0 w-1 h-6 bg-brand-purple rounded-r-full" />}
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-brand-purple' : 'text-gray-400 group-hover:text-gray-700 dark:text-gray-300 transition-colors'} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Footer / User Profile Card */}
        <div className="p-4 pb-6">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-[24px] p-2 flex flex-col items-center justify-center border border-white/50 shadow-glass group hover:bg-white dark:bg-gray-800 transition-colors cursor-pointer" onClick={() => navigate('/faculty/settings')}>
            <div className="flex items-center gap-3 w-full p-2">
              <div className="w-10 h-10 rounded-2xl bg-pastel-blue flex items-center justify-center text-brand-purple font-black text-lg flex-shrink-0">
                {user?.fullName?.[0] || 'F'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-gray-900 dark:text-gray-100 text-sm font-bold truncate">{user?.fullName || 'Faculty User'}</h4>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleLogout(); }}
              className="mt-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all text-sm font-bold opacity-0 group-hover:opacity-100 h-0 group-hover:h-10 overflow-hidden"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ====== MAIN CONTENT ====== */}
      <main className="flex-1 ml-[260px] min-h-screen relative z-10 flex flex-col">
        
        {/* Top Header */}
        <header className="h-[90px] px-8 flex items-center justify-between sticky top-0 z-40 bg-surface-base dark:bg-gray-900/40 backdrop-blur-xl">
          <div className="flex flex-col">
            <h2 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              {getGreeting()}
            </h2>
            <h1 className="text-gray-900 dark:text-gray-100 text-2xl font-black tracking-tight">
              {user?.fullName || 'Faculty'}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Search */}
            <div className="relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-purple transition-colors" />
              <input
                type="text"
                placeholder="Find something..."
                className="w-[320px] h-[48px] pl-11 pr-12 rounded-full bg-white dark:bg-gray-800 border-2 border-transparent text-sm text-gray-900 dark:text-gray-100 font-medium placeholder-gray-400 focus:outline-none focus:border-brand-purple/20 focus:ring-4 focus:ring-brand-purple/10 shadow-glass transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">⌘</span>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">K</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-glass flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-brand-purple hover:scale-105 transition-all border border-gray-100">
                <Clock size={18} strokeWidth={2.5} />
              </button>
              <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-glass flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-brand-purple hover:scale-105 transition-all border border-gray-100 dark:border-gray-700">
                {theme === 'dark' ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
              </button>
              <NotificationBell className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-glass flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-brand-purple hover:scale-105 transition-all border border-gray-100" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
