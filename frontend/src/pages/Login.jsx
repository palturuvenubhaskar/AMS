import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ScanFace, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import { BrandMark } from '../components/layouts/AppLayout';

const roleRoutes = { admin: '/admin', faculty: '/faculty', student: '/student', parent: '/parent' };

const highlights = [
  {
    icon: ShieldCheck,
    title: 'Role-aware access',
    body: 'Admins, faculty, students and parents each land in a portal built for them.',
  },
  {
    icon: ScanFace,
    title: 'Face-recognition attendance',
    body: 'Mark a full classroom in seconds, with manual override always available.',
  },
  {
    icon: Sparkles,
    title: 'Transparent records',
    body: 'Live percentages, zones and dispute trails — no surprises at the end of term.',
  },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (identifier, secret) => {
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier, secret);
      navigate(roleRoutes[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit(email, password);
  };

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[1.05fr_0.95fr]">
      {/* ── editorial panel ── */}
      <aside className="relative hidden overflow-hidden border-r border-line bg-surface lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-70" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-soft blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <BrandMark size={32} />
          <div>
            <p className="text-[15px] font-extrabold leading-none tracking-tight text-ink">AMS</p>
            <p className="mt-1 text-2xs font-semibold uppercase tracking-[0.1em] text-faint">
              Academic Management
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.1em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-positive" />
            Academic year 2026–27
          </p>
          <h1 className="text-[34px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
            Attendance that
            <br />
            keeps itself honest.
          </h1>
          <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
            One system for departments, timetables, leave requests and disputes — so everyone
            works from the same record.
          </p>

          <div className="mt-9 flex flex-col gap-5">
            {highlights.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-canvas text-muted">
                  <Icon size={14} />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-ink">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-2xs text-faint">
          © {new Date().getFullYear()} AMS · Built for Alits Group of Institutions
        </p>
      </aside>

      {/* ── form panel ── */}
      <main className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-[380px] animate-fade-up">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <BrandMark size={30} />
            <p className="text-[15px] font-extrabold tracking-tight text-ink">AMS</p>
          </div>

          <h2 className="text-[22px] font-bold tracking-tight text-ink">Sign in</h2>
          <p className="mt-1.5 text-[13px] text-muted">
            Use the credentials issued by your institution.
          </p>

          {error ? (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2.5 rounded-md border border-negative/25 bg-negative-soft px-3 py-2.5 text-[13px] font-medium text-negative"
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-negative text-2xs font-bold text-white">
                !
              </span>
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="ID number or email" htmlFor="login-email">
              <div className="relative">
                <Mail
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                />
                <Input
                  id="login-email"
                  type="text"
                  className="h-10 pl-9"
                  placeholder="242G1A05X2@alits.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </Field>

            <Field label="Password" htmlFor="login-password">
              <div className="relative">
                <Lock
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="h-10 pl-9 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-faint transition-colors hover:text-ink"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Field>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="mt-2 w-full"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-canvas/30 border-t-canvas" />
                  Signing in
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={15} />
                </>
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted">
            Setting up a new institution?{' '}
            <Link to="/admin-register" className="font-semibold text-accent hover:underline">
              Register as admin
            </Link>
          </p>

          {/* demo accounts — useful while evaluating */}
          <div className="mt-9 border-t border-line pt-5">
            <p className="mb-3 text-2xs font-bold uppercase tracking-[0.12em] text-faint">
              Demo accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Admin', email: 'admin@ams.edu' },
                { label: 'Faculty', email: 'sruthi@alits.edu.in' },
                { label: 'Student', email: '242G1A05X2@alits.edu.in' },
              ].map((role) => (
                <button
                  key={role.label}
                  type="button"
                  onClick={() => submit(role.email, 'Ams@2026')}
                  disabled={loading}
                  className="rounded-md border border-line bg-surface py-2 text-2xs font-semibold text-muted shadow-xs transition-colors hover:border-line-strong hover:bg-sunken hover:text-ink disabled:opacity-50"
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
