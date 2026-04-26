import prisma from '../config/prisma.js'

// ── Notification event map ────────────────────
// Maps event types to recipient roles and message templates

const NOTIFICATION_TEMPLATES = {
  TIMESHEET_SUBMITTED: {
    title: 'New timesheet submitted',
    body:  (meta) => `A timesheet has been submitted for the period ${meta.periodStart} to ${meta.periodEnd}.`,
  },
  TIMESHEET_APPROVED: {
    title: 'Timesheet approved',
    body:  (meta) => `Your timesheet for period ${meta.periodStart} to ${meta.periodEnd} has been approved.`,
  },
  TIMESHEET_REJECTED: {
    title: 'Timesheet rejected',
    body:  (meta) => `Your timesheet was rejected. Reason: ${meta.rejectionReason}`,
  },
  INVOICE_GENERATED: {
    title: 'New invoice generated',
    body:  (meta) => `Invoice ${meta.invoiceNumber} for £${meta.grossAmount} has been generated and is awaiting your approval.`,
  },
  INVOICE_APPROVED: {
    title: 'Invoice approved',
    body:  (meta) => `Invoice ${meta.invoiceNumber} has been approved. Please initiate payment.`,
  },
  PAYMENT_RECEIVED: {
    title: 'Payment received',
    body:  (meta) => `Payment for invoice ${meta.invoiceNumber} has been received and reconciled.`,
  },
  PAYROLL_COMPLETED: {
    title: 'Payroll processed',
    body:  (meta) => `Your payslip for £${meta.netPay} net pay is now available.`,
  },
  COMPLIANCE_SUBMITTED: {
    title: 'HMRC submission complete',
    body:  (meta) => `RTI submission for tax year ${meta.taxYear} has been accepted by HMRC. Reference: ${meta.hmrcReference}`,
  },
  EXCEPTION_RAISED: {
    title: 'Action required — exception raised',
    body:  (meta) => `An exception has been raised: ${meta.title}. Please review and resolve.`,
  },
}

// ── Core dispatcher ───────────────────────────

export const dispatchNotification = async ({ userIds, eventType, metadata = {}, channel = 'IN_APP' }) => {
  if (!userIds?.length) return

  const template = NOTIFICATION_TEMPLATES[eventType]
  if (!template) {
    console.warn(`[Notifications] No template found for event: ${eventType}`)
    return
  }

  const title = template.title
  const body  = template.body(metadata)

  // Create all notification records in one batch
  // Failures must never block the main workflow — fire and forget with error logging
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        channel,
        eventType,
        title,
        body,
        metadata,
        status: 'PENDING',
      })),
      skipDuplicates: true,
    })

    // Mark as sent immediately (in production: queue for email delivery via SES/SendGrid)
    await prisma.notification.updateMany({
      where: { userId: { in: userIds }, eventType, status: 'PENDING' },
      data:  { status: 'SENT', sentAt: new Date() },
    })
  } catch (err) {
    // Non-blocking — log and continue
    console.error('[Notifications] Failed to dispatch:', err.message, { eventType, userIds })
  }
}

// ── Convenience wrappers per event ────────────

export const notifyTimesheetSubmitted = (agencyUserIds, meta) =>
  dispatchNotification({ userIds: agencyUserIds, eventType: 'TIMESHEET_SUBMITTED', metadata: meta })

export const notifyTimesheetApproved = (contractorId, meta) =>
  dispatchNotification({ userIds: [contractorId], eventType: 'TIMESHEET_APPROVED', metadata: meta })

export const notifyTimesheetRejected = (contractorId, meta) =>
  dispatchNotification({ userIds: [contractorId], eventType: 'TIMESHEET_REJECTED', metadata: meta })

export const notifyInvoiceGenerated = (agencyUserIds, meta) =>
  dispatchNotification({ userIds: agencyUserIds, eventType: 'INVOICE_GENERATED', metadata: meta })

export const notifyInvoiceApproved = (umbrellaUserIds, meta) =>
  dispatchNotification({ userIds: umbrellaUserIds, eventType: 'INVOICE_APPROVED', metadata: meta })

export const notifyPaymentReceived = (umbrellaUserIds, meta) =>
  dispatchNotification({ userIds: umbrellaUserIds, eventType: 'PAYMENT_RECEIVED', metadata: meta })

export const notifyPayrollCompleted = (contractorId, meta) =>
  dispatchNotification({ userIds: [contractorId], eventType: 'PAYROLL_COMPLETED', metadata: meta })

export const notifyComplianceSubmitted = (umbrellaUserIds, meta) =>
  dispatchNotification({ userIds: umbrellaUserIds, eventType: 'COMPLIANCE_SUBMITTED', metadata: meta })

export const notifyExceptionRaised = (adminUserIds, meta) =>
  dispatchNotification({ userIds: adminUserIds, eventType: 'EXCEPTION_RAISED', metadata: meta })

// ── Queries ───────────────────────────────────

export const getMyNotifications = async (userId, { unreadOnly = false } = {}) => {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly && { status: 'PENDING' }),
    },
    orderBy: { createdAt: 'desc' },
    take:    50,
  })
}