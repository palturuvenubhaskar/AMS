import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Lock, Mail, ShieldCheck, Hexagon, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const routes = { admin: '/admin', faculty: '/faculty', student: '/student' };
      navigate(routes[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async (roleEmail) => {
    setError('');
    setLoading(true);
    try {
      const user = await login(roleEmail, 'Ams@2026');
      const routes = { admin: '/admin', faculty: '/faculty', student: '/student' };
      navigate(routes[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base flex flex-col justify-center items-center p-4 sm:p-8 relative overflow-hidden font-sans">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-pastel-purple/60 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-pastel-pink/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] bg-pastel-blue/50 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md animate-[fadeIn_0.5s_ease-out] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-purple shadow-[0_10px_40px_rgba(105,65,198,0.3)] mb-6 transform hover:scale-105 transition-transform duration-300">
            <Hexagon size={40} className="text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">AMS</h1>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Academic Management System</p>
        </div>

        <div className="bg-white/60 backdrop-blur-2xl rounded-[32px] p-8 sm:p-10 shadow-glass border border-white/60 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-bl-full blur-2xl -z-10 transition-transform duration-500 group-hover:scale-125" />
          
          <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-2">
            <ShieldCheck size={20} className="text-brand-purple" /> Secure Sign In
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold mb-6 border border-red-100 flex items-start gap-3 animate-[fadeIn_0.3s_ease]">
              <div className="w-5 h-5 mt-0.5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-500">!</div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ID Number / Email</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400 group-focus-within/input:text-brand-purple transition-colors" />
                </div>
                <input
                  type="text"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/80 border-2 border-transparent text-gray-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple/20 transition-all shadow-sm placeholder-gray-400"
                  placeholder="e.g. 242G1A05Y9 or admin@aams.edu"
                  value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400 group-focus-within/input:text-brand-purple transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full h-14 pl-12 pr-12 rounded-2xl bg-white/80 border-2 border-transparent text-gray-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple/20 transition-all shadow-sm placeholder-gray-400"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-brand-purple focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 mt-4 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-bold text-sm shadow-glass hover:shadow-glass-hover transition-all duration-300 flex items-center justify-center gap-2 group/btn disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight size={18} className="text-white group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Development Tools */}
          <div className="mt-10 pt-6 border-t border-gray-200/50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-4">Development Quick Access</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Admin', email: 'admin@ams.edu', color: 'hover:bg-pastel-purple hover:text-brand-purple border-transparent bg-white/50' },
                { label: 'Faculty', email: 'sruthi@alits.edu.in', color: 'hover:bg-pastel-blue hover:text-blue-700 border-transparent bg-white/50' },
                { label: 'Student', email: '242G1A05Y9@alits.edu.in', color: 'hover:bg-pastel-mint hover:text-emerald-700 border-transparent bg-white/50' }
              ].map(role => (
                <button
                  key={role.label}
                  type="button"
                  onClick={() => handleDevLogin(role.email)}
                  disabled={loading}
                  className={`py-2.5 px-1 rounded-xl border text-gray-500 text-xs font-bold transition-all ${role.color} disabled:opacity-50`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
