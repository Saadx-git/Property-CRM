'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PROPERTY_TYPES = ['House', 'Apartment', 'Plot', 'Commercial', 'Villa', 'Other'];
const LEAD_SOURCES = ['Facebook Ads', 'Walk-in', 'Website', 'Referral', 'Phone', 'Other'];

export default function NewLeadPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', propertyInterest: 'House',
    budget: '', location: '', source: 'Walk-in', notes: '', status: 'New',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    if (fieldErrors[key]) setFieldErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, budget: parseFloat(form.budget) }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.details) setFieldErrors(data.details);
        else setError(data.error || 'Failed to create lead');
        return;
      }

      router.push(`/dashboard/leads/${data.data._id}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const budgetInM = form.budget ? (parseFloat(form.budget) / 1_000_000).toFixed(1) : null;
  const predictedPriority = budgetInM
    ? parseFloat(budgetInM) > 20 ? 'High' : parseFloat(budgetInM) >= 10 ? 'Medium' : 'Low'
    : null;

  return (
    <div className="max-w-2xl mx-auto animate-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/leads" className="text-gray-500 hover:text-white transition-colors">← Back</Link>
        <span className="text-gray-700">/</span>
        <h2 className="text-xl font-display font-bold text-white">Create New Lead</h2>
      </div>

      <div className="card-glow p-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Full Name *</label>
              <input type="text" className="input-field" placeholder="Ahmed Khan" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              {fieldErrors.name && <p className="text-red-400 text-xs mt-1">{fieldErrors.name[0]}</p>}
            </div>
            <div>
              <label className="label">Phone Number *</label>
              <input type="tel" className="input-field" placeholder="03001234567" value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
              {fieldErrors.phone && <p className="text-red-400 text-xs mt-1">{fieldErrors.phone[0]}</p>}
            </div>
          </div>

          <div>
            <label className="label">Email Address</label>
            <input type="email" className="input-field" placeholder="client@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Property Interest *</label>
              <select className="select-field" value={form.propertyInterest} onChange={(e) => set('propertyInterest', e.target.value)}>
                {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Lead Source *</label>
              <select className="select-field" value={form.source} onChange={(e) => set('source', e.target.value)}>
                {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Budget (PKR) *</label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 25000000 for 2.5 Crore"
              value={form.budget}
              onChange={(e) => set('budget', e.target.value)}
              required
              min="0"
            />
            {budgetInM && (
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-gray-500">{budgetInM}M PKR</p>
                {predictedPriority && (
                  <span className={`status-badge text-xs ${predictedPriority === 'High' ? 'priority-high' : predictedPriority === 'Medium' ? 'priority-medium' : 'priority-low'}`}>
                    → {predictedPriority} Priority
                  </span>
                )}
              </div>
            )}
            {fieldErrors.budget && <p className="text-red-400 text-xs mt-1">{fieldErrors.budget[0]}</p>}
          </div>

          <div>
            <label className="label">Preferred Location</label>
            <input type="text" className="input-field" placeholder="e.g. DHA Phase 6, Lahore" value={form.location} onChange={(e) => set('location', e.target.value)} />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input-field resize-none"
              rows={4}
              placeholder="Any specific requirements or notes about this lead..."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/dashboard/leads" className="btn-secondary flex-1 text-center">
              Cancel
            </Link>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Creating...</>
              ) : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
