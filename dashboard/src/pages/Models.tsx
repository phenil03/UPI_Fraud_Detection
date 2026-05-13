const models = [
  { name: 'XGBoost', file: 'xgboost_model.pkl', accuracy: 96.4, f1: 0.94, status: 'active' },
  { name: 'LightGBM', file: 'lightgbm_model.pkl', accuracy: 95.1, f1: 0.92, status: 'standby' },
  { name: 'Ensemble', file: 'ensemble.py', accuracy: 97.2, f1: 0.96, status: 'standby' },
]

function StatusDot({ status }: { status: string }) {
  const color = status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
}

export default function Models() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Models</h1>
        <p className="text-sm text-gray-500">ML model registry and performance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((m) => (
          <div key={m.name} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{m.name}</h3>
              <StatusDot status={m.status} />
            </div>
            <p className="mt-1 text-xs text-gray-400">{m.file}</p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Accuracy</span>
                <span className="font-medium text-gray-900">{m.accuracy}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">F1 Score</span>
                <span className="font-medium text-gray-900">{m.f1}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className={`text-xs font-semibold uppercase ${m.status === 'active' ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {m.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
