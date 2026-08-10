import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { transactionsApi } from '../api/client'
import { formatAmount, formatDateShort } from '../utils/format'
import { StatusBadge, RiskBadge, TypeBadge } from '../components/Badges'

export default function ShariahWorkflow() {
  const navigate = useNavigate()
  const [reviewing, setReviewing] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [rev, pend] = await Promise.all([
        transactionsApi.list({ status: 'reviewing' }),
        transactionsApi.list({ status: 'pending' }),
      ])
      setReviewing(rev.data)
      setPending(pend.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const QuickCard = ({ tx }) => {
    const [comment, setComment] = useState('')
    const [loading, setLoading] = useState(null)

    const doAction = async (fn, label) => {
      setLoading(label)
      try {
        await fn({ actor: 'Shariat Kengashi Vakili', comment })
        load()
      } catch (e) {
        alert(e.response?.data?.detail || 'Xato')
      } finally {
        setLoading(null)
      }
    }

    return (
      <div className="card animate-fade-in"
        onClick={(e) => { if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'TEXTAREA') navigate(`/transactions/${tx.id}`) }}
        style={{ padding: 18, marginBottom: 14, cursor: 'pointer', transition: 'border-color 0.2s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{tx.id.toString().padStart(4,'0')}</span>
            <TypeBadge type={tx.type} />
            <StatusBadge status={tx.status} />
          </div>
          {tx.risk_score && <RiskBadge risk={tx.risk_score} />}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          {formatAmount(tx.amount, tx.currency)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: tx.status === 'reviewing' ? 14 : 0 }}>
          {tx.responsible_person}{tx.counterparty ? ` · ${tx.counterparty}` : ''} · {formatDateShort(tx.created_at)}
        </div>
        {tx.status === 'reviewing' && (
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              className="form-input"
              rows={2} placeholder="Izoh..."
              style={{ fontSize: 12, resize: 'vertical' }}
              value={comment} onChange={e => setComment(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-green" disabled={!!loading} style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '8px 12px' }}
                onClick={() => doAction((p) => transactionsApi.approve(tx.id, p), 'approve')}>
                {loading === 'approve' ? '...' : '✅ Tasdiqlash'}
              </button>
              <button className="btn btn-danger" disabled={!!loading} style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '8px 12px' }}
                onClick={() => doAction((p) => transactionsApi.reject(tx.id, p), 'reject')}>
                {loading === 'reject' ? '...' : '❌ Rad etish'}
              </button>
            </div>
          </div>
        )}
        {tx.status === 'pending' && (
          <div onClick={e => e.stopPropagation()}>
            <button className="btn btn-ghost" disabled={!!loading}
              style={{ fontSize: 12, padding: '7px 14px', marginTop: 6 }}
              onClick={() => doAction((p) => transactionsApi.submitReview(tx.id, p), 'submit')}>
              {loading === 'submit' ? '...' : '📤 Ko\'rib chiqishga yuborish'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ padding: 36, maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Shariat Workflow</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Kengash tomonidan ko'rib chiqilishi kerak bo'lgan bitimlar</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Ko'rib chiqilmoqda */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#90CDF4' }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Ko'rib chiqilmoqda</h2>
            <span style={{ fontSize: 12, background: 'rgba(66,153,225,0.15)', color: '#90CDF4', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
              {reviewing.length}
            </span>
          </div>
          {loading ? (
            [...Array(2)].map((_, i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 14, marginBottom: 14 }} />)
          ) : reviewing.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
              Barcha bitimlar ko'rib chiqilgan
            </div>
          ) : reviewing.map(tx => <QuickCard key={tx.id} tx={tx} />)}
        </div>

        {/* Kutilmoqda */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E9C46A' }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Kutilmoqda</h2>
            <span style={{ fontSize: 12, background: 'rgba(201,162,39,0.15)', color: '#E9C46A', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
              {pending.length}
            </span>
          </div>
          {loading ? (
            [...Array(2)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14, marginBottom: 14 }} />)
          ) : pending.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
              Kutilayotgan bitimlar yo'q
            </div>
          ) : pending.map(tx => <QuickCard key={tx.id} tx={tx} />)}
        </div>
      </div>
    </div>
  )
}
