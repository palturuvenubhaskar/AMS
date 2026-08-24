import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { TrendingUp, TrendingDown, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Projections() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/dashboard/predictions/${user?.id}`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin drop-shadow-md" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-gray-500 dark:text-gray-400 font-bold bg-white dark:bg-[#12141d] rounded-3xl shadow-glass border border-slate-200 dark:border-[#222430]">
        No attendance data found to run projections.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-black tracking-tight mb-1">Attendance Projections</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Mathematical projection for the remainder of the semester</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#12141d] rounded-3xl p-6 shadow-glass border border-slate-200 dark:border-[#222430] flex flex-col justify-between">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Conducted Classes</div>
          <div className="text-4xl font-black text-slate-900 dark:text-slate-100">{data.totalConducted}</div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Classes held so far</div>
        </div>

        <div className="bg-white dark:bg-[#12141d] rounded-3xl p-6 shadow-glass border border-slate-200 dark:border-[#222430] flex flex-col justify-between">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Remaining Classes</div>
          <div className="text-4xl font-black text-slate-900 dark:text-slate-100">{data.remainingClasses}</div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Estimated until end of semester</div>
        </div>

        <div className="bg-white dark:bg-[#12141d] rounded-3xl p-6 shadow-glass border border-slate-200 dark:border-[#222430] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={64} />
          </div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Max Possible</div>
          <div className="text-4xl font-black text-emerald-500">{data.maxPossiblePct}%</div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">If you attend every remaining class</div>
        </div>

        <div className="bg-white dark:bg-[#12141d] rounded-3xl p-6 shadow-glass border border-slate-200 dark:border-[#222430] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingDown size={64} />
          </div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Min Possible</div>
          <div className="text-4xl font-black text-red-500">{data.minPossiblePct}%</div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">If you miss every remaining class</div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#12141d] rounded-3xl p-8 shadow-glass border border-slate-200 dark:border-[#222430] mt-8">
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-6">Actionable Insights</h2>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-[#050505] border border-slate-200 dark:border-[#222430]">
            <ShieldCheck className="text-brand-purple mt-1 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Target: 75% Attendance</h3>
              <p className="text-gray-600 dark:text-gray-400 font-medium text-sm mt-1">
                You need to attend <strong className="text-brand-purple text-lg">{data.requiredFor75}</strong> more classes out of the remaining {data.remainingClasses} to secure 75% attendance.
              </p>
            </div>
          </div>

          {!data.canReach75 && (
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-red-50 border border-red-100">
              <AlertTriangle className="text-red-500 mt-1 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-red-700">Critical Warning</h3>
                <p className="text-red-600 font-medium text-sm mt-1">
                  It is mathematically impossible to reach 75% even if you attend all remaining classes. Please contact your HOD immediately for condonation procedures.
                </p>
              </div>
            </div>
          )}

          {data.canReach75 && data.safeToBunk > 0 && (
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
              <CheckCircle className="text-emerald-500 mt-1 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-emerald-700">Safe Margin</h3>
                <p className="text-emerald-600 font-medium text-sm mt-1">
                  You can safely miss <strong className="text-emerald-700 text-lg">{data.safeToBunk}</strong> classes without falling below the 75% threshold.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
