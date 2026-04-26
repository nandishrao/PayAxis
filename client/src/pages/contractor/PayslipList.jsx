import { Link } from 'react-router-dom'
import AppShell from '@/components/shared/AppShell'
import PageHeader from '@/components/shared/PageHeader'
import DataTable from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorMessage from '@/components/shared/ErrorMessage'
import StatCard from '@/components/shared/StatCard'
import { useMyPayslips } from '@/hooks/usepayslip'
import { PAYROLL_STATUS } from '@/lib/constants'
import { formatCurrency, formatDate, formatDateRange } from '@/utils/formatter'

const PayslipList = () => {
  const { data, isLoading, error } = useMyPayslips()

  const payslips = data?.payslips || []
  const totalNet   = payslips.reduce((s, p) => s + parseFloat(p.netPay   || 0), 0)
  const totalGross = payslips.reduce((s, p) => s + parseFloat(p.grossPay || 0), 0)

  const columns = [
    {
      key:    'payslipNumber',
      label:  'Reference',
      render: (row) => (
        <Link to={`/contractor/payslips/${row.id}`} className="text-primary hover:underline font-mono text-xs">
          {row.payslipNumber}
        </Link>
      ),
    },
    {
      key:    'period',
      label:  'Period',
      render: (row) => formatDateRange(row.periodStart, row.periodEnd),
    },
    {
      key:    'grossPay',
      label:  'Gross pay',
      render: (row) => formatCurrency(row.grossPay),
    },
    {
      key:    'netPay',
      label:  'Net pay',
      render: (row) => <span className="font-medium">{formatCurrency(row.netPay)}</span>,
    },
    {
      key:    'paymentDate',
      label:  'Payment date',
      render: (row) => formatDate(row.paymentDate),
    },
    {
      key:    'taxYear',
      label:  'Tax year',
      render: (row) => row.taxYear,
    },
  ]

  return (
    <AppShell>
      <PageHeader title="Payslips" description="Your full payment history and payslip archive." />

      {isLoading && <LoadingSpinner />}
      {error     && <ErrorMessage error={error} />}

      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard label="Total payslips"     value={payslips.length} />
            <StatCard label="Total gross earned" value={formatCurrency(totalGross)} />
            <StatCard label="Total net earned"   value={formatCurrency(totalNet)} />
          </div>
          <DataTable
            columns={columns}
            rows={payslips}
            emptyMessage="No payslips yet. Payslips are generated after payroll is processed."
          />
        </>
      )}
    </AppShell>
  )
}

export default PayslipList