import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OverviewData {
  total_transactions: number
  fraud_count: number
  fraud_rate: number
  total_volume: number
  avg_amount: number
  max_amount: number
  fraud_volume: number
  unique_senders: number
  unique_receivers: number
  type_breakdown: { type: string; count: number; volume: number; fraud_count: number }[]
  daily_trend: { date: string; count: number; volume: number; fraud_count: number }[]
}

/* ------------------------------------------------------------------ */
/*  Formatters                                                         */
/* ------------------------------------------------------------------ */

function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toFixed(0)}`
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-IN')
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  label, value, sub, accent, icon, delay,
}: {
  label: string; value: string | number; sub?: string
  accent: string; icon: React.ReactNode; delay: number
}) {
  return (
    <div
      className={`glass-card stat-card ${accent} p-5 animate-fade-in-up`}
      style={{ animationDelay: `${delay * 0.08}s` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        <div className="stat-icon">{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Custom Tooltip                                                     */
/* ------------------------------------------------------------------ */

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3" style={{ minWidth: 140 }}>
      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{typeof p.value === 'number' && p.value > 100 ? formatINR(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Dashboard Page                                                     */
/* ------------------------------------------------------------------ */

const PIE_COLORS = ['#6366f1', '#14b8a6', '#f43f5e', '#f59e0b', '#0ea5e9']

export default function Dashboard() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/overview`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p style={{ color: 'var(--text-muted)' }}>Failed to load data. Is the backend running?</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Dashboard Overview
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          UPI transaction analytics powered by PaySim dataset — {formatNumber(data.total_transactions)} transactions analyzed
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Transactions"
          value={formatNumber(data.total_transactions)}
          sub="PaySim dataset sample"
          accent="accent-purple"
          delay={1}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <StatCard
          label="Total Volume"
          value={formatINR(data.total_volume)}
          sub={`Avg: ${formatINR(data.avg_amount)} per txn`}
          accent="accent-teal"
          delay={2}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
            </svg>
          }
        />
        <StatCard
          label="Fraud Detected"
          value={formatNumber(data.fraud_count)}
          sub={`${data.fraud_rate}% fraud rate`}
          accent="accent-rose"
          delay={3}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
        />
        <StatCard
          label="Unique Accounts"
          value={formatNumber(data.unique_senders + data.unique_receivers)}
          sub={`${data.unique_senders} senders · ${data.unique_receivers} receivers`}
          accent="accent-amber"
          delay={4}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Daily Trend — Area Chart */}
        <div className="glass-card chart-container col-span-2 animate-fade-in-up delay-5">
          <h3>Transaction Trend</h3>
          <p>Daily transaction count & fraud cases over the analysis period</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.daily_trend}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradFraud" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(v) => v?.slice(5) || ''}
                stroke="transparent"
              />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="transparent" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="Total" stroke="#6366f1" fill="url(#gradTotal)" strokeWidth={2} />
              <Area type="monotone" dataKey="fraud_count" name="Fraud" stroke="#f43f5e" fill="url(#gradFraud)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Type Breakdown — Pie Chart */}
        <div className="glass-card chart-container animate-fade-in-up delay-6">
          <h3>Transaction Types</h3>
          <p>Distribution by transaction category</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.type_breakdown}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={3}
                strokeWidth={0}
              >
                {data.type_breakdown.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {data.type_breakdown.map((t, i) => (
              <span key={i} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                {t.type}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Volume by Type — Bar Chart */}
        <div className="glass-card chart-container animate-fade-in-up delay-5">
          <h3>Volume by Type</h3>
          <p>Total transaction volume (₹) per category</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.type_breakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="type" tick={{ fontSize: 10, fill: '#64748b' }} stroke="transparent" />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="transparent" tickFormatter={(v) => formatINR(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="volume" name="Volume" radius={[6, 6, 0, 0]} fill="#6366f1">
                {data.type_breakdown.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fraud by Type */}
        <div className="glass-card chart-container animate-fade-in-up delay-6">
          <h3>Fraud Distribution by Type</h3>
          <p>Number of fraudulent transactions per category</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.type_breakdown.filter(t => t.fraud_count > 0)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} stroke="transparent" />
              <YAxis dataKey="type" type="category" tick={{ fontSize: 10, fill: '#64748b' }} stroke="transparent" width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="fraud_count" name="Fraud Cases" radius={[0, 6, 6, 0]} fill="#f43f5e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats Table */}
      <div className="glass-card p-5 animate-fade-in-up">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Transaction Type Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Count</th>
                <th>Volume</th>
                <th>Fraud</th>
                <th>Fraud Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.type_breakdown.map((t, i) => (
                <tr key={i}>
                  <td>
                    <span className="badge badge-type">{t.type}</span>
                  </td>
                  <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatNumber(t.count)}
                  </td>
                  <td>{formatINR(t.volume)}</td>
                  <td>
                    <span className={t.fraud_count > 0 ? '' : ''} style={{ color: t.fraud_count > 0 ? '#fb7185' : 'var(--text-muted)' }}>
                      {t.fraud_count}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="progress-bar w-16">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${Math.min((t.fraud_count / t.count) * 100 * 5, 100)}%`,
                            background: t.fraud_count > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                          }}
                        />
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {t.count > 0 ? ((t.fraud_count / t.count) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
