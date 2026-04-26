import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const RoleGuard = ({ allowedRoles }) => {
  const getRole = useAuthStore((s) => s.getRole)
  const role    = getRole()

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export default RoleGuard