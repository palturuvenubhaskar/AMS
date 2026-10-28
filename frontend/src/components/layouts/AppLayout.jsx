import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Moon, MoreHorizontal, Sun, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import NotificationBell from '../NotificationBell';
import Avatar from '../ui/Avatar';
import { cn } from '../ui/cn';
import { currentSection, isActivePath, navConfig } from './nav';

/* ─────────────────────────── brand ─────────────────────────── */

export function BrandMark({ size = 30 }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[9px] bg-ink text-canvas"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.56}
        height={size * 0.56}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 19h18M6 19v-6M11 19V8M16 19v-4M21 19V5" />
      </svg>
    </span>
  );
}

function Brand({ portal, compact }) {
  return (
    <div className={cn('flex items-center gap-2.5', compact ? 'px-4 py-4' : 'px-4 h-16')}>
      <BrandMark />
      <div className="min-w-0">
        <p className="text-[15px] font-extrabold leading-none tracking-tight text-ink">AMS</p>
        <p className="mt-1 truncate text-2xs font-semibold uppercase tracking-[0.1em] text-faint">
          {portal}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────── navigation ─────────────────────────── */

function NavList({ config, onNavigate }) {
  const { pathname } = useLocation();

  return (
    <nav className="flex flex-col gap-5 px-2.5 py-2">
      {config.sections.map((section) => (
        <div key={section.title}>
          <p className="mb-1.5 px-2 text-2xs font-bold uppercase tracking-[0.12em] text-faint">
            {section.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = isActivePath(pathname, item);
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={cn(
                    'group relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium ' +
                      'transition-colors duration-150',
                    active
                      ? 'bg-accent-soft font-semibold text-accent'
                      : 'text-muted hover:bg-sunken hover:text-ink'
                  )}
                >
                  {active ? (
                    <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-accent" />
                  ) : null}
                  <Icon
                    size={16}
                    strokeWidth={2}
                    className={cn('shrink-0', active ? 'text-accent' : 'text-faint group-hover:text-muted')}
                  />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

/* ─────────────────────────── user menu ─────────────────────────── */

function UserMenu({ user, portal, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'flex items-center gap-2 rounded-md p-1 pr-1.5 transition-colors duration-150 hover:bg-sunken',
          open && 'bg-sunken'
        )}
      >
        <Avatar name={user?.fullName} size="sm" />
        <ChevronDown size={14} className="text-faint" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 animate-scale-in rounded-lg border border-line bg-surface p-1 shadow-pop"
        >
          <div className="border-b border-line px-2.5 pb-2.5 pt-2">
            <p className="truncate text-[13px] font-semibold text-ink">{user?.fullName || 'Account'}</p>
            <p className="truncate text-xs text-faint">{user?.email}</p>
            <p className="mt-1.5 inline-flex rounded bg-sunken px-1.5 py-0.5 text-2xs font-bold uppercase tracking-[0.1em] text-muted">
              {portal}
            </p>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={toggleTheme}
            className="mt-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-body transition-colors hover:bg-sunken hover:text-ink"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            {theme === 'dark' ? 'Light theme' : 'Dark theme'}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={onSignOut}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-negative transition-colors hover:bg-negative-soft"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────────────────── shell ─────────────────────────── */

export default function AppLayout({ role }) {
  const config = navConfig[role] ?? navConfig.student;
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const active = currentSection(pathname, config);
  const allItems = config.sections.flatMap((section) => section.items);
  const primary = allItems.slice(0, 4);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen bg-canvas text-body">
      {/* ── desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-line bg-surface lg:flex">
        <Brand portal={config.portal} />

        <div className="no-scrollbar flex-1 overflow-y-auto py-2">
          <NavList config={config} />
        </div>

        <div className="border-t border-line p-2.5">
          <div className="flex items-center gap-2.5 rounded-md p-2 transition-colors hover:bg-sunken">
            <Avatar name={user?.fullName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink">
                {user?.fullName || 'Signed in'}
              </p>
              <p className="truncate text-2xs text-faint">
                {user?.studentInfo?.roll_no || user?.email || config.portal}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="flex h-7 w-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-surface hover:text-negative"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── mobile drawer ── */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-ink/45 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[272px] animate-slide-in flex-col border-r border-line bg-surface">
            <div className="flex items-center justify-between pr-3">
              <Brand portal={config.portal} compact />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-sunken hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList config={config} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="border-t border-line p-2.5">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-negative hover:bg-negative-soft"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {/* ── main column ── */}
      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <BrandMark size={26} />
            <p className="truncate text-[13px] font-semibold text-ink">
              {active?.item.label ?? 'AMS'}
            </p>
          </div>

          <p className="hidden text-xs font-medium text-faint lg:block">
            {active?.section ? (
              <span>
                <span className="text-muted">{active.section}</span>
                <span className="mx-1.5 text-line-strong">/</span>
                <span className="text-ink">{active.item.label}</span>
              </span>
            ) : (
              today
            )}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              title="Toggle theme"
              aria-label="Toggle theme"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <NotificationBell />

            <span className="mx-1 hidden h-5 w-px bg-line sm:block" />
            <UserMenu user={user} portal={config.portal} onSignOut={handleSignOut} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-5 sm:px-6 sm:pt-6 lg:pb-12">
          <Outlet />
        </main>
      </div>

      {/* ── mobile bottom bar ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[60px] items-stretch border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        {primary.map((item) => {
          const activeItem = isActivePath(pathname, item);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 text-2xs font-semibold transition-colors',
                activeItem ? 'text-accent' : 'text-faint'
              )}
            >
              <Icon size={18} strokeWidth={activeItem ? 2.4 : 2} />
              <span className="max-w-full truncate px-1">{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 text-2xs font-semibold text-faint"
        >
          <MoreHorizontal size={18} />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
