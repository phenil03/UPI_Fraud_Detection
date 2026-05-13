import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie,
} from 'recharts'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/* ------------------------------------------------------------------ */
/*  Formatters                                                         */
/* ------------------------------------------------------------------ */

function formatINR(n: number): string {
  if (!n) return '₹0'
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
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Insight Card                                                       */
/* ------------------------------------------------------------------ */

function InsightCard({
  icon, title, value, description, color, delay,
}: {
  icon: string; title: string; value: string | number
  description: string; color: string; delay: number
}) {
  return (
    <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: `${delay * 0.08}s` }}>
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {title}
          </p>
          <p className="mt-1 text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Fraud Patterns Page                                                */
/* ------------------------------------------------------------------ */

const PIE_COLORS = ['#f43f5e', '#f59e0b', '#6366f1', '#14b8a6', '#0ea5e9']

export default function FraudPatterns() {
  const [patterns, setPatterns] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/analytics/fraud-patterns`)
      .then(r => r.json())
      .then(d => { setPatterns(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!patterns) {
    return (
      <div className="flex h-full items-center justify-center">
        <p style={{ color: 'var(--text-muted)' }}>Failed to load data.</p>
      </div>
    )
  }

  const { fraud_by_type, fraud_by_hour, fraud_amount_stats, legit_amount_stats, account_drain, balance_mismatch_count } = patterns

  // Comparison data for fraud vs legit amounts
  const comparisonData = [
    {
      label: 'Average Amount',
      fraud: fraud_amount_stats.avg,
      legit: legit_amount_stats.avg,
    },
    {
      label: 'Max Amount',
      fraud: fraud_amount_stats.max,
      legit: legit_amount_stats.max,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Fraud Pattern Analysis
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Statistical patterns and anomalies identified from transaction data — no ML models, pure data analysis
        </p>
      </div>

      {/* Key Insight Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InsightCard
          icon="💰"
          title="Avg Fraud Amount"
          value={formatINR(fraud_amount_stats.avg || 0)}
          description={`vs ${formatINR(legit_amount_stats.avg || 0)} for legit transactions`}
          color="#f43f5e"
          delay={1}
        />
        <InsightCard
          icon="🏦"
          title="Account Drains"
          value={account_drain.total_drained}
          description={`${account_drain.drain_fraud_rate}% of drained accounts were fraud`}
          color="#f59e0b"
          delay={2}
        />
        <InsightCard
          icon="⚠️"
          title="Balance Mismatches"
          value={balance_mismatch_count}
          description="Transactions with suspicious balance discrepancies"
          color="#8b5cf6"
          delay={3}
        />
        <InsightCard
          icon="📊"
          title="Total Fraud Volume"
          value={formatINR(fraud_amount_stats.total_volume || 0)}
          description={`Max single fraud: ${formatINR(fraud_amount_stats.max || 0)}`}
          color="#0ea5e9"
          delay={4}
        />
      </div>

      {/* Row 2: Fraud by Type + Fraud by Hour */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Fraud Rate by Type */}
        <div className="glass-card chart-container animate-fade-in-up delay-5">
          <h3>Fraud Rate by Transaction Type</h3>
          <p>Which transaction types are most susceptible to fraud?</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={fraud_by_type}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="type" tick={{ fontSize: 10, fill: '#64748b' }} stroke="transparent" />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="transparent" tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="fraud_rate" name="Fraud Rate (%)" radius={[6, 6, 0, 0]}>
                {fraud_by_type.map((_: any, i: number) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fraud by Hour */}
        <div className="glass-card chart-container animate-fade-in-up delay-6">
          <h3>Fraud Rate by Hour</h3>
          <p>When do fraudulent transactions peak?</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={fraud_by_hour}>
              <defs>
                <linearGradient id="gradFraudHour" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(v) => `${String(v).padStart(2, '0')}h`}
                stroke="transparent"
              />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="transparent" tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="fraud_rate" name="Fraud Rate (%)" stroke="#f43f5e" fill="url(#gradFraudHour)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Fraud vs Legit Comparison + Fraud Pie */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Fraud vs Legit Amount Comparison */}
        <div className="glass-card chart-container col-span-2 animate-fade-in-up delay-5">
          <h3>Fraud vs Legitimate — Amount Comparison</h3>
          <p>Side-by-side comparison of transaction amounts</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="transparent" />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="transparent" tickFormatter={(v) => formatINR(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="fraud" name="Fraud" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="legit" name="Legitimate" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#f43f5e' }} /> Fraudulent
            </span>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#10b981' }} /> Legitimate
            </span>
          </div>
        </div>

        {/* Fraud Distribution Pie */}
        <div className="glass-card chart-container animate-fade-in-up delay-6">
          <h3>Fraud by Type</h3>
          <p>Share of fraud across categories</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={fraud_by_type.filter((d: any) => d.fraud > 0)}
                dataKey="fraud"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={75}
                paddingAngle={3}
                strokeWidth={0}
              >
                {fraud_by_type.filter((d: any) => d.fraud > 0).map((_: any, i: number) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {fraud_by_type.filter((d: any) => d.fraud > 0).map((t: any, i: number) => (
              <span key={i} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {t.type}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Detailed Type Analysis Table */}
      <div className="glass-card p-5 animate-fade-in-up">
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Detailed Fraud Analysis by Type
        </h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Complete breakdown of fraud patterns across all transaction types
        </p>
        <div className="overflow-x-auto">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Total Txns</th>
                <th>Fraud Txns</th>
                <th>Fraud Rate</th>
                <th>Risk Level</th>
                <th>Visual</th>
              </tr>
            </thead>
            <tbody>
              {fraud_by_type.map((t: any, i: number) => {
                const riskLevel =
                  t.fraud_rate > 30 ? 'CRITICAL' :
                  t.fraud_rate > 10 ? 'HIGH' :
                  t.fraud_rate > 1 ? 'MEDIUM' : 'LOW'
                const riskColor =
                  riskLevel === 'CRITICAL' ? '#f43f5e' :
                  riskLevel === 'HIGH' ? '#f59e0b' :
                  riskLevel === 'MEDIUM' ? '#6366f1' : '#10b981'

                return (
                  <tr key={i}>
                    <td>
                      <span className="badge badge-type">{t.type}</span>
                    </td>
                    <td className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {t.total.toLocaleString('en-IN')}
                    </td>
                    <td className="tabular-nums" style={{ color: t.fraud > 0 ? '#fb7185' : 'var(--text-muted)' }}>
                      {t.fraud}
                    </td>
                    <td className="font-semibold tabular-nums" style={{ color: riskColor }}>
                      {t.fraud_rate}%
                    </td>
                    <td>
                      <span
                        className="badge text-[10px]"
                        style={{
                          background: `${riskColor}15`,
                          color: riskColor,
                          border: `1px solid ${riskColor}30`,
                        }}
                      >
                        {riskLevel}
                      </span>
                    </td>
                    <td>
                      <div className="progress-bar w-24">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${Math.min(t.fraud_rate * 2, 100)}%`,
                            background: riskColor,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 5: Key Findings */}
      <div className="glass-card p-5 animate-fade-in-up">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          📋 Key Statistical Findings
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              finding: 'Fraudulent transactions have significantly higher amounts',
              detail: `Avg fraud: ${formatINR(fraud_amount_stats.avg || 0)} vs legit: ${formatINR(legit_amount_stats.avg || 0)}`,
              icon: '💰',
            },
            {
              finding: `${account_drain.drain_fraud_rate}% of drained accounts involve fraud`,
              detail: `${account_drain.total_drained} accounts fully drained, ${account_drain.drained_fraud} flagged as fraud`,
              icon: '🏦',
            },
            {
              finding: `${balance_mismatch_count} transactions show balance mismatches`,
              detail: 'Sender balance before minus amount ≠ balance after',
              icon: '⚠️',
            },
            {
              finding: `TRANSFER and CASH_OUT are the riskiest types`,
              detail: `${fraud_by_type.find((t: any) => t.type === 'TRANSFER')?.fraud_rate ?? 0}% and ${fraud_by_type.find((t: any) => t.type === 'CASH_OUT')?.fraud_rate ?? 0}% fraud rates respectively`,
              icon: '📊',
            },
          ].map((f, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-xl p-3"
              style={{ background: 'rgba(99, 102, 241, 0.04)', border: '1px solid var(--border)' }}
            >
              <span className="text-lg">{f.icon}</span>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{f.finding}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{f.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
