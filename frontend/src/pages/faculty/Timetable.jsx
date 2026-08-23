import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, ChevronDown, Clock, MapPin } from 'lucide-react';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TIME_SLOTS = ['09:00-10:10','10:25-11:30','11:30-12:30','13:15-14:15','14:15-15:15','15:15-16:00'];
const SLOT_COLORS = [
  { bg: 'bg-indigo-50/40', border: 'border-indigo-100/50', highlight: 'bg-indigo-300' },
  { bg: 'bg-emerald-50/40', border: 'border-emerald-100/50', highlight: 'bg-emerald-300' },
  { bg: 'bg-palette-light/20/40', border: 'border-amber-100/50', highlight: 'bg-amber-300' },
  { bg: 'bg-rose-50/40', border: 'border-rose-100/50', highlight: 'bg-rose-300' },
  { bg: 'bg-cyan-50/40', border: 'border-cyan-100/50', highlight: 'bg-cyan-300' },
  { bg: 'bg-fuchsia-50/40', border: 'border-fuchsia-100/50', highlight: 'bg-fuchsia-300' },
];

const MOCK_TIMETABLE = {
  1: { slots: [ 
    { start_time: '09:00:00', subject_code: '24ALBTCS508T', subject_name: 'Green Building', room: '310', type: 'Lecture' }, 
    { start_time: '10:25:00', subject_code: '24ALBTCS501T', subject_name: 'Computer Networks', room: '310', type: 'Lecture' }, 
    { start_time: '11:30:00', subject_code: '24ALBTCS504Ta', subject_name: 'OOAD', room: '310', type: 'Lecture' }, 
    { start_time: '13:15:00', subject_code: '24ALBTCS504Ta', subject_name: 'OOAD', room: '310', type: 'Lecture' }, 
    { start_time: '14:15:00', subject_code: '24ALBTCS501T', subject_name: 'Computer Networks', room: '310', type: 'Lecture' }, 
    { start_time: '15:15:00', subject_code: '24ALBTCS502T', subject_name: 'Automata Theory', room: '310', type: 'Lecture' } 
  ] },
  2: { slots: [ 
    { start_time: '09:00:00', subject_code: '24ALBTCS502T', subject_name: 'Automata Theory', room: '104', type: 'Lecture' }, 
    { start_time: '10:25:00', subject_code: '24ALBTCS301T', subject_name: 'AI', room: '104', type: 'Lecture' }, 
    { start_time: '13:15:00', subject_code: '24ALBTAM301P', subject_name: 'AI Lab', room: 'LAB 1', type: 'Lab' }, 
    { start_time: '14:15:00', subject_code: '24ALBTAM301P', subject_name: 'AI Lab', room: 'LAB 1', type: 'Lab' }, 
    { start_time: '15:15:00', subject_code: '24ALBTAM301P', subject_name: 'AI Lab', room: 'LAB 1', type: 'Lab' } 
  ] },
  3: { slots: [ 
    { start_time: '09:00:00', subject_code: '24ALBTCS503T', subject_name: 'Quantum Tech', room: '310', type: 'Lecture' }, 
    { start_time: '10:25:00', subject_code: '24ALBTCS503T', subject_name: 'Quantum Tech', room: '310', type: 'Lecture' }, 
    { start_time: '11:30:00', subject_code: '24ALBTCS502T', subject_name: 'Automata Theory', room: '310', type: 'Lecture' }, 
    { start_time: '13:15:00', subject_code: '24ALBTCS508T', subject_name: 'Green Building', room: '310', type: 'Lecture' }, 
    { start_time: '14:15:00', subject_code: '24ALBTCS301T', subject_name: 'AI', room: '310', type: 'Lecture' } 
  ] },
  4: { slots: [ 
    { start_time: '09:00:00', subject_code: '24ALBTCS501P', subject_name: 'Computer Networks Lab', room: 'LAB 5', type: 'Lab' }, 
    { start_time: '10:25:00', subject_code: '24ALBTCS501P', subject_name: 'Computer Networks Lab', room: 'LAB 5', type: 'Lab' }, 
    { start_time: '11:30:00', subject_code: '24ALBTCS504Ta', subject_name: 'OOAD', room: '104', type: 'Lecture' }, 
    { start_time: '13:15:00', subject_code: '24ALBTCS301T', subject_name: 'AI', room: '104', type: 'Lecture' } 
  ] },
  5: { slots: [ 
    { start_time: '09:00:00', subject_code: '24ALBTCS508T', subject_name: 'Green Building', room: 'LAB 4', type: 'Lecture' }, 
    { start_time: '10:25:00', subject_code: '24ALBTCS501T', subject_name: 'Computer Networks', room: 'LAB 4', type: 'Lecture' }, 
    { start_time: '11:30:00', subject_code: '24ALBTCS301T', subject_name: 'AI', room: 'LAB 4', type: 'Lecture' }, 
    { start_time: '13:15:00', subject_code: '24ALBTCS502T', subject_name: 'Automata Theory', room: 'LAB 4', type: 'Lecture' }, 
    { start_time: '14:15:00', subject_code: '24ALBTCS501T', subject_name: 'Computer Networks', room: 'LAB 4', type: 'Lecture' }, 
    { start_time: '15:15:00', subject_code: '24ALBTCS504Ta', subject_name: 'OOAD', room: 'LAB 4', type: 'Lecture' } 
  ] },
  6: { slots: [ 
    { start_time: '09:00:00', subject_code: '24ALBTCS508T', subject_name: 'Green Building', room: '310', type: 'Lecture' }, 
    { start_time: '10:25:00', subject_code: '24ALBTCS301T', subject_name: 'AI', room: '310', type: 'Lecture' }, 
    { start_time: '11:30:00', subject_code: '24ALBTCS508T', subject_name: 'Green Building', room: '310', type: 'Lecture' }, 
    { start_time: '13:15:00', subject_code: '24ALBTCS504Ta', subject_name: 'OOAD', room: '310', type: 'Lecture' }, 
    { start_time: '14:15:00', subject_code: '24ALBTCS502T', subject_name: 'Automata Theory', room: '310', type: 'Lecture' }, 
    { start_time: '15:15:00', subject_code: '24ALBTCS501T', subject_name: 'Computer Networks', room: '310', type: 'Lecture' } 
  ] }
};

export default function Timetable({ readOnly = false, classId = null }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(classId || '');
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    if (!classId) {
      api.get('/classes').then(r => { 
        setClasses(r.data); 
        if(r.data.length && !selectedClass) setSelectedClass(r.data[0].id); 
      }).catch(console.error);
    }
  }, [classId]);
  
  useEffect(() => { 
    if (selectedClass) fetchTimetable(); 
  }, [selectedClass]);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/timetables/weekly/${selectedClass}`);
      // INJECT MOCK DATA if database is empty for this class
      const hasAnySlots = data && Object.values(data).some(day => day.slots && day.slots.length > 0);
      
      if (!hasAnySlots) {
        setTimetable(MOCK_TIMETABLE);
      } else {
        setTimetable(data);
      }
    } catch(e) { 
      console.error(e);
      setTimetable(MOCK_TIMETABLE); // fallback on error
    }
    setLoading(false);
  };

  const getSlotForDayTime = (dayNum, timeSlot) => {
    const dayData = timetable[dayNum];
    if (!dayData) return null;
    const [start] = timeSlot.split('-');
    return dayData.slots?.find(s => {
      const slotStart = s.start_time?.substring(0,5);
      return slotStart === start;
    });
  };

  const subjectColorMap = {};
  let colorIdx = 0;
  Object.values(timetable).forEach(day => {
    day.slots?.forEach(s => {
      if (!subjectColorMap[s.subject_code]) {
        subjectColorMap[s.subject_code] = SLOT_COLORS[colorIdx % SLOT_COLORS.length];
        colorIdx++;
      }
    });
  });

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out] font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#111111] p-6 rounded-[24px] border border-slate-200 dark:border-[#222] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-gray-900 dark:text-gray-100 text-2xl font-black tracking-tight mb-1">Weekly Timetable</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">View and manage class schedules</p>
          </div>
        </div>
        {!readOnly && classes.length > 0 && (
          <div className="relative w-full sm:w-64">
            <select 
              className="w-full appearance-none bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#222] text-gray-900 dark:text-gray-100 text-sm font-bold rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-sm"
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)}
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section} (Sem {c.semester})</option>)}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#111111] rounded-[24px] border border-slate-200 dark:border-[#222] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[800px] border-separate border-spacing-2">
            <thead>
              <tr>
                <th className="w-24 px-4 py-3 bg-slate-50 dark:bg-black rounded-xl text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center shadow-sm">
                  Time
                </th>
                {[1,2,3,4,5,6].map(d => (
                  <th key={d} className="px-4 py-3 bg-slate-50 dark:bg-black rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 text-center shadow-sm">
                    {DAYS[d]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((ts, idx) => {
                const [start, end] = ts.split('-');
                return (
                  <tr key={ts} className="group">
                    <td className="p-3 bg-gray-50/50 rounded-xl border border-slate-200 dark:border-[#222] text-center group-hover:bg-indigo-50/30 transition-colors">
                      <div className="text-gray-900 dark:text-gray-100 font-bold text-sm tracking-tight">{start}</div>
                      <div className="text-gray-400 text-[10px] font-bold uppercase mt-0.5">{end}</div>
                    </td>
                    {[1,2,3,4,5,6].map(d => {
                      const slot = getSlotForDayTime(d, ts);
                      const style = slot ? subjectColorMap[slot.subject_code] : null;
                      
                      return (
                        <td key={`${d}-${ts}`} className="p-1 h-full">
                          {slot ? (
                            <div className={`h-full w-full rounded-xl p-3 border ${style.bg} ${style.border} flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden`}>
                              <div className={`absolute top-0 left-0 w-1 h-full ${style.highlight}`} />
                              <div>
                                <div className={`font-black text-sm tracking-tight leading-tight text-slate-800 mb-1`}>
                                  {slot.subject_name || slot.subject_code}
                                </div>
                                <div className={`text-[10px] font-bold uppercase tracking-wider text-slate-500 opacity-80`}>
                                  {slot.subject_code} • {slot.type || 'Lecture'}
                                </div>
                              </div>
                              <div className={`flex items-center gap-1 mt-3 text-slate-500 opacity-90`}>
                                <MapPin size={12} />
                                <span className="text-xs font-bold">{slot.room}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full w-full rounded-xl border border-slate-200 dark:border-[#222] border-dashed bg-gray-50/30 flex items-center justify-center min-h-[80px]">
                              <span className="text-gray-300 text-sm font-medium">—</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">Legend:</span>
          {Object.entries(subjectColorMap).map(([code, color]) => (
            <div key={code} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-md ${color.highlight} shadow-sm`} />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{code}</span>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
