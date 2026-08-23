import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar as CalendarIcon, Save, Clock, ChevronRight, BookOpen, MapPin, User, X, Plus, Users, ArrowLeft, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = [1, 2, 3, 4, 5, 6]; // Monday to Saturday
const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetableSetup() {
  const [view, setView] = useState('classes'); // 'classes' | 'timetable'
  
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  
  // Data
  const [mappedSubjects, setMappedSubjects] = useState([]);
  const [faculties, setFaculties] = useState([]);
  
  // Timetable State
  const [periods, setPeriods] = useState([]); // [{ startTime, endTime }]
  const [grid, setGrid] = useState({}); // grid[day][periodIdx] = { subjectId, facultyId, room }
  
  // Modals
  const [setupModal, setSetupModal] = useState(false);
  const [cellModal, setCellModal] = useState(null); // { day, periodIdx, data }

  // Setup Form State
  const [setupCount, setSetupCount] = useState(6);
  const [setupPeriods, setSetupPeriods] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [clsRes, facRes] = await Promise.all([
        api.get('/classes'),
        api.get('/users?role=faculty')
      ]);
      setClasses(clsRes.data);
      setFaculties(facRes.data);
    } catch (err) {
      toast.error('Failed to load initial data');
    }
  };

  const handleClassClick = async (cls) => {
    setSelectedClass(cls);
    setView('timetable');
    
    try {
      // Fetch mapped subjects
      const subRes = await api.get(`/class-subjects/${cls.id}`);
      setMappedSubjects(subRes.data);

      // Fetch existing timetable
      const ttRes = await api.get(`/timetables?classId=${cls.id}`);
      const entries = ttRes.data;

      if (entries.length === 0) {
        // No timetable exists
        setPeriods([]);
        setGrid({});
      } else {
        // Extract unique periods from entries
        const uniquePeriods = [];
        entries.forEach(e => {
          const st = e.start_time.substring(0, 5);
          const et = e.end_time.substring(0, 5);
          if (!uniquePeriods.find(p => p.startTime === st && p.endTime === et)) {
            uniquePeriods.push({ startTime: st, endTime: et });
          }
        });
        // Sort periods by start time
        uniquePeriods.sort((a, b) => a.startTime.localeCompare(b.startTime));
        setPeriods(uniquePeriods);

        // Reconstruct Grid
        const initialGrid = {};
        DAYS.forEach(day => {
          initialGrid[day] = {};
          uniquePeriods.forEach((_, idx) => {
            initialGrid[day][idx] = { subjectId: '', facultyId: '', room: '' };
          });
        });

        entries.forEach(e => {
          const st = e.start_time.substring(0, 5);
          const pIdx = uniquePeriods.findIndex(p => p.startTime === st);
          if (pIdx !== -1 && DAYS.includes(e.day_of_week)) {
            initialGrid[e.day_of_week][pIdx] = {
              subjectId: e.subject_id,
              facultyId: e.faculty_id || '',
              room: e.room || ''
            };
          }
        });

        setGrid(initialGrid);
      }
    } catch (err) {
      toast.error('Failed to load class timetable');
    }
  };

  const openSetupModal = () => {
    setSetupCount(periods.length || 6);
    if (periods.length > 0) {
      setSetupPeriods([...periods]);
    } else {
      setSetupPeriods(Array(6).fill().map((_, i) => ({ startTime: '09:00', endTime: '10:00' })));
    }
    setSetupModal(true);
  };

  const handleSetupCountChange = (count) => {
    const val = parseInt(count) || 1;
    setSetupCount(val);
    setSetupPeriods(Array(val).fill().map((_, i) => ({ 
      startTime: setupPeriods[i]?.startTime || '09:00', 
      endTime: setupPeriods[i]?.endTime || '10:00' 
    })));
  };

  const updateSetupPeriod = (idx, field, val) => {
    const newP = [...setupPeriods];
    newP[idx][field] = val;
    setSetupPeriods(newP);
  };

  const applySetup = () => {
    // Validate
    for (const p of setupPeriods) {
      if (!p.startTime || !p.endTime) return toast.error('All periods must have times set.');
    }
    
    // Sort
    const sorted = [...setupPeriods].sort((a, b) => a.startTime.localeCompare(b.startTime));
    setPeriods(sorted);

    // Re-init grid but try to preserve data if times overlap (simple reset for now to avoid bugs)
    const newGrid = {};
    DAYS.forEach(day => {
      newGrid[day] = {};
      sorted.forEach((_, idx) => {
        newGrid[day][idx] = { subjectId: '', facultyId: '', room: '' };
      });
    });
    setGrid(newGrid);
    setSetupModal(false);
    toast.success('Periods configured. You can now build the grid.');
  };

  const openCellModal = (day, periodIdx) => {
    setCellModal({ day, periodIdx, data: { ...(grid[day]?.[periodIdx] || { subjectId: '', facultyId: '', room: '' }) } });
  };

  const handleSubjectSelectInModal = (subjectId) => {
    const defaultMapping = mappedSubjects.find(s => s.subject_id === parseInt(subjectId));
    setCellModal(prev => ({
      ...prev,
      data: {
        ...prev.data,
        subjectId,
        facultyId: defaultMapping?.faculty_id || ''
      }
    }));
  };

  const saveCellData = (e) => {
    e.preventDefault();
    const { day, periodIdx, data } = cellModal;
    setGrid(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [periodIdx]: data
      }
    }));
    setCellModal(null);
  };

  const saveTimetable = async () => {
    const slots = [];
    DAYS.forEach(day => {
      periods.forEach((p, idx) => {
        const cellData = grid[day]?.[idx];
        if (cellData && cellData.subjectId) {
          slots.push({
            subjectId: cellData.subjectId,
            facultyId: cellData.facultyId || null,
            room: cellData.room || null,
            dayOfWeek: day,
            startTime: p.startTime,
            endTime: p.endTime
          });
        }
      });
    });

    try {
      const toastId = toast.loading('Saving timetable...');
      await api.post('/timetables', { classId: selectedClass.id, slots });
      toast.success('Timetable saved successfully!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save timetable');
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out] font-sans pb-12">
      {/* Background Decorative Ambient Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-pastel-purple/40 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-pastel-pink/30 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 backdrop-blur-2xl p-8 rounded-[32px] border border-white/60 shadow-glass">
        <div className="flex items-center gap-4">
          {view === 'timetable' && (
            <button 
              onClick={() => setView('classes')}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white hover:bg-gray-50 text-gray-500 hover:text-brand-purple shadow-sm transition-all"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="w-14 h-14 bg-pastel-blue rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
            <CalendarIcon size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-gray-900 text-3xl font-black tracking-tight mb-1">
              {view === 'classes' ? 'Timetable Management' : `Timetable: ${selectedClass?.name} - ${selectedClass?.section}`}
            </h1>
            <p className="text-gray-500 text-sm font-bold">
              {view === 'classes' ? 'Select a class to view or edit its schedule' : `Semester ${selectedClass?.semester}`}
            </p>
          </div>
        </div>
      </div>

      {/* VIEW 1: Class List */}
      {view === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {classes.map(cls => (
            <div 
              key={cls.id}
              onClick={() => handleClassClick(cls)}
              className="bg-white/60 backdrop-blur-md p-8 rounded-[32px] border border-white/60 shadow-glass hover:shadow-glass-hover hover:-translate-y-1 hover:border-white transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-pastel-purple rounded-2xl flex items-center justify-center text-brand-purple shadow-sm group-hover:scale-105 transition-transform">
                  <Users size={28} />
                </div>
                <div className="bg-white text-gray-500 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                  Sem {cls.semester}
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-1">{cls.name}</h3>
              <p className="text-gray-500 font-bold">Section {cls.section}</p>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: Timetable Grid */}
      {view === 'timetable' && (
        <div className="bg-white/60 backdrop-blur-2xl rounded-[32px] border border-white/60 shadow-glass overflow-hidden animate-[fadeIn_0.3s]">
          {/* Toolbar */}
          <div className="p-8 border-b border-white/40 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white/40">
            <div>
              <h3 className="font-black text-gray-900 text-xl">Weekly Schedule</h3>
              <p className="text-gray-500 text-sm font-bold mt-1">Click any cell to edit. Save when done.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={openSetupModal}
                className="px-6 py-3 rounded-2xl text-sm font-bold bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-white transition-all flex items-center gap-2 hover:shadow-md"
              >
                <Settings size={18} /> Setup Periods
              </button>
              <button 
                onClick={saveTimetable}
                disabled={periods.length === 0}
                className="px-6 py-3 rounded-2xl text-sm font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-glass hover:shadow-glass-hover transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} /> Save Timetable
              </button>
            </div>
          </div>

          <div className="p-8 overflow-x-auto">
            {periods.length === 0 ? (
              <div className="py-24 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-white rounded-[32px] shadow-sm flex items-center justify-center text-gray-300 mb-6 border border-white">
                  <CalendarIcon size={40} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">No Schedule Configured</h3>
                <p className="text-gray-500 font-bold max-w-md">This class does not have a timetable yet. Click "Setup Periods" above to define the time slots and start building.</p>
              </div>
            ) : (
              <table className="w-full border-separate border-spacing-2 min-w-[800px]">
                <thead>
                  <tr>
                    <th className="w-24"></th>
                    {periods.map((p, idx) => (
                      <th key={idx} className="p-4 bg-white rounded-2xl shadow-sm text-center border border-white/60">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Period {idx + 1}</div>
                        <div className="text-xs font-bold text-gray-900 mt-1 bg-gray-50 px-2 py-1 rounded-lg inline-block">{p.startTime} - {p.endTime}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map(day => (
                    <tr key={day}>
                      <td className="p-4 bg-white rounded-2xl shadow-sm text-center border border-white/60 font-black text-gray-500 text-sm">{DAY_NAMES[day].slice(0, 3)}</td>
                      {periods.map((_, idx) => {
                        const cell = grid[day]?.[idx] || {};
                        const subject = mappedSubjects.find(s => s.subject_id === parseInt(cell.subjectId));
                        const faculty = faculties.find(f => f.id === parseInt(cell.facultyId));
                        
                        return (
                          <td 
                            key={idx} 
                            className="p-0 h-28 align-top group"
                            onClick={() => openCellModal(day, idx)}
                          >
                            {cell.subjectId ? (
                              <div className="w-full h-full bg-pastel-blue/30 border border-pastel-blue rounded-2xl p-3 flex flex-col gap-1.5 cursor-pointer hover:bg-pastel-blue/50 transition-colors relative shadow-sm">
                                <div className="font-black text-sm text-blue-900 leading-tight pr-4 truncate">{subject?.subject_code || 'Unknown'}</div>
                                <div className="text-[10px] font-bold text-blue-700 flex items-center gap-1 truncate"><User size={10}/> {faculty?.full_name || 'Unassigned'}</div>
                                {cell.room && <div className="text-[10px] font-bold text-blue-600 flex items-center gap-1"><MapPin size={10}/> Room {cell.room}</div>}
                              </div>
                            ) : (
                              <div className="w-full h-full border-2 border-dashed border-white/60 bg-white/30 rounded-2xl flex items-center justify-center text-gray-400 cursor-pointer hover:border-brand-purple/40 hover:bg-brand-purple/5 hover:text-brand-purple transition-all shadow-sm">
                                <Plus size={24} />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Setup Periods Modal */}
      {setupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-glass border border-white w-full max-w-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-white/50 flex justify-between items-center bg-white/40">
              <h3 className="font-black text-gray-900 text-xl flex items-center gap-2"><Clock className="text-brand-purple"/> Setup Time Slots</h3>
              <button onClick={() => setSetupModal(false)} className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              <div className="mb-8">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Number of Periods</label>
                <input 
                  type="number" min="1" max="10"
                  className="w-32 bg-white border border-transparent text-gray-900 text-xl font-black rounded-2xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple/30 transition-all text-center shadow-sm"
                  value={setupCount} onChange={e => handleSetupCountChange(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {setupPeriods.map((p, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-white/50 hover:shadow-glass-hover transition-all">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Period {idx + 1}</div>
                    <div className="flex gap-2">
                      <div className="w-full">
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Start</label>
                        <input type="time" value={p.startTime || ''} onChange={e => updateSetupPeriod(idx, 'startTime', e.target.value)} className="w-full bg-gray-50 border border-transparent text-gray-900 text-sm font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:bg-white" />
                      </div>
                      <div className="w-full">
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">End</label>
                        <input type="time" value={p.endTime || ''} onChange={e => updateSetupPeriod(idx, 'endTime', e.target.value)} className="w-full bg-gray-50 border border-transparent text-gray-900 text-sm font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:bg-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-white/50 bg-white/40 flex justify-end gap-3">
              <button onClick={() => setSetupModal(false)} className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 shadow-sm border border-white transition-all">Cancel</button>
              <button onClick={applySetup} className="px-6 py-3 rounded-2xl text-sm font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-glass transition-all">Apply Periods</button>
            </div>
          </div>
        </div>
      )}

      {/* Cell Editor Modal */}
      {cellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white/90 backdrop-blur-3xl rounded-[32px] shadow-glass border border-white w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-white/50 flex justify-between items-center bg-white/40">
              <h3 className="font-black text-gray-900 text-lg">{DAY_NAMES[cellModal.day]} <span className="text-gray-400 font-bold">•</span> P{cellModal.periodIdx + 1}</h3>
              <button onClick={() => setCellModal(null)} className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={saveCellData} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><BookOpen size={12}/> Subject</label>
                <select 
                  className="w-full bg-white border border-transparent shadow-sm text-gray-900 text-sm font-bold rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple/20 transition-all appearance-none"
                  value={cellModal.data.subjectId} onChange={e => handleSubjectSelectInModal(e.target.value)}
                >
                  <option value="">-- Free Period --</option>
                  {mappedSubjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_code} - {s.subject_name}</option>)}
                </select>
              </div>

              {cellModal.data.subjectId && (
                <>
                  <div className="animate-[fadeIn_0.2s_ease-out]">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><User size={12}/> Assigned Faculty</label>
                    <select 
                      className="w-full bg-white border border-transparent shadow-sm text-gray-900 text-sm font-bold rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple/20 transition-all appearance-none"
                      value={cellModal.data.facultyId} onChange={e => setCellModal(p => ({...p, data: {...p.data, facultyId: e.target.value}}))}
                    >
                      <option value="">-- Select Faculty --</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)}
                    </select>
                  </div>
                  
                  <div className="animate-[fadeIn_0.2s_ease-out]">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MapPin size={12}/> Room Number</label>
                    <input 
                      type="text"
                      className="w-full bg-white border border-transparent shadow-sm text-gray-900 text-sm font-bold rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple/20 transition-all"
                      value={cellModal.data.room} onChange={e => setCellModal(p => ({...p, data: {...p.data, room: e.target.value}}))} placeholder="e.g. 101A"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 mt-8 pt-4">
                <button type="submit" className={`w-full py-4 rounded-2xl text-sm font-black shadow-glass transition-all ${
                  cellModal.data.subjectId ? 'bg-gray-900 hover:bg-gray-800 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-none'
                }`}>
                  {cellModal.data.subjectId ? 'Save Assignment' : 'Clear Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
