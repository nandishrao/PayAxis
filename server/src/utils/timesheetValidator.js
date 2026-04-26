import { z } from 'zod'

const hoursField = z
  .union([z.string(), z.number()])
  .transform((v) => parseFloat(v) || 0)
  .pipe(z.number().min(0).max(24))

export const submitTimesheetSchema = z.object({
  contractorLinkId: z.string().uuid('Invalid contractor link ID.'),
  periodStart:      z.string().min(1, 'Period start is required.'),
  periodEnd:        z.string().min(1, 'Period end is required.'),
  hours: z.object({
    hoursMonday:    hoursField.default(0),
    hoursTuesday:   hoursField.default(0),
    hoursWednesday: hoursField.default(0),
    hoursThursday:  hoursField.default(0),
    hoursFriday:    hoursField.default(0),
    hoursSaturday:  hoursField.default(0),
    hoursSunday:    hoursField.default(0),
  }),
  notes: z.string().max(1000).optional(),
})

export const approveTimesheetSchema = z.object({
  timesheetId: z.string().uuid('Invalid timesheet ID.'),
})

export const rejectTimesheetSchema = z.object({
  timesheetId:     z.string().uuid('Invalid timesheet ID.'),
  rejectionReason: z.string().min(1, 'Rejection reason is required.').max(1000),
})