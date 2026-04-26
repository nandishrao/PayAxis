import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const ProtectedRoute = () => {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

export default ProtectedRoute