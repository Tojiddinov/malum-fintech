import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import TransactionDetail from './pages/TransactionDetail'
import Workflow from './pages/Workflow'
import Reports from './pages/Reports'
import UsersManagement from './pages/UsersManagement'
import { authApi } from './api/client'
import './index.css'

// Helper component to handle Login redirect to /dashboard
function LoginRoute({ user, onLoginSuccess }) {
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  return <Login onLoginSuccess={onLoginSuccess} />
}

// Protected layout wrapper
function ProtectedLayout({ user, onLogout, allowedRoles, children }) {
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar user={user} onLogout={onLogout} />
      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--surface-dark)' }}>
        {children}
      </main>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('malum_user')
    if (!saved) return null
    try {
      return JSON.parse(saved)
    } catch {
      localStorage.removeItem('malum_user')
      return null
    }
  })
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('malum_token')
    if (token) {
      authApi.me()
        .then(({ data }) => {
          setUser(data)
          localStorage.setItem('malum_user', JSON.stringify(data))
        })
        .catch(() => {
          localStorage.removeItem('malum_token')
          localStorage.removeItem('malum_user')
          setUser(null)
        })
        .finally(() => setCheckingAuth(false))
    } else {
      setCheckingAuth(false)
    }
  }, [])

  const handleLoginSuccess = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('malum_token')
    localStorage.removeItem('malum_user')
    setUser(null)
  }

  if (checkingAuth) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface-dark)', color: 'var(--gold-primary)', fontSize: 16, fontWeight: 600
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="animate-pulse-gold" style={{
            width: 48, height: 48, borderRadius: 12, background: 'var(--gold-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F2D21', fontSize: 24, fontWeight: 800
          }}>
            M
          </div>
          Yuklanmoqda...
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Login Page */}
        <Route
          path="/login"
          element={
            <LoginRoute user={user} onLoginSuccess={handleLoginSuccess} />
          }
        />

        {/* Protected Dashboard & App Pages */}
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout user={user} onLogout={handleLogout}>
              <Dashboard />
            </ProtectedLayout>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedLayout user={user} onLogout={handleLogout}>
              <Transactions currentUser={user} />
            </ProtectedLayout>
          }
        />

        <Route
          path="/transactions/:id"
          element={
            <ProtectedLayout user={user} onLogout={handleLogout}>
              <TransactionDetail currentUser={user} />
            </ProtectedLayout>
          }
        />

        <Route
          path="/workflow"
          element={
            <ProtectedLayout user={user} onLogout={handleLogout} allowedRoles={['admin', 'shariat_board']}>
              <Workflow currentUser={user} />
            </ProtectedLayout>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedLayout user={user} onLogout={handleLogout} allowedRoles={['admin', 'auditor']}>
              <Reports />
            </ProtectedLayout>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedLayout user={user} onLogout={handleLogout} allowedRoles={['admin']}>
              <UsersManagement currentUser={user} />
            </ProtectedLayout>
          }
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
