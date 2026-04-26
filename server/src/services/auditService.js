import prisma from '../config/prisma.js'

/**
 * Central audit log writer.
 * Called by every service on every state transition or significant event.
 * No update or delete operations exist for this model — ever.
 */
export const createAuditLog = async ({
  actorId        = null,
  actorRole      = null,
  organisationId = null,
  eventType,
  workRecordId   = null,
  beforeState    = null,
  afterState     = null,
  metadata       = null,
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        actorRole,
        organisationId,
        eventType,
        workRecordId,
        beforeState,
        afterState,
        metadata,
      },
    })
  } catch (err) {
    // Audit log failure must never crash the main workflow.
    // Log to stderr and continue — the exception queue (Phase 6) will catch persistent failures.
    console.error('[AuditLog] Failed to write audit entry:', err.message, { eventType, actorId })
  }
}