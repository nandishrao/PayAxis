import { Link } from 'react-router-dom'
import AppShell from '@/components/shared/AppShell'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useTimesheets } from '@/hooks/useTimesheets'
import { useMyPayslips } from '@/hooks/usepayslip'
import { useNotifications } from '@/hooks/useNotification'
import { useAuthStore } from '@/store/authStore'
import { TIMESHEET_STATUS } from '@/lib/constants'
import { formatCurrency, formatDateRange, formatDate } from '@/utils/formatter'

const StatCard = ({ label, value, sub }) => (
  <div className="bg-muted/40 rounded-lg p-4 border">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="text-2xl font-semibold">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
)

const ContractorDashboard = () => {
  const user = useAuthStore((s) => s.user)
  const { data: tsData, isLoading: tsLoading } = useTimesheets()
  const { data: psData, isLoading: psLoading } = useMyPayslips()
  const { data: notifData } = useNotifications({ unreadOnly: true })

  const timesheets = tsData?.timesheets ?? []
  const payslips   = psData?.payslips   ?? []
  const unread     = notifData?.notifications?.length ?? 0
  const pendingCount = timesheets.filter((t) => t.status === 'WORK_SUBMITTED').length

  return (
    <AppShell>
      <PageHeader
        title={`Welcome back, ${user?.firstName}`}
        description="Here's an overview of your contractor activity"
        action={
          <Link
            to="/contractor/timesheets/new"
            className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Submit timesheet
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total timesheets"      value={timesheets.length} />
        <StatCard label="Awaiting approval"     value={pendingCount} />
        <StatCard label="Total payslips"        value={payslips.length} />
        <StatCard label="Unread notifications"  value={unread} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium">Recent timesheets</h2>
            <Link to="/contractor/timesheets" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {tsLoading ? <LoadingSpinner /> : timesheets.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No timesheets yet</p>
          ) : (
            <div className="space-y-3">
              {timesheets.slice(0, 5).map((ts) => {
                const s = TIMESHEET_STATUS[ts.status] ?? { label: ts.status, color: 'secondary' }
                const v = ts.versions?.[0]
                return (
                  <div key={ts.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{formatDateRange(ts.periodStart, ts.periodEnd)}</p>
                      {v && <p className="text-xs text-muted-foreground">{parseFloat(v.totalHours).toFixed(1)}h</p>}
                    </div>
                    <StatusBadge label={s.label} color={s.color} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium">Recent payslips</h2>
            <Link to="/contractor/payslips" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {psLoading ? <LoadingSpinner /> : payslips.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No payslips yet</p>
          ) : (
            <div className="space-y-3">
              {payslips.slice(0, 5).map((ps) => (
                <Link key={ps.id} to={`/contractor/payslips/${ps.id}`}
                  className="flex items-center justify-between py-2 border-b last:border-0 hover:opacity-70 transition-opacity"
                >
                  <div>
                    <p className="text-sm font-medium">{ps.payslipNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(ps.paymentDate)}</p>
                  </div>
                  <span className="text-sm font-medium text-green-700">
                    {formatCurrency(ps.netPay, ps.currency)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

export default ContractorDashboard
