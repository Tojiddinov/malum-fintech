import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { reportsApi } from '../api/client'
import { formatDate } from '../utils/format'

export default function Reports() {
  const { t } = useTranslation()
  const [reportType, setReportType] = useState('transaction_summary')
  const [exportFormat, setExportFormat] = useState('pdf')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [txType, setTxType] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [minAmount, setMinAmount] = useState('')

  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [message, setMessage] = useState(null)

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const { data } = await reportsApi.history()
      setHistory(data)
    } catch (e) {
      console.error(e)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const reqPayload = {
        report_type: reportType,
        export_format: exportFormat,
        start_date: startDate || null,
        end_date: endDate || null,
        transaction_type: txType || null,
        status: statusFilter || null,
        min_amount: minAmount ? parseFloat(minAmount) : null,
      }

      const { data } = await reportsApi.generate(reqPayload)
      setMessage({ type: 'success', text: `✅ Hisobot yaratildi: ${data.filename}` })

      // Auto trigger browser download
      window.open(reportsApi.downloadUrl(data.id), '_blank', 'noopener,noreferrer')
      loadHistory()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || "Hisobot yaratishda xato" })
    } finally {
      setLoading(false)
    }
  }

  const reportTypeLabels = {
    transaction_summary: "📊 Bitimlar xulosasi (sana oralig'i, tur, holat bo'yicha)",
    aml_risk_report: "🛡 AML / KYC Risk tahlili hisoboti",
    shariat_audit: "⚖️ Shariat kengashi audit hisoboti",
  }

  return (
    <div className="animate-fade-in" style={{ padding: 36, maxWidth: 1250 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {t('reports.title')}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
          {t('reports.subtitle')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24 }}>
        {/* Left Panel: Generator Form */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
            ⚙️ Hisobot sozlash
          </h2>

          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Report type */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Hisobot turi *
              </label>
              <select
                className="form-input"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="transaction_summary">{reportTypeLabels.transaction_summary}</option>
                <option value="aml_risk_report">{reportTypeLabels.aml_risk_report}</option>
                <option value="shariat_audit">{reportTypeLabels.shariat_audit}</option>
              </select>
            </div>

            {/* Date Range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Boshlanish sanasi
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Tugash sanasi
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Transaction Type Filter */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Bitim turi
                </label>
                <select
                  className="form-input"
                  value={txType}
                  onChange={(e) => setTxType(e.target.value)}
                >
                  <option value="">Barcha turlar</option>
                  <option value="Murabaha">Murabaha</option>
                  <option value="Musharaka">Musharaka</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Holat
                </label>
                <select
                  className="form-input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Barcha holatlar</option>
                  <option value="pending">Kutilmoqda</option>
                  <option value="reviewing">Ko'rib chiqilmoqda</option>
                  <option value="approved">Tasdiqlangan</option>
                  <option value="rejected">Rad etilgan</option>
                </select>
              </div>
            </div>

            {/* Min Amount */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Minimal miqdor (UZS)
              </label>
              <input
                type="number"
                className="form-input"
                placeholder="masalan: 10000000"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </div>

            {/* Export Format Toggle */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Eksport formati *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setExportFormat('pdf')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `2px solid ${exportFormat === 'pdf' ? 'var(--gold-primary)' : 'var(--border-subtle)'}`,
                    background: exportFormat === 'pdf' ? 'rgba(201,162,39,0.1)' : 'var(--surface-dark)',
                    color: exportFormat === 'pdf' ? 'var(--gold-primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  📄 PDF Hujjat
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('excel')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `2px solid ${exportFormat === 'excel' ? '#68D391' : 'var(--border-subtle)'}`,
                    background: exportFormat === 'excel' ? 'rgba(72,187,120,0.1)' : 'var(--surface-dark)',
                    color: exportFormat === 'excel' ? '#68D391' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  📊 Excel Jadval
                </button>
              </div>
            </div>

            {message && (
              <div style={{
                padding: '10px 12px', borderRadius: 8, fontSize: 12,
                background: message.type === 'success' ? 'rgba(72,187,120,0.15)' : 'rgba(245,101,101,0.15)',
                color: message.type === 'success' ? '#68D391' : '#FC8181',
                border: `1px solid ${message.type === 'success' ? 'rgba(72,187,120,0.3)' : 'rgba(245,101,101,0.3)'}`
              }}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '12px 20px', fontSize: 14, marginTop: 6 }}
            >
              {loading ? 'Hisobot shakllantirilmoqda...' : '⚡ Hisobot yaratish va yuklab olish'}
            </button>
          </form>
        </div>

        {/* Right Panel: Recent History Table */}
        <div className="card" style={{ padding: 28, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              📋 Oxirgi yaratilgan hisobotlar
            </h2>
            <button className="btn btn-ghost" onClick={loadHistory} style={{ fontSize: 12, padding: '5px 10px' }}>
              🔄 Yangilash
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.15)' }}>
                {['ID', 'Turi', 'Format', 'Kim yaratdi', 'Sana', 'Yuklab olish'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((__, j) => (
                      <td key={j} style={{ padding: 12 }}>
                        <div className="skeleton" style={{ height: 14 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Hozircha saqlangan hisobotlar yo'q
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      #{item.id}
                    </td>
                    <td style={{ padding: '12px', fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                      {item.report_type.replace('_', ' ').toUpperCase()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                        background: item.export_format === 'pdf' ? 'rgba(201,162,39,0.15)' : 'rgba(72,187,120,0.15)',
                        color: item.export_format === 'pdf' ? 'var(--gold-primary)' : '#68D391',
                        border: `1px solid ${item.export_format === 'pdf' ? 'rgba(201,162,39,0.3)' : 'rgba(72,187,120,0.3)'}`,
                      }}>
                        {item.export_format.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {item.created_by || 'Admin'}
                    </td>
                    <td style={{ padding: '12px', fontSize: 11, color: 'var(--text-muted)' }}>
                      {formatDate(item.created_at)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <a
                        href={reportsApi.downloadUrl(item.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost"
                        style={{ padding: '4px 10px', fontSize: 11, color: 'var(--gold-primary)' }}
                      >
                        ⬇️ Yuklab olish
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
