import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import type { UserRole } from '../api/users'
import UnauthorizedPage from '../pages/UnauthorizedPage'
import Button from '../components/ui/Button'
import { useAuth } from './AuthContext'

function ProtectedRoute({ allowedRoles, children }: { allowedRoles?: UserRole[]; children?: ReactNode }) {
  const { currentUser, isAuthenticated, isLoading, bootstrapError, retryBootstrap, logout } = useAuth()
  const { pathname } = useLocation()
  if (isLoading) return <p role="status" className="p-8 text-center text-sm text-slate-500">Loading your session...</p>
  if (bootstrapError) return (
    <div className="space-y-4 p-8 text-center">
      <p role="alert" className="text-sm text-red-700">{bootstrapError}</p>
      <div className="flex justify-center gap-3">
        <Button onClick={retryBootstrap}>Retry</Button>
        <Button variant="secondary" onClick={logout}>Return to sign in</Button>
      </div>
    </div>
  )
  if (!isAuthenticated || !currentUser) return <Navigate to="/login" replace />
  if (pathname === '/' && currentUser.role === 'employee') return <Navigate to="/tickets" replace />
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) return <UnauthorizedPage />
  return children ?? <Outlet />
}

export default ProtectedRoute
