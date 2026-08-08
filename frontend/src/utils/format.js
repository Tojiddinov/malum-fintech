export function formatAmount(amount, currency = 'UZS') {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ' + currency
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('uz-UZ', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('uz-UZ', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export const STATUS_LABELS = {
  pending:   'Kutilmoqda',
  reviewing: "Ko'rib chiqilmoqda",
  approved:  'Tasdiqlangan',
  rejected:  'Rad etilgan',
}

export const RISK_LABELS = {
  low:    'Past',
  medium: "O'rta",
  high:   'Yuqori',
}

export const TYPE_LABELS = {
  Murabaha:  'Murabaha',
  Musharaka: 'Musharaka',
}
