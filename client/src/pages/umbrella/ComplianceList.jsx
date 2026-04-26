import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import AppShell from '@/components/shared/AppShell'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorMessage from '@/components/shared/ErrorMessage'
import { useInvoices } from '@/hooks/useInvoices'
import { useSubmitRti } from '@/hooks/useCompliance'
import { formatCurrency, formatDate, formatDateRange } from '@/utils/formatter'

const RTI_STATUS = {
  PENDING:   { label: 'Pending',   color: 'warning'   },
  SUBMITTED: { label: 'Submitted', color: 'info'      },
  ACCEPTED:  { label: 'Accepted',  color: 'success'   },
  FAILED:    { label: 'Failed',    color: 'error'      },
}

const ComplianceList = () => {
  const [submittingId, setSubmittingId] = useState(null)
  const qc = useQueryClient()

  const { data: invData, isLoading } = useInvoices()
  const { mutate: submitRti, error } = useSubmitRti()

  const allInvoices = invData?.invoices ?? []
  const completed   = allInvoices.filter((i) => i.payroll?.status === 'PAYROLL_COMPLETED')

  const handleSubmitRti = (payrollId) => {
    setSubmittingId(payrollId)
    submitRti(payrollId, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['invoices'], refetchType: 'all' })
        qc.refetchQueries({ queryKey: ['invoices'] })
        setSubmittingId(null)
      },
      onError: () => setSubmittingId(null),
    })
  }

  return (
    <AppShell>
      <PageHeader
        title="Compliance — RTI submissions"
        description="Submit Full Payment Submissions (FPS) to HMRC for completed payroll runs"
      />

      {error && <div className="mb-4"><ErrorMessage error={error} /></div>}

      {isLoading ? <LoadingSpinner /> : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Invoice</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Contractor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Period</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tax year</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Net pay</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">RTI status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {completed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No completed payrolls awaiting RTI submission
                  </td>
                </tr>
              ) : completed.map((inv) => {
                const pr  = inv.payroll
                const con = inv.contractorLink?.contractor
                const rti = pr?.rtiSubmission
                const s   = rti ? (RTI_STATUS[rti.status] ?? { label: rti.status, color: 'secondary' }) : null
                const isSubmitting = submittingId === pr?.id
                const canSubmit    = !rti || rti.status === 'FAILED'

                return (
                  <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {con ? `${con.firstName} ${con.lastName}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {inv.timesheet ? formatDateRange(inv.timesheet.periodStart, inv.timesheet.periodEnd) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{pr?.taxYear ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">
                      {pr ? formatCurrency(pr.netPay, inv.currency) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {s ? (
                        <div>
                          <StatusBadge label={s.label} color={s.color} />
                          {rti?.submittedAt && (
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(rti.submittedAt)}</p>
                          )}
                          {rti?.submissionRef && rti.status === 'ACCEPTED' && (
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{rti.submissionRef}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not submitted</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canSubmit ? (
                        <button
                          onClick={() => handleSubmitRti(pr.id)}
                          disabled={isSubmitting}
                          className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          {isSubmitting
                            ? 'Submitting...'
                            : rti?.status === 'FAILED'
                            ? 'Retry RTI'
                            : 'Submit RTI'}
                        </button>
                      ) : (
                        <span className="text-xs text-green-700 font-medium">✓ Accepted</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  )
}

export default ComplianceList
