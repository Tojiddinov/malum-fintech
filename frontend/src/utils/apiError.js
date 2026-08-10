export function getApiError(error, fallback = 'Xato yuz berdi') {
  if (!error?.response) {
    return "Server bilan aloqa o'rnatilmadi"
  }

  const detail = error.response.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => item?.msg).filter(Boolean)
    if (messages.length) return messages.join('; ')
  }
  return fallback
}
