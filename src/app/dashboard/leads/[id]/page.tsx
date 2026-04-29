'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { getWhatsAppUrl } from '@/lib/whatsapp';

interface Agent { _id: string; name: string; email: string; }
interface Activity { _id: string; action: string; description: string; performedBy: { name: string; role: string }; createdAt: string; metadata?: Record<string, string>; }
interface Suggestion { suggestions: string[]; actionItems: string[]; suggestedFollowUpDate: string; urgencyScore: number; daysSinceActivity: number; }

interface Lead {
  _id: string; name: string; email?: string; phone: string;
  propertyInterest: string; budgetFormatted: string; budget: number;
  status: string; priority: string; score: number; source: string;
  location?: string; notes?: string; followUpDate?: string;
  assignedTo?: { _id: string; name: string; email: string } | null;
  createdBy?: { name: string } | null;
  createdAt: string; lastActivityAt: string;
}

const ACTION_ICONS: Record<string, string> = {
  lead_created: '✨', lead_updated: '📝', status_changed: '🔄',
  lead_assigned: '👤', lead_reassigned: '🔀', notes_updated: '📋',
  followup_set: '📅', priority_changed: '🎯', lead_deleted: '🗑️',
};

const STATUS_OPTIONS = ['New', 'Contacted', 'In Progress', 'Closed', 'Lost'];
const PROPERTY_TYPES = ['House', 'Apartment', 'Plot', 'Commercial', 'Villa', 'Other'];

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const user = session?.user as { id: string; role: string } | undefined;

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead & { followUpDate: string }>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'ai'>('details');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadRes, actRes] = await Promise.all([
        fetch(`/api/leads/${params.id}`),
        fetch(`/api/leads/${params.id}/activities`),
      ]);
      const [leadData, actData] = await Promise.all([leadRes.json(), actRes.json()]);
      if (leadData.success) { setLead(leadData.data); setEditForm(leadData.data); }
      if (actData.success) setActivities(actData.data);

      if (user?.role === 'admin') {
        const agRes = await fetch('/api/agents');
        const agData = await agRes.json();
        if (agData.success) setAgents(agData.data);
      }
    } finally {
      setLoading(false);
    }
  }, [params.id, user?.role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function fetchSuggestions() {
    if (suggestions) return;
    const res = await fetch(`/api/leads/${params.id}/suggestions`);
    const data = await res.json();
    if (data.success) setSuggestions(data.data);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          budget: editForm.budget ? Number(editForm.budget) : undefined,
          followUpDate: editForm.followUpDate ? new Date(editForm.followUpDate).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (data.success) { setLead(data.data); setEditMode(false); fetchData(); }
    } finally {
      setSaving(false);
    }
  }

  async function handleAssign() {
    if (!selectedAgent) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/leads/${params.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent }),
      });
      const data = await res.json();
      if (data.success) { setLead(data.data); fetchData(); }
    } finally {
      setAssigning(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!lead) return <div className="text-red-400 text-center py-16">Lead not found.</div>;

  const whatsappUrl = getWhatsAppUrl(lead.phone);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/leads" className="text-gray-500 hover:text-white transition-colors">← Leads</Link>
          <span className="text-gray-700">/</span>
          <h2 className="text-xl font-display font-bold text-white">{lead.name}</h2>
          <span className={`status-badge text-xs ${lead.priority === 'High' ? 'priority-high' : lead.priority === 'Medium' ? 'priority-medium' : 'priority-low'}`}>
            {lead.priority}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-secondary text-sm flex items-center gap-1.5 text-green-400 border-green-500/30 hover:bg-green-500/10">
            💬 WhatsApp
          </a>
          {!editMode && (
            <button onClick={() => setEditMode(true)} className="btn-secondary text-sm">
              ✏️ Edit
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tabs */}
          <div className="flex gap-1 bg-dark-800 border border-dark-600 rounded-xl p-1">
            {(['details', 'activity', 'ai'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); if (tab === 'ai') fetchSuggestions(); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-brand-400 text-dark-900' : 'text-gray-400 hover:text-white'}`}
              >
                {tab === 'details' ? '📋 Details' : tab === 'activity' ? '📜 Timeline' : '🤖 AI Insights'}
              </button>
            ))}
          </div>

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="card-glow p-6">
              {editMode ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-white mb-4">Edit Lead</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Name</label>
                      <input className="input-field text-sm" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input className="input-field text-sm" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Status</label>
                      <select className="select-field text-sm" value={editForm.status || ''} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                        {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Property Interest</label>
                      <select className="select-field text-sm" value={editForm.propertyInterest || ''} onChange={(e) => setEditForm({ ...editForm, propertyInterest: e.target.value })}>
                        {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Budget (PKR)</label>
                      <input type="number" className="input-field text-sm" value={editForm.budget || ''} onChange={(e) => setEditForm({ ...editForm, budget: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="label">Follow-up Date</label>
                      <input type="datetime-local" className="input-field text-sm" value={editForm.followUpDate ? new Date(editForm.followUpDate).toISOString().slice(0, 16) : ''} onChange={(e) => setEditForm({ ...editForm, followUpDate: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <textarea className="input-field text-sm resize-none" rows={3} value={editForm.notes || ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setEditMode(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-y-5 gap-x-8">
                  {[
                    ['Email', lead.email || '—'],
                    ['Phone', lead.phone],
                    ['Property Interest', lead.propertyInterest],
                    ['Budget', lead.budgetFormatted],
                    ['Location', lead.location || '—'],
                    ['Source', lead.source],
                    ['Status', lead.status],
                    ['Priority Score', String(lead.score)],
                    ['Follow-up', lead.followUpDate ? new Date(lead.followUpDate).toLocaleString() : '—'],
                    ['Created', new Date(lead.createdAt).toLocaleDateString()],
                    ['Last Activity', new Date(lead.lastActivityAt).toLocaleDateString()],
                    ['Created By', lead.createdBy?.name || '—'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="label text-xs">{label}</p>
                      <p className="text-white font-medium text-sm">{value}</p>
                    </div>
                  ))}
                  {lead.notes && (
                    <div className="col-span-2">
                      <p className="label text-xs">Notes</p>
                      <p className="text-gray-300 text-sm bg-dark-700 rounded-lg p-3 mt-1">{lead.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Activity Timeline Tab */}
          {activeTab === 'activity' && (
            <div className="card-glow p-6">
              <h3 className="font-semibold text-white mb-5">Activity Timeline</h3>
              {activities.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No activities recorded yet.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-dark-500" />
                  <div className="space-y-4">
                    {activities.map((act, i) => (
                      <div key={act._id} className={`relative flex gap-4 ${i === 0 ? '' : ''}`}>
                        <div className="relative z-10 w-8 h-8 bg-dark-700 border border-dark-500 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                          {ACTION_ICONS[act.action] || '📝'}
                        </div>
                        <div className="flex-1 bg-dark-700 rounded-lg p-3">
                          <p className="text-white text-sm font-medium">{act.description}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-500">by {act.performedBy?.name} ({act.performedBy?.role})</p>
                            <p className="text-xs text-gray-600">{new Date(act.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Suggestions Tab */}
          {activeTab === 'ai' && (
            <div className="card-glow p-6">
              <h3 className="font-semibold text-white mb-5">🤖 AI Follow-up Insights</h3>
              {!suggestions ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Analyzing lead...
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-4 bg-dark-700 rounded-xl p-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-brand-400">{suggestions.urgencyScore}</p>
                      <p className="text-xs text-gray-500">Urgency Score</p>
                    </div>
                    <div className="h-12 w-px bg-dark-500" />
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white">{suggestions.daysSinceActivity}</p>
                      <p className="text-xs text-gray-500">Days Inactive</p>
                    </div>
                    <div className="h-12 w-px bg-dark-500" />
                    <div className="text-center">
                      <p className="text-sm font-bold text-green-400">{new Date(suggestions.suggestedFollowUpDate).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">Suggested Follow-up</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">AI Suggestions</p>
                    <div className="space-y-2">
                      {suggestions.suggestions.map((s, i) => (
                        <div key={i} className="bg-dark-700 rounded-lg p-3 text-sm text-gray-300">{s}</div>
                      ))}
                    </div>
                  </div>

                  {suggestions.actionItems.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Action Items</p>
                      <ul className="space-y-2">
                        {suggestions.actionItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                            <span className="text-brand-400 mt-0.5">→</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Score Card */}
          <div className="card-glow p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Lead Score</p>
            <div className="relative w-24 h-24 mx-auto mb-3">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#2c2c3e" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke={lead.score >= 70 ? '#ef4444' : lead.score >= 40 ? '#f59e0b' : '#10b981'}
                  strokeWidth="8"
                  strokeDasharray={`${(lead.score / 100) * 251} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{lead.score}</span>
              </div>
            </div>
            <span className={`status-badge ${lead.priority === 'High' ? 'priority-high' : lead.priority === 'Medium' ? 'priority-medium' : 'priority-low'}`}>
              {lead.priority} Priority
            </span>
          </div>

          {/* Assignment (Admin only) */}
          {user?.role === 'admin' && (
            <div className="card-glow p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Assign Lead</p>
              {lead.assignedTo && (
                <div className="bg-dark-700 rounded-lg p-3 mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand-400/20 rounded-lg flex items-center justify-center text-sm font-bold text-brand-400">
                    {lead.assignedTo.name[0]}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{lead.assignedTo.name}</p>
                    <p className="text-xs text-gray-500">Currently assigned</p>
                  </div>
                </div>
              )}
              <select className="select-field text-sm mb-3" value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
                <option value="">Select agent...</option>
                {agents.map((a) => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
              <button onClick={handleAssign} disabled={assigning || !selectedAgent} className="btn-primary w-full text-sm">
                {assigning ? 'Assigning...' : lead.assignedTo ? 'Reassign' : 'Assign Lead'}
              </button>
            </div>
          )}

          {/* Quick Stats */}
          <div className="card-glow p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Quick Info</p>
            <div className="space-y-2.5">
              {[
                ['Status', lead.status],
                ['Source', lead.source],
                ['Budget', lead.budgetFormatted],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs">{k}</span>
                  <span className="text-white text-xs font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
