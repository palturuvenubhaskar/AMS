import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Building2, Plus, Pencil, Trash2, X } from 'lucide-react';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(); }, []);
  const fetch = async () => {
    setLoading(true);
    try {
      const r = await api.get('/departments');
      setDepartments(r.data);
    } catch (err) {
      toast.error('Failed to load departments');
    }
    setLoading(false);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/departments/${editing.id}`, form);
        toast.success('Department updated');
      } else {
        await api.post('/departments', form);
        toast.success('Department created');
      }
      fetch(); setModal(false); setEditing(null); setForm({ name: '', code: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this department?')) return;
    try { await api.delete(`/departments/${id}`); toast.success('Deleted'); fetch(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out] font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-gray-900 dark:text-gray-100 text-2xl font-black tracking-tight mb-1">Departments</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Manage university departments</p>
          </div>
        </div>
        
        <button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
          onClick={() => { setEditing(null); setForm({name:'',code:''}); setModal(true); }}
        >
          <Plus size={18} /> Add Department
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-medium">Loading departments...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 w-20">ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Code</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(d => (
                  <tr key={d.id} className="group hover:bg-indigo-50/30 transition-colors border-b border-gray-50 last:border-0">
                    <td className="px-6 py-4 font-bold text-sm text-gray-400">#{d.id}</td>
                    <td className="px-6 py-4 font-bold text-sm text-gray-900 dark:text-gray-100">{d.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-palette-light/20 text-palette-dark border border-blue-200 text-xs font-bold tracking-widest">
                        {d.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-900 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                          onClick={() => { setEditing(d); setForm({name:d.name,code:d.code}); setModal(true); }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-900 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          onClick={() => del(d.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {departments.length === 0 && (
                  <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-medium">No departments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-palette-dark/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-gray-800 rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-900 dark:text-gray-100">{editing ? 'Edit' : 'Add'} Department</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Name</label>
                <input 
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={form.name} onChange={e => setForm(p => ({...p,name:e.target.value}))} required 
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Code</label>
                <input 
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={form.code} onChange={e => setForm(p => ({...p,code:e.target.value}))} required 
                  placeholder="e.g. CSE"
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 transition-colors" onClick={() => setModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-colors">
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
