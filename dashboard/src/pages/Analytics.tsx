import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area,
  ScatterChart, Scatter, ZAxis, Cell,
} from 'recharts'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/* ------------------------------------------------------------------ */
/*  Formatters                                                         */
/* ------------------------------------------------------------------ */

function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toFixed(0)}`
}

/* ------------------------------------------------------------------ */
/*  Tooltip                                                            */
/* ------------------------------------------------------------------ */

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3" style={{ minWidth: 140 }}>
      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: p.color || 'var(--text-secondary)' }}>
          {p.name}: <span className="font-semibold">{typeof p.value === 'number' && p.value > 100 ? formatINR(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Heatmap Component                                                  */
/* ------------------------------------------------------------------ */

function ActivityHeatmap({ data }: { data: { hour: number; day: string; day_index: number; count: number }[] }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const maxCount = Math.max(...data.map(d => d.count), 1)

  const getCount = (hour: number, dayIdx: number) => {
    return data.find(d => d.hour === hour && d.day_index === dayIdx)?.count ?? 0
  }

  const getColor = (count: number) => {
    if (count === 0) return 'rgba(99, 102, 241, 0.03)'
    const intensity = count / maxCount
    if (intensity > 0.75) return 'rgba(99, 102, 241, 0.8)'
    if (intensity > 0.5) return 'rgba(99, 102, 241, 0.55)'
    if (intensity > 0.25) return 'rgba(99, 102, 241, 0.35)'
    return 'rgba(99, 102, 241, 0.15)'
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1" style={{ minWidth: 600 }}>
        {/* Hour labels */}
        <div className="flex gap-1 pl-10">
          {hours.filter(h => h % 3 === 0).map(h => (
            <div
              key={h}
              className="text-[9px] text-center"
              style={{ color: 'var(--text-muted)', width: 60 }}
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Grid */}
        {days.map((day, dayIdx) => (
          <div key={day} className="flex items-center gap-1">
            <span className="text-[10px] font-medium w-8" style={{ color: 'var(--text-muted)' }}>
              {day}
            </span>
            {hours.map(h => {
              const count = getCount(h, dayIdx)
              return (
                <div
                  key={h}
                  className="heatmap-cell"
                  title={`${day} ${String(h).padStart(2, '0')}:00 — ${count} txns`}
                  style={{
                    width: 20,
                    height: 20,
                    background: getColor(count),
                  }}
                />
              )
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-2 pl-10 mt-2">
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Less</span>
          {[0.03, 0.15, 0.35, 0.55, 0.8].map((op, i) => (
            <div
              key={i}
              className="rounded"
              style={{
                width: 14,
                height: 14,
                background: `rgba(99, 102, 241, ${op})`,
              }}
            />
          ))}
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>More</span>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Analytics Page                                                     */
/* ------------------------------------------------------------------ */

export default function Analytics() {
  const [hourly, setHourly] = useState<any[]>([])
  const [typeDist, setTypeDist] = useState<any[]>([])
  const [amountDist, setAmountDist] = useState<any[]>([])
  const [cityDist, setCityDist] = useState<any[]>([])
  const [heatmap, setHeatmap] = useState<any[]>([])
  const [topAccounts, setTopAccounts] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/analytics/hourly`).then(r => r.json()),
      fetch(`${API}/analytics/type-distribution`).then(r => r.json()),
      fetch(`${API}/analytics/amount-distribution`).then(r => r.json()),
      fetch(`${API}/analytics/city-distribution`).then(r => r.json()),
      fetch(`${API}/analytics/heatmap`).then(r => r.json()),
      fetch(`${API}/analytics/top-accounts`).then(r => r.json()),
    ]).then(([h, t, a, c, hm, ta]) => {
      setHourly(h)
      setTypeDist(t)
      setAmountDist(a)
      setCityDist(c)
      setHeatmap(hm)
      setTopAccounts(ta)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Advanced Analytics
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Deep-dive into transaction patterns, distributions, and trends
        </p>
      </div>

      {/* Row 1: Heatmap */}
      <div className="glass-card chart-container animate-fade-in-up delay-1">
        <h3>Activity Heatmap</h3>
        <p>Transaction density by hour and day of week — darker = more activity</p>
        <ActivityHeatmap data={heatmap} />
      </div>

      {/* Row 2: Hourly + Amount Distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Hourly Pattern */}
        <div className="glass-card chart-container animate-fade-in-up delay-2">
          <h3>Hourly Transaction Pattern</h3>
          <p>Transaction volume and average amount by hour</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={hourly}>
              <defs>
                <linearGradient id="gradHourly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(v) => `${String(v).padStart(2, '0')}h`}
                stroke="transparent"
              />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="transparent" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" name="Transactions" stroke="#8b5cf6" fill="url(#gradHourly)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Amount Distribution */}
        <div className="glass-card chart-container animate-fade-in-up delay-3">
          <h3>Amount Distribution</h3>
          <p>Transaction count by amount range</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={amountDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="bucket" tick={{ fontSize: 9, fill: '#64748b' }} stroke="transparent" angle={-15} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="transparent" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Transactions" radius={[6, 6, 0, 0]}>
                {amountDist.map((_, i) => (
                  <Cell key={i} fill={i < 3 ? '#14b8a6' : i < 5 ? '#f59e0b' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: City Distribution + Type Radar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* City Distribution */}
        <div className="glass-card chart-container animate-fade-in-up delay-4">
          <h3>Top Cities by Transactions</h3>
          <p>Geographic distribution of transaction origins</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cityDist.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} stroke="transparent" />
              <YAxis dataKey="city" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="transparent" width={85} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Transactions" radius={[0, 6, 6, 0]} fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Type Radar */}
        <div className="glass-card chart-container animate-fade-in-up delay-5">
          <h3>Transaction Type Radar</h3>
          <p>Multi-dimensional view of type characteristics</p>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={typeDist}>
              <PolarGrid stroke="rgba(148,163,184,0.1)" />
              <PolarAngleAxis
                dataKey="type"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
              />
              <PolarRadiusAxis tick={{ fontSize: 9, fill: '#64748b' }} />
              <Radar name="Volume" dataKey="total" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Top Accounts */}
      {topAccounts && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Top Senders */}
          <div className="glass-card p-5 animate-fade-in-up delay-5">
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Top Senders by Volume</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Highest volume originating accounts</p>
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Account</th>
                  <th>City</th>
                  <th>Txns</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                {topAccounts.top_senders.map((s: any, i: number) => (
                  <tr key={i}>
                    <td className="font-bold" style={{ color: i < 3 ? '#f59e0b' : 'var(--text-muted)' }}>
                      {i + 1}
                    </td>
                    <td className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      {s.account}
                    </td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.city}</td>
                    <td className="tabular-nums">{s.txn_count}</td>
                    <td className="font-semibold tabular-nums" style={{ color: 'var(--accent-teal)' }}>
                      {formatINR(s.total_volume)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Receivers */}
          <div className="glass-card p-5 animate-fade-in-up delay-6">
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Top Receivers by Volume</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Highest volume destination accounts</p>
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Account</th>
                  <th>City</th>
                  <th>Txns</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                {topAccounts.top_receivers.map((s: any, i: number) => (
                  <tr key={i}>
                    <td className="font-bold" style={{ color: i < 3 ? '#f59e0b' : 'var(--text-muted)' }}>
                      {i + 1}
                    </td>
                    <td className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      {s.account}
                    </td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.city}</td>
                    <td className="tabular-nums">{s.txn_count}</td>
                    <td className="font-semibold tabular-nums" style={{ color: 'var(--accent-purple)' }}>
                      {formatINR(s.total_volume)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
