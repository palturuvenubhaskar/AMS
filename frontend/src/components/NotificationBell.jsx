import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { HiOutlineBell } from 'react-icons/hi';

export default function NotificationBell({ className }) {
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifs = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch (e) { /* silent */ }
  };

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    fetchNotifs();
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    fetchNotifs();
  };

  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins/60)}h ago`;
    return `${Math.floor(mins/1440)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        className={className || "w-10 h-10 rounded-full bg-white dark:bg-[#111111] shadow-glass flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-brand-purple hover:scale-105 transition-all border border-slate-200 dark:border-[#222] relative"} 
        onClick={() => setOpen(!open)}
      >
        <HiOutlineBell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-purple text-white text-[9px] font-black flex items-center justify-center shadow-sm">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-glass z-50 overflow-hidden flex flex-col max-h-[400px] animate-[fadeIn_0.2s_ease-out]">
          <div className="p-4 flex justify-between items-center border-b border-gray-100/50 bg-white/40 dark:bg-[#111111]/40">
            <span className="font-black text-gray-900 dark:text-gray-100">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[10px] font-bold uppercase tracking-widest text-brand-purple hover:text-brand-dark transition-colors px-2 py-1 rounded-md hover:bg-brand-purple/10">
                Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {notifs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm font-medium">No notifications</div>
            ) : notifs.slice(0, 10).map(n => (
              <div 
                key={n.id} 
                className={`p-3 rounded-2xl cursor-pointer transition-colors relative overflow-hidden ${!n.is_read ? 'bg-brand-purple/5 hover:bg-brand-purple/10' : 'hover:bg-white/60 dark:bg-[#111111]/60'}`} 
                onClick={() => markRead(n.id)}
              >
                {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-purple" />}
                <div className={`pl-2`}>
                  <h4 className={`text-sm ${!n.is_read ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-semibold text-gray-600 dark:text-gray-400'}`}>{n.title}</h4>
                  <p className={`text-xs mt-1 ${!n.is_read ? 'font-medium text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>{n.message}</p>
                  <time className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{timeAgo(n.created_at)}</time>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
