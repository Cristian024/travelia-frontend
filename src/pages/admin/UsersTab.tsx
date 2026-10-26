import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Loader2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { adminApi } from "@/lib/endpoints"
import { useToast } from "@/hooks/use-toast"
import { apiErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import type { UserRole } from "@/types/api"

export function UsersTab() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "users", page],
    queryFn: () => adminApi.users.list(page, 20),
  })

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      adminApi.users.updateRole(userId, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] })
      toast({ title: "Rol actualizado" })
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "No se pudo cambiar el rol",
        description: apiErrorMessage(err),
      }),
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-10 text-center text-sm text-destructive">
          No se pudieron cargar los usuarios.
        </CardContent>
      </Card>
    )
  }

  if (data && data.items.length === 0) {
    return (
      <Card className="border-dashed bg-transparent shadow-none">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="h-7 w-7" />
          </div>
          <p className="text-sm text-muted-foreground">No hay usuarios registrados.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-apple-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Usuario</th>
                <th className="px-5 py-3 font-medium">Suscripción</th>
                <th className="px-5 py-3 font-medium">Premium desde</th>
                <th className="px-5 py-3 font-medium">Registro</th>
                <th className="px-5 py-3 font-medium">Rol</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((u) => {
                const isPending =
                  roleMutation.isPending &&
                  roleMutation.variables?.userId === u.id
                const isPremium = u.subscription_type === "PREMIUM"
                return (
                  <tr key={u.id} className="border-b border-border/40 last:border-0">
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-medium">{u.full_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {u.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={isPremium ? "success" : "secondary"}>
                        {u.subscription_type}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {u.premium_since ? formatDate(u.premium_since) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Select
                          value={u.role}
                          disabled={isPending}
                          onValueChange={(role) =>
                            roleMutation.mutate({
                              userId: u.id,
                              role: role as UserRole,
                            })
                          }
                        >
                          <SelectTrigger className="h-9 w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">Usuario</SelectItem>
                            <SelectItem value="ADMIN">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                        {isPending && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {data.page} de {data.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.total_pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
