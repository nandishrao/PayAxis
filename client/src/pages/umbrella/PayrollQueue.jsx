import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import AppShell from '@/components/shared/AppShell'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorMessage from '@/components/shared/ErrorMessage'
import { useInvoices } from '@/hooks/useInvoices'
import { useRunPayroll } from '@/hooks/usePayroll'
import { PAYROLL_STATUS } from '@/lib/constants'
import { formatCurrency, formatDate, formatDateRange } from '@/utils/formatter'

const payrollSchema = z.object({
  taxCode:         z.string().default('1257L'),
  umbrellaFee:     z.number().min(0).default(30),
  hasPension:      z.boolean().default(false),
  hasStudentLoan:  z.boolean().default(false),
  studentLoanPlan: z.number().int().min(1).max(5).default(1),
})

const RunPayrollModal = ({ invoice, onClose, onSuccess }) => {
  const { mutate: run, isPending, error } = useRunPayroll()
  const { register, handleSubmit, watch } = useForm({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      taxCode: '1257L', umbrellaFee: 30,
      hasPension: false, hasStudentLoan: false, studentLoanPlan: 1,
    },
  })

  const hasStudentLoan = watch('hasStudentLoan')
  const contractor     = invoice.contractorLink?.contractor

  const onSubmit = (options) => {
    run({ invoiceId: invoice.id, options }, {
      onSuccess: () => { onSuccess(); onClose() },
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-xl w-full max-w-lg shadow-lg overflow-y-auto max-h-[90vh]">
        <div className="px-6 py-5 border-b">
          <h2 className="text-base font-semibold">Run payroll</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {contractor ? `${contractor.firstName} ${contractor.lastName}` : '—'} · {invoice.invoiceNumber}
          </p>
        </div>
        <div className="px-6 py-4 bg-muted/30 border-b">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Gross amount</p>
              <p className="font-semibold text-lg">{formatCurrency(invoice.grossAmount, invoice.currency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Pay period</p>
              <p className="font-medium text-xs">
                {invoice.timesheet
                  ? formatDateRange(invoice.timesheet.periodStart, invoice.timesheet.periodEnd)
                  : '—'}
              </p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Tax code</label>
              <input {...register('taxCode')}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Umbrella fee (£)</label>
              <input {...register('umbrellaFee', { valueAsNumber: true })}
                type="number" step="0.01" min="0"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input {...register('hasPension')} type="checkbox" className="rounded" />
              Pension enrolled (5%)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input {...register('hasStudentLoan')} type="checkbox" className="rounded" />
              Student loan
            </label>
          </div>
          {hasStudentLoan && (
            <div>
              <label className="text-sm font-medium block mb-1.5">Student loan plan</label>
              <select {...register('studentLoanPlan', { valueAsNumber: true })}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value={1}>Plan 1</option>
                <option value={2}>Plan 2</option>
                <option value={4}>Plan 4</option>
                <option value={5}>Plan 5</option>
              </select>
            </div>
          )}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-xs text-amber-800 font-medium">
              Payment confirmed received. Payroll will run immediately and a payslip will be generated.
            </p>
          </div>
          {error && <ErrorMessage error={error} />}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending}
              className="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {isPending ? 'Processing payroll...' : 'Run payroll'}
            </button>
            <button type="button" onClick={onClose}
              className="border px-5 py-2 rounded-md text-sm hover:bg-muted transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const PayrollQueue = () => {
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [activeTab, setActiveTab]             = useState('ready')
  const qc = useQueryClient()

  const { data: readyData, isLoading: readyLoading } = useInvoices({ status: 'PAYMENT_RECEIVED' })
  const { data: allData,   isLoading: allLoading   } = useInvoices()

  // Only invoices with PAYMENT_RECEIVED and NO payroll yet
  const readyInvoices = (readyData?.invoices ?? [])
    .filter((i) => !i.payroll)

  // Only invoices that have a payroll record
  const processedInvoices = (allData?.invoices ?? [])
    .filter((i) => !!i.payroll)

  const TABS = [
    { id: 'ready',     label: `Ready for payroll (${readyInvoices.length})`     },
    { id: 'processed', label: `Processed (${processedInvoices.length})`          },
  ]

  const handlePayrollSuccess = () => {
    qc.invalidateQueries({ queryKey: ['invoices'], refetchType: 'all' })
    qc.refetchQueries({ queryKey: ['invoices'] })
    setActiveTab('processed')
  }

  return (
    <AppShell>
      <PageHeader
        title="Payroll queue"
        description="Run payroll for invoices where payment has been confirmed and reconciled"
      />

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === t.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'ready' && (
        readyLoading ? <LoadingSpinner /> : (
          <div className="space-y-3">
            {readyInvoices.length === 0 ? (
              <div className="border rounded-xl py-16 text-center">
                <p className="text-sm font-medium text-muted-foreground">No invoices ready for payroll</p>
                <p className="text-xs text-muted-foreground mt-1">Payments must be received and reconciled first</p>
              </div>
            ) : readyInvoices.map((inv) => {
              const con = inv.contractorLink?.contractor
              const ts  = inv.timesheet
              return (
                <div key={inv.id} className="border rounded-xl p-5 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-semibold">
                        {con ? `${con.firstName} ${con.lastName}` : '—'}
                      </p>
                      <StatusBadge label="Payment received" color="success" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {inv.invoiceNumber}
                      {ts ? ` · ${formatDateRange(ts.periodStart, ts.periodEnd)}` : ''}
                    </p>
                    <p className="text-xl font-bold">{formatCurrency(inv.grossAmount, inv.currency)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
                  >
                    Run payroll
                  </button>
                </div>
              )
            })}
          </div>
        )
      )}

      {activeTab === 'processed' && (
        allLoading ? <LoadingSpinner /> : (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Invoice</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Contractor</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Gross</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Net pay</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Disbursed</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {processedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No processed payrolls yet
                    </td>
                  </tr>
                ) : processedInvoices.map((inv) => {
                  const con = inv.contractorLink?.contractor
                  const pr  = inv.payroll
                  const s   = pr ? (PAYROLL_STATUS[pr.status] ?? { label: pr.status, color: 'secondary' }) : null
                  return (
                    <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {con ? `${con.firstName} ${con.lastName}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(inv.grossAmount, inv.currency)}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-700">
                        {pr ? formatCurrency(pr.netPay, inv.currency) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {s ? <StatusBadge label={s.label} color={s.color} /> : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {pr?.disbursedAt ? formatDate(pr.disbursedAt) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {selectedInvoice && (
        <RunPayrollModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onSuccess={handlePayrollSuccess}
        />
      )}
    </AppShell>
  )
}

export default PayrollQueue
