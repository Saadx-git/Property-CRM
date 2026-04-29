'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  New: '#3b82f6', Contacted: '#8b5cf6', 'In Progress': '#f59e0b', Closed: '#10b981', Lost: '#ef4444',
};
const PRIORITY_COLORS: Record<string, string> = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface AnalyticsData {
  overview: {
    totalLeads: number; leadsThisMonth: number; leadsThisWeek: number;
    overdueFollowups: number; totalAgents: number; unassignedLeads: number;
  };
  statusDistribution: { _id: string; count: number }[];
  priorityDistribution: { _id: string; count: number }[];
  sourceDistribution: { _id: string; count: number }[];
  agentPerformance: {
    _id: string; agentName: string; agentEmail: string;
    totalLeads: number; closedLeads: number; highPriority: number;
    avgScore: number; conversionRate: number;
  }[];
  recentLeads: { _id: string; name: string; priority: string; status: string; budgetFormatted: string; createdAt: string }[];
  monthlyTrend: { _id: { year: number; month: number }; count: number; highPriority: number }[];
}

function StatCard({ icon, label, value, sub, color = 'brand' }: {
  icon: string; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    brand: 'border-brand-400/20 bg-brand-400/5',
    red: 'border-red-500/20 bg-red-500/5',
    blue: 'border-blue-500/20 bg-blue-500/5',
    green: 'border-green-500/20 bg-green-500/5',
    purple: 'border-purple-500/20 bg-purple-500/5',
  };
  return (
    <div className={`card border ${colorMap[color] || colorMap.brand} p-6 rounded-xl`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-red-400">Failed to load analytics.</div>;

  const monthlyChartData = data.monthlyTrend.map((m) => ({
    name: MONTH_NAMES[m._id.month - 1],
    Total: m.count,
    'High Priority': m.highPriority,
  }));

  return (
    <div className="space-y-8 animate-in">
      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon="👥" label="Total Leads" value={data.overview.totalLeads} color="brand" />
        <StatCard icon="📅" label="This Month" value={data.overview.leadsThisMonth} sub="New leads" color="blue" />
        <StatCard icon="🔥" label="This Week" value={data.overview.leadsThisWeek} sub="New leads" color="purple" />
        <StatCard icon="⚠️" label="Overdue" value={data.overview.overdueFollowups} sub="Follow-ups" color="red" />
        <StatCard icon="🧑‍💼" label="Agents" value={data.overview.totalAgents} sub="Active" color="green" />
        <StatCard icon="📭" label="Unassigned" value={data.overview.unassignedLeads} sub="Leads" color="red" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <div className="lg:col-span-2 card-glow p-6">
          <h3 className="font-semibold text-white mb-5">📈 Lead Trend (6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2c2c3e" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #3a3a52', borderRadius: 8, color: '#fff' }} />
              <Legend />
              <Line type="monotone" dataKey="Total" stroke="#f0ad36" strokeWidth={2} dot={{ fill: '#f0ad36' }} />
              <Line type="monotone" dataKey="High Priority" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="card-glow p-6">
          <h3 className="font-semibold text-white mb-5">📊 Status Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data.statusDistribution} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={70} label={({ _id, count }) => `${_id}: ${count}`} labelLine={false}>
                {data.statusDistribution.map((entry) => (
                  <Cell key={entry._id} fill={STATUS_COLORS[entry._id] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #3a3a52', borderRadius: 8, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1">
            {data.statusDistribution.map((s) => (
              <div key={s._id} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s._id] || '#6b7280' }} />
                  <span className="text-gray-400">{s._id}</span>
                </span>
                <span className="text-white font-semibold">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority + Source charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-glow p-6">
          <h3 className="font-semibold text-white mb-5">🎯 Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.priorityDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2c2c3e" />
              <XAxis dataKey="_id" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #3a3a52', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.priorityDistribution.map((entry) => (
                  <Cell key={entry._id} fill={PRIORITY_COLORS[entry._id] || '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-glow p-6">
          <h3 className="font-semibold text-white mb-5">📡 Lead Sources</h3>
          <div className="space-y-3">
            {data.sourceDistribution.map((s) => {
              const pct = data.overview.totalLeads ? Math.round((s.count / data.overview.totalLeads) * 100) : 0;
              return (
                <div key={s._id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{s._id}</span>
                    <span className="text-white font-semibold">{s.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="card-glow p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-white">🧑‍💼 Agent Performance</h3>
          <Link href="/dashboard/agents" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 pb-3">Agent</th>
                <th className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 pb-3">Total</th>
                <th className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 pb-3">Closed</th>
                <th className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 pb-3">High Priority</th>
                <th className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 pb-3">Avg Score</th>
                <th className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 pb-3">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {data.agentPerformance.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No agent data yet</td></tr>
              ) : (
                data.agentPerformance.map((agent) => (
                  <tr key={agent._id} className="table-row">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-400/20 rounded-lg flex items-center justify-center text-sm font-bold text-brand-400">
                          {agent.agentName[0]}
                        </div>
                        <div>
                          <p className="text-white font-medium">{agent.agentName}</p>
                          <p className="text-xs text-gray-500">{agent.agentEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center text-white font-semibold">{agent.totalLeads}</td>
                    <td className="text-center text-green-400 font-semibold">{agent.closedLeads}</td>
                    <td className="text-center text-red-400 font-semibold">{agent.highPriority}</td>
                    <td className="text-center">
                      <span className="bg-brand-400/10 text-brand-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                        {agent.avgScore}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${agent.conversionRate >= 50 ? 'bg-green-500/15 text-green-400' : agent.conversionRate >= 25 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
                        {agent.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="card-glow p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-white">🕐 Recent Leads</h3>
          <Link href="/dashboard/leads" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
        </div>
        <div className="space-y-3">
          {data.recentLeads.map((lead) => (
            <div key={lead._id} className="flex items-center justify-between bg-dark-700 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-dark-600 rounded-lg flex items-center justify-center font-bold text-brand-400">
                  {lead.name[0]}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{lead.name}</p>
                  <p className="text-xs text-gray-500">{new Date(lead.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{lead.budgetFormatted}</span>
                <span className={`status-badge ${lead.priority === 'High' ? 'priority-high' : lead.priority === 'Medium' ? 'priority-medium' : 'priority-low'}`}>
                  {lead.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
