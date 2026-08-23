import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Activity, CheckCircle2, XCircle, Clock, AlertTriangle, Info, Calendar, ShieldAlert } from 'lucide-react';

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

export default function MyAttendance() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disputeModal, setDisputeModal] = useState({ open: false, record: null, type: 'justification', reason: '', proofUrl: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [sumRes, recRes] = await Promise.all([
        api.get(`/students/me/attendance/summary`).catch(() => ({ data: {} })),
        api.get(`/students/me/attendance`).catch(() => ({ data: [] })),
      ]);
      setSummary(sumRes.data);
      setRecords(recRes.data);
    } catch (e) { 
      console.error(e); 
    }
    setLoading(false);
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/attendance-records/${disputeModal.record.id}/disputes`, {
        type: disputeModal.type,
        reason: disputeModal.reason,
        proofUrl: disputeModal.proofUrl || ''
      });
      alert('Request submitted successfully.');
      setDisputeModal({ open: false, record: null, type: 'justification', reason: '', proofUrl: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error submitting request');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-palette-medium border-t-transparent rounded-full animate-spin drop-shadow-md" />
      </div>
    );
  }

  const pct = Number(summary?.attendance_pct) || 0;
  const zone = summary?.zone || (pct >= 75 ? 'green' : pct >= 40 ? 'yellow' : 'red');

  const zoneConfig = {
    green: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 size={20} className="text-emerald-500" />, text: 'Safe Zone — You are eligible for auto-approved leaves.' },
    yellow: { color: 'text-palette-dark', bg: 'bg-palette-light/20', border: 'border-palette-medium/50', icon: <AlertTriangle size={20} className="text-palette-medium" />, text: 'Warning Zone — Leave requests will require manual faculty review.' },
    red: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: <XCircle size={20} className="text-red-500" />, text: 'Critical Zone — Leaves auto-rejected. Immediate improvement required.' }
  };
  const activeZone = zoneConfig[zone];

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-gray-100 text-3xl font-black tracking-tight mb-1">My Attendance</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            {user?.studentInfo?.class_name}-{user?.studentInfo?.section} <span className="mx-2 text-gray-300">|</span> Roll No: <span className="font-mono text-gray-600 dark:text-gray-400">{user?.studentInfo?.roll_no}</span>
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#111111] rounded-[24px] border border-slate-200 dark:border-[#222] p-6 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-500 shadow-sm transform group-hover:scale-105 transition-transform duration-300">
              <Activity size={26} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <div className={`text-4xl font-black tracking-tight leading-none mb-1 ${activeZone.color}`}>
              {pct}%
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Attendance Rate</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] rounded-[24px] border border-slate-200 dark:border-[#222] p-6 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm transform group-hover:scale-105 transition-transform duration-300">
              <CheckCircle2 size={26} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <div className="text-gray-900 dark:text-gray-100 text-4xl font-black tracking-tight leading-none mb-1">
              <AnimatedNumber value={summary?.total_present || 0} />
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Classes Present</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] rounded-[24px] border border-slate-200 dark:border-[#222] p-6 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-red-400 to-rose-500 shadow-sm transform group-hover:scale-105 transition-transform duration-300">
              <XCircle size={26} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <div className="text-gray-900 dark:text-gray-100 text-4xl font-black tracking-tight leading-none mb-1">
              <AnimatedNumber value={summary?.total_absent || 0} />
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Classes Absent</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] rounded-[24px] border border-slate-200 dark:border-[#222] p-6 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm transform group-hover:scale-105 transition-transform duration-300">
              <Clock size={26} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <div className="text-gray-900 dark:text-gray-100 text-4xl font-black tracking-tight leading-none mb-1">
              <AnimatedNumber value={summary?.total_on_leave || 0} />
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Approved Leaves</div>
          </div>
        </div>
      </div>

      {/* Zone Status Banner */}
      <div className={`flex items-start gap-4 p-5 rounded-2xl border ${activeZone.bg} ${activeZone.border}`}>
        <div className="mt-0.5">{activeZone.icon}</div>
        <div>
          <h4 className={`text-sm font-bold ${activeZone.color}`}>Attendance Status</h4>
          <p className={`text-sm mt-0.5 font-medium ${activeZone.color.replace('600', '700')}`}>{activeZone.text}</p>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white dark:bg-[#111111] rounded-[24px] border border-slate-200 dark:border-[#222] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-white/50 dark:bg-[#111111]/50 backdrop-blur-sm">
          <h3 className="text-gray-900 dark:text-gray-100 font-bold text-lg">Attendance History</h3>
          <p className="text-gray-400 text-xs font-medium mt-1">Detailed log of your recent classes</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-left px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Date & Time</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Subject</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Faculty</th>
                <th className="text-center px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Mode</th>
                <th className="text-center px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((r, idx) => (
                <tr key={r.id} className="hover:bg-gray-50/80 transition-colors" style={{ animation: `fadeIn 0.3s ease-out ${idx * 40}ms both` }}>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 dark:text-gray-100 font-bold text-sm">{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <div className="text-gray-400 text-xs font-medium mt-0.5 flex items-center gap-1"><Clock size={12} /> {r.time_slot}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 dark:text-gray-100 font-bold text-sm">{r.subject_name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-400">{r.faculty_name}</td>
                  <td className="text-center px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      r.mode === 'frs' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-palette-light/20 text-palette-dark border border-blue-100'
                    }`}>
                      {r.mode}
                    </span>
                  </td>
                  <td className="text-center px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                        r.status === 'present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                        r.status === 'on_leave' ? 'bg-palette-light/20 text-palette-dark border border-amber-100' : 
                        'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {r.status}
                      </span>
                      {r.status === 'absent' && (
                        <button 
                          onClick={() => setDisputeModal({ open: true, record: r, type: 'justification', reason: '', proofUrl: '' })}
                          className="text-[10px] bg-slate-100 dark:bg-[#111111] hover:bg-slate-200 dark:bg-[#222] text-gray-600 dark:text-gray-400 px-2 py-1 rounded font-bold transition-colors"
                          title="Dispute or Justify"
                        >
                          APPEAL
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-black mb-4">
                      <Calendar size={24} className="text-gray-300" />
                    </div>
                    <p className="text-gray-900 dark:text-gray-100 font-bold">No attendance records yet</p>
                    <p className="text-gray-400 text-sm mt-1">Check back after your first class.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Modal */}
      {disputeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111111] rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Appeal Absence</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              For {new Date(disputeModal.record?.date).toLocaleDateString()} - {disputeModal.record?.subject_name}
            </p>
            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Appeal Type</label>
                <select 
                  className="w-full border-slate-200 dark:border-[#222] rounded-xl focus:ring-brand-purple focus:border-brand-purple"
                  value={disputeModal.type}
                  onChange={e => setDisputeModal(prev => ({...prev, type: e.target.value}))}
                >
                  <option value="justification">Justify (Convert to Leave)</option>
                  <option value="dispute">Dispute (Mark as Present)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                <textarea 
                  required
                  className="w-full border-slate-200 dark:border-[#222] rounded-xl focus:ring-brand-purple focus:border-brand-purple"
                  rows="3"
                  value={disputeModal.reason}
                  onChange={e => setDisputeModal(prev => ({...prev, reason: e.target.value}))}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Proof URL (Optional)</label>
                <input 
                  type="url"
                  className="w-full border-slate-200 dark:border-[#222] rounded-xl focus:ring-brand-purple focus:border-brand-purple"
                  placeholder="Link to doctor note, etc."
                  value={disputeModal.proofUrl}
                  onChange={e => setDisputeModal(prev => ({...prev, proofUrl: e.target.value}))}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setDisputeModal(prev => ({...prev, open: false}))} className="px-4 py-2 font-bold text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:bg-[#111111] rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold text-white bg-brand-purple hover:bg-brand-purple/90 rounded-xl shadow-md">Submit Appeal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
