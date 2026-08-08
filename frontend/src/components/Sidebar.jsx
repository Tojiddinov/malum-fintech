import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

export default function Sidebar({ user, onLogout }) {
  const { t } = useTranslation()

  const isAuditor = user?.role === 'auditor'
  const isShariat = user?.role === 'shariat_board'
  const isAdmin = user?.role === 'admin'

  const navItems = [
    {
      to: '/dashboard',
      label: t('nav.dashboard'),
      show: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1.5"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5"/>
        </svg>
      ),
    },
    {
      to: '/transactions',
      label: t('nav.transactions'),
      show: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
          <line x1="9" y1="12" x2="15" y2="12"/>
          <line x1="9" y1="16" x2="13" y2="16"/>
        </svg>
      ),
    },
    {
      to: '/workflow',
      label: t('nav.workflow'),
      show: isAdmin || isShariat,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
      ),
    },
    {
      to: '/reports',
      label: t('nav.reports'),
      show: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
    },
    {
      to: '/users',
      label: t('nav.users'),
      show: isAdmin,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ),
    },
  ]

  const roleBadges = {
    admin: { label: t('roles.admin'), bg: 'rgba(201,162,39,0.2)', color: '#E9C46A' },
    shariat_board: { label: t('roles.shariat_board'), bg: 'rgba(72,187,120,0.2)', color: '#68D391' },
    auditor: { label: t('roles.auditor'), bg: 'rgba(144,205,244,0.2)', color: '#90CDF4' },
  }

  const badge = roleBadges[user?.role] || roleBadges.auditor

  return (
    <aside style={{
      width: 250,
      minWidth: 250,
      background: 'var(--green-dark)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 20,
    }}>
      {/* Brand Header */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, var(--gold-primary), var(--gold-dark))',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#0F2D21',
            boxShadow: '0 4px 14px rgba(201,162,39,0.3)',
          }}>M</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Malum</div>
            <div style={{ fontSize: 10, color: 'var(--gold-primary)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('brand.tagline')}</div>
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 12px', marginBottom: 8 }}>
          {t('nav.mainMenu')}
        </div>
        {navItems.filter(item => item.show).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '11px 14px',
              borderRadius: 10,
              marginBottom: 4,
              color: isActive ? 'var(--gold-primary)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(201,162,39,0.12)' : 'transparent',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              borderLeft: isActive ? '3px solid var(--gold-primary)' : '3px solid transparent',
              transition: 'all 0.18s ease',
            })}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Language Switcher */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
        <LanguageSwitcher theme="dark" />
      </div>

      {/* User Footer & Logout */}
      <div style={{ padding: 16, borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name || t('common.name')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            background: badge.bg, color: badge.color, textTransform: 'uppercase', flexShrink: 0
          }}>
            {badge.label}
          </span>
        </div>

        <button
          onClick={onLogout}
          className="btn btn-ghost"
          style={{
            width: '100%',
            justify: 'center',
            fontSize: 12,
            padding: '8px 12px',
            color: '#FC8181',
            borderColor: 'rgba(245,101,101,0.2)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  )
}
