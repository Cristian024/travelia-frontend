import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { adminApi } from "@/lib/endpoints"
import { formatDate } from "@/lib/utils"
import type { PaymentStatus } from "@/types/api"

const statusBadge: Record<
  PaymentStatus,
  { label: string; variant: "default" | "secondary" | "success" | "destructive" }
> = {
  APPROVED: { label: "Aprobado", variant: "success" },
  PENDING: { label: "Pendiente", variant: "secondary" },
  DECLINED: { label: "Rechazado", variant: "destructive" },
  VOIDED: { label: "Anulado", variant: "destructive" },
  ERROR: { label: "Error", variant: "destructive" },
}

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100)

export function PaymentsTab() {
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "payments", page],
    queryFn: () => adminApi.payments.list(page, 20),
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
          No se pudieron cargar los pagos.
        </CardContent>
      </Card>
    )
  }

  if (data && data.items.length === 0) {
    return (
      <Card className="border-dashed bg-transparent shadow-none">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CreditCard className="h-7 w-7" />
          </div>
          <p className="text-sm text-muted-foreground">
            Todavía no hay transacciones registradas.
          </p>
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
                <th className="px-5 py-3 font-medium">Referencia</th>
                <th className="px-5 py-3 font-medium">Monto</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Transacción</th>
                <th className="px-5 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((p) => {
                const status = statusBadge[p.status]
                return (
                  <tr key={p.id} className="border-b border-border/40 last:border-0">
                    <td className="px-5 py-3.5 font-mono text-xs">{p.reference}</td>
                    <td className="px-5 py-3.5 font-medium tabular-nums">
                      {money(p.amount_in_cents, p.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                      {p.transaction_id ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {formatDate(p.created_at)}
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
