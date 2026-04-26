import { useParams, Link } from 'react-router-dom'
import AppShell from '@/components/shared/AppShell'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorMessage from '@/components/shared/ErrorMessage'
import { usePayslip } from '@/hooks/usepayslip'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate, formatDateRange } from '@/utils/formatter'

const Row = ({ label, value, bold }) => (
  <div className={`flex justify-between py-2 border-b last:border-0 text-sm ${bold ? 'font-medium' : ''}`}>
    <span className={bold ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    <span className="text-foreground">{value}</span>
  </div>
)

const PayslipDetail = () => {
  const { id }    = useParams()
  const user      = useAuthStore((s) => s.user)
  const { data: payslip, isLoading, error } = usePayslip(id)

  return (
    <AppShell>
      <PageHeader
        title="Payslip"
        description={payslip ? `Reference: ${payslip.payslipNumber}` : ''}
        action={
          <Link to="/contractor/payslips" className="border text-sm px-4 py-2 rounded-md hover:bg-muted transition-colors">
            Back to payslips
          </Link>
        }
      />

      {isLoading && <LoadingSpinner />}
      {error     && <ErrorMessage error={error} />}

      {payslip && (
        <div className="max-w-lg space-y-6">

          <div className="border rounded-lg p-6">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">Employee</h2>
            <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>Tax code: <span className="text-foreground font-mono">{payslip.taxCode}</span></span>
              <span>Tax year: <span className="text-foreground">{payslip.taxYear}</span></span>
              <span>Period: <span className="text-foreground">{formatDateRange(payslip.periodStart, payslip.periodEnd)}</span></span>
              <span>Payment date: <span className="text-foreground">{formatDate(payslip.paymentDate)}</span></span>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">Earnings</h2>
            <Row label="Gross pay" value={formatCurrency(payslip.grossPay)} bold />
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">Deductions</h2>
            <Row label="Income tax (PAYE)"      value={`-${formatCurrency(payslip.incomeTax)}`} />
            <Row label="Employee NI"            value={`-${formatCurrency(payslip.employeeNI)}`} />
            <Row label="Umbrella fee"           value={`-${formatCurrency(payslip.umbrellaFee)}`} />
            {parseFloat(payslip.pensionContribution)  > 0 && (
              <Row label="Pension contribution" value={`-${formatCurrency(payslip.pensionContribution)}`} />
            )}
            {parseFloat(payslip.studentLoanRepayment) > 0 && (
              <Row label="Student loan"         value={`-${formatCurrency(payslip.studentLoanRepayment)}`} />
            )}
          </div>

          <div className="border rounded-lg p-6 bg-primary/5">
            <Row label="Net pay" value={formatCurrency(payslip.netPay)} bold />
          </div>

        </div>
      )}
    </AppShell>
  )
}

export default PayslipDetail