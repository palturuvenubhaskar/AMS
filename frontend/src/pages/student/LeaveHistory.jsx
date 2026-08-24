import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function LeaveHistory() {
  const [leaves, setLeaves] = useState([]);
  useEffect(() => { api.get('/leave-requests/my').then(r => setLeaves(r.data)).catch(console.error); }, []);

  return (
    <div className="animate-[fadeIn_0.5s_ease-out] font-sans">
      <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-black tracking-tight mb-8">My Leave Requests</h1>
      <div className="bg-white/60 dark:bg-[#12141d]/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white/40 dark:bg-[#12141d]/40 border-b border-gray-100/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">From</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">To</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Zone</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance %</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Decision By</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#222430]/50 bg-white/20">
              {leaves.map(l => (
                <tr key={l.id} className="hover:bg-white/40 dark:bg-[#12141d]/40 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{new Date(l.from_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{new Date(l.to_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-400">{l.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${l.zone === 'green' ? 'bg-emerald-100 text-emerald-700' : l.zone === 'yellow' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {l.zone}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-slate-100">{l.attendance_pct_snapshot}%</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${l.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : l.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-400">{l.decision_by || '—'}</td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-400">{l.remarks || '—'}</td>
                </tr>
              ))}
              {leaves.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400 font-medium">No leave requests found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
