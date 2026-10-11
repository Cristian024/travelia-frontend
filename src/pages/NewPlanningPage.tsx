import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { Compass, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { useToast } from "@/hooks/use-toast"
import { apiErrorMessage } from "@/lib/api"
import type { BudgetRange, TravelPurpose } from "@/types/api"

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
                {...register("departure_date")}
              />
              {errors.departure_date && (
                <p className="text-xs text-destructive">
                  {errors.departure_date.message}
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
            <Button type="submit" size="lg" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Continuar con preguntas dinámicas
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
