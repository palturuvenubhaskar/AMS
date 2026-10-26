import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Camera, UserCheck, Sparkles } from 'lucide-react';
import FaceEnrollmentModal from '../../components/FaceEnrollmentModal';

export default function FacultyClasses() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [faceStatuses, setFaceStatuses] = useState({});
  const [enrollingStudent, setEnrollingStudent] = useState(null);

  useEffect(() => { api.get('/classes').then(r => setClasses(r.data)); }, []);

  const loadFaceStatus = async (classId) => {
    try {
      const res = await api.get(`/classes/${classId}/face-status`);
      const map = {};
      (res.data.students || []).forEach(s => {
        map[s.studentId] = s;
      });
      setFaceStatuses(map);
    } catch (e) {
      console.error(e);
    }
  };

  const viewStudents = async (classId) => {
    setSelectedClass(classId);
    const { data } = await api.get(`/classes/${classId}/students`);
    setStudents(data);
    loadFaceStatus(classId);
  };

  return (
    <div>
      <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-black tracking-tight mb-8">Classes & Students</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        {classes.map(c => (
          <div 
            key={c.id} 
            className={`cursor-pointer bg-white/60 dark:bg-[#12141d]/60 backdrop-blur-md rounded-3xl p-4 md:p-6 shadow-glass hover:bg-white dark:bg-[#12141d] hover:scale-[1.02] transition-all border-2 ${selectedClass===c.id ? 'border-brand-purple' : 'border-white/50'}`} 
            onClick={() => viewStudents(c.id)}
          >
            <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg">{c.department_code} {c.name}-{c.section}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">Semester {c.semester} — {c.academic_year}</p>
            <div className="mt-4 text-xl md:text-3xl font-black text-brand-purple flex items-baseline gap-2">
              {c.student_count} <span className="text-sm font-semibold text-gray-400">students</span>
            </div>
          </div>
        ))}
      </div>

      {selectedClass && (
        <div className="bg-white/60 dark:bg-[#12141d]/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-glass p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg">Enrolled Students</h3>
              <p className="text-xs text-gray-400">
                {Object.values(faceStatuses).filter(s => s.isEnrolled).length} of {students.length} students have FRS Face ID registered
              </p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#222430]/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100/50 bg-white/40 dark:bg-[#12141d]/40">
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">#</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Roll No</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Face ID</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Present</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Absent</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">%</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Zone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#222430]/50 bg-white/20">
                {students.map((s, i) => (
                  <tr key={s.id} className="hover:bg-white/40 dark:bg-[#12141d]/40 transition-colors">
                    <td className="px-4 md:px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">{i+1}</td>
                    <td className="px-4 md:px-6 py-4 text-sm font-mono font-medium text-gray-700 dark:text-gray-300">{s.roll_no}</td>
                    <td className="px-4 md:px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{s.full_name}</td>
                    <td className="px-4 md:px-6 py-4 text-sm">
                      {faceStatuses[s.id]?.isEnrolled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <UserCheck className="w-3.5 h-3.5" /> Enrolled
                        </span>
                      ) : (
                        <button
                          onClick={() => setEnrollingStudent(s)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-purple hover:bg-brand-purple/10 px-2.5 py-0.5 rounded-full border border-brand-purple/30 transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5" /> Enroll Face
                        </button>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm font-black text-green-600">{s.total_present}</td>
                    <td className="px-4 md:px-6 py-4 text-sm font-black text-red-600">{s.total_absent}</td>
                    <td className="px-4 md:px-6 py-4 text-sm font-black text-slate-900 dark:text-slate-100">{s.attendance_pct}%</td>
                    <td className="px-4 md:px-6 py-4">
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

      <FaceEnrollmentModal
        isOpen={!!enrollingStudent}
        onClose={() => setEnrollingStudent(null)}
        preselectedStudentId={enrollingStudent?.id}
        classStudents={students}
        onEnrolled={() => {
          if (selectedClass) loadFaceStatus(selectedClass);
        }}
      />
    </div>
  );
}
