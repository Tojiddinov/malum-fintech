import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { transactionsApi } from '../api/client'
import { formatAmount, formatDateShort } from '../utils/format'
import { StatusBadge, RiskBadge, TypeBadge } from '../components/Badges'
import NewTransactionModal from '../components/NewTransactionModal'

const STATUS_OPTIONS = ['', 'pending', 'reviewing', 'approved', 'rejected']
const TYPE_OPTIONS = ['', 'Murabaha', 'Musharaka']

export default function Transactions() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.type = typeFilter
      const { data } = await transactionsApi.list(params)
      setTransactions(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter, typeFilter])

  const filtered = transactions.filter(tx =>
    !search ||
    tx.responsible_person?.toLowerCase().includes(search.toLowerCase()) ||
    tx.counterparty?.toLowerCase().includes(search.toLowerCase()) ||
    tx.id.toString().includes(search)
  )

  const handleCreated = (newTx) => {
    setShowModal(false)
    navigate(`/transactions/${newTx.id}`)
  }

  const statusLabels = {
    pending: t('status.pending'),
    reviewing: t('status.reviewing'),
    approved: t('status.approved'),
    rejected: t('status.rejected'),
  }

  return (
    <div className="animate-fade-in" style={{ padding: 36, maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{t('transactions.title')}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{t('transactions.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ padding: '11px 22px', fontSize: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {t('transactions.newTx')}
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="form-input" placeholder={`🔍  ${t('transactions.searchPlaceholder')}`}
          style={{ maxWidth: 280 }} value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="form-input" style={{ maxWidth: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">{t('transactions.allStatuses')}</option>
          {STATUS_OPTIONS.slice(1).map(s => (
            <option key={s} value={s}>{statusLabels[s]}</option>
          ))}
        </select>
        <select className="form-input" style={{ maxWidth: 140 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">{t('transactions.allTypes')}</option>
          {TYPE_OPTIONS.slice(1).map(tp => <option key={tp} value={tp}>{tp}</option>)}
        </select>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {filtered.length} {t('common.type').toLowerCase()}
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.15)' }}>
              {[t('common.id'), t('common.type'), t('common.amount'), 'Kontragent', "Mas'ul", t('common.risk'), t('common.status'), t('common.date'), ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(9)].map((__, j) => (
                    <td key={j} style={{ padding: '14px 16px' }}>
                      <div className="skeleton" style={{ height: 14, width: j === 0 ? 40 : j === 2 ? 100 : 80 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t('transactions.noTx')}</div>
                  <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: 16, fontSize: 13 }}>
                    {t('transactions.newTx')}
                  </button>
                </td>
              </tr>
            ) : filtered.map((tx) => (
              <tr key={tx.id}
                onClick={() => navigate(`/transactions/${tx.id}`)}
                style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{tx.id.toString().padStart(4,'0')}</td>
                <td style={{ padding: '14px 16px' }}><TypeBadge type={tx.type} /></td>
                <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{formatAmount(tx.amount, tx.currency)}</td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.counterparty || '—'}</td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{tx.responsible_person}</td>
                <td style={{ padding: '14px 16px' }}>{tx.risk_score ? <RiskBadge risk={tx.risk_score} /> : '—'}</td>
                <td style={{ padding: '14px 16px' }}><StatusBadge status={tx.status} /></td>
                <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateShort(tx.created_at)}</td>
                <td style={{ padding: '14px 16px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <NewTransactionModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  )
}
