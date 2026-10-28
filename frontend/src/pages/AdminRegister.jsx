import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, User } from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import { BrandMark } from '../components/layouts/AppLayout';

export default function AdminRegister() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register-admin', { fullName, email, phone, password });
      toast.success('Admin registered. You can sign in now.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex h-16 items-center justify-between border-b border-line px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <BrandMark size={28} />
          <p className="text-[15px] font-extrabold tracking-tight text-ink">AMS</p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </header>

      <main className="flex flex-1 justify-center px-5 py-10 sm:px-8 sm:py-14">
        <div className="w-full max-w-[430px] animate-fade-up">
          <div className="mb-7">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.1em] text-muted">
              <ShieldCheck size={12} /> System setup
            </span>
            <h1 className="text-[24px] font-bold tracking-tight text-ink">Register an admin</h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              This creates the first administrator account for your institution. Later accounts are
              managed from the user directory.
            </p>
          </div>

          {error ? (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-md border border-negative/25 bg-negative-soft px-3 py-2.5 text-[13px] font-medium text-negative"
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-negative text-2xs font-bold text-white">
                !
              </span>
              {error}
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-line bg-surface p-5 shadow-xs sm:p-6"
          >
            <div className="space-y-4">
              <Field label="Full name" htmlFor="reg-name" required>
                <div className="relative">
                  <User
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                  />
                  <Input
                    id="reg-name"
                    className="h-10 pl-9"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </Field>

              <Field label="Email address" htmlFor="reg-email" required>
                <div className="relative">
                  <Mail
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                  />
                  <Input
                    id="reg-email"
                    type="email"
                    className="h-10 pl-9"
                    placeholder="admin@institution.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </Field>

              <Field label="Phone number" htmlFor="reg-phone" hint="Optional, used for account recovery.">
                <div className="relative">
                  <Phone
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                  />
                  <Input
                    id="reg-phone"
                    className="h-10 pl-9"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </Field>

              <Field label="Password" htmlFor="reg-password" required>
                <div className="relative">
                  <Lock
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                  />
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    className="h-10 pl-9 pr-10"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
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
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="mt-5 w-full"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-canvas/30 border-t-canvas" />
                  Creating account
                </>
              ) : (
                <>
                  Create admin account
                  <ArrowRight size={15} />
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
