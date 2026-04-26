import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import AppShell from '@/components/shared/AppShell'
import PageHeader from '@/components/shared/PageHeader'
import ErrorMessage from '@/components/shared/ErrorMessage'
import { useSubmitTimesheet } from '@/hooks/useTimesheets'
import { useAuthStore } from '@/store/authStore'

const hoursField = z.coerce.number().min(0).max(24)

const schema = z.object({
  contractorLinkId: z.string().uuid('Select a valid contractor link'),
  periodStart:      z.string().min(1, 'Start date required'),
  periodEnd:        z.string().min(1, 'End date required'),
  hours: z.object({
    hoursMonday:    hoursField,
    hoursTuesday:   hoursField,
    hoursWednesday: hoursField,
    hoursThursday:  hoursField,
    hoursFriday:    hoursField,
    hoursSaturday:  hoursField,
    hoursSunday:    hoursField,
  }),
  notes: z.string().max(1000).optional(),
})

const DAYS = [
  { key: 'hoursMonday',    label: 'Monday'    },
  { key: 'hoursTuesday',   label: 'Tuesday'   },
  { key: 'hoursWednesday', label: 'Wednesday' },
  { key: 'hoursThursday',  label: 'Thursday'  },
  { key: 'hoursFriday',    label: 'Friday'    },
  { key: 'hoursSaturday',  label: 'Saturday'  },
  { key: 'hoursSunday',    label: 'Sunday'    },
]

const TimesheetSubmit = () => {
  const navigate  = useNavigate()
  const user      = useAuthStore((s) => s.user)
  const links     = user?.contractorLinks ?? []

  const { mutate: submit, isPending, error } = useSubmitTimesheet()

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      hours: {
        hoursMonday: 0, hoursTuesday: 0, hoursWednesday: 0,
        hoursThursday: 0, hoursFriday: 0, hoursSaturday: 0, hoursSunday: 0,
      },
    },
  })

  const watchedHours = watch('hours')
  const total = Object.values(watchedHours || {}).reduce((s, v) => s + (parseFloat(v) || 0), 0)

 const onSubmit = (values) => {
  const payload = {
    ...values,
    periodStart: new Date(values.periodStart).toISOString(),
    periodEnd:   new Date(values.periodEnd).toISOString(),
  }
  submit(payload, {
    onSuccess: () => navigate('/contractor/timesheets'),
  })
}

  return (
    <AppShell>
      <PageHeader title="Submit timesheet" description="Enter your hours for the week." />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-medium">Assignment</h2>
            <div>
              <label className="text-sm font-medium block mb-1.5">Contractor link</label>
              <select
                {...register('contractorLinkId')}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select assignment...</option>
                {links.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.agency?.name} — £{parseFloat(l.agreedRatePerHour).toFixed(2)}/hr
                  </option>
                ))}
              </select>
              {errors.contractorLinkId && (
                <p className="text-xs text-destructive mt-1">{errors.contractorLinkId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Period start</label>
                <input
                  type="datetime-local"
                  {...register('periodStart')}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {errors.periodStart && (
                  <p className="text-xs text-destructive mt-1">{errors.periodStart.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Period end</label>
                <input
                  type="datetime-local"
                  {...register('periodEnd')}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {errors.periodEnd && (
                  <p className="text-xs text-destructive mt-1">{errors.periodEnd.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Hours worked</h2>
              <span className="text-sm font-semibold text-primary">{total.toFixed(1)}h total</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {DAYS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-sm text-muted-foreground w-24 shrink-0">{label}</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    {...register(`hours.${key}`)}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <label className="text-sm font-medium block mb-1.5">Notes (optional)</label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Any notes for the approver..."
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {error && <ErrorMessage error={error} />}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="bg-primary text-primary-foreground text-sm px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Submitting...' : 'Submit timesheet'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/contractor/timesheets')}
              className="border text-sm px-6 py-2 rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}

export default TimesheetSubmit