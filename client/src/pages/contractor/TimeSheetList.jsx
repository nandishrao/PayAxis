import { Link } from 'react-router-dom'
import AppShell from '@/components/shared/AppShell'
import PageHeader from '@/components/shared/PageHeader'
import DataTable from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorMessage from '@/components/shared/ErrorMessage'
import { useTimesheets } from '@/hooks/useTimeSheets'
import { TIMESHEET_STATUS } from '@/lib/constants'
import { formatDateRange } from '@/utils/formatter'

const columns = [
  {
    key:    'period',
    label:  'Period',
    render: (row) => formatDateRange(row.periodStart, row.periodEnd),
  },
  {
    key:    'hours',
    label:  'Total hours',
    render: (row) => {
      const v = row.versions?.[0]
      return v ? `${parseFloat(v.totalHours).toFixed(1)}h` : '—'
    },
  },
  {
    key:    'version',
    label:  'Version',
    render: (row) => `v${row.currentVersion}`,
  },
  {
    key:    'status',
    label:  'Status',
    render: (row) => {
      const s = TIMESHEET_STATUS[row.status]
      return <StatusBadge label={s?.label} color={s?.color} />
    },
  },
  {
    key:    'rejection',
    label:  'Rejection reason',
    render: (row) => {
      const v = row.versions?.[0]
      return v?.rejectionReason
        ? <span className="text-xs text-destructive">{v.rejectionReason}</span>
        : '—'
    },
  },
]

const TimesheetList = () => {
const { data, isLoading, error } = useTimesheets()
const timesheets = data?.timesheets || []
  return (
    <AppShell>
      <PageHeader
        title="My timesheets"
        description="All timesheet submissions and their current status."
        action={
          <Link
            to="/contractor/timesheets/new"
            className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Submit new
          </Link>
        }
      />
      {isLoading && <LoadingSpinner />}
      {error   && <ErrorMessage error={error} />}
      {!isLoading && !error && (
        <DataTable
          columns={columns}
          rows={timesheets}
          emptyMessage="You have not submitted any timesheets yet."
        />
      )}
    </AppShell>
  )
}

export default TimesheetList