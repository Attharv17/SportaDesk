import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ManagerRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'manager') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
