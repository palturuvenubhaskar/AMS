import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, CheckCircle2, AlertCircle, RefreshCw, Trash2, Sparkles, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import FaceEnrollmentModal from '../../components/FaceEnrollmentModal';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [faceData, setFaceData] = useState(null);
  const [loadingFace, setLoadingFace] = useState(true);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const fetchFaceStatus = () => {
    if (!user?.id) return;
    setLoadingFace(true);
    api.get(`/students/${user.id}/face`)
      .then(r => setFaceData(r.data))
      .catch(console.error)
      .finally(() => setLoadingFace(false));
  };

  useEffect(() => {
    api.get('/students/me').then(r => setProfile(r.data)).catch(console.error);
    fetchFaceStatus();
  }, [user?.id]);

  const handleDeleteFace = async () => {
    if (!window.confirm('Are you sure you want to remove your enrolled Face ID? You will not be recognized by classroom FRS until re-enrolled.')) {
      return;
    }
    try {
      await api.delete(`/students/${user.id}/face`);
      toast.success('Face ID removed.');
      fetchFaceStatus();
    } catch (err) {
      toast.error('Failed to remove Face ID.');
    }
  };

  if (!profile) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-[fadeIn_0.5s_ease-out] font-sans max-w-4xl">
      <h1 className="text-slate-900 dark:text-slate-100 text-xl md:text-3xl font-black tracking-tight mb-8">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card (2 cols) */}
        <div className="md:col-span-2 bg-white/60 dark:bg-[#12141d]/60 backdrop-blur-xl border border-white/50 dark:border-[#222430] rounded-3xl p-6 md:p-8 shadow-glass">
          <div className="flex items-center gap-4 md:gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-brand-purple flex items-center justify-center text-xl md:text-3xl font-black text-white shadow-md shadow-brand-purple/20">
              {profile.full_name?.[0]}
            </div>
            <div>
              <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-black tracking-tight mb-1">{profile.full_name}</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Roll No: {profile.roll_no}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6">
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

        {/* Face ID Card (1 col) */}
        <div className="bg-white/60 dark:bg-[#12141d]/60 backdrop-blur-xl border border-white/50 dark:border-[#222430] rounded-3xl p-6 shadow-glass flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-purple" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">FRS Face ID</h3>
              </div>
              {faceData?.enrolled ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Enrolled
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  Pending
                </span>
              )}
            </div>

            <p className="text-gray-400 text-xs mb-5">
              Enrolled face descriptors are used by classroom cameras for automatic attendance verification.
            </p>

            {loadingFace ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Checking enrollment...
              </div>
            ) : faceData?.enrolled ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden aspect-square border-2 border-emerald-500/40 bg-slate-900">
                  {faceData.face?.imagePath ? (
                    <img
                      src={faceData.face.imagePath}
                      alt="Enrolled Face"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-emerald-400">
                      <ShieldCheck className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md rounded-xl p-2 text-[10px] text-white flex items-center justify-between">
                    <span>Enrolled portrait</span>
                    <span className="text-emerald-400 font-bold">128-D Active</span>
                  </div>
                </div>
                <div className="text-[11px] text-gray-400">
                  Registered: {new Date(faceData.face?.createdAt).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs space-y-2 mb-4">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4" /> Face Not Registered
                </div>
                <p className="text-[11px] opacity-90">
                  You have not registered your Face ID yet. Classroom cameras will not be able to mark you present automatically.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-[#222430] space-y-2">
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-brand-purple text-white text-xs font-bold shadow-lg shadow-brand-purple/20 hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              {faceData?.enrolled ? 'Re-enroll Face' : 'Register Face Now'}
            </button>
            {faceData?.enrolled && (
              <button
                onClick={handleDeleteFace}
                className="w-full py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Face ID
              </button>
            )}
          </div>
        </div>
      </div>

      <FaceEnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        preselectedStudentId={user?.id}
        onEnrolled={() => fetchFaceStatus()}
      />
    </div>
  );
}
