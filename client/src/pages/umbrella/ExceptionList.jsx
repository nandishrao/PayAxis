import { useState } from 'react'
import AppShell from '@/components/shared/AppShell'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorMessage from '@/components/shared/ErrorMessage'
import { useExceptions, useResolveException, useAssignException } from '@/hooks/useExceptions'
import { EXCEPTION_STATUS } from '@/lib/constants'
import { formatDateTime } from '@/utils/formatter'

const FILTERS = ['All', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'ESCALATED']

const ResolveModal = ({ exception, onClose }) => {
  const [resolution,     setResolution]     = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [isOverride,     setIsOverride]     = useState(false)
  const { mutate: resolve, isPending, error } = useResolveException()

  const canSubmit = resolution.trim() && (!isOverride || overrideReason.trim())

  const handleSubmit = () => {
    resolve(
      { id: exception.id, resolution, ...(isOverride ? { overrideReason } : {}) },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-xl w-full max-w-lg shadow-lg">
        <div className="px-6 py-5 border-b">
          <h2 className="text-base font-semibold">Resolve exception</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{exception.type.replace(/_/g, ' ')}</p>
        </div>

        <div className="px-6 py-4 bg-muted/30 border-b">
          <p className="text-sm">{exception.description}</p>
          <p className="text-xs text-muted-foreground mt-1">Ref: {exception.referenceType} · {exception.referenceId}</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Resolution</label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
              placeholder="Describe how this exception was resolved..."
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isOverride} onChange={(e) => setIsOverride(e.target.checked)} className="rounded" />
            This resolution involves a manual override
          </label>

          {isOverride && (
            <div>
              <label className="text-sm font-medium block mb-1.5">
                Override justification <span className="text-destructive">*</span>
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={2}
                placeholder="Required — stored permanently in the audit log..."
                className="w-full border border-amber-300 rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <p className="text-xs text-amber-700 mt-1">This justification is immutable and permanently recorded.</p>
            </div>
          )}

          {error && <ErrorMessage error={error} />}

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isPending}
              className="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Resolving...' : 'Mark resolved'}
            </button>
            <button onClick={onClose} className="border px-5 py-2 rounded-md text-sm hover:bg-muted transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ExceptionList = () => {
  const [filter, setFilter]       = useState('OPEN')
  const [resolving, setResolving] = useState(null)

  const params = filter === 'All' ? {} : { status: filter }
  const { data, isLoading, error } = useExceptions(params)
  const exceptions = data?.exceptions ?? []

  return (
    <AppShell>
      <PageHeader
        title="Exceptions"
        description="Workflow blocks requiring manual resolution before processing can continue"
      />

      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            {f === 'All' ? 'All' : (EXCEPTION_STATUS[f]?.label ?? f)}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : error ? <ErrorMessage error={error} /> : (
        <div className="space-y-3">
          {exceptions.length === 0 ? (
            <div className="border rounded-xl py-16 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                {filter === 'OPEN' ? 'No open exceptions — system is clear' : 'No exceptions found'}
              </p>
            </div>
          ) : exceptions.map((ex) => {
            const s        = EXCEPTION_STATUS[ex.status] ?? { label: ex.status, color: 'secondary' }
            const canResolve = ['OPEN', 'IN_REVIEW', 'ESCALATED'].includes(ex.status)
            return (
              <div key={ex.id} className="border rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <p className="text-sm font-semibold">{ex.type.replace(/_/g, ' ')}</p>
                      <StatusBadge label={s.label} color={s.color} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{ex.description}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                      <span>Ref: {ex.referenceType} · <span className="font-mono">{ex.referenceId.slice(0, 8)}…</span></span>
                      <span>Raised: {formatDateTime(ex.createdAt)}</span>
                      {ex.assignedTo && <span>Assigned to: {ex.assignedTo.firstName} {ex.assignedTo.lastName}</span>}
                    </div>
                    {ex.resolution && (
                      <div className="mt-3 bg-muted/40 rounded-md px-3 py-2">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Resolution</p>
                        <p className="text-xs">{ex.resolution}</p>
                        {ex.overrideReason && (
                          <p className="text-xs text-amber-700 mt-1">Override: {ex.overrideReason}</p>
                        )}
                      </div>
                    )}
                  </div>
                  {canResolve && (
                    <button
                      onClick={() => setResolving(ex)}
                      className="shrink-0 border border-primary text-primary px-4 py-1.5 rounded-md text-xs font-medium hover:bg-primary/10 transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {resolving && (
        <ResolveModal
          exception={resolving}
          onClose={() => setResolving(null)}
        />
      )}
    </AppShell>
  )
}

export default ExceptionList