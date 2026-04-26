import { useState } from 'react'
import AppShell from '@/components/shared/AppShell'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorMessage from '@/components/shared/ErrorMessage'
import { useTimesheets, useApproveTimesheet, useRejectTimesheet } from '@/hooks/useTimesheets'
import { TIMESHEET_STATUS } from '@/lib/constants'
import { formatDateRange, formatDate, formatHours } from '@/utils/formatter'

const FILTERS = ['All', 'WORK_SUBMITTED', 'WORK_APPROVED', 'WORK_REJECTED']

const RejectModal = ({ timesheetId, onClose, onConfirm, isPending }) => {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-card border rounded-xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-base font-semibold mb-1">Reject timesheet</h2>
        <p className="text-sm text-muted-foreground mb-4">A reason is required and will be sent to the contractor.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Enter rejection reason..."
          className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-4"
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose}
            className="border px-4 py-2 rounded-md text-sm hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim() || isPending}
            className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Rejecting...' : 'Confirm reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

const TimesheetReview = () => {
  const [filter, setFilter]       = useState('WORK_SUBMITTED')
  const [rejectId, setRejectId]   = useState(null)

  const params = filter === 'All' ? {} : { status: filter }
  const { data, isLoading, error } = useTimesheets(params)
  const timesheets = Array.isArray(data) ? data : (data?.timesheets ?? [])

  const { mutate: approve, isPending: approving } = useApproveTimesheet()
  const { mutate: reject,  isPending: rejecting } = useRejectTimesheet()

  const handleApprove = (id) => approve(id)
  const handleReject  = (reason) => {
    reject({ id: rejectId, rejectionReason: reason }, { onSuccess: () => setRejectId(null) })
  }

  return (
    <AppShell>
      <PageHeader title="Timesheet review" description="Approve or reject contractor timesheets" />

      <div className="flex gap-2 mb-6">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            {f === 'All' ? 'All' : (TIMESHEET_STATUS[f]?.label ?? f)}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : error ? <ErrorMessage error={error} /> : (
        <div className="space-y-3">
          {timesheets.length === 0
            ? <p className="text-sm text-muted-foreground text-center py-12 border rounded-xl">No timesheets found</p>
            : timesheets.map((ts) => {
              const v          = ts.versions?.[0]
              const contractor = ts.contractorLink?.contractor
              const agency     = ts.contractorLink?.agency
              const s          = TIMESHEET_STATUS[ts.status] ?? { label: ts.status, color: 'secondary' }
              const canAct     = ts.status === 'WORK_SUBMITTED'

              return (
                <div key={ts.id} className="border rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-sm font-semibold">
                          {contractor ? `${contractor.firstName} ${contractor.lastName}` : 'Unknown contractor'}
                        </p>
                        <StatusBadge label={s.label} color={s.color} />
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {formatDateRange(ts.periodStart, ts.periodEnd)} · v{ts.currentVersion}
                        {agency ? ` · ${agency.name}` : ''}
                      </p>

                      {v && (
                        <div className="grid grid-cols-7 gap-2 mb-3">
                          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
                            const keys = ['hoursMonday','hoursTuesday','hoursWednesday','hoursThursday','hoursFriday','hoursSaturday','hoursSunday']
                            const hrs = parseFloat(v[keys[i]] ?? 0)
                            return (
                              <div key={day} className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">{day}</p>
                                <p className={`text-sm font-medium ${hrs > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {hrs.toFixed(1)}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold">
                          Total: {v ? formatHours(v.totalHours) : '—'}
                        </span>
                        {v?.notes && (
                          <span className="text-xs text-muted-foreground italic">"{v.notes}"</span>
                        )}
                      </div>

                      {v?.rejectionReason && (
                        <p className="text-xs text-destructive mt-2">
                          Rejection reason: {v.rejectionReason}
                        </p>
                      )}
                    </div>

                    {canAct && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(ts.id)}
                          disabled={approving}
                          className="bg-green-600 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectId(ts.id)}
                          className="border border-destructive text-destructive px-4 py-1.5 rounded-md text-xs font-medium hover:bg-destructive/10 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          }
        </div>
      )}

      {rejectId && (
        <RejectModal
          timesheetId={rejectId}
          onClose={() => setRejectId(null)}
          onConfirm={handleReject}
          isPending={rejecting}
        />
      )}
    </AppShell>
  )
}

export default TimesheetReview
