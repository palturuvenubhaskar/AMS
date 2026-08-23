import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { set, get, del, keys } from 'idb-keyval';

export default function TakeAttendance() {
  const [step, setStep] = useState(1);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('');
  const [mode, setMode] = useState('manual');
  const [isScanning, setIsScanning] = useState(false);
  const [records, setRecords] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { api.get('/classes').then(r => setClasses(r.data)); }, []);

  useEffect(() => {
    if (selectedClass) {
      api.get(`/classes/${selectedClass}/subjects`).then(r => setSubjects(r.data));
      api.get(`/classes/${selectedClass}/students`).then(r => {
        setStudents(r.data);
        const init = {};
        r.data.forEach(s => { init[s.id] = 'present'; });
        setRecords(init);
      });
    }
  }, [selectedClass]);

  useEffect(() => {
    const syncOfflineData = async () => {
      if (navigator.onLine) {
        const ks = await keys();
        for (const k of ks) {
          if (typeof k === 'string' && k.startsWith('sync_attendance_')) {
            try {
              const payload = await get(k);
              const session = await api.post('/attendance-sessions', {
                classId: payload.classId,
                subjectId: payload.subjectId,
                date: payload.date,
                timeSlot: payload.timeSlot,
                mode: payload.mode,
              });
              await api.post(`/attendance-sessions/${session.data.id}/records`, { records: payload.records });
              await del(k);
              toast.success(`Synced offline attendance for ${payload.date} ${payload.timeSlot}`);
            } catch (e) {
              console.error('Failed to sync', k, e);
            }
          }
        }
      }
    };
    
    window.addEventListener('online', syncOfflineData);
    syncOfflineData(); // Check on mount
    return () => window.removeEventListener('online', syncOfflineData);
  }, []);

  const toggleStatus = (id) => {
    setRecords(prev => ({ ...prev, [id]: prev[id] === 'present' ? 'absent' : 'present' }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => { updated[s.id] = status; });
    setRecords(updated);
  };

  const simulateFRSScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const updated = {};
      students.forEach(s => {
        updated[s.id] = Math.random() > 0.15 ? 'present' : 'absent';
      });
      setRecords(updated);
      setIsScanning(false);
      toast.success('FRS scan complete. Please review the results.');
    }, 2500);
  };

  const submit = async () => {
    if (!selectedClass || !selectedSubject || !date || !timeSlot) {
      return toast.error('Please fill all fields');
    }
    setSubmitting(true);
    try {
      if (!navigator.onLine) throw new Error('OFFLINE');

      // Create session
      const session = await api.post('/attendance-sessions', {
        classId: parseInt(selectedClass),
        subjectId: parseInt(selectedSubject),
        date,
        timeSlot,
        mode: mode,
      });

      // Mark attendance
      const recordsArray = Object.entries(records).map(([studentId, status]) => ({
        studentId: parseInt(studentId),
        status,
      }));

      const res = await api.post(`/attendance-sessions/${session.data.id}/records`, { records: recordsArray });

      const present = recordsArray.filter(r => r.status === 'present').length;
      const absent = recordsArray.filter(r => r.status === 'absent').length;
      setResult({ present, absent, total: recordsArray.length, offline: false });
      setStep(4);
      toast.success('Attendance recorded successfully!');
    } catch (err) {
      if (err.message === 'OFFLINE' || !navigator.onLine || err.code === 'ERR_NETWORK') {
        const recordsArray = Object.entries(records).map(([studentId, status]) => ({
          studentId: parseInt(studentId),
          status,
        }));
        const payload = {
          classId: parseInt(selectedClass),
          subjectId: parseInt(selectedSubject),
          date, timeSlot, mode,
          records: recordsArray,
          timestamp: Date.now()
        };
        const id = `sync_attendance_${Date.now()}`;
        await set(id, payload);
        toast.success('Offline mode: Attendance saved locally. Will sync when online.', { duration: 5000 });
        
        const present = recordsArray.filter(r => r.status === 'present').length;
        const absent = recordsArray.filter(r => r.status === 'absent').length;
        setResult({ present, absent, total: recordsArray.length, offline: true });
        setStep(4);
      } else {
        toast.error(err.response?.data?.error || 'Failed to submit attendance');
      }
    }
    setSubmitting(false);
  };

  const selectedClassName = classes.find(c => c.id == selectedClass);
  const selectedSubjectName = subjects.find(s => s.id == selectedSubject);

  return (
    <div>
      <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-black tracking-tight">Take Attendance</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1 mb-8">Record attendance for any class in 4 simple steps</p>

      {/* Steps indicator */}
      <div className="flex gap-3 mb-8">
        {['Select Class', 'Select Subject & Time', 'Mark Attendance', 'Done'].map((label, i) => (
          <div key={i} className={`flex-1 px-4 py-3 rounded-2xl text-xs font-bold text-center transition-all ${
            step > i 
              ? 'bg-brand-purple/10 text-brand-purple border-b-2 border-brand-purple/30' 
              : step === i + 1 
                ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30 border-b-2 border-transparent scale-[1.02]' 
                : 'bg-white/60 dark:bg-[#111111]/60 backdrop-blur-md text-gray-400 border border-white/50 border-b-2 border-b-transparent'
          }`}>
            {i+1}. {label}
          </div>
        ))}
      </div>

      {/* Step 1: Select Class */}
      {step === 1 && (
        <div className="bg-white/60 dark:bg-[#111111]/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-glass p-8 max-w-2xl">
          <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg mb-6">Step 1: Select Class</h3>
          <div className="mb-6">
            <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Class</label>
            <select 
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple/30 transition-all appearance-none cursor-pointer"
              value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
            >
              <option value="">-- Select Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.department_code} {c.name}-{c.section} (Sem {c.semester}) — {c.student_count} students</option>)}
            </select>
          </div>
          <button 
            className="w-full py-3.5 rounded-xl bg-brand-purple text-white font-bold shadow-lg shadow-brand-purple/30 hover:opacity-90 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            disabled={!selectedClass} onClick={() => setStep(2)}>Next →</button>
        </div>
      )}

      {/* Step 2: Subject & Time */}
      {step === 2 && (
        <div className="bg-white/60 dark:bg-[#111111]/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-glass p-8 max-w-2xl">
          <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg mb-6">Step 2: Subject & Time Slot</h3>
          
          <div className="mb-5">
            <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Subject</label>
            <select 
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple/30 transition-all appearance-none cursor-pointer"
              value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
            >
              <option value="">-- Select Subject --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple/30 transition-all"
                value={date} onChange={e => {
                  const day = new Date(e.target.value).getDay();
                  if (day === 0) return toast.error('Cannot select a Sunday (Holiday).');
                  setDate(e.target.value);
                }} 
              />
            </div>
            <div>
              <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Time Slot</label>
              <select 
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple/30 transition-all appearance-none cursor-pointer"
                value={timeSlot} onChange={e => setTimeSlot(e.target.value)}
              >
                <option value="">-- Select --</option>
                <option value="09:00-10:10">09:00 - 10:10 (P1)</option>
                <option value="10:25-11:30">10:25 - 11:30 (P2)</option>
                <option value="11:30-12:30">11:30 - 12:30 (P3)</option>
                <option value="13:15-14:15">13:15 - 14:15 (P4)</option>
                <option value="14:15-15:15">14:15 - 15:15 (P5)</option>
                <option value="15:15-16:00">15:15 - 16:00 (P6)</option>
              </select>
            </div>
          </div>
          
          <div className="mb-8">
            <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">Attendance Mode</label>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 cursor-pointer transition-all ${mode === 'manual' ? 'border-brand-purple bg-brand-purple/5 text-brand-purple' : 'border-slate-200 dark:border-[#222] bg-white dark:bg-[#111111] text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:bg-black'}`}>
                <input type="radio" value="manual" checked={mode === 'manual'} onChange={e => setMode(e.target.value)} className="hidden" />
                <span className="font-bold text-sm">Manual Entry</span>
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 cursor-pointer transition-all ${mode === 'frs' ? 'border-brand-purple bg-brand-purple/5 text-brand-purple' : 'border-slate-200 dark:border-[#222] bg-white dark:bg-[#111111] text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:bg-black'}`}>
                <input type="radio" value="frs" checked={mode === 'frs'} onChange={e => setMode(e.target.value)} className="hidden" />
                <span className="font-bold text-sm">Facial Recognition</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 py-3.5 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222] text-gray-600 dark:text-gray-400 font-bold hover:bg-slate-50 dark:bg-black transition-all" onClick={() => setStep(1)}>← Back</button>
            <button 
              className="flex-[2] py-3.5 rounded-xl bg-brand-purple text-white font-bold shadow-lg shadow-brand-purple/30 hover:opacity-90 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed" 
              disabled={!selectedSubject || !timeSlot} onClick={() => setStep(3)}>Next →</button>
          </div>
        </div>
      )}

      {/* Step 3: Mark Attendance */}
      {step === 3 && (
        <div className="bg-white/60 dark:bg-[#111111]/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-glass p-8 max-w-4xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold">
                {selectedClassName && `${selectedClassName.name}-${selectedClassName.section}`} | {selectedSubjectName?.name} | {date} | {timeSlot}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                {students.length} students | <span className="text-green-600 font-bold">{Object.values(records).filter(r=>r==='present').length} Present</span>, <span className="text-red-600 font-bold">{Object.values(records).filter(r=>r==='absent').length} Absent</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded-xl bg-green-100 text-green-700 font-bold text-sm hover:bg-green-200 transition-colors" onClick={() => markAll('present')}>✓ Mark All Present</button>
              <button className="px-4 py-2 rounded-xl bg-red-100 text-red-700 font-bold text-sm hover:bg-red-200 transition-colors" onClick={() => markAll('absent')}>✗ Mark All Absent</button>
            </div>
          </div>

          {mode === 'frs' && (
            <div className="bg-brand-purple/5 border-2 border-brand-purple/20 rounded-2xl p-10 text-center mb-8 shadow-inner">
              {!isScanning ? (
                <>
                  <div className="text-5xl mb-4">📷</div>
                  <h4 className="text-slate-900 dark:text-slate-100 text-lg font-bold mb-2">Facial Recognition System</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-6">Make sure the classroom camera is connected and positioned correctly.</p>
                  <button className="px-6 py-3 rounded-xl bg-brand-purple text-white font-bold shadow-lg shadow-brand-purple/30 hover:opacity-90 transition-all" onClick={simulateFRSScan}>Start FRS Scan</button>
                </>
              ) : (
                <>
                  <div className="inline-block w-12 h-12 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin mb-4"></div>
                  <h4 className="text-slate-900 dark:text-slate-100 font-bold">Scanning faces... Please wait.</h4>
                </>
              )}
            </div>
          )}

          <div className="space-y-3">
            {students.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between bg-white dark:bg-[#111111] rounded-2xl p-4 border border-slate-200 dark:border-[#222] shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <span className="w-6 text-gray-400 font-bold text-xs">{i+1}</span>
                  <span className="font-mono text-gray-500 dark:text-gray-400 text-sm bg-slate-50 dark:bg-black px-2 py-1 rounded">{s.roll_no}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{s.full_name}</span>
                </div>
                <div className="flex bg-slate-50 dark:bg-black p-1 rounded-xl border border-slate-200 dark:border-[#222]">
                  <button 
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${records[s.id] === 'present' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:text-gray-400'}`}
                    onClick={() => setRecords(p => ({...p, [s.id]: 'present'}))}
                  >Present</button>
                  <button 
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${records[s.id] === 'absent' ? 'bg-red-100 text-red-700 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:text-gray-400'}`}
                    onClick={() => setRecords(p => ({...p, [s.id]: 'absent'}))}
                  >Absent</button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
            <button className="flex-1 py-3.5 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222] text-gray-600 dark:text-gray-400 font-bold hover:bg-slate-50 dark:bg-black transition-all max-w-[200px]" onClick={() => setStep(2)}>← Back</button>
            <button 
              className="flex-[2] py-3.5 rounded-xl bg-brand-purple text-white font-bold shadow-lg shadow-brand-purple/30 hover:opacity-90 transition-all disabled:opacity-50" 
              onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting...' : '✓ Submit Attendance'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 4 && result && (
        <div className="bg-white/60 dark:bg-[#111111]/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-glass p-12 max-w-lg mx-auto text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
            ✓
          </div>
          <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-black mb-2">
            {result.offline ? 'Attendance Saved Offline!' : 'Attendance Submitted!'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-10">
            {selectedSubjectName?.name} — {date} — {timeSlot}
          </p>
          
          <div className="flex justify-center gap-12 mb-10">
            <div>
              <div className="text-4xl font-black text-green-600 mb-1">{result.present}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Present</div>
            </div>
            <div>
              <div className="text-4xl font-black text-red-600 mb-1">{result.absent}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Absent</div>
            </div>
            <div>
              <div className="text-4xl font-black text-brand-purple mb-1">{result.total}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</div>
            </div>
          </div>
          
          <button 
            className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold shadow-lg hover:opacity-90 transition-all" 
            onClick={() => { setStep(1); setResult(null); setSelectedClass(''); setSelectedSubject(''); setRecords({}); }}>
            Take Another Attendance
          </button>
        </div>
      )}
    </div>
  );
}
