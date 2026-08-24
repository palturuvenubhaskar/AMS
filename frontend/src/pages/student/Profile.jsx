import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get('/students/me').then(r => setProfile(r.data)).catch(console.error);
  }, []);

  if (!profile) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-[fadeIn_0.5s_ease-out] font-sans">
      <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-black tracking-tight mb-8">My Profile</h1>
      <div className="bg-white/60 dark:bg-[#12141d]/60 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-glass max-w-2xl">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-brand-purple flex items-center justify-center text-3xl font-black text-white shadow-md shadow-brand-purple/20">
            {profile.full_name?.[0]}
          </div>
          <div>
            <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-black tracking-tight mb-1">{profile.full_name}</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Roll No: {profile.roll_no}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6">
          {[
            ['Email', profile.email],
            ['Phone', profile.phone || 'Not set'],
            ['Department', `${profile.department_name} (${profile.department_code})`],
            ['Class', `${profile.class_name}-${profile.section}`],
            ['Semester', profile.semester],
            ['Academic Year', profile.academic_year],
            ['Enrollment No', profile.enrollment_no],
            ['Joined', new Date(profile.created_at).toLocaleDateString()],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
