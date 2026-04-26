/**
 * Generates a human-readable, unique invoice number.
 * Format: INV-YYYYMM-XXXXXX (e.g. INV-202506-A3F9K2)
 */
export const generateInvoiceNumber = () => {
  const now    = new Date()
  const year   = now.getFullYear()
  const month  = String(now.getMonth() + 1).padStart(2, '0')
  const random = Math.random().toString(36).toUpperCase().slice(2, 8)
  return `INV-${year}${month}-${random}`
}