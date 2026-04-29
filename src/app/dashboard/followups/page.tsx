'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Lead {
  _id: string; name: string; phone: string; propertyInterest: string;
  budgetFormatted: string; status: string; priority: string;
  followUpDate?: string; lastActivityAt: string;
  assignedTo?: { name: string } | null;
}

function LeadRow({ lead, type }: { lead: Lead; type: 'overdue' | 'upcoming' | 'stale' }) {
  const typeColors = {
    overdue: 'border-l-red-500',
    upcoming: 'border-l-amber-500',
    stale: 'border-l-purple-500',
  };

  return (
    <Link
      href={`/dashboard/leads/${lead._id}`}
      className={`flex items-center justify-between bg-dark-700 hover:bg-dark-600 rounded-lg px-4 py-3 border-l-2 ${typeColors[type]} transition-colors group`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-2 h-10 rounded-full ${lead.priority === 'High' ? 'bg-red-500' : lead.priority === 'Medium' ? 'bg-amber-500' : 'bg-green-500'}`} />
        <div>
          <p className="text-white font-medium text-sm group-hover:text-brand-400 transition-colors">{lead.name}</p>
          <p className="text-xs text-gray-500">{lead.propertyInterest} · {lead.budgetFormatted}</p>
          {lead.assignedTo && <p className="text-xs text-gray-600">Agent: {lead.assignedTo.name}</p>}
        </div>
      </div>
      <div className="text-right">
        {type === 'overdue' && lead.followUpDate && (
          <p className="text-red-400 text-xs font-semibold">Due: {new Date(lead.followUpDate).toLocaleDateString()}</p>
        )}
        {type === 'upcoming' && lead.followUpDate && (
          <p className="text-amber-400 text-xs font-semibold">Due: {new Date(lead.followUpDate).toLocaleDateString()}</p>
        )}
        {type === 'stale' && (
          <p className="text-purple-400 text-xs font-semibold">
            Last: {new Date(lead.lastActivityAt).toLocaleDateString()}
          </p>
        )}
        <span className={`status-badge text-xs mt-1 ${lead.priority === 'High' ? 'priority-high' : lead.priority === 'Medium' ? 'priority-medium' : 'priority-low'}`}>
          {lead.priority}
        </span>
      </div>
    </Link>
  );
}

export default function FollowupsPage() {
  const [data, setData] = useState<{ overdue: Lead[]; upcoming: Lead[]; stale: Lead[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/followups')
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sections = [
    { key: 'overdue' as const, label: '⚠️ Overdue Follow-ups', color: 'red', desc: 'These leads had follow-up dates in the past' },
    { key: 'upcoming' as const, label: '📅 Upcoming (Next 7 Days)', color: 'amber', desc: 'Follow-ups due in the next 7 days' },
    { key: 'stale' as const, label: '💤 Stale Leads', color: 'purple', desc: 'No activity recorded in 7+ days' },
  ];

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">Follow-up Tracker</h2>
        <p className="text-gray-500 text-sm mt-1">Smart detection of overdue and inactive leads</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Overdue', count: data?.overdue.length || 0, color: 'red', icon: '⚠️' },
          { label: 'Upcoming', count: data?.upcoming.length || 0, color: 'amber', icon: '📅' },
          { label: 'Stale', count: data?.stale.length || 0, color: 'purple', icon: '💤' },
        ].map((s) => (
          <div key={s.label} className={`card border ${s.color === 'red' ? 'border-red-500/20 bg-red-500/5' : s.color === 'amber' ? 'border-amber-500/20 bg-amber-500/5' : 'border-purple-500/20 bg-purple-500/5'} p-5 rounded-xl`}>
            <span className="text-2xl">{s.icon}</span>
            <p className="text-3xl font-bold text-white mt-2">{s.count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {sections.map((section) => {
        const leads = data?.[section.key] || [];
        return (
          <div key={section.key} className="card-glow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white">{section.label}</h3>
              <span className={`text-xs font-semibold ${section.color === 'red' ? 'text-red-400' : section.color === 'amber' ? 'text-amber-400' : 'text-purple-400'}`}>
                {leads.length} leads
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">{section.desc}</p>
            {leads.length === 0 ? (
              <div className="text-center py-6 text-gray-600 text-sm">✅ None — you&apos;re all caught up!</div>
            ) : (
              <div className="space-y-2">
                {leads.map((lead) => (
                  <LeadRow key={lead._id} lead={lead} type={section.key} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
