import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usersApi } from '../api/client'
import { formatDate } from '../utils/format'
import { getApiError } from '../utils/apiError'

export default function UsersManagement({ currentUser }) {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  // Form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('auditor')
  const [bankName, setBankName] = useState("O'zbekiston Islom Banki")
  const [formError, setFormError] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [actionError, setActionError] = useState(null)

  const loadUsers = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const { data } = await usersApi.list()
      setUsers(data)
    } catch (err) {
      setLoadError(getApiError(err, "Foydalanuvchilarni yuklab bo'lmadi"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers()
    }
  }, [currentUser])

  if (currentUser?.role !== 'admin') {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⛔</div>
        <h2 style={{ color: '#FC8181', fontSize: 20 }}>Ruxsat berilmagan</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Foydalanuvchilarni boshqarish faqat Adminlar uchun ochiq.</p>
      </div>
    )
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFullName('')
    setEmail('')
    setPassword('')
    setRole('auditor')
    setBankName("O'zbekiston Islom Banki")
    setFormError(null)
    setShowModal(true)
  }

  const openEditModal = (u) => {
    setEditingUser(u)
    setFullName(u.full_name)
    setEmail(u.email)
    setPassword('')
    setRole(u.role)
    setBankName(u.bank_name || '')
    setFormError(null)
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setFormError(null)
    setSubmitLoading(true)
    try {
      if (editingUser) {
        const payload = { full_name: fullName, email, role, bank_name: bankName }
        if (password) payload.password = password
        await usersApi.update(editingUser.id, payload)
      } else {
        await usersApi.create({ full_name: fullName, email, password, role, bank_name: bankName })
      }
      setShowModal(false)
      loadUsers()
    } catch (err) {
      setFormError(getApiError(err, "Saqlashda xato yuz berdi"))
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeactivate = async (userId) => {
    if (!window.confirm("Haqiqatdan ham ushbu foydalanuvchini faolsizlashtirmoqchimisiz?")) return
    try {
      setActionError(null)
      await usersApi.deactivate(userId)
      loadUsers()
    } catch (err) {
      setActionError(getApiError(err, "Foydalanuvchini faolsizlantirib bo'lmadi"))
    }
  }

  const roleBadges = {
    admin: { label: 'Admin', bg: 'rgba(201,162,39,0.2)', color: '#E9C46A' },
    shariat_board: { label: 'Shariat Kengashi', bg: 'rgba(72,187,120,0.2)', color: '#68D391' },
    auditor: { label: 'Auditor', bg: 'rgba(144,205,244,0.2)', color: '#90CDF4' },
  }

  return (
    <div className="animate-fade-in" style={{ padding: 36, maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {t('users.title')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
            {t('users.subtitle')}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} style={{ padding: '11px 22px', fontSize: 14 }}>
          + {t('users.newUser')}
        </button>
      </div>

      {(loadError || actionError) && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, color: '#FC8181', background: 'rgba(245,101,101,0.12)', border: '1px solid rgba(245,101,101,0.25)', fontSize: 13 }}>
          {loadError || actionError}
          {loadError && <button type="button" onClick={loadUsers} style={{ marginLeft: 8, color: 'inherit', textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer' }}>Qayta urinish</button>}
        </div>
      )}

      {/* Users Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.15)' }}>
              {['ID', 'F.I.O.', 'Email', 'Rol', 'Bank nomi', 'Holat', 'So\'nggi kirish', 'Amallar'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}>
                  {[...Array(8)].map((__, j) => (
                    <td key={j} style={{ padding: 14 }}>
                      <div className="skeleton" style={{ height: 14 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Foydalanuvchilar topilmadi
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const badge = roleBadges[u.role] || roleBadges.auditor

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      #{u.id}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {u.full_name}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                        background: badge.bg, color: badge.color, textTransform: 'uppercase'
                      }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                      {u.bank_name || '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${u.is_active ? 'badge-approved' : 'badge-rejected'}`}>
                        {u.is_active ? 'FAOL' : 'FAOLSIZ'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {u.last_login ? formatDate(u.last_login) : 'Kirmagan'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-ghost"
                          onClick={() => openEditModal(u)}
                          style={{ padding: '5px 10px', fontSize: 12 }}
                        >
                          ✏️ Tahrirlash
                        </button>
                        {u.is_active && u.id !== currentUser.id && (
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeactivate(u.id)}
                            style={{ padding: '5px 10px', fontSize: 12 }}
                          >
                            🚫 Faolsizlantirish
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* User Create/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="animate-fade-in" style={{
            background: 'var(--surface-card)', border: '1px solid var(--border-medium)',
            borderRadius: 18, width: '100%', maxWidth: 500, padding: 32
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                {editingUser ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi qo\'shish'}
              </h2>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ padding: '4px 8px' }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>F.I.O. *</label>
                <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Ism Sharif" />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email *</label>
                <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required placeholder="email@domain.uz" />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  {editingUser ? 'Parol (O\'zgartirish kiritmoqchi bo\'lsangiz yozing)' : 'Parol *'}
                </label>
                <input type="password" minLength={8} className="form-input" value={password} onChange={e => setPassword(e.target.value)} required={!editingUser} placeholder="••••••••" />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Rol *</label>
                <select className="form-input" value={role} onChange={e => setRole(e.target.value)} disabled={editingUser?.id === currentUser.id}>
                  <option value="admin">Admin (Barcha huquqlar)</option>
                  <option value="shariat_board">Shariat Kengashi (Tasdiqlash & Rad etish)</option>
                  <option value="auditor">Auditor (Faqat o'qish)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Bank yoki Tashkilot nomi</label>
                <input className="form-input" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="masalan: Aloqabank Islom Darchasi" />
              </div>

              {formError && (
                <div style={{ color: '#FC8181', fontSize: 12, background: 'rgba(245,101,101,0.1)', padding: 10, borderRadius: 8 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Bekor qilish</button>
                <button type="submit" disabled={submitLoading} className="btn btn-primary">
                  {submitLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
