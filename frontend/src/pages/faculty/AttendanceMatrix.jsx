import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Calendar, Users, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AttendanceMatrix({ externalClassId, onExternalClassChange }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(externalClassId ? externalClassId.toString() : '');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [matrixData, setMatrixData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Month Picker State
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const pickerRef = useRef(null);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Handle click outside to close picker
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (externalClassId && externalClassId.toString() !== selectedClass) {
      setSelectedClass(externalClassId.toString());
    }
  }, [externalClassId]);

  useEffect(() => {
    api.get('/classes').then(res => {
      setClasses(res.data);
      if (res.data.length > 0 && !selectedClass && !externalClassId) {
        setSelectedClass(res.data[0].id.toString());
        if (onExternalClassChange) onExternalClassChange(res.data[0].id.toString());
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    api.get(`/dashboard/classes/${selectedClass}/matrix`, { params: { month } })
      .then(res => setMatrixData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedClass, month]);

  const handleExport = async () => {
    if (!selectedClass) return;
    try {
      const response = await api.get(`/dashboard/classes/${selectedClass}/export-matrix`, {
        params: { month },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_matrix_${selectedClass}_${month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to export matrix');
    }
  };

  return (
    <div className="mt-12 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-gray-900 dark:text-gray-100 text-2xl font-black tracking-tight">Monthly Attendance</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">Comprehensive daily records and performance tracking</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-colors"
        >
          <Download size={16} /> Export to Excel
        </button>
      </div>

      <div className="bg-white/60 dark:bg-[#111111]/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-glass p-6 mb-8 relative z-20">
        <div className="flex flex-wrap gap-6 items-end">
          {!externalClassId && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Users size={14} /> Select Class
              </label>
              <select
                value={selectedClass} onChange={e => {
                  setSelectedClass(e.target.value);
                  if (onExternalClassChange) onExternalClassChange(e.target.value);
                }}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222] text-gray-900 dark:text-gray-100 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all appearance-none"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.section} ({c.academic_year})</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex-1 min-w-[200px] relative" ref={pickerRef}>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Calendar size={14} /> Select Month
            </label>
            <button
              onClick={() => {
                setPickerYear(parseInt(month.split('-')[0]));
                setShowPicker(!showPicker);
              }}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222] text-gray-900 dark:text-gray-100 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all text-left flex justify-between items-center"
            >
              <span>{monthNames[parseInt(month.split('-')[1]) - 1]} {month.split('-')[0]}</span>
              <Calendar size={16} className="text-gray-400" />
            </button>
            
            {showPicker && (
              <div className="absolute top-[105%] left-0 w-64 bg-white dark:bg-[#111111] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-200 dark:border-[#222] p-4 z-50 animate-[fadeIn_0.2s_ease-out]">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setPickerYear(y => y - 1)} className="p-1.5 hover:bg-slate-100 dark:bg-[#111111] rounded-lg transition-colors"><ChevronLeft size={16} /></button>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{pickerYear}</span>
                  <button onClick={() => setPickerYear(y => y + 1)} className="p-1.5 hover:bg-slate-100 dark:bg-[#111111] rounded-lg transition-colors"><ChevronRight size={16} /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {monthNames.map((m, i) => {
                    const isSelected = month === `${pickerYear}-${String(i + 1).padStart(2, '0')}`;
                    return (
                      <button
                        key={m}
                        onClick={() => {
                          setMonth(`${pickerYear}-${String(i + 1).padStart(2, '0')}`);
                          setShowPicker(false);
                        }}
                        className={`py-2 rounded-lg text-sm font-bold transition-all ${
                          isSelected ? 'bg-brand-purple text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:bg-[#111111]'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white/60 dark:bg-[#111111]/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-glass overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-medium">Loading matrix...</div>
        ) : !matrixData || !matrixData.students || matrixData.students.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-medium">No attendance data found for this period.</div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-gradient-to-b from-gray-50 to-white/50 border-b border-slate-200 dark:border-[#222]">
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase border-r border-slate-200 dark:border-[#222]">Sl No</th>
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase border-r border-slate-200 dark:border-[#222]">Roll No</th>
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase border-r border-slate-200 dark:border-[#222] shadow-[2px_0_10px_rgba(0,0,0,0.02)]">Name</th>
                  
                  {matrixData.dates.map(dateStr => (
                    <th key={dateStr} className="px-3 py-4 text-xs font-bold text-gray-600 dark:text-gray-400 text-center border-r border-slate-200 dark:border-[#222] bg-yellow-50/30">
                      {parseInt(dateStr.split('-')[2])}
                    </th>
                  ))}
                  
                  <th className="px-4 py-4 text-xs font-black text-gray-700 dark:text-gray-300 uppercase bg-yellow-100/50 border-l border-slate-200 dark:border-[#222] shadow-[-2px_0_10px_rgba(0,0,0,0.02)]">(%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#222]">
                {matrixData.students.map(s => (
                  <tr key={s.rollNo} className="hover:bg-white/50 dark:bg-[#111111]/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 border-r border-slate-200 dark:border-[#222]">{s.slNo}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400 border-r border-slate-200 dark:border-[#222]">{s.rollNo}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-200 border-r border-slate-200 dark:border-[#222] shadow-[2px_0_10px_rgba(0,0,0,0.02)] whitespace-nowrap">{s.name}</td>
                    
                    {matrixData.dates.map(dateStr => {
                      const status = s.attendance[dateStr];
                      let cellClass = "px-3 py-3 text-sm font-bold text-center border-r border-slate-200 dark:border-[#222] ";
                      if (status === 'P') cellClass += "bg-[#C6E0B4] text-[#375623]"; // Excel green
                      else if (status === 'A') cellClass += "bg-[#F8CBAD] text-[#C00000]"; // Excel red
                      else cellClass += "bg-white dark:bg-[#111111] text-gray-300";
                      
                      return (
                        <td key={dateStr} className={cellClass}>
                          {status || '-'}
                        </td>
                      );
                    })}
                    
                    <td className={`px-4 py-3 text-sm font-black text-center border-l border-slate-200 dark:border-[#222]
                      ${s.percentage >= 75 ? 'bg-[#E2EFDA] text-[#375623]' : s.percentage >= 40 ? 'bg-[#FFF2CC] text-[#B08A22]' : 'bg-[#FCE4D6] text-[#C00000]'}`}>
                      {s.percentage.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
