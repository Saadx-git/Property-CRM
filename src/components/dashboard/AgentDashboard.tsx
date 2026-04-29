'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Lead {
  _id: string; name: string; phone: string; propertyInterest: string;
  budgetFormatted: string; status: string; priority: string; score: number;
  followUpDate?: string; lastActivityAt: string;
}

interface FollowupData {
  overdue: Lead[]; upcoming: Lead[]; stale: Lead[];
}

function priorityBadge(p: string) {
  if (p === 'High') return 'priority-high status-badge';
  if (p === 'Medium') return 'priority-medium status-badge';
  return 'priority-low status-badge';
}

export default function AgentDashboard({ userId, userName }: { userId: string; userName: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followups, setFollowups] = useState<FollowupData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/leads?limit=10').then((r) => r.json()),
      fetch('/api/followups').then((r) => r.json()),
    ])
      .then(([leadsData, fuData]) => {
        if (leadsData.success) setLeads(leadsData.data);
        if (fuData.success) setFollowups(fuData.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const highPriority = leads.filter((l) => l.priority === 'High').length;
  const needFollowup = (followups?.overdue.length || 0) + (followups?.stale.length || 0);

  return (
    <div className="space-y-6 animate-in">
      {/* Welcome */}
      <div className="card-glow p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">
            Welcome back, {userName.split(' ')[0]} 👋
          </h2>
          <p className="text-gray-400 mt-1">Here&apos;s your performance overview for today.</p>
        </div>
        <Link href="/dashboard/leads/new" className="btn-primary hidden sm:flex items-center gap-2">
          + New Lead
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '👥', label: 'My Leads', value: leads.length, color: 'brand' },
          { icon: '🔴', label: 'High Priority', value: highPriority, color: 'red' },
          { icon: '📅', label: 'Overdue Follow-ups', value: followups?.overdue.length || 0, color: 'red' },
          { icon: '💤', label: 'Stale Leads', value: followups?.stale.length || 0, color: 'purple' },
        ].map((stat) => (
          <div key={stat.label} className={`card border ${stat.color === 'red' ? 'border-red-500/20 bg-red-500/5' : stat.color === 'purple' ? 'border-purple-500/20 bg-purple-500/5' : 'border-brand-400/20 bg-brand-400/5'} p-5 rounded-xl`}>
            <span className="text-2xl">{stat.icon}</span>
            <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {needFollowup > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-red-400 font-semibold">Attention Required</p>
            <p className="text-sm text-red-300/70">
              You have {followups?.overdue.length || 0} overdue and {followups?.stale.length || 0} stale leads.{' '}
              <Link href="/dashboard/followups" className="underline">View all →</Link>
            </p>
          </div>
        </div>
      )}

      {/* My Leads */}
      <div className="card-glow p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-white">My Assigned Leads</h3>
          <Link href="/dashboard/leads" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
        </div>
        <div className="space-y-2">
          {leads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No leads assigned yet.</div>
          ) : (
            leads.map((lead) => (
              <Link
                key={lead._id}
                href={`/dashboard/leads/${lead._id}`}
                className="flex items-center justify-between bg-dark-700 hover:bg-dark-600 rounded-lg px-4 py-3 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-10 rounded-full ${lead.priority === 'High' ? 'bg-red-500' : lead.priority === 'Medium' ? 'bg-amber-500' : 'bg-green-500'}`} />
                  <div>
                    <p className="text-white font-medium text-sm group-hover:text-brand-400 transition-colors">{lead.name}</p>
                    <p className="text-xs text-gray-500">{lead.propertyInterest} · {lead.budgetFormatted}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`status-badge ${priorityBadge(lead.priority)}`}>{lead.priority}</span>
                  <span className="text-xs text-gray-500 hidden sm:block">{lead.status}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Upcoming follow-ups */}
      {followups?.upcoming && followups.upcoming.length > 0 && (
        <div className="card-glow p-6">
          <h3 className="font-semibold text-white mb-4">📅 Upcoming Follow-ups</h3>
          <div className="space-y-2">
            {followups.upcoming.slice(0, 5).map((lead) => (
              <Link
                key={lead._id}
                href={`/dashboard/leads/${lead._id}`}
                className="flex items-center justify-between bg-dark-700 hover:bg-dark-600 rounded-lg px-4 py-3 transition-colors"
              >
                <div>
                  <p className="text-white font-medium text-sm">{lead.name}</p>
                  <p className="text-xs text-gray-500">{lead.propertyInterest}</p>
                </div>
                <div className="text-right">
                  <p className="text-brand-400 text-xs font-semibold">
                    {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">Follow-up</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
