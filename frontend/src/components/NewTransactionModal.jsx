import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { transactionsApi } from '../api/client'
import { getApiError } from '../utils/apiError'

const INITIAL = {
  type: 'Murabaha',
  amount: '',
  currency: 'UZS',
  responsible_person: '',
  counterparty: '',
  description: '',
}

export default function NewTransactionModal({ onClose, onCreated }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount) }
      const { data } = await transactionsApi.create(payload)
      onCreated(data)
    } catch (err) {
      setError(getApiError(err, t('common.error')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="animate-fade-in" style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-medium)',
        borderRadius: 18,
        width: '100%', maxWidth: 520,
        padding: 32,
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{t('transactions.newModal.title')}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>AML/KYC {t('common.loading').replace('...', '')} avtomatik amalga oshiriladi</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 16 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Type */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              {t('transactions.newModal.txType')} *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['Murabaha', 'Musharaka'].map((tp) => (
                <button key={tp} type="button" onClick={() => setForm(p => ({...p, type: tp}))} style={{
                  padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  border: `2px solid ${form.type === tp ? 'var(--gold-primary)' : 'var(--border-subtle)'}`,
                  background: form.type === tp ? 'rgba(201,162,39,0.1)' : 'var(--surface-dark)',
                  color: form.type === tp ? 'var(--gold-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.18s',
                }}>
                  {tp}
                </button>
              ))}
            </div>
          </div>

          {/* Amount + Currency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{t('transactions.newModal.amount')} *</label>
              <input className="form-input" name="amount" type="number" min="1" step="any"
                placeholder="1,000,000" value={form.amount} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{t('transactions.newModal.currency')}</label>
              <select className="form-input" name="currency" value={form.currency} onChange={handleChange}>
                <option>UZS</option><option>USD</option>
              </select>
            </div>
          </div>

          {/* Responsible person */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Mas'ul shaxs *</label>
            <input className="form-input" name="responsible_person" placeholder="F.I.O." value={form.responsible_person} onChange={handleChange} required />
          </div>

          {/* Counterparty */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{t('transactions.newModal.counterparty')}</label>
            <input className="form-input" name="counterparty" placeholder={t('transactions.newModal.counterpartyPlaceholder')} value={form.counterparty} onChange={handleChange} />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{t('transactions.newModal.description')}</label>
            <textarea className="form-input" name="description" rows={3}
              placeholder={t('transactions.newModal.descriptionPlaceholder')} value={form.description} onChange={handleChange}
              style={{ resize: 'vertical' }} />
          </div>

          {error && (
            <div style={{ background: 'rgba(245,101,101,0.1)', border: '1px solid rgba(245,101,101,0.25)', borderRadius: 8, padding: '10px 14px', color: '#FC8181', fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">{t('transactions.newModal.cancel')}</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? t('transactions.newModal.creating') : `+ ${t('transactions.newModal.create')}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
