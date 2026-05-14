import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const VALID_USERS = [
  { email: 'kotvalbaban@gmail.com', password: 'Test@1234', name: 'Himanshu' },
  { email: 'admin@upifraud.com', password: 'admin123', name: 'Admin' },
]

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    await new Promise((r) => setTimeout(r, 600))

    const user = VALID_USERS.find(
      (u) => u.email === email && u.password === password,
    )

    if (!user) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    localStorage.setItem(
      'auth_session',
      JSON.stringify({ email: user.email, name: user.name, loggedInAt: Date.now() }),
    )
    window.dispatchEvent(new Event('auth-change'))
    navigate('/', { replace: true })
  }

  return (
    <div className="login-bg flex items-center justify-center px-4">
      <div className="login-card w-full max-w-md p-8 animate-fade-in-up">
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl animate-float"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            UPI Transaction Analytics
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Sign in to access the analytics dashboard
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            id="login-error"
            className="mb-4 rounded-xl p-3 text-sm animate-fade-in"
            style={{
              background: 'rgba(244, 63, 94, 0.1)',
              color: '#fb7185',
              border: '1px solid rgba(244, 63, 94, 0.2)',
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="filter-input w-full"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="filter-input w-full"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
            style={{
              background: 'var(--gradient-primary)',
              focusRingColor: 'var(--accent-primary)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>


      </div>
    </div>
  )
}
