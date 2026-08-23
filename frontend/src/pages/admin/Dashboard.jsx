import { useState, useEffect } from 'react';
import api from '../../services/api';
import { HiOutlineUsers, HiOutlineAcademicCap, HiOutlineBookOpen, HiOutlineOfficeBuilding } from 'react-icons/hi';
import { LayoutDashboard } from 'lucide-react';
import AttendanceMatrix from '../faculty/AttendanceMatrix';

/* ────── Animated Counter ────── */
function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const num = Number(value) || 0;
    let start = 0;
    const step = num / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= num) { setDisplay(num); clearInterval(id); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [value, duration]);
  return <>{display}</>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ departments: 0, classes: 0, subjects: 0, faculty: 0, students: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/departments'),
      api.get('/classes'),
      api.get('/subjects'),
      api.get('/users?role=faculty'),
      api.get('/users?role=student'),
    ]).then(([d, c, s, f, st]) => {
      setStats({
        departments: d.data.length,
        classes: c.data.length,
        subjects: s.data.length,
        faculty: f.data.length,
        students: st.data.length,
      });
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Departments', value: stats.departments, icon: HiOutlineOfficeBuilding, gradient: 'from-[#8b5cf6] to-[#a78bfa]', iconColor: 'text-white', trend: 'Active' },
    { label: 'Classes', value: stats.classes, icon: HiOutlineAcademicCap, gradient: 'from-[#3b82f6] to-[#60a5fa]', iconColor: 'text-white', trend: 'Active' },
    { label: 'Subjects', value: stats.subjects, icon: HiOutlineBookOpen, gradient: 'from-[#10b981] to-[#34d399]', iconColor: 'text-white', trend: 'Active' },
    { label: 'Faculty', value: stats.faculty, icon: HiOutlineUsers, gradient: 'from-[#f59e0b] to-[#fbbf24]', iconColor: 'text-white', trend: 'Registered' },
    { label: 'Students', value: stats.students, icon: HiOutlineUsers, gradient: 'from-[#ef4444] to-[#f87171]', iconColor: 'text-white', trend: 'Registered' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-purple-500 rounded-full animate-spin drop-shadow-md" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-3xl font-black tracking-tight mb-1">System Overview</h1>
          <p className="text-gray-500 text-sm font-medium">Real-time metrics and administration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-[24px] border border-gray-100 p-6 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${card.gradient} shadow-sm transform group-hover:scale-105 transition-transform duration-300`}>
                  <Icon size={26} className={card.iconColor} strokeWidth={2} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-md">{card.trend}</span>
              </div>
              
              <div>
                <div className="text-gray-900 text-4xl font-black tracking-tight leading-none mb-1">
                  <AnimatedNumber value={card.value} />
                </div>
                <div className="text-gray-500 text-sm font-medium">{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <AttendanceMatrix />
      
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
