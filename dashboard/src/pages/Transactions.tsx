import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface Transaction {
  id: number
  txn_id: string
  sender_upi: string
  receiver_upi: string
  amount: number
  risk_score: number
  decision: string
  explanation: string
  device_id: string
  location: string
  created_at: string
}

function Badge({ decision }: { decision: string }) {
  const colors: Record<string, string> = {
    ALLOW: 'bg-emerald-100 text-emerald-700',
    CHALLENGE: 'bg-amber-100 text-amber-700',
    BLOCK: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[decision] ?? 'bg-gray-100 text-gray-700'}`}>
      {decision}
    </span>
  )
}

export default function Transactions() {
  const [rows, setRows] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../supabaseClient')
        const token = (await supabase.auth.getSession()).data.session?.access_token
        const res = await fetch(`${API}/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setRows(await res.json())
      } catch { /* ignore */ } finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-sm text-gray-500">Last 50 predictions stored</p>
      </div>
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        {loading ? (
          <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No transactions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="pb-3 pr-4">TXN ID</th>
                  <th className="pb-3 pr-4">Sender</th>
                  <th className="pb-3 pr-4">Receiver</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Risk</th>
                  <th className="pb-3 pr-4">Decision</th>
                  <th className="pb-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-600">{t.txn_id}</td>
                    <td className="py-3 pr-4 text-gray-600">{t.sender_upi}</td>
                    <td className="py-3 pr-4 text-gray-600">{t.receiver_upi}</td>
                    <td className="py-3 pr-4 font-medium text-gray-900">₹{t.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-gray-600">{t.risk_score.toFixed(4)}</td>
                    <td className="py-3 pr-4"><Badge decision={t.decision} /></td>
                    <td className="py-3 text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</td>
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
