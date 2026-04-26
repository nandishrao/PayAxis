import { Link } from 'react-router-dom'
import AppShell from '@/components/shared/AppShell'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useInvoices } from '@/hooks/useInvoices'
import { useExceptions } from '@/hooks/useExceptions'
import { EXCEPTION_STATUS } from '@/lib/constants'
import { formatCurrency } from '@/utils/formatter'
import { useAuthStore } from '@/store/authStore'

const StatCard = ({ label, value, color, to }) => {
  const inner = (
    <div className={`bg-muted/40 rounded-lg p-4 border transition-colors ${to ? 'hover:border-primary/40 cursor-pointer' : ''}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color ?? ''}`}>{value}</p>
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

const UmbrellaDashboard = () => {
  const user = useAuthStore((s) => s.user)

  const { data: invData,   isLoading: invLoading  } = useInvoices()
  const { data: excData,   isLoading: excLoading  } = useExceptions({ status: 'OPEN' })

  const invoices   = invData?.invoices   ?? []
  const exceptions = excData?.exceptions ?? []

  // Ready = PAYMENT_RECEIVED with no payroll yet
  const readyForPayroll = invoices.filter((i) => i.status === 'PAYMENT_RECEIVED' && !i.payroll)

  // RTI due = payroll completed but no rtiSubmission
  const pendingRti = invoices.filter(
    (i) => i.payroll?.status === 'PAYROLL_COMPLETED' && !i.payroll?.rtiSubmission
  )

  const totalProcessed = invoices.filter((i) => !!i.payroll).length
  const openExceptions = exceptions.length

  return (
    <AppShell>
      <PageHeader
        title="Umbrella dashboard"
        description="Payroll queue, compliance status and exception overview"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Ready for payroll"
          value={readyForPayroll.length}
          color={readyForPayroll.length > 0 ? 'text-primary' : ''}
          to="/umbrella/payroll"
        />
        <StatCard
          label="Open exceptions"
          value={openExceptions}
          color={openExceptions > 0 ? 'text-destructive' : ''}
          to="/umbrella/exceptions"
        />
        <StatCard
          label="RTI submissions due"
          value={pendingRti.length}
          color={pendingRti.length > 0 ? 'text-amber-600' : ''}
          to="/umbrella/compliance"
        />
        <StatCard
          label="Payrolls processed"
          value={totalProcessed}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium">Payroll queue</h2>
            <Link to="/umbrella/payroll" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {invLoading ? <LoadingSpinner /> : readyForPayroll.length === 0
            ? <p className="text-sm text-muted-foreground text-center py-4">No invoices ready for payroll</p>
            : (
              <div className="space-y-3">
                {readyForPayroll.slice(0, 6).map((inv) => {
                  const con = inv.contractorLink?.contractor
                  return (
                    <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">
                          {con ? `${con.firstName} ${con.lastName}` : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">{inv.invoiceNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(inv.grossAmount, inv.currency)}</p>
                        <StatusBadge label="Ready" color="success" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>

        <div className="border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium">Open exceptions</h2>
            <Link to="/umbrella/exceptions" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {excLoading ? <LoadingSpinner /> : exceptions.length === 0
            ? <p className="text-sm text-muted-foreground text-center py-4">No open exceptions</p>
            : (
              <div className="space-y-3">
                {exceptions.slice(0, 6).map((ex) => {
                  const s = EXCEPTION_STATUS[ex.status] ?? { label: ex.status, color: 'secondary' }
                  return (
                    <div key={ex.id} className="flex items-start justify-between py-2 border-b last:border-0 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ex.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground truncate">{ex.description}</p>
                      </div>
                      <StatusBadge label={s.label} color={s.color} />
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>
      </div>
    </AppShell>
  )
}

export default UmbrellaDashboard
