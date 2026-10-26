import { useMutation, useQuery } from "@tanstack/react-query"
import { Check, Crown, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { subscriptionsApi, paymentsApi } from "@/lib/endpoints"
import { openWompiCheckout, type WompiTransaction } from "@/lib/wompi"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { apiErrorMessage } from "@/lib/api"

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100)

const statusLabel: Record<string, string> = {
  APPROVED: "aprobado",
  PENDING: "pendiente",
  DECLINED: "rechazado",
  VOIDED: "anulado",
  ERROR: "con error",
}

export function SubscriptionPlans() {
  const { subscription, refreshSubscription } = useAuth()
  const { toast } = useToast()

  const { data: plans, isLoading, isError } = useQuery({
    queryKey: ["plans"],
    queryFn: subscriptionsApi.plans,
  })

  const isPremium = subscription?.subscription_type === "PREMIUM"

  const checkoutMutation = useMutation({
    mutationFn: async (): Promise<WompiTransaction> => {
      const checkout = await paymentsApi.checkout()
      return openWompiCheckout(checkout)
    },
    onSuccess: async (transaction) => {
      if (transaction?.status === "APPROVED") {
        toast({
          title: "¡Pago aprobado!",
          description: "Tu suscripción Premium está activa.",
        })
        await refreshSubscription()
      } else {
        const label = statusLabel[transaction?.status] ?? transaction?.status
        toast({
          variant: "destructive",
          title: `Pago ${label ?? "no completado"}`,
          description: "No se activó la suscripción. Puedes intentarlo de nuevo.",
        })
      }
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "No se pudo iniciar el pago",
        description: apiErrorMessage(err),
      }),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-10 text-center text-sm text-destructive">
          No se pudieron cargar los planes disponibles.
        </CardContent>
      </Card>
    )
  }

  const activePlans = plans?.filter((p) => p.is_active) ?? []

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {activePlans.map((plan) => (
        <Card
          key={plan.id}
          className="flex flex-col overflow-hidden border-primary/20 bg-gradient-to-b from-primary/5 to-transparent"
        >
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Crown className="h-5 w-5 text-primary" />
                {plan.name}
              </CardTitle>
              <Badge variant="default">{plan.code}</Badge>
            </div>
            <CardDescription>
              Acceso por {plan.duration_days} días
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            <div className="text-3xl font-semibold tracking-tight">
              {money(plan.amount_in_cents, plan.currency)}
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Planificaciones ilimitadas",
                "Más días y destinos por viaje",
                "Exportación a PDF y equipaje con IA",
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  {benefit}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={isPremium || checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate()}
            >
              {checkoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isPremium ? "Ya eres Premium" : "Suscribirme"}
            </Button>
          </CardFooter>
        </Card>
      ))}

      {activePlans.length === 0 && (
        <Card className="border-dashed bg-transparent shadow-none sm:col-span-2">
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            No hay planes disponibles por ahora.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
