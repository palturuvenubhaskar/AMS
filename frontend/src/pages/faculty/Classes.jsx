import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function FacultyClasses() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => { api.get('/classes').then(r => setClasses(r.data)); }, []);

  const viewStudents = async (classId) => {
    setSelectedClass(classId);
    const { data } = await api.get(`/classes/${classId}/students`);
    setStudents(data);
  };

  return (
    <div>
      <h1 className="text-gray-900 dark:text-gray-100 text-2xl font-black tracking-tight mb-8">Classes & Students</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {classes.map(c => (
          <div 
            key={c.id} 
            className={`cursor-pointer bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-3xl p-6 shadow-glass hover:bg-white dark:bg-gray-800 hover:scale-[1.02] transition-all border-2 ${selectedClass===c.id ? 'border-brand-purple' : 'border-white/50'}`} 
            onClick={() => viewStudents(c.id)}
          >
            <h3 className="text-gray-900 dark:text-gray-100 font-bold text-lg">{c.department_code} {c.name}-{c.section}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">Semester {c.semester} — {c.academic_year}</p>
            <div className="mt-4 text-3xl font-black text-brand-purple flex items-baseline gap-2">
              {c.student_count} <span className="text-sm font-semibold text-gray-400">students</span>
            </div>
          </div>
        ))}
      </div>

      {selectedClass && (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-glass p-6">
          <h3 className="text-gray-900 dark:text-gray-100 font-bold text-lg mb-4">Enrolled Students</h3>
          <div className="overflow-x-auto rounded-2xl border border-gray-100/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100/50 bg-white/40 dark:bg-gray-800/40">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Present</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Absent</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">%</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Zone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50 bg-white/20">
                {students.map((s, i) => (
                  <tr key={s.id} className="hover:bg-white/40 dark:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">{i+1}</td>
                    <td className="px-6 py-4 text-sm font-mono font-medium text-gray-700 dark:text-gray-300">{s.roll_no}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-100">{s.full_name}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">{s.email}</td>
                    <td className="px-6 py-4 text-sm font-black text-green-600">{s.total_present}</td>
                    <td className="px-6 py-4 text-sm font-black text-red-600">{s.total_absent}</td>
                    <td className="px-6 py-4 text-sm font-black text-gray-900 dark:text-gray-100">{s.attendance_pct}%</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.zone === 'green' ? 'bg-green-100 text-green-700' : s.zone === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {s.zone}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
