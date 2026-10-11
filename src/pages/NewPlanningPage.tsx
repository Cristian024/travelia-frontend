import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { Compass, Crown, Loader2, Sparkles, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Checkbox } from "@/components/ui/checkbox"
import { planningApi } from "@/lib/endpoints"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { apiErrorMessage } from "@/lib/api"
import type { BudgetRange, TravelPurpose } from "@/types/api"

function addDays(dateStr: string, days: number): string | undefined {
  if (!dateStr) return undefined
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return undefined
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function diffDays(from: string, to: string): number | null {
  if (!from || !to) return null
  const a = new Date(`${from}T00:00:00`)
  const b = new Date(`${to}T00:00:00`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

const schema = z
  .object({
    destination_country: z.string().min(2, "Ingresa el país de destino"),
    destination_city: z.string().optional(),
    arrival_date: z.string().min(1, "Selecciona la fecha de llegada"),
    departure_date: z.string().min(1, "Selecciona la fecha de salida"),
    number_of_travelers: z.coerce
      .number()
      .int()
      .min(1, "Al menos 1 viajero"),
    budget_range: z.enum(["economic", "moderate", "luxury"]),
    travel_purpose: z.enum([
      "leisure",
      "adventure",
      "rest",
      "business",
      "cultural",
      "gastronomic",
      "romantic",
      "family",
    ]),
    has_children: z.boolean().default(false),
    special_requirements: z.string().optional(),
  })
  .refine(
    (data) => new Date(data.departure_date) > new Date(data.arrival_date),
    {
      message: "La salida debe ser posterior a la llegada",
      path: ["departure_date"],
    },
  )

type FormValues = z.infer<typeof schema>

const BUDGETS: { value: BudgetRange; label: string; hint: string }[] = [
  { value: "economic", label: "Económico", hint: "Ajustado, lo esencial" },
  { value: "moderate", label: "Moderado", hint: "Balance entre precio y calidad" },
  { value: "luxury", label: "Lujo", hint: "Experiencias premium" },
]

const PURPOSES: { value: TravelPurpose; label: string }[] = [
  { value: "leisure", label: "Ocio" },
  { value: "adventure", label: "Aventura" },
  { value: "rest", label: "Descanso" },
  { value: "business", label: "Negocios" },
  { value: "cultural", label: "Cultural" },
  { value: "gastronomic", label: "Gastronómico" },
  { value: "romantic", label: "Romántico" },
  { value: "family", label: "Familiar" },
]

export function NewPlanningPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { subscription } = useAuth()
  const [hasChildren, setHasChildren] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      destination_country: "",
      destination_city: "",
      arrival_date: "",
      departure_date: "",
      number_of_travelers: 2,
      budget_range: "moderate",
      travel_purpose: "leisure",
      has_children: false,
      special_requirements: "",
    },
  })

  const budget = watch("budget_range")
  const purpose = watch("travel_purpose")
  const arrivalDate = watch("arrival_date")
  const departureDate = watch("departure_date")

  const maxTotalDays = subscription?.max_total_days ?? null
  const monthlyLimit = subscription?.monthly_planning_limit ?? null
  const monthlyUsed = subscription?.monthly_plannings_used ?? 0
  const quotaReached = monthlyLimit !== null && monthlyUsed >= monthlyLimit

  const maxDepartureDate =
    maxTotalDays !== null && arrivalDate ? addDays(arrivalDate, maxTotalDays) : undefined

  const tripDays = diffDays(arrivalDate, departureDate)
  const exceedsMaxDays =
    maxTotalDays !== null && tripDays !== null && tripDays > maxTotalDays

  const mutation = useMutation({
    mutationFn: planningApi.create,
    onSuccess: (data) => {
      navigate(`/planning/${data.id}`)
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "No se pudo crear la planificación",
        description: apiErrorMessage(err),
      }),
  })

  const onSubmit = (values: FormValues) => {
    if (quotaReached) {
      toast({
        variant: "destructive",
        title: "Alcanzaste tu límite mensual",
        description: "Actualiza a Premium para seguir planificando viajes.",
      })
      return
    }
    if (exceedsMaxDays) {
      toast({
        variant: "destructive",
        title: "Viaje demasiado largo",
        description: `Tu plan permite hasta ${maxTotalDays} días por viaje.`,
      })
      return
    }
    mutation.mutate({
      destination_country: values.destination_country,
      destination_city: values.destination_city?.trim() || null,
      arrival_date: values.arrival_date,
      departure_date: values.departure_date,
      number_of_travelers: values.number_of_travelers,
      budget_range: values.budget_range,
      travel_purpose: values.travel_purpose,
      has_children: values.has_children,
      special_requirements: values.special_requirements?.trim() || null,
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="animate-fade-up flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-primary to-primary/85 text-primary-foreground shadow-apple-sm">
          <Compass className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight sm:text-[34px]">
            Nueva planificación
          </h1>
          <p className="text-[15px] text-muted-foreground">
            Comenzamos con algunas preguntas generales sobre tu viaje
          </p>
        </div>
      </div>

      <Card className="animate-fade-up animate-delay-1">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              Información general
            </CardTitle>
            <CardDescription className="pt-1">
              Con estos datos haremos preguntas dinámicas para personalizar tu
              itinerario.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {quotaReached && (
              <div className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      Alcanzaste tu límite mensual
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Usaste {monthlyUsed} de {monthlyLimit} planificaciones este
                      mes. Actualiza a Premium para seguir planificando.
                    </p>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button type="button" size="sm" className="shrink-0">
                      <Crown className="h-4 w-4" />
                      Actualizar plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-primary" />
                        Hazte Premium
                      </DialogTitle>
                      <DialogDescription>
                        Con Premium disfrutas de planificaciones ilimitadas, más
                        días por viaje y más destinos. Cambia tu plan desde tu
                        perfil cuando quieras.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <DialogClose asChild>
                        <Button type="button" variant="ghost">
                          Ahora no
                        </Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button
                          type="button"
                          onClick={() => navigate("/profile")}
                        >
                          <Crown className="h-4 w-4" />
                          Ir a mi perfil
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="destination_country" className="text-[13px] text-muted-foreground">
                País de destino
              </Label>
              <Input
                id="destination_country"
                placeholder="Ej. Japón"
                {...register("destination_country")}
              />
              {errors.destination_country && (
                <p className="text-xs text-destructive">
                  {errors.destination_country.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination_city" className="text-[13px] text-muted-foreground">
                Ciudad (opcional)
              </Label>
              <Input
                id="destination_city"
                placeholder="Ej. Tokio"
                {...register("destination_city")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrival_date" className="text-[13px] text-muted-foreground">
                Fecha de llegada
              </Label>
              <Input id="arrival_date" type="date" {...register("arrival_date")} />
              {errors.arrival_date && (
                <p className="text-xs text-destructive">{errors.arrival_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="departure_date" className="text-[13px] text-muted-foreground">
                Fecha de salida
              </Label>
              <Input
                id="departure_date"
                type="date"
                min={arrivalDate || undefined}
                max={maxDepartureDate}
                {...register("departure_date")}
              />
              {errors.departure_date && (
                <p className="text-xs text-destructive">
                  {errors.departure_date.message}
                </p>
              )}
              {maxTotalDays !== null && (
                <p
                  className={
                    exceedsMaxDays
                      ? "text-xs text-destructive"
                      : "text-xs text-muted-foreground"
                  }
                >
                  {exceedsMaxDays
                    ? `Tu plan permite hasta ${maxTotalDays} días por viaje.`
                    : `Máximo ${maxTotalDays} días por viaje.`}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="number_of_travelers" className="text-[13px] text-muted-foreground">
                Número de viajeros
              </Label>
              <Input
                id="number_of_travelers"
                type="number"
                min={1}
                {...register("number_of_travelers")}
              />
              {errors.number_of_travelers && (
                <p className="text-xs text-destructive">
                  {errors.number_of_travelers.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] text-muted-foreground">Presupuesto</Label>
              <Select
                value={budget}
                onValueChange={(v) => setValue("budget_range", v as BudgetRange)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUDGETS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      <div className="flex flex-col text-left">
                        <span>{b.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {b.hint}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-[13px] text-muted-foreground">
                Propósito del viaje
              </Label>
              <Select
                value={purpose}
                onValueChange={(v) => setValue("travel_purpose", v as TravelPurpose)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label
              htmlFor="has_children"
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 bg-secondary/40 p-4 sm:col-span-2"
            >
              <Checkbox
                id="has_children"
                checked={hasChildren}
                onCheckedChange={(c) => {
                  const v = c === true
                  setHasChildren(v)
                  setValue("has_children", v)
                }}
              />
              <span className="text-sm font-medium">
                Viajaré con menores de edad
              </span>
            </label>
            <div className="space-y-2 sm:col-span-2">
              <Label
                htmlFor="special_requirements"
                className="text-[13px] text-muted-foreground"
              >
                Requerimientos especiales (opcional)
              </Label>
              <Textarea
                id="special_requirements"
                placeholder="Accesibilidad, alergias, preferencias alimentarias..."
                {...register("special_requirements")}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={mutation.isPending || quotaReached || exceedsMaxDays}
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Continuar con preguntas dinámicas
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
