import { z } from 'zod'

export const runPayrollSchema = z.object({
  taxCode:         z.string().default('1257L'),
  umbrellaFee:     z.number().min(0).default(30),
  hasPension:      z.boolean().default(false),
  hasStudentLoan:  z.boolean().default(false),
  studentLoanPlan: z.number().int().min(1).max(5).default(1),
})