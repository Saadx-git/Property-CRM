'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getWhatsAppUrl } from '@/lib/whatsapp';

interface Lead {
  _id: string; name: string; email?: string; phone: string;
  propertyInterest: string; budgetFormatted: string; budget: number;
  status: string; priority: string; score: number; source: string;
  assignedTo?: { name: string; email: string } | null;
  createdAt: string; followUpDate?: string;
}

const STATUS_OPTIONS = ['All', 'New', 'Contacted', 'In Progress', 'Closed', 'Lost'];
const PRIORITY_OPTIONS = ['All', 'High', 'Medium', 'Low'];

function PriorityBadge({ p }: { p: string }) {
  return (
    <span className={`status-badge text-xs ${p === 'High' ? 'priority-high' : p === 'Medium' ? 'priority-medium' : 'priority-low'}`}>
      {p === 'High' ? '🔴' : p === 'Medium' ? '🟡' : '🟢'} {p}
    </span>
  );
}

function StatusBadge({ s }: { s: string }) {
  const colors: Record<string, string> = {
    New: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Contacted: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    'In Progress': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Closed: 'bg-green-500/15 text-green-400 border-green-500/30',
    Lost: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return (
    <span className={`status-badge border text-xs ${colors[s] || 'bg-gray-500/15 text-gray-400'}`}>{s}</span>
  );
}

export default function LeadsPage() {
  const { data: session } = useSession();
  const user = session?.user as { id: string; role: string } | undefined;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (search) params.set('search', search);
    if (status !== 'All') params.set('status', status);
    if (priority !== 'All') params.set('priority', priority);

    try {
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
        setTotal(data.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, status, priority]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this lead? This action cannot be undone.')) return;
    setDeleting(id);
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      setLeads((prev) => prev.filter((l) => l._id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function exportCSV() {
    const res = await fetch('/api/leads/export?format=csv');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${Date.now()}.csv`;
    a.click();
  }

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Lead Management</h2>
          <p className="text-gray-500 text-sm mt-1">{total} total leads</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-secondary text-sm flex items-center gap-1.5">
            📥 Export CSV
          </button>
          <Link href="/dashboard/leads/new" className="btn-primary text-sm flex items-center gap-1.5">
            + New Lead
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card-glow p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search leads..."
          className="input-field flex-1 min-w-48 py-2 text-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="select-field w-36 py-2 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="select-field w-36 py-2 text-sm" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}>
          {PRIORITY_OPTIONS.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card-glow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-600">
                {['Lead', 'Contact', 'Property / Budget', 'Status', 'Priority', 'Assigned To', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-500">
                  <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading...
                </td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-500">
                  No leads found. <Link href="/dashboard/leads/new" className="text-brand-400 hover:text-brand-300">Create one →</Link>
                </td></tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead._id} className="table-row">
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/leads/${lead._id}`} className="group">
                        <p className="text-white font-medium group-hover:text-brand-400 transition-colors">{lead.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Score: {lead.score} · {lead.source}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <a href={getWhatsAppUrl(lead.phone)} target="_blank" rel="noreferrer"
                          className="text-green-400 hover:text-green-300 text-lg" title="WhatsApp">💬</a>
                        <div>
                          <p className="text-gray-300 text-xs">{lead.phone}</p>
                          {lead.email && <p className="text-gray-500 text-xs">{lead.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-300 text-xs">{lead.propertyInterest}</p>
                      <p className="text-white font-semibold text-xs mt-0.5">{lead.budgetFormatted}</p>
                    </td>
                    <td className="px-5 py-4"><StatusBadge s={lead.status} /></td>
                    <td className="px-5 py-4"><PriorityBadge p={lead.priority} /></td>
                    <td className="px-5 py-4">
                      {lead.assignedTo ? (
                        <span className="text-gray-300 text-xs">{lead.assignedTo.name}</span>
                      ) : (
                        <span className="text-gray-600 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/leads/${lead._id}`} className="text-xs text-brand-400 hover:text-brand-300 font-medium">
                          View
                        </Link>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(lead._id)}
                            disabled={deleting === lead._id}
                            className="text-xs text-red-400 hover:text-red-300 font-medium disabled:opacity-50"
                          >
                            {deleting === lead._id ? '...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-dark-600">
            <p className="text-xs text-gray-500">Page {page} of {totalPages} · {total} leads</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
