import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowRight,
  Calendar,
  Check,
  Loader2,
  MapPin,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Separator } from "@/components/ui/separator"
import {
  DynamicQuestions,
  buildAnswers,
  validateAnswers,
} from "@/components/planning/DynamicQuestions"
import { itinerariesApi, planningApi } from "@/lib/endpoints"
import { useToast } from "@/hooks/use-toast"
import { apiErrorMessage } from "@/lib/api"
import type { CurrentQuestionsResponse } from "@/types/api"

export function PlanningPage() {
  const { planningId } = useParams<{ planningId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()

  const planningQuery = useQuery({
    queryKey: ["planning", planningId],
    queryFn: () => planningApi.get(planningId!),
    enabled: !!planningId,
  })

  const currentQuery = useQuery({
    queryKey: ["planning", planningId, "current"],
    queryFn: () => planningApi.current(planningId!),
    enabled: !!planningId,
  })

  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [current, setCurrent] = useState<CurrentQuestionsResponse | null>(null)

  useEffect(() => {
    if (currentQuery.data) setCurrent(currentQuery.data)
  }, [currentQuery.data])

  const answerMutation = useMutation({
    mutationFn: (body: {
      node_id: string
      answers: ReturnType<typeof buildAnswers>
    }) => planningApi.answer(planningId!, body),
    onSuccess: (data) => {
      setCurrent(data)
      setAnswers({})
      setFormError(null)
      qc.invalidateQueries({ queryKey: ["planning", planningId] })
    },
    onError: (err) => setFormError(apiErrorMessage(err)),
  })

  const readyMutation = useMutation({
    mutationFn: () => planningApi.markReady(planningId!),
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "No se pudo finalizar la planificación",
        description: apiErrorMessage(err),
      }),
  })

  const generateMutation = useMutation({
    mutationFn: () => itinerariesApi.generate(planningId!),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["itineraries"] })
      navigate(`/itineraries/${data.id}`)
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "No se pudo generar el itinerario",
        description: apiErrorMessage(err),
      }),
  })

  const handleSubmit = () => {
    if (!current) return
    const error = validateAnswers(current.questions, answers)
    if (error) {
      setFormError(error)
      return
    }
    answerMutation.mutate({
      node_id: current.node_id,
      answers: buildAnswers(current.questions, answers),
    })
  }

  const handleGenerate = async () => {
    try {
      await readyMutation.mutateAsync()
      await generateMutation.mutateAsync()
    } catch {
      /* handled by toasts */
    }
  }

  if (planningQuery.isLoading || currentQuery.isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (planningQuery.isError || !planningQuery.data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-10 text-center text-sm text-destructive">
          No se pudo cargar la planificación.
        </CardContent>
      </Card>
    )
  }

  const planning = planningQuery.data
  const general = planning.general_answers
  const depth = current?.depth ?? 0
  const progress = Math.min(100, (depth / 4) * 100 + 20)
  const canGenerate =
    !!current?.can_generate_itinerary || planning.status !== "in_progress"

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="animate-fade-up space-y-3">
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium uppercase tracking-wider text-primary">
            Planificación en curso
          </p>
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight sm:text-[34px]">
            Planifiquemos tu viaje
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-medium">
            <MapPin className="h-3.5 w-3.5" />
            {general.destination_city
              ? `${general.destination_city}, ${general.destination_country}`
              : general.destination_country}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-medium">
            <Calendar className="h-3.5 w-3.5" />
            {general.total_days} días
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-medium">
            <Users className="h-3.5 w-3.5" />
            {general.number_of_travelers} viajero(s)
          </span>
        </div>
      </div>

      <Card className="animate-fade-up animate-delay-1">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <CardTitle className="text-lg">Preguntas dinámicas</CardTitle>
            </div>
            <Badge variant="secondary">Ronda {depth + 1}</Badge>
          </div>
          <CardDescription className="pt-1">
            Cada respuesta nos ayuda a afinar tu itinerario. Puedes generarlo
            cuando tengas suficiente información.
          </CardDescription>
          <div className="pt-4">
            <Progress value={progress} />
          </div>
        </CardHeader>
        <CardContent>
          {current && current.questions.length > 0 ? (
            <DynamicQuestions
              questions={current.questions}
              value={answers}
              onChange={setAnswers}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-8 text-center text-sm text-muted-foreground">
              No hay más preguntas pendientes. Puedes generar el itinerario.
            </div>
          )}
          {formError && (
            <p className="mt-4 text-sm text-destructive">{formError}</p>
          )}
        </CardContent>
        <Separator />
        <CardFooter className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-medium text-muted-foreground">
            {canGenerate
              ? "Ya puedes generar el itinerario o seguir respondiendo."
              : "Responde esta ronda para continuar."}
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            {current && current.questions.length > 0 && (
              <Button
                className="flex-1 sm:flex-none"
                onClick={handleSubmit}
                disabled={answerMutation.isPending}
              >
                {answerMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Siguiente ronda
              </Button>
            )}
            <Button
              variant={canGenerate ? "default" : "outline"}
              onClick={handleGenerate}
              disabled={
                !canGenerate ||
                readyMutation.isPending ||
                generateMutation.isPending
              }
              className="flex-1 sm:flex-none"
            >
              {readyMutation.isPending || generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Generar itinerario
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card className="animate-fade-up animate-delay-2">
        <CardHeader>
          <CardTitle className="text-base">Resumen general</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Destino">
            {general.destination_city
              ? `${general.destination_city}, ${general.destination_country}`
              : general.destination_country}
          </Field>
          <Field label="Fechas">
            {general.arrival_date} → {general.departure_date}
          </Field>
          <Field label="Duración">{general.total_days} días</Field>
          <Field label="Viajeros">
            {general.number_of_travelers}
            {general.has_children ? " (con menores)" : ""}
          </Field>
          <Field label="Presupuesto">{general.budget_range}</Field>
          <Field label="Propósito">{general.travel_purpose}</Field>
          {general.special_requirements && (
            <Field label="Requerimientos" full>
              {general.special_requirements}
            </Field>
          )}
        </CardContent>
      </Card>

      {planning.status !== "in_progress" && (
        <Card className="animate-fade-up border-primary/30 bg-primary/5 shadow-none">
          <CardContent className="flex items-center gap-3 py-4 text-sm font-medium">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Check className="h-4 w-4" />
            </span>
            Esta planificación ya está lista para generar un itinerario.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Field({
  label,
  children,
  full,
}: {
  label: string
  children: React.ReactNode
  full?: boolean
}) {
  return (
    <div
      className={
        full
          ? "rounded-2xl border border-border/70 bg-secondary/40 p-4 sm:col-span-2"
          : "rounded-2xl border border-border/70 bg-secondary/40 p-4"
      }
    >
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-semibold">{children}</div>
    </div>
  )
}
