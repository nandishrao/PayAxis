import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useLogout, useMe } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const navByRole = {
  CONTRACTOR: [
    { label: 'Dashboard',  to: '/contractor/dashboard'  },
    { label: 'Timesheets', to: '/contractor/timesheets' },
    { label: 'Payslips',   to: '/contractor/payslips'   },
  ],
  AGENCY_ADMIN: [
    { label: 'Dashboard',   to: '/agency/dashboard'   },
    { label: 'Timesheets',  to: '/agency/timesheets'  },
    { label: 'Invoices',    to: '/agency/invoices'    },
    { label: 'Contractors', to: '/agency/contractors' },
  ],
  AGENCY_CONSULTANT: [
    { label: 'Dashboard',  to: '/agency/dashboard'  },
    { label: 'Timesheets', to: '/agency/timesheets' },
    { label: 'Invoices',   to: '/agency/invoices'   },
  ],
  UMBRELLA_ADMIN: [
    { label: 'Dashboard',     to: '/umbrella/dashboard'     },
    { label: 'Payroll',       to: '/umbrella/payroll'       },
    { label: 'Compliance',    to: '/umbrella/compliance'    },
    { label: 'Exceptions',    to: '/umbrella/exceptions'    },
    { label: 'Audit log',     to: '/umbrella/audit-logs'    },
    { label: 'Organisations', to: '/umbrella/organisations' },
  ],
  PAYROLL_OPERATOR: [
    { label: 'Dashboard',  to: '/umbrella/dashboard'  },
    { label: 'Payroll',    to: '/umbrella/payroll'    },
    { label: 'Compliance', to: '/umbrella/compliance' },
    { label: 'Exceptions', to: '/umbrella/exceptions' },
  ],
  PLATFORM_ADMIN: [
    { label: 'Dashboard',     to: '/umbrella/dashboard'     },
    { label: 'Payroll',       to: '/umbrella/payroll'       },
    { label: 'Exceptions',    to: '/umbrella/exceptions'    },
    { label: 'Audit log',     to: '/umbrella/audit-logs'    },
    { label: 'Organisations', to: '/umbrella/organisations' },
  ],
}

const AppShell = ({ children }) => {
  // Refetch full user profile on every AppShell mount
  // This ensures memberships with organisationId are always fresh
  const { isLoading } = useMe()

  const { user, getRole } = useAuthStore()
  const logout   = useLogout()
  const location = useLocation()
  const role     = getRole()
  const navItems = navByRole[role] ?? []

  // Show nothing while user profile is loading to avoid empty renders
  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-56 border-r flex flex-col py-6 px-3 shrink-0">
        <div className="px-3 mb-8">
          <span className="text-sm font-semibold text-foreground">Agentic Umbrella</span>
          <p className="text-xs text-muted-foreground mt-0.5">{role?.replace(/_/g, ' ')}</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center px-3 py-2 rounded-md text-sm transition-colors',
                location.pathname === item.to
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 pt-4 border-t">
          <p className="text-xs font-medium text-foreground truncate">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-muted-foreground truncate mb-3">{user?.email}</p>
          <button
            onClick={logout}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}

export default AppShell
