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
import Models from './pages/Models'
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
/*  Sidebar layout                                                     */
/* ------------------------------------------------------------------ */

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/transactions', label: 'Transactions', icon: '💳' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
  { to: '/models', label: 'Models', icon: '🤖' },
]

function SidebarLayout() {
  const session = getSession()

  const handleLogout = () => {
    localStorage.removeItem('auth_session')
    window.location.href = '/login'
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-sidebar text-white">
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-white/10">
          <span className="text-2xl">🛡️</span>
          <span className="text-lg font-semibold tracking-tight">
            UPI Fraud Guard
          </span>
        </div>

        {/* Nav links */}
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        {session && (
          <div className="mx-3 mb-2 rounded-lg bg-white/5 px-4 py-2">
            <p className="text-xs text-slate-400">Signed in as</p>
            <p className="truncate text-sm font-medium text-white">
              {session.name || session.email}
            </p>
          </div>
        )}

        {/* Logout */}
        <div className="border-t border-white/10 p-4">
          <button
            id="logout-button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <span className="text-base">🚪</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
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
          <Route path="/models" element={<Models />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
