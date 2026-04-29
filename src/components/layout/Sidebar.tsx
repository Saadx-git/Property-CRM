'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface SidebarProps {
  role: string;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'agent'] },
  { href: '/dashboard/leads', label: 'Leads', icon: '👥', roles: ['admin', 'agent'] },
  { href: '/dashboard/followups', label: 'Follow-ups', icon: '📅', roles: ['admin', 'agent'] },
  { href: '/dashboard/agents', label: 'Agents', icon: '🧑‍💼', roles: ['admin'] },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📈', roles: ['admin'] },
];

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const filtered = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-dark-800 border-r border-dark-600 flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-dark-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-400/15 border border-brand-400/30 rounded-xl flex items-center justify-center text-xl">
            🏢
          </div>
          <div>
            <p className="font-display font-bold text-white leading-tight">Property CRM</p>
            <p className="text-xs text-brand-400 font-medium capitalize">{role} Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 px-4 mb-3">
          Navigation
        </p>
        {filtered.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 bg-brand-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-dark-600">
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <span className="text-lg">🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
