/*
  Warnings:

  - The values [OTHER] on the enum `ExceptionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isManualOverride` on the `exceptions` table. All the data in the column will be lost.
  - You are about to drop the column `overrideJustification` on the `exceptions` table. All the data in the column will be lost.
  - You are about to drop the column `relatedEntityId` on the `exceptions` table. All the data in the column will be lost.
  - You are about to drop the column `relatedEntityType` on the `exceptions` table. All the data in the column will be lost.
  - You are about to drop the column `resolutionNote` on the `exceptions` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `exceptions` table. All the data in the column will be lost.
  - You are about to drop the column `channel` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `failReason` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `failedAt` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `niNumber` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `taxCode` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `compliance_submissions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `referenceId` to the `exceptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referenceType` to the `exceptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RtiSubmissionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'ACCEPTED', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "ExceptionType_new" AS ENUM ('PAYMENT_MISMATCH', 'INVALID_TAX_CODE', 'MISSING_NI_NUMBER', 'PAYROLL_OUT_OF_RANGE', 'HMRC_SUBMISSION_FAILED', 'UNRECOGNISED_PAYMENT', 'MANUAL_OVERRIDE');
ALTER TABLE "exceptions" ALTER COLUMN "type" TYPE "ExceptionType_new" USING ("type"::text::"ExceptionType_new");
ALTER TYPE "ExceptionType" RENAME TO "ExceptionType_old";
ALTER TYPE "ExceptionType_new" RENAME TO "ExceptionType";
DROP TYPE "ExceptionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "compliance_submissions" DROP CONSTRAINT "compliance_submissions_payrollId_fkey";

-- DropForeignKey
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_organisationId_fkey";

-- AlterTable
ALTER TABLE "exceptions" DROP COLUMN "isManualOverride",
DROP COLUMN "overrideJustification",
DROP COLUMN "relatedEntityId",
DROP COLUMN "relatedEntityType",
DROP COLUMN "resolutionNote",
DROP COLUMN "title",
ADD COLUMN     "overrideReason" TEXT,
ADD COLUMN     "referenceId" TEXT NOT NULL,
ADD COLUMN     "referenceType" TEXT NOT NULL,
ADD COLUMN     "resolution" TEXT;

-- AlterTable
ALTER TABLE "memberships" ALTER COLUMN "organisationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "channel",
DROP COLUMN "failReason",
DROP COLUMN "failedAt",
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "niNumber",
DROP COLUMN "taxCode";

-- DropTable
DROP TABLE "compliance_submissions";

-- DropEnum
DROP TYPE "ComplianceSubmissionStatus";

-- DropEnum
DROP TYPE "NotificationChannel";

-- CreateTable
CREATE TABLE "rti_submissions" (
    "id" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "umbrellaId" TEXT NOT NULL,
    "submissionRef" TEXT NOT NULL,
    "taxYear" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "RtiSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rti_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rti_submissions_payrollId_key" ON "rti_submissions"("payrollId");

-- CreateIndex
CREATE UNIQUE INDEX "rti_submissions_submissionRef_key" ON "rti_submissions"("submissionRef");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rti_submissions" ADD CONSTRAINT "rti_submissions_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "payrolls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
