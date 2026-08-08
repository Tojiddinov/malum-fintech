import { STATUS_LABELS, RISK_LABELS } from '../utils/format'

export function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function RiskBadge({ risk }) {
  const colors = {
    low:    { bg: 'rgba(72,187,120,0.12)', color: '#68D391', border: 'rgba(72,187,120,0.25)' },
    medium: { bg: 'rgba(246,173,85,0.12)',  color: '#F6AD55', border: 'rgba(246,173,85,0.25)' },
    high:   { bg: 'rgba(245,101,101,0.12)', color: '#FC8181', border: 'rgba(245,101,101,0.25)' },
  }
  const icons = { low: '↓', medium: '→', high: '↑' }
  const c = colors[risk] || colors.medium
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      {icons[risk]} {RISK_LABELS[risk] || risk}
    </span>
  )
}

export function TypeBadge({ type }) {
  const isMusharaka = type === 'Musharaka'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: isMusharaka ? 'rgba(128,90,213,0.12)' : 'rgba(56,178,172,0.12)',
      color: isMusharaka ? '#B794F4' : '#81E6D9',
      border: `1px solid ${isMusharaka ? 'rgba(128,90,213,0.25)' : 'rgba(56,178,172,0.25)'}`,
      letterSpacing: '0.03em',
    }}>
      {type}
    </span>
  )
}
