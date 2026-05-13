import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const GOOGLE_CLIENT_ID =
  '362331204986-d38svqv7u7jtauvrs0j51uh6c4564t0q.apps.googleusercontent.com'

// Hardcoded credentials for email/password login
const VALID_USERS = [
  { email: 'kotvalbaban@gmail.com', password: 'Test@1234', name: 'Himanshu' },
  { email: 'admin@upifraud.com', password: 'admin123', name: 'Admin' },
]

// Decode a JWT payload (base64url → JSON)
function decodeJwtPayload(token: string) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Google credential callback
  const handleGoogleCredential = useCallback(
    (response: { credential: string }) => {
      try {
        const payload = decodeJwtPayload(response.credential)
        localStorage.setItem(
          'auth_session',
          JSON.stringify({
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            provider: 'google',
            loggedInAt: Date.now(),
          }),
        )
        window.dispatchEvent(new Event('auth-change'))
        navigate('/', { replace: true })
      } catch {
        setError('Google sign-in failed. Please try again.')
      }
    },
    [navigate],
  )

  // Initialize Google sign-in
  useEffect(() => {
    const initGoogle = () => {
      if (!(window as any).google?.accounts?.id) {
        // Script not loaded yet, retry
        setTimeout(initGoogle, 200)
        return
      }
      ;(window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      })
    }
    initGoogle()
  }, [handleGoogleCredential])

  const handleGoogleClick = () => {
    if ((window as any).google?.accounts?.id) {
      ;(window as any).google.accounts.id.prompt()
    } else {
      setError('Google sign-in is loading, please try again in a moment.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    await new Promise((r) => setTimeout(r, 500))

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
      JSON.stringify({
        email: user.email,
        name: user.name,
        loggedInAt: Date.now(),
      }),
    )
    window.dispatchEvent(new Event('auth-change'))
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="mb-3 inline-block text-4xl">🛡️</span>
          <h1 className="text-2xl font-bold text-gray-900">UPI Fraud Guard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to access the dashboard
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            id="login-error"
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200"
          >
            {error}
          </div>
        )}

        {/* Google Sign-In */}
        <button
          id="google-login"
          onClick={handleGoogleClick}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>

        {/* Divider */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">or sign in with email</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-gray-700"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-shadow focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-gray-700"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-shadow focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
