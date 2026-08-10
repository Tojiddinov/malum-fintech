import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { workflowApi } from '../api/client'
import { formatAmount, formatDate, formatDateShort } from '../utils/format'
import { StatusBadge, RiskBadge, TypeBadge } from '../components/Badges'
import { getApiError } from '../utils/apiError'

export default function Workflow({ currentUser }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('pending') // pending | reviewing | approved | rejected
  const [items, setItems] = useState([])
  const [selectedTx, setSelectedTx] = useState(null)
  const [stats, setStats] = useState({ pending: 0, reviewing: 0, approved: 0, rejected: 0, overdue: 0 })
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [queueRes, statsRes] = await Promise.all([
        workflowApi.getQueue(activeTab),
        workflowApi.stats(),
      ])
      setItems(queueRes.data)
      setStats(statsRes.data)
      setSelectedTx((current) => (
        queueRes.data.find(tx => tx.id === current?.id) || queueRes.data[0] || null
      ))
    } catch (err) {
      setLoadError(getApiError(err, "Workflow ma'lumotlarini yuklab bo'lmadi"))
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    loadData()
  }, [loadData])

  const isOverdue = (createdDateStr) => {
    if (!createdDateStr) return false
    const created = new Date(createdDateStr).getTime()
    const now = new Date().getTime()
    const diffHours = (now - created) / (1000 * 60 * 60)
    return diffHours >= 48
  }

  const handleSendToReview = async (txId) => {
    setActionLoading('review')
    setErrorMsg(null)
    try {
      await workflowApi.sendToReview(txId, { comment })
      setComment('')
      loadData()
    } catch (err) {
      setErrorMsg(getApiError(err))
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = async (txId) => {
    setActionLoading('approve')
    setErrorMsg(null)
    try {
      await workflowApi.approve(txId, { comment })
      setComment('')
      loadData()
    } catch (err) {
      setErrorMsg(getApiError(err))
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (txId) => {
    if (!comment || !comment.trim()) {
      setErrorMsg("Rad etish uchun izoh/sabab kiritish majburiy!")
      return
    }
    setActionLoading('reject')
    setErrorMsg(null)
    try {
      await workflowApi.reject(txId, { comment })
      setComment('')
      loadData()
    } catch (err) {
      setErrorMsg(getApiError(err))
    } finally {
      setActionLoading(null)
    }
  }

  const isAdmin = currentUser?.role === 'admin'

  return (
    <div className="animate-fade-in" style={{ padding: 36, maxWidth: 1300 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {t('workflow.title')}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
          {t('workflow.subtitle')}
        </p>
      </div>

      {loadError && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, color: '#FC8181', background: 'rgba(245,101,101,0.12)', border: '1px solid rgba(245,101,101,0.25)', fontSize: 13 }}>
          {loadError} <button type="button" onClick={loadData} style={{ marginLeft: 8, color: 'inherit', textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer' }}>Qayta urinish</button>
        </div>
      )}

      {/* Navigation Tabs with Counts */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12
      }}>
        {[
          { key: 'pending', label: t('status.pending'), count: stats.pending, color: '#E9C46A' },
          { key: 'reviewing', label: t('status.reviewing'), count: stats.reviewing, color: '#90CDF4' },
          { key: 'approved', label: t('status.approved'), count: stats.approved, color: '#68D391' },
          { key: 'rejected', label: t('status.rejected'), count: stats.rejected, color: '#FC8181' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              border: activeTab === tab.key ? `1px solid ${tab.color}` : '1px solid var(--border-subtle)',
              background: activeTab === tab.key ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.18s',
            }}
          >
            <span>{tab.label}</span>
            <span style={{
              fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 999,
              background: activeTab === tab.key ? tab.color : 'rgba(255,255,255,0.1)',
              color: activeTab === tab.key ? '#0F2D21' : 'var(--text-muted)',
            }}>
              {tab.count}
            </span>
          </button>
        ))}

        {stats.overdue > 0 && (
          <div style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8, background: 'rgba(245,101,101,0.12)', border: '1px solid rgba(245,101,101,0.3)',
            color: '#FC8181', fontSize: 12, fontWeight: 700
          }}>
            ⚠️ {stats.overdue} TA BITIM MUDDATI O'TGAN (&gt;48h)
          </div>
        )}
      </div>

      {/* Main Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20 }}>
        {/* Left Column: Transaction Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: 4 }}>
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />
            ))
          ) : items.length === 0 ? (
            <div className="card" style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              Ushbu bo'limda bitimlar mavjud emas
            </div>
          ) : (
            items.map((tx) => {
              const overdue = isOverdue(tx.created_at) && (tx.status === 'pending' || tx.status === 'reviewing')
              const isSelected = selectedTx?.id === tx.id

              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="card"
                  style={{
                    padding: 16,
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--gold-primary)' : 'var(--border-subtle)',
                    background: isSelected ? 'rgba(201,162,39,0.08)' : 'var(--surface-card)',
                    boxShadow: isSelected ? '0 0 0 1px var(--gold-primary)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {tx.transaction_id}
                      </span>
                      <TypeBadge type={tx.type} />
                    </div>
                    {tx.risk_score && <RiskBadge risk={tx.risk_score} />}
                  </div>

                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {formatAmount(tx.amount, tx.currency)}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                    {tx.responsible_person} {tx.counterparty ? `· ${tx.counterparty}` : ''}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {formatDateShort(tx.created_at)}
                    </span>
                    {overdue && (
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(245,101,101,0.2)', color: '#FC8181', border: '1px solid rgba(245,101,101,0.4)',
                        letterSpacing: '0.04em'
                      }}>
                        ⏰ MUDDATI O'TGAN
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Right Column: Selected Transaction Detail & Actions */}
        <div>
          {selectedTx ? (
            <div className="card" style={{ padding: 28, position: 'sticky', top: 24 }}>
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {selectedTx.type} {selectedTx.transaction_id}
                    </h2>
                    <TypeBadge type={selectedTx.type} />
                    <StatusBadge status={selectedTx.status} />
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Mas'ul: {selectedTx.responsible_person} | Kontragent: {selectedTx.counterparty || '—'}
                  </div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold-primary)' }}>
                  {formatAmount(selectedTx.amount, selectedTx.currency)}
                </div>
              </div>

              {/* Grid details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                    Yaratilgan sana
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{formatDate(selectedTx.created_at)}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                    AML / KYC Risk Holati
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RiskBadge risk={selectedTx.risk_score || 'low'} />
                  </div>
                </div>
              </div>

              {/* AML Details box */}
              {selectedTx.risk_details && (
                <div style={{
                  padding: 14, borderRadius: 10, marginBottom: 20,
                  background: 'rgba(201,162,39,0.06)', border: '1px solid var(--border-subtle)',
                  fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)'
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--gold-primary)', marginBottom: 4 }}>🛡 AML Risk Tahlili Natijasi:</div>
                  {selectedTx.risk_details}
                </div>
              )}

              {/* Description */}
              {selectedTx.description && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Bitim tavsifi
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 8 }}>
                    {selectedTx.description}
                  </div>
                </div>
              )}

              {/* Audit Trail List */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
                  Audit log va harakatlar
                </div>
                <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 10 }}>
                  {selectedTx.audit_logs?.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Hozircha amallar yozilmagan</div>
                  ) : (
                    selectedTx.audit_logs?.map((log) => (
                      <div key={log.id} style={{ fontSize: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', fontWeight: 600 }}>
                          <span>{log.actor} ({log.action})</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateShort(log.timestamp)}</span>
                        </div>
                        {log.comment && <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 2 }}>"{log.comment}"</div>}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Workflow Actions Box */}
              {(selectedTx.status === 'reviewing' || (isAdmin && selectedTx.status === 'pending')) && (
                <div style={{
                  padding: 20, borderRadius: 12, background: 'rgba(27,67,50,0.4)', border: '1px solid var(--border-medium)'
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-primary)', marginBottom: 10 }}>
                    ✍️ Shariat Kengashi Qarori
                  </div>

                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Izoh yoki rad etish sababini yozing... (Rad etishda majburiy)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={{ fontSize: 13, marginBottom: 12, resize: 'vertical' }}
                  />

                  {errorMsg && (
                    <div style={{ color: '#FC8181', fontSize: 12, marginBottom: 10, padding: 8, background: 'rgba(245,101,101,0.1)', borderRadius: 6 }}>
                      {errorMsg}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 12 }}>
                    {isAdmin && selectedTx.status === 'pending' && (
                      <button
                        className="btn btn-ghost"
                        disabled={!!actionLoading}
                        onClick={() => handleSendToReview(selectedTx.id)}
                        style={{ flex: 1, padding: '10px 14px' }}
                      >
                        {actionLoading === 'review' ? 'Yuborilmoqda...' : "🔍 Ko'rib chiqishga o'tkazish"}
                      </button>
                    )}

                    {selectedTx.status === 'reviewing' && <>
                      <button
                        className="btn btn-green"
                        disabled={!!actionLoading}
                        onClick={() => handleApprove(selectedTx.id)}
                        style={{ flex: 1, padding: '10px 14px' }}
                      >
                        {actionLoading === 'approve' ? 'Tasdiqlanmoqda...' : '✅ Tasdiqlash'}
                      </button>

                      <button
                        className="btn btn-danger"
                        disabled={!!actionLoading}
                        onClick={() => handleReject(selectedTx.id)}
                        style={{ flex: 1, padding: '10px 14px' }}
                      >
                        {actionLoading === 'reject' ? 'Rad etilmoqda...' : '❌ Rad etish'}
                      </button>
                    </>}
                  </div>
                </div>
              )}

              {selectedTx.status === 'pending' && !isAdmin && (
                <div style={{ padding: 14, background: 'rgba(144,205,244,0.1)', borderRadius: 8, color: '#90CDF4', fontSize: 13, textAlign: 'center' }}>
                  ℹ️ Bitimni review bosqichiga faqat administrator yuboradi.
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              Tanlash uchun chap paneldan bitimni bosing
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
