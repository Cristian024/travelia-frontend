import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { tokenStorage } from "@/lib/api"
import { usersApi, authApi } from "@/lib/endpoints"
import type { LoginRequest, RegisterRequest, UserResponse } from "@/types/api"

interface AuthContextValue {
  user: UserResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (body: LoginRequest) => Promise<void>
  register: (body: RegisterRequest) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const [hasToken, setHasToken] = useState<boolean>(() => !!tokenStorage.getAccess())

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["me"],
    queryFn: usersApi.me,
    enabled: hasToken,
    retry: false,
    staleTime: 60_000,
  })

  useEffect(() => {
    const onStorage = () => setHasToken(!!tokenStorage.getAccess())
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const login = async (body: LoginRequest) => {
    const tokens = await authApi.login(body)
    tokenStorage.set(tokens)
    setHasToken(true)
    await refetch()
  }

  const register = async (body: RegisterRequest) => {
    const tokens = await authApi.register(body)
    tokenStorage.set(tokens)
    setHasToken(true)
    await refetch()
  }

  const logout = () => {
    tokenStorage.clear()
    setHasToken(false)
    qc.clear()
  }

  const refreshUser = async () => {
    await refetch()
  }

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: hasToken && isLoading,
        isAuthenticated: hasToken && !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
