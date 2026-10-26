import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarDays, Crown, Loader2, Mail, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/context/AuthContext"
import { subscriptionsApi, usersApi } from "@/lib/endpoints"
import { useToast } from "@/hooks/use-toast"
import { apiErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans"
import type { SubscriptionType } from "@/types/api"

const schema = z.object({
  full_name: z.string().min(2, "Ingresa tu nombre"),
  birth_date: z.string().min(1, "Selecciona tu fecha de nacimiento"),
  country_of_residence: z.string().min(2, "Ingresa tu país"),
  phone: z.string().optional(),
  preferred_language: z.string().min(2),
})

type FormValues = z.infer<typeof schema>

const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
  { value: "fr", label: "Français" },
]

export function ProfilePage() {
  const { user, subscription, refreshUser, refreshSubscription } = useAuth()
  const { toast } = useToast()
  const qc = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: user?.full_name ?? "",
      birth_date: user?.birth_date ?? "",
      country_of_residence: user?.country_of_residence ?? "",
      phone: user?.phone ?? "",
      preferred_language: user?.preferred_language ?? "es",
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name,
        birth_date: user.birth_date,
        country_of_residence: user.country_of_residence,
        phone: user.phone ?? "",
        preferred_language: user.preferred_language,
      })
    }
  }, [user, reset])

  const [serverError, setServerError] = useState<string | null>(null)
  const language = watch("preferred_language")

  const mutation = useMutation({
    mutationFn: usersApi.update,
    onSuccess: async () => {
      await refreshUser()
      await qc.invalidateQueries({ queryKey: ["me"] })
      toast({ title: "Perfil actualizado" })
      setServerError(null)
    },
    onError: (err) =>
      setServerError(apiErrorMessage(err, "No se pudo actualizar el perfil")),
  })

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      ...values,
      phone: values.phone?.trim() ? values.phone : null,
    })
  }

  const subscriptionMutation = useMutation({
    mutationFn: (subscription_type: SubscriptionType) =>
      subscriptionsApi.change({ subscription_type }),
    onSuccess: async (data) => {
      await refreshSubscription()
      qc.setQueryData(["subscription"], data)
      toast({
        title: "Suscripción actualizada",
        description:
          data.subscription_type === "PREMIUM"
            ? "Ahora eres usuario Premium."
            : "Volviste al plan Free.",
      })
    },
    onError: (err) =>
      toast({
        title: "No se pudo cambiar el plan",
        description: apiErrorMessage(err, "Inténtalo de nuevo más tarde"),
        variant: "destructive",
      }),
  })

  if (!user) return null

  const initials = user.full_name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const isPremium = subscription?.subscription_type === "PREMIUM"
  const limit = subscription?.monthly_planning_limit ?? null
  const used = subscription?.monthly_plannings_used ?? 0
  const usagePct = limit ? Math.min(100, (used / limit) * 100) : 0

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="animate-fade-up space-y-1.5">
        <h1 className="text-[30px] font-semibold leading-tight tracking-tight sm:text-[34px]">
          Mi perfil
        </h1>
        <p className="text-[15px] text-muted-foreground">
          Revisa y actualiza tu información personal
        </p>
      </div>

      <Card className="animate-fade-up animate-delay-1">
        <CardContent className="flex items-center gap-4 p-6 sm:p-7">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-b from-primary to-primary/85 text-xl font-semibold text-primary-foreground shadow-apple-sm">
            {initials}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="truncate text-lg font-semibold tracking-tight">
              {user.full_name}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Miembro desde {formatDate(user.created_at)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-up animate-delay-2">
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-xl">
              Suscripción
              <Badge variant={isPremium ? "success" : "secondary"}>
                {isPremium ? (
                  <Crown className="h-3 w-3" />
                ) : null}
                {subscription?.subscription_type ?? "FREE"}
              </Badge>
            </CardTitle>
            <CardDescription>
              {isPremium
                ? "Disfrutas de planificaciones ilimitadas y más días por viaje."
                : "Plan gratuito con límite mensual de planificaciones."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Planificaciones este mes
              </span>
              <span className="font-medium tabular-nums">
                {limit === null ? `${used} / ∞` : `${used} / ${limit}`}
              </span>
            </div>
            <Progress value={limit === null ? 0 : usagePct} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-secondary/60 p-4">
              <div className="text-xs text-muted-foreground">
                Días máximos por viaje
              </div>
              <div className="mt-1 text-lg font-semibold tabular-nums">
                {subscription?.max_total_days ?? "—"}
              </div>
            </div>
            <div className="rounded-2xl bg-secondary/60 p-4">
              <div className="text-xs text-muted-foreground">
                Destinos máximos
              </div>
              <div className="mt-1 text-lg font-semibold tabular-nums">
                {subscription?.max_destinations ?? "—"}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end pt-0">
          {isPremium ? (
            <Button
              variant="outline"
              disabled={subscriptionMutation.isPending}
              onClick={() => subscriptionMutation.mutate("FREE")}
            >
              {subscriptionMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Volver a Free
            </Button>
          ) : (
            <Button
              onClick={() =>
                document
                  .getElementById("subscription-plans")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              <Crown className="h-4 w-4" />
              Ver planes Premium
            </Button>
          )}
        </CardFooter>
      </Card>

      <section
        id="subscription-plans"
        className="animate-fade-up animate-delay-2 space-y-4 scroll-mt-24"
      >
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            Planes disponibles
          </h2>
          <p className="text-sm text-muted-foreground">
            Paga de forma segura con Wompi y activa Premium al instante.
          </p>
        </div>
        <SubscriptionPlans />
      </section>

      <Card className="animate-fade-up animate-delay-2">
        <CardHeader>
          <CardTitle className="text-xl">Datos personales</CardTitle>
          <CardDescription>
            Actualiza tu información cuando quieras. El correo no se puede
            modificar desde aquí.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name" className="text-[13px] text-muted-foreground">
                Nombre completo
              </Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && (
                <p className="text-xs text-destructive">{errors.full_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date" className="text-[13px] text-muted-foreground">
                Fecha de nacimiento
              </Label>
              <Input id="birth_date" type="date" {...register("birth_date")} />
              {errors.birth_date && (
                <p className="text-xs text-destructive">{errors.birth_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="country_of_residence"
                className="text-[13px] text-muted-foreground"
              >
                País de residencia
              </Label>
              <Input
                id="country_of_residence"
                {...register("country_of_residence")}
              />
              {errors.country_of_residence && (
                <p className="text-xs text-destructive">
                  {errors.country_of_residence.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[13px] text-muted-foreground">
                Teléfono
              </Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] text-muted-foreground">
                Idioma preferido
              </Label>
              <Select
                value={language}
                onValueChange={(v) =>
                  setValue("preferred_language", v, { shouldDirty: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Idioma" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {serverError && (
              <p className="text-sm text-destructive sm:col-span-2">{serverError}</p>
            )}
          </CardContent>
          <Separator />
          <CardFooter className="justify-end pt-6">
            <Button
              type="submit"
              disabled={!isDirty || mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar cambios
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
