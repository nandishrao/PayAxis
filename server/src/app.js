import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { errorHandler } from './middlewares/errorHandler.js'
import healthRoutes       from './routes/healthRoutes.js'
import authRoutes         from './routes/authRoutes.js'
import organisationRoutes from './routes/organizationRoutes.js'
import timesheetRoutes    from './routes/timesheetRoutes.js'
import invoiceRoutes      from './routes/invoiceRoutes.js'
import payrollRoutes      from './routes/payrollRoutes.js'
import complianceRoutes   from './routes/complianceRoutes.js'
import exceptionRoutes    from './routes/exceptionRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import auditLogRoutes     from './routes/auditlogRoutes.js'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

app.use('/api/health',        healthRoutes)
app.use('/api/auth',          authRoutes)
app.use('/api/organisations', organisationRoutes)
app.use('/api/timesheets',    timesheetRoutes)
app.use('/api/invoices',      invoiceRoutes)
app.use('/api/payroll',       payrollRoutes)
app.use('/api/compliance',    complianceRoutes)
app.use('/api/exceptions',    exceptionRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/audit-logs',    auditLogRoutes)

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` })
})

app.use(errorHandler)

export default app