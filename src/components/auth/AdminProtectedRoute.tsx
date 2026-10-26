import { Navigate, Outlet, useLocation } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export function AdminProtectedRoute() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
