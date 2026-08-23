import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AttendanceHistory() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/classes').then(r => setClasses(r.data)); fetchSessions(); }, []);
  useEffect(() => { fetchSessions(); }, [classFilter]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = classFilter ? `?classId=${classFilter}` : '';
      const { data } = await api.get(`/attendance-sessions${params}`);
      setSessions(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-black tracking-tight">Attendance History</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">View all past attendance sessions</p>
        </div>
        <select 
          className="w-[240px] px-4 py-2.5 rounded-xl bg-white/60 dark:bg-[#111111]/60 backdrop-blur-md border border-white/50 text-slate-900 dark:text-slate-100 text-sm font-semibold shadow-glass focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all cursor-pointer appearance-none"
          value={classFilter} 
          onChange={e => setClassFilter(e.target.value)}
        >
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
        </select>
      </div>

      <div className="bg-white/60 dark:bg-[#111111]/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Class</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Time Slot</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Mode</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Faculty</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Present</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Absent</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#222]/50">
              {sessions.map(s => (
                <tr key={s.id} className="hover:bg-white/40 dark:bg-[#111111]/40 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{new Date(s.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{s.class_name}-{s.section}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">{s.subject_name}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">{s.time_slot}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.mode === 'frs' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {s.mode}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-400">{s.faculty_name}</td>
                  <td className="px-6 py-4 text-sm font-black text-green-600">{s.present_count}</td>
                  <td className="px-6 py-4 text-sm font-black text-red-600">{s.absent_count}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.status === 'closed' ? 'bg-green-100 text-green-700' : s.status === 'active' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">
                    No sessions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
