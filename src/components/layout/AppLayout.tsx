import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { Compass, LogOut, Map, Plus, User } from "lucide-react"
import { Button } from "@/components/ui/button"
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
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  )

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Compass className="h-6 w-6 text-primary" />
            <span className="text-lg">Travelia</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItem("/", <Map className="h-4 w-4" />, "Mis itinerarios")}
            {navItem(
              "/planning/new",
              <Plus className="h-4 w-4" />,
              "Nueva planificación",
            )}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {initials ?? "?"}
                </div>
                <span className="hidden text-sm font-medium sm:inline">
                  {user?.full_name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{user?.full_name}</span>
                  <span className="text-xs text-muted-foreground">
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
        <div className="container flex gap-1 overflow-x-auto pb-2 md:hidden">
          {navItem("/", <Map className="h-4 w-4" />, "Itinerarios")}
          {navItem("/planning/new", <Plus className="h-4 w-4" />, "Nuevo")}
          {navItem("/profile", <User className="h-4 w-4" />, "Perfil")}
        </div>
      </header>

      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  )
}
