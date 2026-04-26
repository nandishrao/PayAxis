export const ROLES = {
  PLATFORM_ADMIN:     'PLATFORM_ADMIN',
  AGENCY_ADMIN:       'AGENCY_ADMIN',
  AGENCY_CONSULTANT:  'AGENCY_CONSULTANT',
  UMBRELLA_ADMIN:     'UMBRELLA_ADMIN',
  PAYROLL_OPERATOR:   'PAYROLL_OPERATOR',
  CONTRACTOR:         'CONTRACTOR',
}

export const ROLE_PORTALS = {
  PLATFORM_ADMIN:    '/umbrella/dashboard',
  AGENCY_ADMIN:      '/agency/dashboard',
  AGENCY_CONSULTANT: '/agency/dashboard',
  UMBRELLA_ADMIN:    '/umbrella/dashboard',
  PAYROLL_OPERATOR:  '/umbrella/dashboard',
  CONTRACTOR:        '/contractor/dashboard',
}

export const TIMESHEET_STATUS = {
  DRAFT:          { label: 'Draft',     color: 'secondary' },
  WORK_SUBMITTED: { label: 'Submitted', color: 'warning'   },
  WORK_APPROVED:  { label: 'Approved',  color: 'success'   },
  WORK_REJECTED:  { label: 'Rejected',  color: 'error'     },
}

export const INVOICE_STATUS = {
  INVOICE_GENERATED: { label: 'Generated', color: 'secondary' },
  INVOICE_APPROVED:  { label: 'Approved',  color: 'info'      },
  PAYMENT_PENDING:   { label: 'Pending',   color: 'warning'   },
  PAYMENT_RECEIVED:  { label: 'Received',  color: 'success'   },
}

export const PAYROLL_STATUS = {
  PAYROLL_PROCESSING: { label: 'Processing', color: 'warning' },
  PAYROLL_COMPLETED:  { label: 'Completed',  color: 'success' },
  FAILED:             { label: 'Failed',     color: 'error'   },
}

export const EXCEPTION_STATUS = {
  OPEN:       { label: 'Open',       color: 'error'   },
  IN_REVIEW:  { label: 'In review',  color: 'warning' },
  RESOLVED:   { label: 'Resolved',   color: 'success' },
  ESCALATED:  { label: 'Escalated',  color: 'error'   },
}