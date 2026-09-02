import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function LeaveInbox() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});

  const [selected, setSelected] = useState(new Set());
  const [bulkRemarks, setBulkRemarks] = useState('');

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    try {
      const { data } = await api.get('/leave-requests/pending');
      setLeaves(data);
      setSelected(new Set());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const review = async (id, status) => {
    try {
      await api.put(`/leave-requests/${id}`, { status, remarks: remarks[id] || '' });
      toast.success(`Leave ${status}!`);
      fetchPending();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const bulkReview = async (status) => {
    if (selected.size === 0) return;
    try {
      await api.put('/leave-requests/bulk-review', { 
        leaveIds: Array.from(selected), 
        status, 
        remarks: bulkRemarks 
      });
      toast.success(`${selected.size} leaves ${status}!`);
      setBulkRemarks('');
      fetchPending();
    } catch (e) { toast.error(e.response?.data?.error || 'Bulk review failed'); }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelected(newSelected);
  };

  return (
    <div>
      <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-black tracking-tight">Leave Inbox</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1 mb-8">Review Yellow Zone leave requests (40-75% attendance)</p>

      {leaves.length === 0 ? (
        <div className="bg-white/60 dark:bg-[#12141d]/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-glass p-16 text-center max-w-2xl mx-auto mt-12">
          <div className="w-24 h-24 bg-brand-purple/10 text-brand-purple rounded-full flex items-center justify-center text-2xl md:text-4xl mx-auto mb-6">
            📫
          </div>
          <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold mb-2">No pending requests</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium">All yellow zone leave requests have been processed</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/60 dark:bg-[#12141d]/60 p-4 rounded-2xl border border-white/50 shadow-sm gap-4">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-brand-purple focus:ring-brand-purple"
                checked={leaves.length > 0 && selected.size === leaves.length}
                onChange={e => {
                  if (e.target.checked) setSelected(new Set(leaves.map(l => l.id)));
                  else setSelected(new Set());
                }}
              />
              <span className="font-bold text-gray-700 dark:text-gray-300">Select All ({selected.size} selected)</span>
            </div>
            {selected.size > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                <input 
                  type="text" 
                  placeholder="Bulk remarks..." 
                  className="px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-[#222430] focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                  value={bulkRemarks}
                  onChange={e => setBulkRemarks(e.target.value)}
                />
                <button 
                  className="bg-green-100 hover:bg-green-200 text-green-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors"
                  onClick={() => bulkReview('approved')}
                >Approve Selected</button>
                <button 
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors"
                  onClick={() => bulkReview('rejected')}
                >Reject Selected</button>
              </div>
            )}
          </div>

          {leaves.map(l => (
            <div key={l.id} className="bg-white/60 dark:bg-[#12141d]/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-glass p-4 md:p-8 transition-all hover:bg-white/80 dark:bg-[#12141d]/80 flex gap-4">
              <div className="pt-1">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-brand-purple focus:ring-brand-purple"
                  checked={selected.has(l.id)}
                  onChange={() => toggleSelect(l.id)}
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold flex items-center gap-2">
                      {l.student_name} 
                      <span className="font-mono text-xs bg-slate-100 dark:bg-[#12141d] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">{l.roll_no}</span>
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">Class: {l.class_name}-{l.section}</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
                    🟡 Yellow Zone — {l.attendance_pct_snapshot}%
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 bg-gray-50/50 rounded-2xl p-4 md:p-6 mb-6 border border-slate-200 dark:border-[#222430]/50">
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">From</span><p className="font-bold text-slate-900 dark:text-slate-100">{new Date(l.from_date).toLocaleDateString()}</p></div>
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">To</span><p className="font-bold text-slate-900 dark:text-slate-100">{new Date(l.to_date).toLocaleDateString()}</p></div>
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Reason</span><p className="font-bold text-slate-900 dark:text-slate-100">{l.reason}</p></div>
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Attendance</span><p className="font-black text-yellow-600">{l.attendance_pct_snapshot}%</p></div>
                </div>
                
                {l.description && (
                  <div className="mb-6 pl-4 border-l-4 border-slate-200 dark:border-[#222430]">
                    <p className="text-gray-600 dark:text-gray-400 italic text-sm">"{l.description}"</p>
                  </div>
                )}
                
                <div className="mb-6">
                  <input 
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#12141d] border border-slate-200 dark:border-[#222430] text-slate-900 dark:text-slate-100 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple/30 transition-all shadow-sm" 
                    placeholder="Add remarks (optional)..." 
                    value={remarks[l.id] || ''} 
                    onChange={e => setRemarks(p => ({...p, [l.id]: e.target.value}))} 
                  />
                </div>
                
                <div className="flex gap-3">
                  <button className="px-4 md:px-6 py-3 rounded-xl bg-green-100 text-green-700 font-bold hover:bg-green-200 transition-colors shadow-sm" onClick={() => review(l.id, 'approved')}>✓ Approve Request</button>
                  <button className="px-4 md:px-6 py-3 rounded-xl bg-red-100 text-red-700 font-bold hover:bg-red-200 transition-colors shadow-sm" onClick={() => review(l.id, 'rejected')}>✗ Reject Request</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
