import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';
import api from '../services/api';
import { cn } from './ui/cn';

const timeAgo = (date) => {
  const mins = Math.floor((Date.now() - new Date(date)) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
};

export default function NotificationBell() {
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const fetchNotifs = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch {
      /* silent — the bell is non-critical */
    }
  };

  const markRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifs();
    } catch {
      toast.error('Could not update notification');
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifs();
    } catch {
      toast.error('Could not update notifications');
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        aria-expanded={open}
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-ink',
          open && 'bg-sunken text-ink'
        )}
      >
        <Bell size={16} />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-negative opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-negative" />
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 flex max-h-[420px] w-[340px] animate-scale-in flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <h4 className="text-[13px] font-bold text-ink">Notifications</h4>
              {unread > 0 ? (
                <span className="tnum rounded-full bg-accent-soft px-1.5 py-0.5 text-2xs font-bold text-accent">
                  {unread}
                </span>
              ) : null}
            </div>
            {unread > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="text-2xs font-semibold text-accent hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Bell size={20} className="mx-auto mb-2 text-faint" />
                <p className="text-[13px] font-medium text-muted">You're all caught up</p>
              </div>
            ) : (
              notifs.slice(0, 12).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markRead(n.id, n.is_read)}
                  className="flex w-full gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-0 hover:bg-sunken"
                >
                  <span
                    className={cn(
                      'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                      n.is_read ? 'bg-line-strong' : 'bg-accent'
                    )}
                  />
                  <span className="min-w-0">
                    <span
                      className={cn(
                        'block truncate text-[13px]',
                        n.is_read ? 'font-medium text-body' : 'font-semibold text-ink'
                      )}
                    >
                      {n.title}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted">
                      {n.message}
                    </span>
                    <span className="mt-1 block text-2xs font-medium uppercase tracking-wide text-faint">
                      {timeAgo(n.created_at)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
