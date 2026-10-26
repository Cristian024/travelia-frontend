import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/context/AuthContext"
import { Toaster } from "@/components/ui/toaster"
import { ProtectedRoute, PublicOnlyRoute } from "@/components/auth/ProtectedRoute"
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute"
import { AppLayout } from "@/components/layout/AppLayout"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { ItinerariesPage } from "@/pages/ItinerariesPage"
import { ItineraryDetailPage } from "@/pages/ItineraryDetailPage"
import { NewPlanningPage } from "@/pages/NewPlanningPage"
import { PlanningPage } from "@/pages/PlanningPage"
import { AdminDashboard } from "@/pages/admin/AdminDashboard"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<ItinerariesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/planning/new" element={<NewPlanningPage />} />
                <Route path="/planning/:planningId" element={<PlanningPage />} />
                <Route
                  path="/itineraries/:itineraryId"
                  element={<ItineraryDetailPage />}
                />
                <Route element={<AdminProtectedRoute />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
