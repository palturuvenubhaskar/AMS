import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users as UsersIcon, Shield, GraduationCap, CheckCircle2, XCircle, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importClass, setImportClass] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', role: 'faculty', phone: '' });

  const [classes, setClasses] = useState([]);

  useEffect(() => { 
    fetchUsers(); 
    api.get('/classes').then(r => setClasses(r.data)).catch(() => {});
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = roleFilter ? `?role=${roleFilter}` : '';
      const { data } = await api.get(`/users${params}`);
      setUsers(data);
    } catch (err) {
      toast.error('Failed to load users');
    }
    setLoading(false);
  };

  const saveUser = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (form.role === 'student') {
        if (!form.classId || !form.rollNo) return toast.error('Class and Roll No are required for students.');
        res = await api.post('/students', form);
      } else {
        res = await api.post('/users', form);
      }
      toast.success(`User created! Default password: ${res.data.tempPassword}`);
      fetchUsers();
      setModal(false);
      setForm({ fullName: '', email: '', role: 'faculty', phone: '', classId: '', rollNo: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!importFile || !importClass) return toast.error('File and class are required.');
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('classId', importClass);
    
    setLoading(true);
    try {
      const res = await api.post('/students/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`Import complete! Success: ${res.data.success}, Failed: ${res.data.failed}`);
      fetchUsers();
      setImportModal(false);
      setImportFile(null);
      setImportClass('');
    } catch (err) {
      toast.error('Bulk import failed.');
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return <Shield size={14} />;
    if (role === 'faculty') return <UsersIcon size={14} />;
    return <GraduationCap size={14} />;
  };

  const getRoleColor = (role) => {
    if (role === 'admin') return 'bg-purple-50 text-purple-600 border-purple-200';
    if (role === 'faculty') return 'bg-palette-light/20 text-palette-dark border-blue-200';
    return 'bg-emerald-50 text-emerald-600 border-emerald-200';
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out] font-sans pb-12 relative">
      {/* Background Decorative Ambient Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-pastel-purple/40 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-pastel-blue/30 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 dark:bg-[#111111]/60 backdrop-blur-2xl p-8 rounded-[32px] border border-white/60 dark:border-gray-700/60 shadow-glass">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-pastel-purple rounded-2xl flex items-center justify-center text-brand-purple shadow-sm">
            <UsersIcon size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-gray-900 dark:text-gray-100 text-3xl font-black tracking-tight mb-1">Users Directory</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">Manage {users.length} registered accounts</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <select 
              className="w-full appearance-none bg-white dark:bg-[#111111] border border-transparent shadow-sm text-gray-900 dark:text-gray-100 text-sm font-bold rounded-2xl pl-4 pr-10 py-3 focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple/20 transition-all cursor-pointer"
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="faculty">Faculty</option>
              <option value="student">Students</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs font-black">▼</div>
          </div>
          <button 
            className="bg-white dark:bg-[#111111] hover:bg-slate-50 dark:bg-black text-gray-900 dark:text-gray-100 border border-slate-200 dark:border-[#222] px-6 py-3 rounded-2xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 flex-shrink-0"
            onClick={() => setImportModal(true)}
          >
            Bulk Import CSV
          </button>
          <button 
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-glass hover:shadow-glass-hover transition-all flex items-center gap-2 flex-shrink-0"
            onClick={() => setModal(true)}
          >
            <Plus size={18} /> Add User
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white/60 dark:bg-[#111111]/60 backdrop-blur-2xl rounded-[32px] border border-white/60 dark:border-gray-700/60 shadow-glass overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400 font-bold">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white/40 dark:bg-[#111111]/40 border-b border-white/50">
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest w-20">ID</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Name</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {users.map(u => (
                  <tr key={u.id} className="group hover:bg-white/50 dark:bg-[#111111]/50 transition-colors">
                    <td className="px-6 py-5 font-black text-sm text-gray-400">#{u.id}</td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-brand-purple transition-colors">{u.full_name}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-gray-600 dark:text-gray-400">{u.email}</div>
                      <div className="text-xs font-bold text-gray-400 mt-0.5">{u.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getRoleColor(u.role)}`}>
                        {getRoleIcon(u.role)}
                        {u.role}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {u.is_active ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pastel-mint text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 size={12} /> Active
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pastel-pink text-red-700 text-[10px] font-black uppercase tracking-widest">
                          <XCircle size={12} /> Inactive
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right text-sm font-bold text-gray-400">
                      {new Date(u.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-gray-400 font-bold">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-glass border border-white w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-white/50 flex justify-between items-center bg-white/40 dark:bg-[#111111]/40">
              <h3 className="font-black text-gray-900 dark:text-gray-100 text-xl">Add New User</h3>
              <button onClick={() => setModal(false)} className="w-10 h-10 bg-white dark:bg-[#111111] rounded-xl shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900 dark:text-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={saveUser} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                <input 
                  className="w-full bg-white dark:bg-[#111111] border border-transparent shadow-sm text-gray-900 dark:text-gray-100 text-sm font-bold rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple/20 transition-all placeholder-gray-400"
                  value={form.fullName} onChange={e => setForm(p => ({...p,fullName:e.target.value}))} required placeholder="e.g. John Doe"
                />
              </div>
              {form.role !== 'student' && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                  <input 
                    type="email"
                    className="w-full bg-white dark:bg-[#111111] border border-transparent shadow-sm text-gray-900 dark:text-gray-100 text-sm font-bold rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple/20 transition-all placeholder-gray-400"
                    value={form.email} onChange={e => setForm(p => ({...p,email:e.target.value}))} required placeholder="john@example.com"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Role</label>
                  <div className="relative">
                    <select 
                      className="w-full appearance-none bg-white dark:bg-[#111111] border border-transparent shadow-sm text-gray-900 dark:text-gray-100 text-sm font-bold rounded-2xl pl-4 pr-10 py-3.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple/20 transition-all cursor-pointer"
                      value={form.role} onChange={e => setForm(p => ({...p,role:e.target.value}))} required
                    >
                      <option value="faculty">Faculty</option>
                      <option value="admin">Admin</option>
                      <option value="student">Student</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs font-black">▼</div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Phone</label>
                  <input 
                    className="w-full bg-white dark:bg-[#111111] border border-transparent shadow-sm text-gray-900 dark:text-gray-100 text-sm font-bold rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple/20 transition-all placeholder-gray-400"
                    value={form.phone} onChange={e => setForm(p => ({...p,phone:e.target.value}))} placeholder="Optional"
                  />
                </div>
              </div>

              {form.role === 'student' && (
                <div className="grid grid-cols-2 gap-4 animate-[fadeIn_0.2s_ease-out]">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Class</label>
                    <div className="relative">
                      <select 
                        className="w-full appearance-none bg-white dark:bg-[#111111] border border-transparent shadow-sm text-gray-900 dark:text-gray-100 text-sm font-bold rounded-2xl pl-4 pr-10 py-3.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple/20 transition-all cursor-pointer"
                        value={form.classId} onChange={e => setForm(p => ({...p,classId:e.target.value}))} required
                      >
                        <option value="">-- Select Class --</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs font-black">▼</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Roll No</label>
                    <input 
                      className="w-full bg-white dark:bg-[#111111] border border-transparent shadow-sm text-gray-900 dark:text-gray-100 text-sm font-bold rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple/20 transition-all placeholder-gray-400"
                      value={form.rollNo} onChange={e => setForm(p => ({...p,rollNo:e.target.value}))} required placeholder="e.g. 242G1"
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 mt-8 pt-4">
                <button type="button" className="px-6 py-3.5 rounded-2xl text-sm font-bold bg-white dark:bg-[#111111] border border-white text-gray-500 dark:text-gray-400 hover:bg-slate-50 dark:bg-black shadow-sm transition-colors" onClick={() => setModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="px-6 py-3.5 rounded-2xl text-sm font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-glass transition-colors">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-glass border border-white w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-white/50 flex justify-between items-center bg-white/40 dark:bg-[#111111]/40">
              <h3 className="font-black text-gray-900 dark:text-gray-100 text-xl">Bulk Import Students</h3>
              <button onClick={() => setImportModal(false)} className="w-10 h-10 bg-white dark:bg-[#111111] rounded-xl shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900 dark:text-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleBulkImport} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Class</label>
                <div className="relative">
                  <select 
                    className="w-full appearance-none bg-white dark:bg-[#111111] border border-transparent shadow-sm text-gray-900 dark:text-gray-100 text-sm font-bold rounded-2xl pl-4 pr-10 py-3.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple/20 transition-all cursor-pointer"
                    value={importClass} onChange={e => setImportClass(e.target.value)} required
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs font-black">▼</div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CSV File</label>
                <input 
                  type="file" accept=".csv"
                  className="w-full bg-white dark:bg-[#111111] border border-transparent shadow-sm text-gray-900 dark:text-gray-100 text-sm font-bold rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple/20 transition-all"
                  onChange={e => setImportFile(e.target.files[0])} required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">CSV must have headers: name, roll_no, email(optional), phone(optional)</p>
              </div>
              
              <div className="flex justify-end gap-3 mt-8 pt-4">
                <button type="button" className="px-6 py-3.5 rounded-2xl text-sm font-bold bg-white dark:bg-[#111111] border border-white text-gray-500 dark:text-gray-400 hover:bg-slate-50 dark:bg-black shadow-sm transition-colors" onClick={() => setImportModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="px-6 py-3.5 rounded-2xl text-sm font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-glass transition-colors">
                  Import CSV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
