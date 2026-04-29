'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface TopBarProps {
  user: { name?: string | null; email?: string | null; role: string };
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard Overview',
  '/dashboard/leads': 'Lead Management',
  '/dashboard/leads/new': 'Create New Lead',
  '/dashboard/agents': 'Agent Management',
  '/dashboard/analytics': 'Analytics & Insights',
  '/dashboard/followups': 'Follow-up Tracker',
};

export default function TopBar({ user }: TopBarProps) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const title = Object.entries(pageTitles).find(([k]) => pathname === k)?.[1] || 'Property CRM';

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch {}
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="bg-dark-800 border-b border-dark-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <p className="text-xs text-gray-500">
          {new Date().toLocaleDateString('en-PK', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs && unreadCount > 0) markAllRead(); }}
            className="relative w-10 h-10 bg-dark-700 hover:bg-dark-600 border border-dark-500 rounded-xl flex items-center justify-center transition-colors"
          >
            <span className="text-lg">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-dark-800 border border-dark-500 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4 border-b border-dark-600 flex items-center justify-between">
                <span className="font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-brand-400 hover:text-brand-300">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">No notifications</div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n._id}
                      className={`p-4 border-b border-dark-600 last:border-0 ${!n.isRead ? 'bg-brand-400/5' : ''}`}
                    >
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 bg-dark-700 hover:bg-dark-600 border border-dark-500 rounded-xl px-3 py-2 transition-colors"
          >
            <div className="w-7 h-7 bg-brand-400/20 border border-brand-400/40 rounded-lg flex items-center justify-center text-sm font-bold text-brand-400">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <span className="text-gray-500 text-xs">▾</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-48 bg-dark-800 border border-dark-500 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-dark-600">
                <p className="text-xs font-semibold text-white">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
