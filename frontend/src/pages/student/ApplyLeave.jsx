import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const REASONS = ['Medical', 'Family Emergency', 'Personal', 'Event/Competition', 'Travel', 'Other'];

export default function ApplyLeave() {
  const { user } = useAuth();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [zonePreview, setZonePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const classId = user?.studentInfo?.class_id;

  useEffect(() => {
    if (classId) {
      api.get(`/leave-requests/zone-preview?classId=${classId}`).then(r => setZonePreview(r.data));
    }
  }, [classId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate || !reason) return toast.error('Please fill all required fields');
    setSubmitting(true);
    try {
      const { data } = await api.post('/leave-requests', { classId, fromDate, toDate, reason, description });
      setSubmitted(data);
      toast.success('Leave request submitted!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-[32px] p-12 max-w-lg mx-auto mt-12 shadow-glass text-center animate-[fadeIn_0.5s_ease-out]">
        <div className="text-6xl mb-6">
          {submitted.status === 'approved' ? '✅' : submitted.status === 'rejected' ? '❌' : '⏳'}
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-3">
          {submitted.status === 'approved' ? 'Leave Auto-Approved!' :
           submitted.status === 'rejected' ? 'Leave Auto-Rejected' : 'Leave Pending Review'}
        </h2>
        <p className="text-gray-500 font-medium mb-6">
          {submitted.status === 'approved' ? 'Your attendance is above 75%. Leave was auto-approved.' :
           submitted.status === 'rejected' ? `Your attendance is ${submitted.attendance_pct_snapshot}% (below 40%). Leave auto-rejected.` :
           'Your attendance is between 40-75%. A faculty member will review your request.'}
        </p>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold tracking-widest mb-8 ${
          submitted.zone === 'green' ? 'bg-emerald-100 text-emerald-700' :
          submitted.zone === 'yellow' ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          {submitted.zone === 'green' ? '🟢' : submitted.zone === 'yellow' ? '🟡' : '🔴'} {submitted.zone.toUpperCase()} ZONE — {submitted.attendance_pct_snapshot}%
        </div>
        <br />
        <button 
          className="bg-brand-purple hover:bg-brand-dark text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
          onClick={() => { setSubmitted(null); setFromDate(''); setToDate(''); setReason(''); setDescription(''); }}
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_0.5s_ease-out] font-sans">
      <h1 className="text-gray-900 text-3xl font-black tracking-tight mb-2">Apply for Leave</h1>
      <p className="text-gray-500 font-medium mb-8">Submit a leave request — your zone determines automatic processing</p>

      {/* Zone Preview */}
      {zonePreview && (
        <div className={`p-4 rounded-2xl mb-8 border ${
          zonePreview.zone === 'green' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
          zonePreview.zone === 'yellow' ? 'bg-amber-50 border-amber-100 text-amber-800' :
          'bg-red-50 border-red-100 text-red-800'
        }`}>
          <div>
            <strong className="font-black">Your Current Status:</strong> {zonePreview.attendancePct}% attendance
            <br/><span className="text-sm font-medium opacity-90 mt-1 block">{zonePreview.message}</span>
          </div>
        </div>
      )}

      <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-8 border border-white/50 shadow-glass max-w-2xl">
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">From Date <span className="text-red-500">*</span></label>
              <input type="date" className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-semibold rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/20 focus:border-brand-purple transition-all shadow-sm" value={fromDate} onChange={e => setFromDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">To Date <span className="text-red-500">*</span></label>
              <input type="date" className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-semibold rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/20 focus:border-brand-purple transition-all shadow-sm" value={toDate} onChange={e => setToDate(e.target.value)} required />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Reason <span className="text-red-500">*</span></label>
            <div className="relative">
              <select className="w-full appearance-none bg-white border border-gray-200 text-gray-900 text-sm font-semibold rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/20 focus:border-brand-purple transition-all shadow-sm cursor-pointer" value={reason} onChange={e => setReason(e.target.value)} required>
                <option value="">-- Select Reason --</option>
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▼</div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description <span className="text-gray-400 lowercase normal-case">(optional)</span></label>
            <textarea className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-semibold rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/20 focus:border-brand-purple transition-all shadow-sm min-h-[120px] resize-y" placeholder="Provide additional details..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          
          <button type="submit" className="w-full bg-brand-purple hover:bg-brand-dark text-white py-4 rounded-2xl text-sm font-black tracking-wide shadow-md shadow-brand-purple/20 hover:shadow-lg transition-all" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
