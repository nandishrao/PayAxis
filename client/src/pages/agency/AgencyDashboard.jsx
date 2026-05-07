import { Link } from 'react-router-dom'
import AppShell from '@/components/shared/AppShell'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useTimesheets } from '@/hooks/useTimeSheets'
import { useInvoices } from '@/hooks/useInvoices'
import { useAuthStore } from '@/store/authStore'
import { TIMESHEET_STATUS, INVOICE_STATUS } from '@/lib/constants'
import { formatCurrency, formatDateRange, formatDate } from '@/utils/formatter'

const StatCard = ({ label, value, sub, color }) => (
  <div className="bg-muted/40 rounded-lg p-4 border">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className={`text-2xl font-semibold ${color ?? ''}`}>{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
)

const AgencyDashboard = () => {
  const user = useAuthStore((s) => s.user)
  const { data: tsData, isLoading: tsLoading } = useTimesheets()
  const { data: invData, isLoading: invLoading } = useInvoices()

const timesheets = Array.isArray(tsData) ? tsData : (tsData?.timesheets ?? [])
const invoices = Array.isArray(invData) ? invData : (invData?.invoices ?? [])

  const pendingTs   = timesheets.filter((t) => t.status === 'WORK_SUBMITTED').length
  const pendingInv  = invoices.filter((i) => i.status === 'INVOICE_GENERATED').length
  const awaitingPay = invoices.filter((i) => i.status === 'INVOICE_APPROVED').length
  const totalOwed   = invoices
    .filter((i) => ['INVOICE_GENERATED','INVOICE_APPROVED','PAYMENT_PENDING'].includes(i.status))
    .reduce((s, i) => s + parseFloat(i.grossAmount), 0)

  return (
    <AppShell>
      <PageHeader
        title={`Agency dashboard`}
        description="Pending approvals and invoice pipeline"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Timesheets to review" value={pendingTs}   color={pendingTs   > 0 ? 'text-amber-600' : ''} />
        <StatCard label="Invoices to approve"  value={pendingInv}  color={pendingInv  > 0 ? 'text-amber-600' : ''} />
        <StatCard label="Awaiting payment"     value={awaitingPay} color={awaitingPay > 0 ? 'text-blue-600'  : ''} />
        <StatCard label="Total outstanding"    value={formatCurrency(totalOwed)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium">Timesheets awaiting review</h2>
            <Link to="/agency/timesheets" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {tsLoading ? <LoadingSpinner /> : (
            <div className="space-y-3">
              {timesheets.filter((t) => t.status === 'WORK_SUBMITTED').slice(0, 6).length === 0
                ? <p className="text-sm text-muted-foreground text-center py-4">All caught up</p>
                : timesheets.filter((t) => t.status === 'WORK_SUBMITTED').slice(0, 6).map((ts) => {
                  const v = ts.versions?.[0]
                  const contractor = ts.contractorLink?.contractor
                  return (
                    <Link key={ts.id} to="/agency/timesheets"
                      className="flex items-center justify-between py-2 border-b last:border-0 hover:opacity-70 transition-opacity"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {contractor ? `${contractor.firstName} ${contractor.lastName}` : 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDateRange(ts.periodStart, ts.periodEnd)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{v ? `${parseFloat(v.totalHours).toFixed(1)}h` : '—'}</p>
                        <StatusBadge label="Submitted" color="warning" />
                      </div>
                    </Link>
                  )
                })
              }
            </div>
          )}
        </div>

        <div className="border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium">Invoice pipeline</h2>
            <Link to="/agency/invoices" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {invLoading ? <LoadingSpinner /> : (
            <div className="space-y-3">
              {invoices.slice(0, 6).length === 0
                ? <p className="text-sm text-muted-foreground text-center py-4">No invoices yet</p>
                : invoices.slice(0, 6).map((inv) => {
                  const s = INVOICE_STATUS[inv.status] ?? { label: inv.status, color: 'secondary' }
                  return (
                    <Link key={inv.id} to="/agency/invoices"
                      className="flex items-center justify-between py-2 border-b last:border-0 hover:opacity-70 transition-opacity"
                    >
                      <div>
                        <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">Due {formatDate(inv.dueDate)}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-sm font-medium">{formatCurrency(inv.grossAmount, inv.currency)}</span>
                        <StatusBadge label={s.label} color={s.color} />
                      </div>
                    </Link>
                  )
                })
              }
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

export default AgencyDashboard