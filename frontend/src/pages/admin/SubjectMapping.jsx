import { useState, useEffect } from 'react';
import api from '../../services/api';
import { BookOpen, User, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubjectMapping() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  
  const [subjects, setSubjects] = useState([]); // All subjects in the class's department
  const [mappedSubjects, setMappedSubjects] = useState([]); // Subjects currently mapped to the class
  
  const [faculties, setFaculties] = useState([]); // All users with role=faculty
  
  const [loading, setLoading] = useState(false);

  // Form State
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formFacultyId, setFormFacultyId] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchMappedSubjects();
      
      // Also fetch all subjects for the class's department to populate the dropdown
      const cls = classes.find(c => c.id === parseInt(selectedClass));
      if (cls) {
        api.get(`/subjects?departmentId=${cls.department_id}`).then(res => setSubjects(res.data));
      }
    } else {
      setMappedSubjects([]);
      setSubjects([]);
    }
  }, [selectedClass]);

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

  const fetchMappedSubjects = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/class-subjects/${selectedClass}`);
      setMappedSubjects(data);
    } catch (err) {
      toast.error('Failed to load mapped subjects');
    }
    setLoading(false);
  };

  const handleMapSubject = async (e) => {
    e.preventDefault();
    if (!selectedClass || !formSubjectId) return toast.error('Class and Subject are required');
    try {
      await api.post('/class-subjects', {
        classId: selectedClass,
        subjectId: formSubjectId,
        facultyId: formFacultyId || null
      });
      toast.success('Subject mapped to class successfully');
      fetchMappedSubjects();
      setFormSubjectId('');
      setFormFacultyId('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to map subject');
    }
  };

  const handleUnmap = async (subjectId) => {
    if (!window.confirm('Are you sure you want to remove this subject from the class?')) return;
    try {
      await api.delete(`/class-subjects/${selectedClass}/${subjectId}`);
      toast.success('Subject unmapped');
      fetchMappedSubjects();
    } catch (err) {
      toast.error('Failed to unmap subject');
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out] font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#111111] p-6 rounded-[24px] border border-slate-200 dark:border-[#222] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-palette-light/20 rounded-2xl flex items-center justify-center text-palette-medium shadow-sm">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-gray-900 dark:text-gray-100 text-2xl font-black tracking-tight mb-1">Assign Faculty</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Map subjects to classes and assign primary faculty.</p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <select 
            className="w-full appearance-none bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#222] text-gray-900 dark:text-gray-100 text-sm font-bold rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-4 focus:ring-palette-medium/20 focus:border-palette-medium transition-all cursor-pointer shadow-sm"
            value={selectedClass} 
            onChange={e => setSelectedClass(e.target.value)}
          >
            <option value="">-- Select a Class --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} - {c.section} (Sem {c.semester})</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▼</div>
        </div>
      </div>

      {selectedClass && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form to Map New Subject */}
          <div className="lg:col-span-1 bg-white dark:bg-[#111111] rounded-[24px] border border-slate-200 dark:border-[#222] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
            <h3 className="font-black text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <Plus size={18} className="text-palette-medium"/> Map Subject to Class
            </h3>
            
            <form onSubmit={handleMapSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Subject</label>
                <div className="relative">
                  <select 
                    className="w-full appearance-none bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#222] text-gray-900 dark:text-gray-100 text-sm font-semibold rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-4 focus:ring-palette-medium/20 focus:border-palette-medium transition-all"
                    value={formSubjectId} onChange={e => setFormSubjectId(e.target.value)} required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▼</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Assign Faculty</label>
                <div className="relative">
                  <select 
                    className="w-full appearance-none bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#222] text-gray-900 dark:text-gray-100 text-sm font-semibold rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-4 focus:ring-palette-medium/20 focus:border-palette-medium transition-all"
                    value={formFacultyId} onChange={e => setFormFacultyId(e.target.value)}
                  >
                    <option value="">-- No Faculty Assigned --</option>
                    {faculties.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▼</div>
                </div>
                <p className="text-xs text-gray-400 mt-2 font-medium">This faculty will be the default teacher for this subject in timetables.</p>
              </div>

              <button type="submit" className="w-full mt-2 bg-palette-dark hover:bg-palette-dark/90 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md shadow-palette-dark/20 transition-all">
                Save Mapping
              </button>
            </form>
          </div>

          {/* List of Mapped Subjects */}
          <div className="lg:col-span-2 bg-white dark:bg-[#111111] rounded-[24px] border border-slate-200 dark:border-[#222] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <h3 className="font-black text-gray-900 dark:text-gray-100">Current Assignments</h3>
            </div>
            
            {loading ? (
              <div className="p-12 text-center text-gray-400 font-medium">Loading subjects...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Subject</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Faculty</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedSubjects.map(m => (
                      <tr key={m.id} className="group hover:bg-palette-light/20/30 transition-colors border-b border-gray-50 last:border-0">
                        <td className="px-6 py-4">
                          <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{m.subject_name}</div>
                          <div className="text-xs font-medium text-gray-400 mt-0.5">{m.subject_code} • {m.credits} Credits</div>
                        </td>
                        <td className="px-6 py-4">
                          {m.faculty_name ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold">
                              <User size={14} /> {m.faculty_name}
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-gray-400 bg-slate-100 dark:bg-[#111111] px-3 py-1 rounded-full">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleUnmap(m.subject_id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove mapping"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {mappedSubjects.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-6 py-12 text-center text-gray-400 font-medium">No subjects assigned to this class yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {!selectedClass && (
        <div className="bg-white dark:bg-[#111111] rounded-[24px] border border-slate-200 dark:border-[#222] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-12 text-center">
          <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Select a Class</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Please select a class from the dropdown above to manage its faculty assignments.</p>
        </div>
      )}
    </div>
  );
}
