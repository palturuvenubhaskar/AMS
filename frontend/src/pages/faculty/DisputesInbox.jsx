import { useState, useEffect } from 'react';
import api from '../../services/api';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

export default function DisputesInbox() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/attendance-disputes/pending');
      setDisputes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id, status) => {
    const remarks = window.prompt(`Enter remarks for marking as ${status} (optional):`);
    if (remarks === null) return; // cancelled

    try {
      await api.put(`/attendance-disputes/${id}/resolve`, { status, remarks });
      fetchDisputes();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resolve dispute.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 md:w-12 h-10 md:h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Disputes Inbox</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Review student attendance appeals and justifications.</p>
      </div>

      <div className="bg-white dark:bg-[#12141d] rounded-3xl shadow-glass border border-slate-200 dark:border-[#222430] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#050505]">
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date & Time</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Subject & Class</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Reason</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {disputes.map(d => (
                <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 md:px-6 py-4">
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{new Date(d.date).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{d.time_slot}</div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{d.student_name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{d.roll_no}</div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{d.subject_name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{d.class_name}-{d.section}</div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      d.type === 'dispute' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {d.type}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" title={d.reason}>{d.reason}</div>
                    {d.proof_url && (
                      <a href={d.proof_url} target="_blank" rel="noreferrer" className="text-xs text-brand-purple hover:underline mt-1 inline-block">View Proof</a>
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleResolve(d.id, 'approved')}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                        title="Approve"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button 
                        onClick={() => handleResolve(d.id, 'rejected')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Reject"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {disputes.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <ShieldAlert size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="font-bold text-slate-900 dark:text-slate-100">All clear!</p>
                    <p className="text-sm mt-1">No pending disputes or justifications.</p>
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
