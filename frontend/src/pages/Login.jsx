import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/client'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Login({ onLoginSuccess }) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await authApi.login(email, password)
      localStorage.setItem('malum_token', data.access_token)
      localStorage.setItem('malum_user', JSON.stringify(data.user))
      onLoginSuccess(data.user)
    } catch (err) {
      setError(err.response?.data?.detail || t('auth.loginError'))
    } finally {
      setLoading(false)
    }
  }

  const fillDemoUser = (demoEmail, demoPass) => {
    setEmail(demoEmail)
    setPassword(demoPass)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top, #142B20 0%, #0D1F18 100%)',
      padding: 20,
    }}>
      {/* Language Switcher — top right */}
      <div style={{ position: 'fixed', top: 20, right: 24 }}>
        <LanguageSwitcher theme="dark" />
      </div>

      <div className="animate-fade-in" style={{
        width: '100%',
        maxWidth: 440,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-medium)',
        borderRadius: 20,
        padding: '40px 36px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--gold-primary), var(--gold-dark))',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: '#0F2D21',
            boxShadow: '0 6px 20px rgba(201,162,39,0.35)',
          }}>
            M
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Malum
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {t('brand.description')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              {t('auth.email')}
            </label>
            <input
              type="email"
              className="form-input"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              {t('auth.password')}
            </label>
            <input
              type="password"
              className="form-input"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(245,101,101,0.12)',
              border: '1px solid rgba(245,101,101,0.25)',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#FC8181',
              fontSize: 13,
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '12px 20px', fontSize: 15, marginTop: 4, width: '100%' }}
          >
            {loading ? t('auth.loggingIn') : t('auth.loginButton')}
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, textAlign: 'center' }}>
            {t('auth.demoUsers')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: t('auth.demoAdmin'), email: 'admin@amanat.uz', pass: 'admin123', tag: 'admin' },
              { label: t('auth.demoShariat'), email: 'kengash@amanat.uz', pass: 'kengash123', tag: 'shariat' },
              { label: t('auth.demoAuditor'), email: 'auditor@amanat.uz', pass: 'auditor123', tag: 'auditor' },
            ].map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => fillDemoUser(u.email, u.pass)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(201,162,39,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(201,162,39,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.borderColor = 'var(--border-subtle)'
                }}
              >
                <span>{u.label}</span>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(201,162,39,0.15)', color: 'var(--gold-primary)', fontWeight: 600 }}>
                  {u.tag}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
