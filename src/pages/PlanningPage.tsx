import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
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
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (planningQuery.isError || !planningQuery.data) {
    return (
      <Card>
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
    !!current?.can_generate_itinerary ||
    planning.status !== "in_progress"

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Planifiquemos tu viaje
        </h1>
        <p className="text-muted-foreground">
          {general.destination_city
            ? `${general.destination_city}, ${general.destination_country}`
            : general.destination_country}{" "}
          · {general.total_days} días · {general.number_of_travelers} viajero(s)
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">
                Preguntas dinámicas
              </CardTitle>
            </div>
            <Badge variant="secondary">Ronda {depth + 1}</Badge>
          </div>
          <CardDescription>
            Cada respuesta nos ayuda a afinar tu itinerario. Puedes generarlo
            cuando tengas suficiente información.
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent>
          {current && current.questions.length > 0 ? (
            <DynamicQuestions
              questions={current.questions}
              value={answers}
              onChange={setAnswers}
            />
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No hay más preguntas pendientes. Puedes generar el itinerario.
            </div>
          )}
          {formError && (
            <p className="mt-4 text-sm text-destructive">{formError}</p>
          )}
        </CardContent>
        <Separator />
        <CardFooter className="flex flex-col gap-3 pt-6 sm:flex-row sm:justify-between">
          <div className="text-xs text-muted-foreground">
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

      <Card>
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
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4 text-sm">
            <Check className="h-5 w-5 text-primary" />
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
    <div className={full ? "sm:col-span-2" : undefined}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="font-medium">{children}</div>
    </div>
  )
}
