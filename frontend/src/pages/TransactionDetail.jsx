import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { transactionsApi } from '../api/client'
import { formatAmount, formatDate } from '../utils/format'
import { StatusBadge, RiskBadge, TypeBadge } from '../components/Badges'
import { getApiError } from '../utils/apiError'

function AuditEntry({ log }) {
  const actionIcons = {
    created: '🆕',
    submitted_for_review: '📤',
    approved: '✅',
    rejected: '❌',
    commented: '💬',
  }
  return (
    <div style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ fontSize: 18, flexShrink: 0 }}>{actionIcons[log.action] || '📌'}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{log.actor}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>·</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(log.timestamp)}</span>
          {log.previous_status && log.new_status && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              <StatusBadge status={log.previous_status} /> → <StatusBadge status={log.new_status} />
            </span>
          )}
        </div>
        {log.comment && (
          <div style={{ marginTop: 5, fontSize: 13, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '6px 10px', borderLeft: '2px solid var(--gold-primary)' }}>
            {log.comment}
          </div>
        )}
      </div>
    </div>
  )
}

function WorkflowAction({ tx, currentUser, onRefresh }) {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)

  const doAction = async (apiCall, label) => {
    setLoading(label)
    setError(null)
    try {
      await apiCall({ comment })
      setComment('')
      onRefresh()
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(null)
    }
  }

  const canSubmit = currentUser?.role === 'admin' && tx.status === 'pending'
  const canApprove = ['admin', 'shariat_board'].includes(currentUser?.role) && tx.status === 'reviewing'
  const canReject = ['admin', 'shariat_board'].includes(currentUser?.role) && tx.status === 'reviewing'
  const isTerminal = tx.status === 'approved' || tx.status === 'rejected'

  if (isTerminal) {
    return (
      <div style={{ padding: '16px 18px', background: tx.status === 'approved' ? 'rgba(72,187,120,0.08)' : 'rgba(245,101,101,0.08)', borderRadius: 12, border: `1px solid ${tx.status === 'approved' ? 'rgba(72,187,120,0.2)' : 'rgba(245,101,101,0.2)'}`, textAlign: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>{tx.status === 'approved' ? '✅' : '❌'}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: tx.status === 'approved' ? '#68D391' : '#FC8181' }}>
          Bitim {tx.status === 'approved' ? 'tasdiqlangan' : 'rad etilgan'}
        </div>
      </div>
    )
  }

  if (!canSubmit && !canApprove && !canReject) {
    return (
      <div style={{ padding: 14, background: 'rgba(144,205,244,0.1)', borderRadius: 8, color: '#90CDF4', fontSize: 13, textAlign: 'center' }}>
        ℹ️ Ushbu bosqichda siz uchun amal mavjud emas.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <textarea
        className="form-input"
        rows={3}
        placeholder="Izoh (ixtiyoriy)..."
        value={comment}
        onChange={e => setComment(e.target.value)}
        style={{ resize: 'vertical', fontSize: 13 }}
      />
      {error && <div style={{ color: '#FC8181', fontSize: 12 }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {canSubmit && (
          <button className="btn btn-green" disabled={!!loading}
            onClick={() => doAction((p) => transactionsApi.submitReview(tx.id, p), 'submit')}
            style={{ width: '100%', justifyContent: 'center' }}>
            {loading === 'submit' ? 'Yuklanmoqda...' : '📤 Ko\'rib chiqishga yuborish'}
          </button>
        )}
        {canApprove && (
          <button className="btn btn-green" disabled={!!loading}
            onClick={() => doAction((p) => transactionsApi.approve(tx.id, p), 'approve')}
            style={{ width: '100%', justifyContent: 'center' }}>
            {loading === 'approve' ? 'Yuklanmoqda...' : '✅ Tasdiqlash (Shariat kengashi)'}
          </button>
        )}
        {canReject && (
          <button className="btn btn-danger" disabled={!!loading}
            onClick={() => doAction((p) => transactionsApi.reject(tx.id, p), 'reject')}
            style={{ width: '100%', justifyContent: 'center' }}>
            {loading === 'reject' ? 'Yuklanmoqda...' : '❌ Rad etish'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function TransactionDetail({ currentUser }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tx, setTx] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { data } = await transactionsApi.get(id)
      setTx(data)
    } catch {
      navigate('/transactions')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={{ padding: 36 }}>
      <div className="skeleton" style={{ width: 120, height: 20, marginBottom: 24 }} />
      <div className="skeleton" style={{ height: 300, borderRadius: 14 }} />
    </div>
  )

  if (!tx) return null

  const riskGradients = {
    low:    'linear-gradient(135deg, rgba(72,187,120,0.12), rgba(72,187,120,0.04))',
    medium: 'linear-gradient(135deg, rgba(246,173,85,0.12), rgba(246,173,85,0.04))',
    high:   'linear-gradient(135deg, rgba(245,101,101,0.18), rgba(245,101,101,0.06))',
  }

  return (
    <div className="animate-fade-in" style={{ padding: 36, maxWidth: 1100 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: 'var(--text-muted)' }}>
        <button onClick={() => navigate('/transactions')} style={{ background: 'none', border: 'none', color: 'var(--gold-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>
          ← Bitim Reestri
        </button>
        <span>/</span>
        <span>{tx.transaction_id}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {tx.type} {tx.transaction_id}
          </h1>
          <TypeBadge type={tx.type} />
          <StatusBadge status={tx.status} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-primary)' }}>
          {formatAmount(tx.amount, tx.currency)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Details */}
          <div className="card" style={{ padding: 22 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>Bitim tafsiloti</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Bitim ID', value: tx.transaction_id },
                { label: 'Tur', value: tx.type },
                { label: 'Miqdor', value: formatAmount(tx.amount, tx.currency) },
                { label: 'Valyuta', value: tx.currency },
                { label: "Mas'ul shaxs", value: tx.responsible_person },
                { label: 'Kontragent', value: tx.counterparty || '—' },
                { label: 'Yaratilgan', value: formatDate(tx.created_at) },
                { label: 'Yangilangan', value: formatDate(tx.updated_at) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
            {tx.description && (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Tavsif</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tx.description}</p>
              </div>
            )}
          </div>

          {/* AML/KYC */}
          <div className="card" style={{
            padding: 22,
            background: tx.risk_score ? riskGradients[tx.risk_score] : 'var(--surface-card)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AML/KYC Natija</h2>
              {tx.risk_score && <RiskBadge risk={tx.risk_score} />}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, fontFamily: 'monospace' }}>
              {tx.risk_details || 'Ma\'lumot yo\'q'}
            </p>
          </div>

          {/* Audit log */}
          <div className="card" style={{ padding: 22 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Audit trail</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Bitim bo'yicha barcha harakatlar</p>
            {tx.audit_logs.length === 0
              ? <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Hozircha yozuvlar yo'q</div>
              : tx.audit_logs.map(log => <AuditEntry key={log.id} log={log} />)
            }
          </div>
        </div>

        {/* Right column — Workflow */}
        <div>
          <div className="card" style={{ padding: 22, position: 'sticky', top: 24 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>Shariat Kengashi</h2>

            {/* Status pipeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 22 }}>
              {[
                { status: 'pending',   label: 'Kutilmoqda',        icon: '⏺' },
                { status: 'reviewing', label: "Ko'rib chiqilmoqda", icon: '🔍' },
                { status: 'approved',  label: 'Tasdiqlangan',       icon: '✅' },
              ].map((step, i) => {
                const statuses = ['pending', 'reviewing', 'approved', 'rejected']
                const currentIdx = statuses.indexOf(tx.status)
                const stepIdx = statuses.indexOf(step.status)
                const isDone = tx.status === 'approved' && stepIdx <= 2
                const isCurrent = tx.status === step.status
                const isPast = currentIdx > stepIdx && tx.status !== 'rejected'

                return (
                  <div key={step.status}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8,
                      background: isCurrent ? 'rgba(201,162,39,0.1)' : 'transparent',
                      border: isCurrent ? '1px solid rgba(201,162,39,0.25)' : '1px solid transparent',
                    }}>
                      <span style={{ fontSize: 14 }}>{step.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: isCurrent ? 700 : 400, color: isDone || isPast ? '#68D391' : isCurrent ? 'var(--gold-primary)' : 'var(--text-muted)' }}>
                        {step.label}
                      </span>
                      {(isDone || isPast) && <span style={{ marginLeft: 'auto', color: '#68D391', fontSize: 14 }}>✓</span>}
                      {isCurrent && <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: 'var(--gold-primary)' }} className="animate-pulse-gold" />}
                    </div>
                    {i < 2 && <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', marginLeft: 22 }} />}
                  </div>
                )
              })}
              {tx.status === 'rejected' && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(245,101,101,0.1)', border: '1px solid rgba(245,101,101,0.2)', display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <span>❌</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#FC8181' }}>Rad etilgan</span>
                </div>
              )}
            </div>

            <WorkflowAction tx={tx} currentUser={currentUser} onRefresh={load} />
          </div>
        </div>
      </div>
    </div>
  )
}
