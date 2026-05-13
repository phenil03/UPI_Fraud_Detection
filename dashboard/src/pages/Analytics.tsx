import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  transactions: Math.floor(Math.random() * 500 + 100),
  fraud: Math.floor(Math.random() * 30 + 2),
}))

const decisionData = [
  { name: 'ALLOW', value: 7420, color: '#10b981' },
  { name: 'CHALLENGE', value: 1580, color: '#f59e0b' },
  { name: 'BLOCK', value: 340, color: '#ef4444' },
]

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Fraud detection performance insights</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar chart */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Hourly Transaction Volume</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="transactions" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fraud" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Decision Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={decisionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {decisionData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
