import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import AppShell from '@/components/shared/AppShell'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorMessage from '@/components/shared/ErrorMessage'
import { useInvoices, useApproveInvoice, useMarkPaymentPending } from '@/hooks/useInvoices'
import apiClient from '@/api/client'
import { INVOICE_STATUS } from '@/lib/constants'
import { formatCurrency, formatDate, formatDateRange } from '@/utils/formatter'

const FILTERS = ['All', 'INVOICE_GENERATED', 'INVOICE_APPROVED', 'PAYMENT_PENDING', 'PAYMENT_RECEIVED']

const ConfirmModal = ({ title, message, onConfirm, onClose, isPending, confirmLabel = 'Confirm', variant = 'primary' }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-card border rounded-xl p-6 w-full max-w-sm shadow-lg">
      <h2 className="text-base font-semibold mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="border px-4 py-2 rounded-md text-sm hover:bg-muted transition-colors">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isPending}
          className={`px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors ${
            variant === 'primary'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isPending ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </div>
  </div>
)

const InvoiceList = () => {
  const [filter, setFilter]       = useState('All')
  const [approveId, setApproveId] = useState(null)
  const [payId, setPayId]         = useState(null)
  const [simulating, setSimulating] = useState(null)

  const qc = useQueryClient()

  const params = filter === 'All' ? {} : { status: filter }
  const { data, isLoading, error } = useInvoices(params)
  const invoices = data?.invoices ?? []

  const { mutate: approve, isPending: approving } = useApproveInvoice()
  const { mutate: markPay, isPending: marking    } = useMarkPaymentPending()

 const simulatePayment = async (inv) => {
  setSimulating(inv.id)
  try {
    await apiClient.post('/invoices/webhook/payment', {
      paymentReference: inv.invoiceNumber,
      amountReceived:   parseFloat(inv.grossAmount),
      currency:         inv.currency,
      bankSource:       'AGENCY-BANK-SIM',
    })
    await qc.invalidateQueries({ queryKey: ['invoices'], refetchType: 'all' })
    await qc.refetchQueries({ queryKey: ['invoices'] })
  } catch (err) {
    console.error('Payment simulation failed:', err?.response?.data || err.message)
  } finally {
    setSimulating(null)
  }
}

  return (
    <AppShell>
      <PageHeader title="Invoices" description="Review, approve and initiate payments" />

      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            {f === 'All' ? 'All' : (INVOICE_STATUS[f]?.label ?? f)}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : error ? <ErrorMessage error={error} /> : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Invoice</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Contractor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Period</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Due date</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No invoices found
                  </td>
                </tr>
              ) : invoices.map((inv) => {
                const s       = INVOICE_STATUS[inv.status] ?? { label: inv.status, color: 'secondary' }
                const con     = inv.contractorLink?.contractor
                const ts      = inv.timesheet
                const overdue = inv.status !== 'PAYMENT_RECEIVED' && new Date(inv.dueDate) < new Date()

                return (
                  <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {con ? `${con.firstName} ${con.lastName}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {ts ? formatDateRange(ts.periodStart, ts.periodEnd) : '—'}
                    </td>
                    <td className={`px-4 py-3 text-xs ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                      {formatDate(inv.dueDate)}{overdue ? ' · Overdue' : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(inv.grossAmount, inv.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={s.label} color={s.color} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        {inv.status === 'INVOICE_GENERATED' && (
                          <button
                            onClick={() => setApproveId(inv.id)}
                            className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {inv.status === 'INVOICE_APPROVED' && (
                          <button
                            onClick={() => setPayId(inv.id)}
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors"
                          >
                            Mark paid
                          </button>
                        )}
                        {inv.status === 'PAYMENT_PENDING' && (
                          <button
                            onClick={() => simulatePayment(inv)}
                            disabled={simulating === inv.id}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {simulating === inv.id ? 'Processing...' : 'Simulate received'}
                          </button>
                        )}
                        {inv.status === 'PAYMENT_RECEIVED' && (
                          <span className="text-xs text-green-700 font-medium">
                            ✓ Ready for payroll
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {approveId && (
        <ConfirmModal
          title="Approve invoice"
          message="Once approved this invoice will be locked and cannot be modified. The umbrella company will be notified."
          confirmLabel="Approve invoice"
          isPending={approving}
          onClose={() => setApproveId(null)}
          onConfirm={() => approve(approveId, { onSuccess: () => setApproveId(null) })}
        />
      )}

      {payId && (
        <ConfirmModal
          title="Mark payment as sent"
          message="Confirm you have initiated the bank transfer. The system will reconcile on receipt."
          confirmLabel="Confirm payment sent"
          variant="success"
          isPending={marking}
          onClose={() => setPayId(null)}
          onConfirm={() => markPay(payId, { onSuccess: () => setPayId(null) })}
        />
      )}
    </AppShell>
  )
}

export default InvoiceList
