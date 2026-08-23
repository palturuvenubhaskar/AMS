import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { GraduationCap, Plus, Pencil, Trash2, X } from 'lucide-react';

export default function AdminClasses() {
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ departmentId:'', name:'', section:'', semester:'', academicYear:'' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    api.get('/departments').then(r => setDepartments(r.data)); 
    fetch(); 
  }, []);

  const fetch = async () => {
    setLoading(true);
    try {
      const r = await api.get('/classes');
      setClasses(r.data);
    } catch (err) {
      toast.error('Failed to load classes');
    }
    setLoading(false);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/classes/${editing.id}`, form);
      else await api.post('/classes', form);
      toast.success(editing ? 'Class Updated' : 'Class Created');
      fetch(); setModal(false); setEditing(null);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this class?')) return;
    try { await api.delete(`/classes/${id}`); toast.success('Deleted'); fetch(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out] font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#111111] p-6 rounded-[24px] border border-slate-200 dark:border-[#222] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-black tracking-tight mb-1">Classes</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Manage {classes.length} class sections</p>
          </div>
        </div>
        
        <button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
          onClick={() => { setEditing(null); setForm({departmentId:'',name:'',section:'',semester:'',academicYear:''}); setModal(true); }}
        >
          <Plus size={18} /> Add Class
        </button>
      </div>

      <div className="bg-white dark:bg-[#111111] rounded-[24px] border border-slate-200 dark:border-[#222] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-medium">Loading classes...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Dept</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Section</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Semester</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Year</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Students</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(c => (
                  <tr key={c.id} className="group hover:bg-indigo-50/30 transition-colors border-b border-gray-50 last:border-0">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-palette-light/20 text-palette-dark border border-blue-200 text-xs font-bold tracking-widest">
                        {c.department_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-sm text-slate-900 dark:text-slate-100">{c.name}</td>
                    <td className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-gray-400">{c.section}</td>
                    <td className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-gray-400">Sem {c.semester}</td>
                    <td className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-gray-400">{c.academic_year}</td>
                    <td className="px-6 py-4 text-center font-black text-sm text-indigo-600">{c.student_count}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-black hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                          onClick={() => { setEditing(c); setForm({departmentId:c.department_id,name:c.name,section:c.section,semester:c.semester,academicYear:c.academic_year}); setModal(true); }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-black hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          onClick={() => del(c.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {classes.length === 0 && (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400 font-medium">No classes found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-palette-dark/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-[#111111] rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-slate-900 dark:text-slate-100">{editing ? 'Edit' : 'Add'} Class</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Department</label>
                <div className="relative">
                  <select 
                    className="w-full appearance-none bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#222] text-slate-900 dark:text-slate-100 text-sm font-semibold rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={form.departmentId} onChange={e => setForm(p => ({...p,departmentId:e.target.value}))} required
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▼</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Name</label>
                  <input 
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#222] text-slate-900 dark:text-slate-100 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={form.name} onChange={e => setForm(p => ({...p,name:e.target.value}))} required placeholder="e.g. CSE"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Section</label>
                  <input 
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#222] text-slate-900 dark:text-slate-100 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={form.section} onChange={e => setForm(p => ({...p,section:e.target.value}))} required placeholder="e.g. A"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Semester</label>
                  <input 
                    type="number" className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#222] text-slate-900 dark:text-slate-100 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={form.semester} onChange={e => setForm(p => ({...p,semester:e.target.value}))} required min="1" max="10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Academic Year</label>
                  <input 
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#222] text-slate-900 dark:text-slate-100 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={form.academicYear} onChange={e => setForm(p => ({...p,academicYear:e.target.value}))} required placeholder="e.g. 2026-27"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-50 dark:bg-black text-gray-500 dark:text-gray-400 hover:bg-slate-100 dark:bg-[#111111] transition-colors" onClick={() => setModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-colors">
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
