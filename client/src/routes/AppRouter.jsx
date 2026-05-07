import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import RoleGuard from './RoleGuard'

// Public pages
import LandingPage from '@/pages/public/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import Unauthorized from '@/pages/auth/Unauthorized'

// Contractor
import ContractorDashboard from '@/pages/contractor/ContractorDashboard'
import TimesheetList from '@/pages/contractor/TimeSheetList'
import TimesheetSubmit from '@/pages/contractor/TimesheetSubmit'
import PayslipList from '@/pages/contractor/PayslipList'
import PayslipDetail from '@/pages/contractor/PayslipDetail'

// Agency
import AgencyDashboard from '@/pages/agency/AgencyDashboard'
import TimesheetReview from '@/pages/agency/TimesheetReview'
import InvoiceList from '@/pages/agency/InvoiceList'
import ContractorManagement from '@/pages/agency/ContractorManagement'

// Umbrella / Admin
import UmbrellaDashboard from '@/pages/umbrella/UmbrellaDashboard'
import PayrollQueue from '@/pages/umbrella/PayrollQueue'
import ComplianceList from '@/pages/umbrella/ComplianceList'
import ExceptionList from '@/pages/umbrella/ExceptionList'
import AuditLogList from '@/pages/umbrella/AuditLogList'
import OrganisationList from '@/pages/umbrella/OrganisationList'

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/unauthorized', element: <Unauthorized /> },

  // Contractor portal
  {
    element: <ProtectedRoute />,
    children: [{
      element: <RoleGuard allowedRoles={['CONTRACTOR']} />,
      children: [
        { path: '/contractor/dashboard', element: <ContractorDashboard /> },
        { path: '/contractor/timesheets', element: <TimesheetList /> },
        { path: '/contractor/timesheets/new', element: <TimesheetSubmit /> },
        { path: '/contractor/payslips', element: <PayslipList /> },
        { path: '/contractor/payslips/:id', element: <PayslipDetail /> },
      ],
    }],
  },

  // Agency portal
  {
    element: <ProtectedRoute />,
    children: [{
      element: <RoleGuard allowedRoles={['AGENCY_ADMIN', 'AGENCY_CONSULTANT']} />,
      children: [
        { path: '/agency/dashboard', element: <AgencyDashboard /> },
        { path: '/agency/timesheets', element: <TimesheetReview /> },
        { path: '/agency/invoices', element: <InvoiceList /> },
        { path: '/agency/contractors', element: <ContractorManagement /> },
      ],
    }],
  },

  // Umbrella / Admin portal
  {
    element: <ProtectedRoute />,
    children: [{
      element: <RoleGuard allowedRoles={['UMBRELLA_ADMIN', 'PAYROLL_OPERATOR', 'PLATFORM_ADMIN']} />,
      children: [
        { path: '/umbrella/dashboard', element: <UmbrellaDashboard /> },
        { path: '/umbrella/payroll', element: <PayrollQueue /> },
        { path: '/umbrella/compliance', element: <ComplianceList /> },
        { path: '/umbrella/exceptions', element: <ExceptionList /> },
        { path: '/umbrella/audit-logs', element: <AuditLogList /> },
        { path: '/umbrella/organisations', element: <OrganisationList /> },
      ],
    }],
  },
])

const AppRouter = () => <RouterProvider router={router} />

export default AppRouter