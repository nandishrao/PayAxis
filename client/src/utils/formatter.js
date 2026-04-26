export const formatCurrency = (amount, currency = 'GBP') =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)

export const formatDate = (date) => {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(new Date(date))
}

export const formatDateRange = (start, end) => {
  if (!start || !end) return '—'
  return `${formatDate(start)} – ${formatDate(end)}`
}

export const formatDateTime = (date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))

export const formatHours = (hours) => {
  if (!hours) return '0.0h'
  return `${parseFloat(hours).toFixed(1)}h`
}

export const initials = (firstName, lastName) =>
  `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()