import { useState, useEffect } from 'react';
import api from '../../services/api';
import { User, Activity, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parents/ward-summary')
      .then(res => {
        setWards(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="mb-8">
        <h2 className="text-gray-900 text-3xl font-black tracking-tight mb-2">My Wards</h2>
        <p className="text-gray-500 font-medium">Overview of your children's academic attendance</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-bold">Loading data...</div>
      ) : wards.length === 0 ? (
        <div className="bg-white/60 p-12 text-center rounded-3xl border border-white/50 shadow-glass">
          <p className="text-gray-500 font-bold">No wards linked to your account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wards.map((ward, idx) => (
            <div key={idx} className="bg-white/60 backdrop-blur-xl border border-white/50 p-6 rounded-[32px] shadow-glass flex flex-col relative overflow-hidden group">
              <div className={`absolute top-0 left-0 right-0 h-2 ${ward.attendance?.zone === 'red' ? 'bg-red-500' : ward.attendance?.zone === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'}`} />
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-brand-purple/10 text-brand-purple rounded-2xl flex items-center justify-center font-black text-2xl">
                  {ward.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">{ward.full_name}</h3>
                  <p className="text-gray-500 font-medium text-sm flex gap-2">
                    <span>{ward.roll_no}</span> • <span>{ward.class_name}-{ward.section}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Attendance</span>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-gray-900">{ward.attendance?.attendance_pct || 0}%</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Zone</span>
                  <div className="flex items-center gap-2 h-full pb-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                      ${ward.attendance?.zone === 'red' ? 'bg-red-100 text-red-700' : 
                        ward.attendance?.zone === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'}`}>
                      {ward.attendance?.zone || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-sm font-medium text-gray-500 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 mt-auto">
                <div>Classes: <strong className="text-gray-900">{ward.attendance?.total_classes || 0}</strong></div>
                <div>Present: <strong className="text-green-600">{ward.attendance?.present_classes || 0}</strong></div>
                <div>Absent: <strong className="text-red-500">{ward.attendance?.absent_classes || 0}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
