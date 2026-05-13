import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Transaction {
  id: number
  txn_id: string
  sender_upi: string
  receiver_upi: string
  amount: number
  risk_score: number
  decision: 'ALLOW' | 'CHALLENGE' | 'BLOCK'
  created_at: string
}

/* ------------------------------------------------------------------ */
/*  Realistic mock data (generated once per page load)                 */
/* ------------------------------------------------------------------ */

const UPI_IDS = [
  'rahul.sharma@ybl', 'priya.patel@oksbi', 'amit.kumar@paytm',
  'sneha.verma@ibl', 'vijay.singh@axl', 'deepak.gupta@icici',
  'anita.joshi@ybl', 'suresh.reddy@sbi', 'meena.das@hdfc',
  'rajesh.nair@paytm', 'pooja.mehta@oksbi', 'kiran.rao@axl',
  'manoj.tiwari@ybl', 'neha.agarwal@ibl', 'arjun.mishra@sbi',
]

function generateMockTransactions(): Transaction[] {
  const decisions: ('ALLOW' | 'CHALLENGE' | 'BLOCK')[] = ['ALLOW', 'ALLOW', 'ALLOW', 'ALLOW', 'ALLOW', 'ALLOW', 'CHALLENGE', 'CHALLENGE', 'BLOCK', 'ALLOW']
  const now = Date.now()

  return Array.from({ length: 20 }, (_, i) => {
    const decision = decisions[i % decisions.length]
    const amount = decision === 'BLOCK'
      ? Math.floor(Math.random() * 45000 + 15000) // Fraud = high amounts
      : decision === 'CHALLENGE'
        ? Math.floor(Math.random() * 10000 + 5000) // Suspicious = medium
        : Math.floor(Math.random() * 5000 + 100) // Normal = low

    return {
      id: i + 1,
      txn_id: `TXN${String(now - i * 60000).slice(-10)}`,
      sender_upi: UPI_IDS[Math.floor(Math.random() * UPI_IDS.length)],
      receiver_upi: UPI_IDS[Math.floor(Math.random() * UPI_IDS.length)],
      amount,
      risk_score: decision === 'BLOCK' ? +(Math.random() * 0.3 + 0.7).toFixed(3)
        : decision === 'CHALLENGE' ? +(Math.random() * 0.3 + 0.4).toFixed(3)
          : +(Math.random() * 0.3 + 0.05).toFixed(3),
      decision,
      created_at: new Date(now - i * 120000).toISOString(),
    }
  })
}

const mockTransactions = generateMockTransactions()

const fraudRateData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  rate: +(Math.random() * 4 + (i >= 22 || i <= 4 ? 3 : 1)).toFixed(2),
}))

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string
  value: string | number
  sub?: string
  accent: string
  icon: string
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
          {label}
        </p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function Badge({ decision }: { decision: string }) {
  const map: Record<string, string> = {
    ALLOW: 'bg-emerald-100 text-emerald-700',
    CHALLENGE: 'bg-amber-100 text-amber-700',
    BLOCK: 'bg-red-100 text-red-700',
  }
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        map[decision] ?? 'bg-gray-100 text-gray-700'
      }`}
    >
      {decision}
    </span>
  )
}

function RiskBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = pct > 70 ? 'bg-red-500' : pct > 40 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-gray-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{pct}%</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Dashboard page                                                     */
/* ------------------------------------------------------------------ */

const COLORS = ['#10b981', '#f59e0b', '#ef4444']

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${API}/transactions`)
        if (res.ok) {
          const data: Transaction[] = await res.json()
          setTransactions(data.slice(0, 20))
          setLoading(false)
          return
        }
      } catch {
        // Backend not running — use mock data
      }
      setTransactions(mockTransactions)
      setLoading(false)
    }
    fetchTransactions()
  }, [])

  const totalTxns = transactions.length
  const fraudCount = transactions.filter((t) => t.decision === 'BLOCK').length
  const challengeCount = transactions.filter((t) => t.decision === 'CHALLENGE').length
  const allowCount = totalTxns - fraudCount - challengeCount
  const avgRisk = totalTxns > 0
    ? (transactions.reduce((s, t) => s + t.risk_score, 0) / totalTxns * 100).toFixed(1)
    : '0'

  const pieData = [
    { name: 'Allowed', value: allowCount },
    { name: 'Challenged', value: challengeCount },
    { name: 'Blocked', value: fraudCount },
  ]

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Real-time UPI fraud monitoring overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Transactions"
          value={totalTxns}
          sub="processed today"
          accent="text-gray-900"
          icon="💳"
        />
        <StatCard
          label="Fraud Blocked"
          value={fraudCount}
          sub={`${totalTxns > 0 ? ((fraudCount / totalTxns) * 100).toFixed(1) : 0}% of total`}
          accent="text-red-600"
          icon="🚫"
        />
        <StatCard
          label="Challenged"
          value={challengeCount}
          sub="needs review"
          accent="text-amber-600"
          icon="⚠️"
        />
        <StatCard
          label="Avg Risk Score"
          value={`${avgRisk}%`}
          sub="across all transactions"
          accent="text-indigo-600"
          icon="📊"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Fraud rate chart */}
        <div className="col-span-2 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Fraud Rate — Last 24 Hours
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={fraudRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                formatter={(v: number) => [`${v}%`, 'Fraud Rate']}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Decision pie chart */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Decision Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Allowed</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Challenged</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Blocked</span>
          </div>
        </div>
      </div>

      {/* Live transaction feed */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">
          Live Transaction Feed
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="pb-3 pr-4">TXN ID</th>
                  <th className="pb-3 pr-4">Sender</th>
                  <th className="pb-3 pr-4">Receiver</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Risk Score</th>
                  <th className="pb-3">Decision</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 pr-4 font-mono text-xs text-gray-600">
                      {t.txn_id}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{t.sender_upi}</td>
                    <td className="py-3 pr-4 text-gray-600">{t.receiver_upi}</td>
                    <td className="py-3 pr-4 font-medium text-gray-900">
                      ₹{t.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 pr-4">
                      <RiskBar score={t.risk_score} />
                    </td>
                    <td className="py-3">
                      <Badge decision={t.decision} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
