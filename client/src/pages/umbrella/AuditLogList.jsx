import { useState } from 'react'
import AppShell from '@/components/shared/AppShell'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorMessage from '@/components/shared/ErrorMessage'
import { useAuditLogs } from '@/hooks/useAuditlogs'
import { formatDateTime } from '@/utils/formatter'

const STATE_COLORS = {
  WORK_SUBMITTED:      'bg-blue-100   text-blue-800',
  WORK_APPROVED:       'bg-green-100  text-green-800',
  WORK_REJECTED:       'bg-red-100    text-red-800',
  INVOICE_GENERATED:   'bg-purple-100 text-purple-800',
  INVOICE_APPROVED:    'bg-indigo-100 text-indigo-800',
  PAYMENT_PENDING:     'bg-yellow-100 text-yellow-800',
  PAYMENT_RECEIVED:    'bg-teal-100   text-teal-800',
  PAYROLL_PROCESSING:  'bg-orange-100 text-orange-800',
  PAYROLL_COMPLETED:   'bg-green-100  text-green-800',
  COMPLIANCE_SUBMITTED:'bg-cyan-100   text-cyan-800',
  COMPLETED:           'bg-gray-100   text-gray-800',
}

const StateChip = ({ state }) => {
  if (!state) return <span className="text-muted-foreground">—</span>
  const color = STATE_COLORS[state] ?? 'bg-gray-100 text-gray-800'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {state.replace(/_/g, ' ')}
    </span>
  )
}

const AuditLogList = () => {
  const [filters, setFilters] = useState({ eventType: '', actorId: '', from: '', to: '' })
  const [applied, setApplied] = useState({})

  const { data, isLoading, error } = useAuditLogs(applied)
  const logs = data?.logs ?? []

  const handleApply = () => setApplied(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v.trim() !== ''))
  )
  const handleClear = () => { setFilters({ eventType: '', actorId: '', from: '', to: '' }); setApplied({}) }

  return (
    <AppShell>
      <PageHeader
        title="Audit log"
        description="Immutable, append-only record of every system action — read only"
      />

      <div className="border rounded-xl p-4 mb-6 space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Filter logs</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Event type</label>
            <input
              value={filters.eventType}
              onChange={(e) => setFilters((f) => ({ ...f, eventType: e.target.value }))}
              placeholder="e.g. TIMESHEET_APPROVED"
              className="w-full border rounded-md px-3 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Actor ID</label>
            <input
              value={filters.actorId}
              onChange={(e) => setFilters((f) => ({ ...f, actorId: e.target.value }))}
              placeholder="User UUID"
              className="w-full border rounded-md px-3 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">From</label>
            <input
              type="datetime-local"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              className="w-full border rounded-md px-3 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">To</label>
            <input
              type="datetime-local"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              className="w-full border rounded-md px-3 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleApply}
            className="bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-xs font-medium hover:bg-primary/90 transition-colors">
            Apply filters
          </button>
          <button onClick={handleClear}
            className="border px-4 py-1.5 rounded-md text-xs hover:bg-muted transition-colors">
            Clear
          </button>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : error ? <ErrorMessage error={error} /> : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Timestamp</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Event</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Actor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Before</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">After</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No audit log entries found</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors align-top">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                      {log.eventType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : '—'}
                    {log.actorRole && (
                      <p className="text-xs opacity-60">{log.actorRole.replace(/_/g, ' ')}</p>
                    )}
                  </td>
                  <td className="px-4 py-3"><StateChip state={log.beforeState} /></td>
                  <td className="px-4 py-3"><StateChip state={log.afterState} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">
                    {log.metadata
                      ? <pre className="text-xs font-mono whitespace-pre-wrap break-all opacity-70">{JSON.stringify(log.metadata, null, 1)}</pre>
                      : '—'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  )
}

export default AuditLogList