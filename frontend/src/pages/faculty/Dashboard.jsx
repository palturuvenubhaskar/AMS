import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Users, CheckCircle, XCircle, TrendingUp, ChevronLeft, ChevronRight,
  AlertTriangle, Calendar, ArrowRight, FileText, Activity, X
} from 'lucide-react';
import AttendanceMatrix from './AttendanceMatrix';

/* ────── Mock Data Injector ────── */
const MOCK_DATA = {
  summary: { totalStudents: 62, todayPresent: 58, todayAbsent: 4, todayLeave: 0, avgAttendancePct: 93.5 },
  trends: [
    { date: '2026-08-15', attendance_rate: 85 },
    { date: '2026-08-16', attendance_rate: 92 },
    { date: '2026-08-17', attendance_rate: 88 },
    { date: '2026-08-18', attendance_rate: 96 },
    { date: '2026-08-19', attendance_rate: 90 },
    { date: '2026-08-20', attendance_rate: 95 },
    { date: '2026-08-21', attendance_rate: 93.5 },
  ],
  zones: { green: 48, yellow: 10, red: 4 },
  students: [
    { student_id: 1, roll_no: '242G1A0501', student_name: 'MOHAMMED RAYAN', total_present: 45, total_absent: 2, total_on_leave: 0, attendance_pct: 95, zone: 'green' },
    { student_id: 2, roll_no: '242G1A0502', student_name: 'MOOD SAI JYOSHNA', total_present: 38, total_absent: 9, total_on_leave: 0, attendance_pct: 81, zone: 'green' },
    { student_id: 3, roll_no: '242G1A0503', student_name: 'N POOJITHA', total_present: 30, total_absent: 17, total_on_leave: 0, attendance_pct: 64, zone: 'yellow' },
    { student_id: 4, roll_no: '242G1A0504', student_name: 'PATAKAMURI TEJA', total_present: 25, total_absent: 22, total_on_leave: 0, attendance_pct: 53, zone: 'red' },
  ],
  schedule: [
    { subject_code: 'AI', subject_name: 'Artificial Intelligence', time_slot: '09:00 - 10:10', room_no: '310' },
    { subject_code: 'CNIP', subject_name: 'Computer Networks', time_slot: '10:25 - 11:30', room_no: '310' },
    { subject_code: 'OOAD', subject_name: 'Object Oriented Design', time_slot: '11:30 - 12:30', room_no: '310' },
  ],
  alerts: [
    { type: 'warning', title: '3 Yellow Zone Leave Requests', message: 'Awaiting your review' },
    { type: 'critical', title: '4 Students Below 60%', message: 'Critical attendance alert' },
    { type: 'warning', title: 'ATCD — No attendance taken', message: 'Today, 14:15 slot' }
  ]
};

/* ────── Animated Components ────── */
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

function CircleProgress({ pct, size = 44 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 75 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} className="transform -rotate-90 filter drop-shadow-sm">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fill={color}
        fontSize="11" fontWeight="800" transform={`rotate(90 ${size / 2} ${size / 2})`}>
        {pct}%
      </text>
    </svg>
  );
}

/* ────── Mini Calendar ────── */
function MiniCalendar() {
  const [date, setDate] = useState(new Date());
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = new Date();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = date.toLocaleDateString('en', { month: 'long', year: 'numeric' });
  
  const days = Array(firstDay).fill(null).concat(Array.from({length: daysInMonth}, (_, i) => i + 1));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 p-6 shadow-glass relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-pastel-pink/20 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110 blur-xl" />
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setDate(new Date(year, month - 1, 1))} className="p-1.5 hover:bg-gray-100 dark:bg-gray-800 rounded-xl transition-colors"><ChevronLeft size={16} className="text-gray-500 dark:text-gray-400" /></button>
        <h3 className="text-gray-900 dark:text-gray-100 font-bold text-sm tracking-wide">{monthName}</h3>
        <button onClick={() => setDate(new Date(year, month + 1, 1))} className="p-1.5 hover:bg-gray-100 dark:bg-gray-800 rounded-xl transition-colors"><ChevronRight size={16} className="text-gray-500 dark:text-gray-400" /></button>
      </div>
      <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{d}</div>
        ))}
        {days.map((d, i) => {
          const isToday = d && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
          return (
            <div key={i} className={`text-xs py-2 rounded-xl font-bold transition-all relative ${
              !d ? '' :
              isToday ? 'bg-brand-purple text-white shadow-sm transform scale-105' :
              'text-gray-600 dark:text-gray-400 hover:bg-pastel-blue/50 cursor-pointer'
            }`}>
              {d || ''}
              {d && !isToday && Math.random() > 0.7 && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pastel-mint" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────── Tooltip ────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = new Date(label);
  const dateStr = d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <div className="bg-palette-dark/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-xl border border-white/10 transform transition-all">
      <div className="flex items-center gap-2 mb-2">
        <Activity size={14} className="text-palette-medium" />
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{dateStr}</p>
      </div>
      <p className="text-2xl font-black text-white">{payload[0].value}% <span className="text-sm font-medium text-gray-400">attendance</span></p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/* ══════         MAIN DASHBOARD COMPONENT                    ══════ */
/* ══════════════════════════════════════════════════════════════════ */
export default function FacultyDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [zones, setZones] = useState({ green: 0, yellow: 0, red: 0 });
  const [students, setStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMocking, setIsMocking] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => { if (selectedClass) fetchDashboardData(); }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
      if (data.length > 0) setSelectedClass(data[0].id);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, trendRes, zoneRes, studRes, alertRes, schedRes] = await Promise.all([
        api.get(`/dashboard/classes/${selectedClass}/summary`).catch(() => ({ data: {} })),
        api.get(`/dashboard/classes/${selectedClass}/trends?days=7`).catch(() => ({ data: [] })),
        api.get(`/dashboard/classes/${selectedClass}/zones`).catch(() => ({ data: { green: 0, yellow: 0, red: 0 } })),
        api.get(`/dashboard/classes/${selectedClass}/students?search=${search}`).catch(() => ({ data: { students: [] } })),
        api.get('/dashboard/alerts').catch(() => ({ data: [] })),
        api.get(`/timetables/weekly/${user?.id || 1}`).catch(() => ({ data: [] }))
      ]);

      // Intelligent Mock Data Injection: If the real API returns zero students, use MOCK_DATA for the UI redesign.
      if (!sumRes.data?.totalStudents || sumRes.data.totalStudents === 0) {
        setIsMocking(true);
        setSummary(MOCK_DATA.summary);
        setTrends(MOCK_DATA.trends);
        setZones(MOCK_DATA.zones);
        setStudents(MOCK_DATA.students);
        setAlerts(MOCK_DATA.alerts);
        setSchedule(MOCK_DATA.schedule);
      } else {
        setIsMocking(false);
        setSummary(sumRes.data);
        setTrends(trendRes.data);
        setZones(zoneRes.data);
        
        const fetchedStudents = studRes.data.students || [];
        setStudents(fetchedStudents);
        
        const dynamicAlerts = [];
        fetchedStudents.forEach(s => {
          if (s.zone === 'red') {
            dynamicAlerts.push({
              type: 'critical',
              title: s.student_name?.toUpperCase() || 'UNKNOWN STUDENT',
              message: `(${s.roll_no}) has ${s.attendance_pct}% attendance`
            });
          } else if (s.zone === 'yellow') {
            dynamicAlerts.push({
              type: 'warning',
              title: s.student_name?.toUpperCase() || 'UNKNOWN STUDENT',
              message: `(${s.roll_no}) has ${s.attendance_pct}% attendance`
            });
          }
        });
        
        setAlerts([...dynamicAlerts, ...(alertRes.data || [])]);
        
        const today = new Date().toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
        setSchedule((schedRes.data || []).filter(s => s.day?.toLowerCase() === today));
      }
    } catch (e) { 
      console.error(e); 
    }
    setLoading(false);
  };

  const zoneData = [
    { name: 'Safe (>75%)', value: zones.green, color: '#10b981' },
    { name: 'Warning (40-74%)', value: zones.yellow, color: '#f59e0b' },
    { name: 'Critical (<40%)', value: zones.red, color: '#ef4444' },
  ];

  const statCards = summary ? [
    { label: 'Total Students', value: summary.totalStudents, icon: Users, bgClass: 'bg-pastel-purple', iconColor: 'text-[#6941C6]', text: 'text-gray-900 dark:text-gray-100', trend: '+2 this week' },
    { label: 'Present Today', value: summary.todayPresent, icon: CheckCircle, bgClass: 'bg-pastel-mint', iconColor: 'text-[#10b981]', text: 'text-gray-900 dark:text-gray-100', trend: 'Optimal' },
    { label: 'Absent Today', value: summary.todayAbsent, icon: XCircle, bgClass: 'bg-pastel-pink', iconColor: 'text-[#ef4444]', text: 'text-gray-900 dark:text-gray-100', trend: '-1 from yesterday' },
    { label: 'Avg. Attendance', value: `${summary.avgAttendancePct}%`, icon: TrendingUp, bgClass: 'bg-pastel-peach', iconColor: 'text-[#f59e0b]', isPercent: true, trend: 'Top 10% in dept' },
  ] : [];

  const filteredStudents = students.filter(s =>
    !search || s.student_name?.toLowerCase().includes(search.toLowerCase()) || s.roll_no?.toLowerCase().includes(search.toLowerCase())
  );

  const subjectColors = ['bg-gradient-to-br from-purple-500 to-indigo-500', 'bg-gradient-to-br from-emerald-400 to-teal-500', 'bg-gradient-to-br from-orange-400 to-amber-500', 'bg-gradient-to-br from-blue-400 to-cyan-500'];

  if (loading && !selectedClass) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-palette-medium border-t-transparent rounded-full animate-spin drop-shadow-md" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* ── Header Area ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-gray-900 dark:text-gray-100 text-3xl font-black tracking-tight">Class Dashboard</h1>
            {isMocking && (
              <span className="bg-palette-dark text-palette-medium text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest shadow-sm">Preview Mode</span>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Real-time attendance analytics & insights</p>
        </div>
        <div className="relative group">
          <select
            className="w-72 h-12 px-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold focus:outline-none focus:ring-4 focus:ring-palette-medium/20 focus:border-palette-medium cursor-pointer shadow-sm appearance-none transition-all group-hover:shadow-md"
            value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.department_code} {c.name}-{c.section} (Sem {c.semester})</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-600 dark:text-gray-400 transition-colors">
            <ChevronRight size={18} className="transform rotate-90" />
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className={`${card.bgClass} rounded-[32px] p-6 flex flex-col shadow-sm hover:shadow-glass-hover hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group border border-white/40`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-bl-full blur-2xl -z-10" />
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white/60 dark:bg-gray-800/60 shadow-sm backdrop-blur-md transform group-hover:scale-105 transition-transform duration-300`}>
                    <Icon size={26} className={card.iconColor} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-white/50 dark:bg-gray-800/50 backdrop-blur-md px-3 py-1.5 rounded-full">{card.trend}</span>
                </div>
                <div>
                  <div className="text-gray-900 dark:text-gray-100 text-4xl font-black tracking-tight leading-none mb-1">
                    {card.isPercent ? card.value : <AnimatedNumber value={card.value} />}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm font-bold">{card.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 p-8 shadow-glass relative">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-gray-900 dark:text-gray-100 font-black text-xl">Attendance Trend</h3>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">Last 7 Days Average</p>
            </div>
            <div className="flex items-center gap-2 bg-pastel-blue/30 px-3 py-1.5 rounded-full border border-pastel-blue">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-bold text-blue-700">Live Data</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={d => new Date(d).toLocaleDateString('en', { weekday: 'short' })} dy={10} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(243, 244, 246, 0.6)' }} />
              <Bar dataKey="attendance_rate" radius={[12, 12, 12, 12]} maxBarSize={48}>
                {trends.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === trends.length - 1 ? '#6941C6' : '#E0F2FE'} className="transition-all duration-300 hover:opacity-80" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Today's Schedule */}
        <div className="bg-pastel-purple/30 rounded-[32px] border border-pastel-purple p-8 shadow-glass">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-gray-900 dark:text-gray-100 font-black text-xl">Today's Schedule</h3>
            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
              <Calendar size={18} className="text-brand-purple" />
            </div>
          </div>
          
          <div className="space-y-4">
            {schedule.map((s, i) => (
              <div key={i} className="group relative p-4 rounded-2xl bg-white dark:bg-gray-800 hover:shadow-glass transition-all duration-300 cursor-pointer border border-transparent hover:border-brand-purple/20">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 bg-pastel-purple text-brand-purple`}>
                    {s.subject_code?.slice(0, 2) || '??'}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-gray-900 dark:text-gray-100 font-bold text-sm truncate">{s.subject_name || s.subject_code}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold mt-1">{s.time_slot} • Room {s.room_no}</p>
                  </div>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-brand-light flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 shadow-sm">
                  <ArrowRight size={16} className="text-brand-purple" />
                </div>
              </div>
            ))}
            {schedule.length === 0 && (
              <div className="text-center py-12">
                <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 font-bold">No classes scheduled today.</p>
              </div>
            )}
          </div>
          
          <button className="w-full mt-6 py-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:border-brand-purple/30 hover:text-brand-purple hover:shadow-glass transition-all">
            View Full Timetable
          </button>
        </div>
      </div>

      {/* ── Bottom Row: Zone Donut + Pending Actions + Calendar ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Zone Distribution Donut */}
        <div className="bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 p-8 shadow-glass relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#10b981] via-[#f59e0b] to-[#ef4444] opacity-30" />
          <h3 className="text-gray-900 dark:text-gray-100 font-black text-xl mb-6">Attendance Status</h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={zoneData} dataKey="value" cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" paddingAngle={4} strokeWidth={0}>
                  {zoneData.map((d, i) => <Cell key={i} fill={d.color} className="hover:opacity-80 transition-opacity outline-none" />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} itemStyle={{ fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="block text-4xl font-black text-gray-900 dark:text-gray-100">{summary?.totalStudents || 0}</span>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total</span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-6 px-2">
            {zoneData.map(z => (
              <div key={z.name} className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: z.color }} />
                  <span className="font-black text-gray-900 dark:text-gray-100">{z.value}</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{z.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions */}
        <div 
          onClick={() => { if(alerts.length > 0) setShowAlertsModal(true); }}
          className={`bg-brand-purple rounded-[32px] p-8 shadow-[0_20px_40px_rgba(105,65,198,0.2)] relative overflow-hidden ${alerts.length > 0 ? 'cursor-pointer hover:shadow-[0_20px_50px_rgba(105,65,198,0.3)] transition-all group' : ''}`}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-bl-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-tr-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-white font-black text-xl">Action Required</h3>
            {alerts.length > 0 && <span className="text-white/60 text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">View All</span>}
          </div>
          <div className="space-y-4 relative z-10">
            {alerts.length > 0 ? (
              <>
                {alerts.slice(0, 3).map((a, i) => (
                  <div key={i} className="group/item p-4 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 backdrop-blur-md transition-all shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl mt-0.5 ${a.type === 'critical' ? 'bg-red-400/20 text-red-300' : 'bg-amber-400/20 text-amber-300'}`}>
                        {a.type === 'critical' ? <AlertTriangle size={16} /> : <FileText size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-sm truncate">{a.title}</h4>
                        <p className="text-brand-light/80 text-xs mt-1 font-bold">{a.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {alerts.length > 3 && (
                  <div className="text-center pt-2">
                    <span className="text-white/60 text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                      + {alerts.length - 3} more
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                  <CheckCircle size={24} className="text-white" />
                </div>
                <p className="text-white font-bold">All caught up!</p>
                <p className="text-brand-light/80 text-sm mt-1">No pending actions required.</p>
              </div>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div className="flex flex-col">
          <MiniCalendar />
        </div>
      </div>
      
      <AttendanceMatrix 
        externalClassId={selectedClass}
        onExternalClassChange={setSelectedClass}
      />

      {/* ── Student Overview Table ── */}
      <div className="bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 shadow-glass overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 lg:px-8 border-b border-gray-50">
          <div>
            <h3 className="text-gray-900 dark:text-gray-100 font-black text-xl">Student List</h3>
            <p className="text-gray-400 text-xs font-bold mt-1">Manage and view individual attendance</p>
          </div>
          <div className="mt-4 sm:mt-0 relative w-full sm:w-72">
            <input type="text" placeholder="Search by name or roll no..."
              className="w-full h-11 pl-4 pr-10 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple/20 transition-all focus:outline-none"
              value={search} onChange={e => setSearch(e.target.value)} />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 shadow-sm">/</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-left px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Student Info</th>
                <th className="text-left px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Roll No</th>
                <th className="text-center px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Present</th>
                <th className="text-center px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Absent</th>
                <th className="text-center px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Attendance %</th>
                <th className="text-center px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map((s, idx) => (
                <tr key={s.student_id} className="hover:bg-pastel-blue/10 transition-colors group cursor-pointer"
                  style={{ animation: `fadeIn 0.4s ease-out ${idx * 60}ms both` }}>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-2xl bg-pastel-blue text-blue-700 flex items-center justify-center text-sm font-black shadow-sm">
                          {s.student_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${s.zone === 'green' ? 'bg-[#10b981]' : s.zone === 'yellow' ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'}`} />
                      </div>
                      <span className="text-gray-900 dark:text-gray-100 font-bold text-sm group-hover:text-brand-purple transition-colors">{s.student_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono font-bold tracking-tight">{s.roll_no}</td>
                  <td className="text-center px-4 py-4 text-sm font-black text-[#10b981]">{s.total_present}</td>
                  <td className="text-center px-4 py-4 text-sm font-black text-[#ef4444]">{s.total_absent}</td>
                  <td className="text-center px-4 py-4">
                    <div className="flex justify-center">
                      <CircleProgress pct={Number(s.attendance_pct) || 0} />
                    </div>
                  </td>
                  <td className="text-center px-8 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      s.zone === 'green' ? 'bg-pastel-mint text-emerald-700' :
                      s.zone === 'yellow' ? 'bg-pastel-peach text-amber-700' :
                      'bg-pastel-pink text-red-700'
                    }`}>
                      {s.zone === 'green' ? 'On Track' : s.zone === 'yellow' ? 'Warning' : 'Critical'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-900 mb-4">
                      <Users size={24} className="text-gray-300" />
                    </div>
                    <p className="text-gray-900 dark:text-gray-100 font-bold">No students found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search query.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Alerts Modal */}
      {showAlertsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowAlertsModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-gray-900 dark:text-gray-100 font-black text-2xl">Action Required</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">Review all alerts and pending tasks</p>
              </div>
              <button 
                onClick={() => setShowAlertsModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {alerts.map((a, i) => (
                <div key={i} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 hover:border-brand-purple/30 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl mt-1 ${a.type === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                      {a.type === 'critical' ? <AlertTriangle size={20} /> : <FileText size={20} />}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-gray-900 dark:text-gray-100 font-bold text-lg">{a.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{a.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
