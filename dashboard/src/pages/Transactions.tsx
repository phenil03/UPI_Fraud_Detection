import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface Transaction {
  id: number
  txn_id: string
  sender_upi: string
  receiver_upi: string
  sender_city: string
  receiver_city: string
  txn_type: string
  txn_type_raw: string
  amount: number
  is_fraud: number
  hour_of_day: number
  day_of_week: number
  created_at: string
}

function formatINR(n: number): string {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Transactions() {
  const [rows, setRows] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [typeFilter, setTypeFilter] = useState('')
  const [fraudFilter, setFraudFilter] = useState(false)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const limit = 25

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      if (typeFilter) params.set('txn_type', typeFilter)
      if (fraudFilter) params.set('fraud_only', 'true')

      const res = await fetch(`${API}/transactions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRows(data.data)
        setTotal(data.total)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [page, typeFilter, fraudFilter, sortBy, sortOrder])

  const totalPages = Math.ceil(total / limit)

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(col)
      setSortOrder('desc')
    }
    setPage(0)
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <span className="ml-1 opacity-30">↕</span>
    return <span className="ml-1" style={{ color: 'var(--accent-purple)' }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Transaction Explorer
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Browse and filter all {total.toLocaleString('en-IN')} transactions
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card flex flex-wrap items-center gap-3 p-4 animate-fade-in-up delay-1">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}
          className="filter-select"
        >
          <option value="">All Types</option>
          <option value="PAYMENT">Payment</option>
          <option value="TRANSFER">Transfer</option>
          <option value="CASH_OUT">Cash Out</option>
          <option value="CASH_IN">Cash In</option>
          <option value="DEBIT">Debit</option>
        </select>

        <button
          onClick={() => { setFraudFilter(!fraudFilter); setPage(0) }}
          className="badge text-xs cursor-pointer transition-all"
          style={{
            background: fraudFilter ? 'rgba(244, 63, 94, 0.2)' : 'rgba(148, 163, 184, 0.1)',
            color: fraudFilter ? '#fb7185' : 'var(--text-muted)',
            border: `1px solid ${fraudFilter ? 'rgba(244, 63, 94, 0.3)' : 'var(--border)'}`,
          }}
        >
          {fraudFilter ? '⚠ Fraud Only' : '○ Show All'}
        </button>

        <div className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
          Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total.toLocaleString('en-IN')}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden animate-fade-in-up delay-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="spinner" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center" style={{ color: 'var(--text-muted)' }}>
            No transactions found with current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>TXN ID</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th className="cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('txn_type')}>
                    Type <SortIcon col="txn_type" />
                  </th>
                  <th className="cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('amount')}>
                    Amount <SortIcon col="amount" />
                  </th>
                  <th>City</th>
                  <th className="cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('is_fraud')}>
                    Status <SortIcon col="is_fraud" />
                  </th>
                  <th>Time</th>
                  <th className="cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('created_at')}>
                    Date <SortIcon col="created_at" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="font-mono text-xs" style={{ color: 'var(--accent-purple)' }}>
                      {t.txn_id.slice(0, 12)}
                    </td>
                    <td className="text-xs">
                      <span style={{ color: 'var(--text-primary)' }}>{t.sender_upi}</span>
                    </td>
                    <td className="text-xs">
                      <span style={{ color: 'var(--text-primary)' }}>{t.receiver_upi}</span>
                    </td>
                    <td>
                      <span className="badge badge-type text-[10px]">{t.txn_type_raw}</span>
                    </td>
                    <td className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {formatINR(t.amount)}
                    </td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t.sender_city}
                    </td>
                    <td>
                      {t.is_fraud ? (
                        <span className="badge badge-fraud">FRAUD</span>
                      ) : (
                        <span className="badge badge-legit">LEGIT</span>
                      )}
                    </td>
                    <td className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {String(t.hour_of_day).padStart(2, '0')}:00 · {DAYS[t.day_of_week]}
                    </td>
                    <td className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {t.created_at?.slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="badge cursor-pointer transition-all disabled:opacity-30"
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                color: 'var(--accent-purple)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              ← Previous
            </button>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="badge cursor-pointer transition-all disabled:opacity-30"
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                color: 'var(--accent-purple)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
