import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"
import type { TokenResponse } from "@/types/api"

const BASE_URL = "https://traveliaapp-bzaaabhuc8g2ech5.mexicocentral-01.azurewebsites.net"

const ACCESS_KEY = "travelia.access_token"
const REFRESH_KEY = "travelia.refresh_token"

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (tokens: TokenResponse) => {
    localStorage.setItem(ACCESS_KEY, tokens.access_token)
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refresh = tokenStorage.getRefresh()
  if (!refresh) throw new Error("No refresh token")
  const res = await axios.post<TokenResponse>(`${BASE_URL}/api/v1/auth/refresh`, {
    refresh_token: refresh,
  })
  tokenStorage.set(res.data)
  return res.data.access_token
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/")
    ) {
      original._retry = true
      try {
        if (!refreshPromise) refreshPromise = refreshAccessToken()
        const newToken = await refreshPromise
        refreshPromise = null
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (err) {
        refreshPromise = null
        tokenStorage.clear()
        if (window.location.pathname !== "/login") {
          window.location.href = "/login"
        }
        return Promise.reject(err)
      }
    }
    return Promise.reject(error)
  },
)

export function apiErrorMessage(err: unknown, fallback = "Ha ocurrido un error"): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { detail?: unknown } | undefined
    const detail = data?.detail
    if (typeof detail === "string") return detail
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string }
      if (first?.msg) return first.msg
    }
    if (err.message) return err.message
  }
  return fallback
}
