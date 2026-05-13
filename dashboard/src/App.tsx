import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  Outlet,
} from 'react-router-dom'

import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Analytics from './pages/Analytics'
import FraudPatterns from './pages/FraudPatterns'
import Login from './pages/Login'

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

function getSession() {
  try {
    const raw = localStorage.getItem('auth_session')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/*  Icons (inline SVGs for crisp rendering)                            */
/* ------------------------------------------------------------------ */

const icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  transactions: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  fraud: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
}

/* ------------------------------------------------------------------ */
/*  Navigation items                                                    */
/* ------------------------------------------------------------------ */

const navItems = [
  { to: '/', label: 'Overview', icon: icons.dashboard },
  { to: '/transactions', label: 'Transactions', icon: icons.transactions },
  { to: '/analytics', label: 'Analytics', icon: icons.analytics },
  { to: '/fraud-patterns', label: 'Fraud Patterns', icon: icons.fraud },
]

/* ------------------------------------------------------------------ */
/*  Sidebar layout                                                     */
/* ------------------------------------------------------------------ */

function SidebarLayout() {
  const session = getSession()

  const handleLogout = () => {
    localStorage.removeItem('auth_session')
    window.location.href = '/login'
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Background decorative orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      {/* Sidebar */}
      <aside className="sidebar relative z-10 flex w-64 flex-col">
        {/* Brand */}
        <div className="sidebar-brand flex h-16 items-center gap-3 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'var(--gradient-primary)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              UPI Analytics
            </span>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Transaction Intelligence
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-3 flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        {session && (
          <div className="mx-3 mb-2 rounded-xl p-3" style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Signed in as</p>
            <p className="truncate text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {session.name || session.email}
            </p>
          </div>
        )}

        {/* Logout */}
        <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            id="logout-button"
            onClick={handleLogout}
            className="nav-link w-full"
          >
            <span className="nav-icon">{icons.logout}</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="relative z-10 flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-primary)' }}>
        <Outlet />
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Protected route wrapper                                            */
/* ------------------------------------------------------------------ */

function ProtectedRoute({ loggedIn }: { loggedIn: boolean }) {
  if (!loggedIn) return <Navigate to="/login" replace />
  return <SidebarLayout />
}

/* ------------------------------------------------------------------ */
/*  Root App                                                           */
/* ------------------------------------------------------------------ */

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!getSession())

  useEffect(() => {
    const handleChange = () => setLoggedIn(!!getSession())
    window.addEventListener('auth-change', handleChange)
    window.addEventListener('storage', handleChange)
    return () => {
      window.removeEventListener('auth-change', handleChange)
      window.removeEventListener('storage', handleChange)
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute loggedIn={loggedIn} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/fraud-patterns" element={<FraudPatterns />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
