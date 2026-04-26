/*
  Warnings:

  - You are about to drop the column `contractorId` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `lockVersion` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `ratePerHour` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `totalHours` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `amountExpected` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `amountReceived` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `bankSource` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `isMismatch` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `isReconciled` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `paidAt` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `reconciledAt` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the `payment_exceptions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `contractorLinkId` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grossAmount` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMatchStatus" AS ENUM ('MATCHED', 'MISMATCHED', 'UNRECOGNISED');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('PAYROLL_PROCESSING', 'PAYROLL_COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "payment_exceptions" DROP CONSTRAINT "payment_exceptions_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "payment_exceptions" DROP CONSTRAINT "payment_exceptions_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_invoiceId_fkey";

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "contractorId",
DROP COLUMN "lockVersion",
DROP COLUMN "ratePerHour",
DROP COLUMN "subtotal",
DROP COLUMN "totalHours",
ADD COLUMN     "contractorLinkId" TEXT NOT NULL,
ADD COLUMN     "grossAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "paidAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "amountExpected",
DROP COLUMN "amountReceived",
DROP COLUMN "bankSource",
DROP COLUMN "isMismatch",
DROP COLUMN "isReconciled",
DROP COLUMN "paidAt",
DROP COLUMN "reconciledAt",
ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "exceptionNote" TEXT,
ADD COLUMN     "exceptionRaised" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "matchStatus" "PaymentMatchStatus" NOT NULL DEFAULT 'UNRECOGNISED',
ADD COLUMN     "matchedAt" TIMESTAMP(3),
ADD COLUMN     "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "senderAccountRef" TEXT,
ALTER COLUMN "invoiceId" DROP NOT NULL;

-- DropTable
DROP TABLE "payment_exceptions";

-- DropEnum
DROP TYPE "PaymentExceptionStatus";

-- CreateTable
CREATE TABLE "payrolls" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "umbrellaId" TEXT NOT NULL,
    "grossPay" DECIMAL(10,2) NOT NULL,
    "incomeTax" DECIMAL(10,2) NOT NULL,
    "employeeNI" DECIMAL(10,2) NOT NULL,
    "employerNI" DECIMAL(10,2) NOT NULL,
    "umbrellaFee" DECIMAL(10,2) NOT NULL,
    "pensionContribution" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "studentLoanRepayment" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(10,2) NOT NULL,
    "taxCode" TEXT NOT NULL DEFAULT '1257L',
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "status" "PayrollStatus" NOT NULL DEFAULT 'PAYROLL_PROCESSING',
    "taxYear" TEXT NOT NULL,
    "payPeriodStart" TIMESTAMP(3) NOT NULL,
    "payPeriodEnd" TIMESTAMP(3) NOT NULL,
    "disbursedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "payslipNumber" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "grossPay" DECIMAL(10,2) NOT NULL,
    "incomeTax" DECIMAL(10,2) NOT NULL,
    "employeeNI" DECIMAL(10,2) NOT NULL,
    "employerNI" DECIMAL(10,2) NOT NULL,
    "umbrellaFee" DECIMAL(10,2) NOT NULL,
    "pensionContribution" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "studentLoanRepayment" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(10,2) NOT NULL,
    "taxCode" TEXT NOT NULL,
    "taxYear" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_invoiceId_key" ON "payrolls"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_payrollId_key" ON "payslips"("payrollId");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_payslipNumber_key" ON "payslips"("payslipNumber");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contractorLinkId_fkey" FOREIGN KEY ("contractorLinkId") REFERENCES "contractor_links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "payrolls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
