import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  if (!user) return <Navigate to="/login" replace />

  switch (user.role) {
    case 'organizer':
      return <Navigate to="/organizer/dashboard" replace />
    case 'manager':
      return <Navigate to="/manager/dashboard" replace />
    case 'player':
      return <Navigate to="/player/dashboard" replace />
    default:
      return <Navigate to="/login" replace />
  }
}
