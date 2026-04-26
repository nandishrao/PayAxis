-- CreateEnum
CREATE TYPE "TimesheetStatus" AS ENUM ('DRAFT', 'WORK_SUBMITTED', 'WORK_APPROVED', 'WORK_REJECTED');

-- CreateTable
CREATE TABLE "timesheets" (
    "id" TEXT NOT NULL,
    "contractorLinkId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "TimesheetStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "lockVersion" INTEGER NOT NULL DEFAULT 1,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timesheet_versions" (
    "id" TEXT NOT NULL,
    "timesheetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "hoursMonday" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "hoursTuesday" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "hoursWednesday" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "hoursThursday" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "hoursFriday" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "hoursSaturday" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "hoursSunday" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "totalHours" DECIMAL(6,2) NOT NULL,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timesheet_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "timesheet_versions_timesheetId_version_key" ON "timesheet_versions"("timesheetId", "version");

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_contractorLinkId_fkey" FOREIGN KEY ("contractorLinkId") REFERENCES "contractor_links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet_versions" ADD CONSTRAINT "timesheet_versions_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "timesheets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
