'use client';

import { useState, useEffect } from 'react';

interface Agent {
  _id: string; name: string; email: string; phone?: string; isActive: boolean; createdAt: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((d) => { if (d.success) setAgents(d.data); })
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create agent'); return; }
      setAgents((prev) => [...prev, data.data]);
      setForm({ name: '', email: '', password: '', phone: '' });
      setShowForm(false);
      setSuccess('Agent created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Network error.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Agent Management</h2>
          <p className="text-gray-500 text-sm mt-1">{agents.length} agents registered</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          + Add Agent
        </button>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Create Agent Form */}
      {showForm && (
        <div className="card-glow p-6 animate-in">
          <h3 className="font-semibold text-white mb-5">Create New Agent</h3>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input-field text-sm" placeholder="Agent Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input-field text-sm" placeholder="agent@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" className="input-field text-sm" placeholder="03001234567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Password *</label>
              <input type="password" className="input-field text-sm" placeholder="Min 8 chars" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button type="submit" disabled={creating} className="btn-primary flex-1 text-sm">
                {creating ? 'Creating...' : 'Create Agent'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Agents Table */}
      <div className="card-glow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-600">
              {['Agent', 'Email', 'Phone', 'Status', 'Joined'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-5 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-500">
                <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : agents.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-500">No agents yet.</td></tr>
            ) : (
              agents.map((agent) => (
                <tr key={agent._id} className="table-row">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-brand-400/20 border border-brand-400/30 rounded-xl flex items-center justify-center font-bold text-brand-400">
                        {agent.name[0]}
                      </div>
                      <p className="text-white font-medium">{agent.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-400">{agent.email}</td>
                  <td className="px-5 py-4 text-gray-400">{agent.phone || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`status-badge text-xs ${agent.isActive ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
