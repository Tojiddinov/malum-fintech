import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { transactionsApi } from '../api/client'
import { formatAmount, formatDateShort } from '../utils/format'
import { StatusBadge, RiskBadge } from '../components/Badges'

function StatCard({ label, value, sub, color = 'var(--gold-primary)', icon }) {
  return (
    <div className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

function RecentRow({ tx }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{tx.id.toString().padStart(4,'0')}</td>
      <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{tx.type}</span></td>
      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{formatAmount(tx.amount, tx.currency)}</td>
      <td style={{ padding: '12px 16px' }}><StatusBadge status={tx.status} /></td>
      <td style={{ padding: '12px 16px' }}>{tx.risk_score ? <RiskBadge risk={tx.risk_score} /> : '—'}</td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{formatDateShort(tx.created_at)}</td>
    </tr>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      transactionsApi.stats(),
      transactionsApi.list({ limit: 6 }),
    ]).then(([s, r]) => {
      setStats(s.data)
      setRecent(r.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ padding: 36 }}>
      <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 32 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
      </div>
    </div>
  )

  const approvedPct = stats.total ? Math.round((stats.by_status.approved / stats.total) * 100) : 0

  return (
    <div className="animate-fade-in" style={{ padding: 36, maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{t('dashboard.title')}</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label={t('dashboard.totalTx')} value={stats.total} icon="📊" color="var(--text-primary)" />
        <StatCard label={t('dashboard.approved')} value={stats.by_status.approved} sub={t('dashboard.approvedPct', { pct: approvedPct })} icon="✅" color="#68D391" />
        <StatCard label={t('dashboard.reviewing')} value={stats.by_status.reviewing} icon="⏳" color="#90CDF4" />
        <StatCard label={t('dashboard.approvedVolume')} value={formatAmount(stats.approved_volume_uzs)} icon="💰" color="var(--gold-primary)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Recent transactions */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{t('dashboard.recentTx')}</h2>
            <a href="/transactions" style={{ fontSize: 12, color: 'var(--gold-primary)', textDecoration: 'none', fontWeight: 600 }}>{t('common.viewAll')}</a>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {[t('dashboard.colId') || 'ID', t('common.type'), t('common.amount'), t('common.status'), t('common.risk'), t('common.date')].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0
                ? <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{t('dashboard.noTx')}</td></tr>
                : recent.map(tx => <RecentRow key={tx.id} tx={tx} />)}
            </tbody>
          </table>
        </div>

        {/* Risk breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('dashboard.amlRisk')}</h3>
            {[
              { label: t('dashboard.lowRisk'), value: stats.by_risk.low, color: '#68D391', pct: stats.total ? (stats.by_risk.low/stats.total)*100 : 0 },
              { label: t('dashboard.mediumRisk'), value: stats.by_risk.medium, color: '#F6AD55', pct: stats.total ? (stats.by_risk.medium/stats.total)*100 : 0 },
              { label: t('dashboard.highRisk'), value: stats.by_risk.high, color: '#FC8181', pct: stats.total ? (stats.by_risk.high/stats.total)*100 : 0 },
            ].map(r => (
              <div key={r.label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.value}</span>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ height: '100%', borderRadius: 999, width: `${r.pct}%`, background: r.color, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('dashboard.byStatus')}</h3>
            {Object.entries(stats.by_status).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <StatusBadge status={key} />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
