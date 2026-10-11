import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { Compass, LogOut, Map, Plus, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.full_name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const navItem = (to: string, icon: React.ReactNode, label: string) => (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ease-apple",
          isActive
            ? "bg-card text-foreground shadow-apple-xs"
            : "text-muted-foreground hover:text-foreground",
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  )

  const mobileNavItem = (to: string, icon: React.ReactNode, label: string) => (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground shadow-apple-sm"
            : "bg-secondary text-muted-foreground",
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="material-bar sticky top-0 z-40 border-b border-border/60">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-semibold transition-opacity hover:opacity-80"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-[0.7rem] bg-primary text-primary-foreground shadow-apple-sm">
              <Compass className="h-5 w-5" />
            </span>
            <span className="text-[17px] tracking-tight">Travelia</span>
          </Link>

          <nav className="hidden items-center gap-0.5 rounded-full bg-secondary/70 p-1 md:flex">
            {navItem("/", <Map className="h-4 w-4" />, "Mis itinerarios")}
            {navItem(
              "/planning/new",
              <Plus className="h-4 w-4" />,
              "Nueva planificación",
            )}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-full p-0.5 pr-1 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-primary to-primary/85 text-xs font-semibold text-primary-foreground shadow-apple-sm ring-1 ring-inset ring-white/20">
                  {initials ?? "?"}
                </div>
                <span className="hidden text-sm font-medium sm:inline">
                  {user?.full_name}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{user?.full_name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="h-4 w-4" />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/planning/new")}>
                <Plus className="h-4 w-4" />
                Nueva planificación
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => {
                  logout()
                  navigate("/login")
                }}
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="container flex gap-2 overflow-x-auto pb-3 md:hidden">
          {mobileNavItem("/", <Map className="h-4 w-4" />, "Itinerarios")}
          {mobileNavItem("/planning/new", <Plus className="h-4 w-4" />, "Nuevo")}
          {mobileNavItem("/profile", <User className="h-4 w-4" />, "Perfil")}
        </div>
      </header>

      <main className="container py-8 md:py-12">
        <Outlet />
      </main>
    </div>
  )
}
