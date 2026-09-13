import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, Loader2, RefreshCcw, Wand2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DynamicQuestions,
  buildAnswers,
  validateAnswers,
} from "@/components/planning/DynamicQuestions"
import { itinerariesApi } from "@/lib/endpoints"
import { useToast } from "@/hooks/use-toast"
import { apiErrorMessage } from "@/lib/api"
import type { DestinationQuestionsResponse } from "@/types/api"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  itineraryId: string
  destinationId: string
  destinationName: string
}

export function ReplaceDestinationDialog({
  open,
  onOpenChange,
  itineraryId,
  destinationId,
  destinationName,
}: Props) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [current, setCurrent] = useState<DestinationQuestionsResponse | null>(null)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const startMutation = useMutation({
    mutationFn: () => itinerariesApi.startReplacement(itineraryId, destinationId),
    onSuccess: (data) => {
      setCurrent(data)
      setAnswers({})
    },
    onError: (err) => setFormError(apiErrorMessage(err)),
  })

  const answerMutation = useMutation({
    mutationFn: (body: {
      node_id: string
      answers: ReturnType<typeof buildAnswers>
    }) =>
      itinerariesApi.answerReplacement(itineraryId, destinationId, body),
    onSuccess: (data) => {
      setCurrent(data)
      setAnswers({})
      setFormError(null)
    },
    onError: (err) => setFormError(apiErrorMessage(err)),
  })

  const replaceMutation = useMutation({
    mutationFn: () => itinerariesApi.replace(itineraryId, destinationId),
    onSuccess: async (data) => {
      qc.setQueryData(["itinerary", itineraryId], data)
      await qc.invalidateQueries({ queryKey: ["itineraries"] })
      toast({
        title: "Destino reemplazado",
        description: "Tu itinerario se actualizó con el nuevo destino.",
      })
      onOpenChange(false)
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "No se pudo reemplazar",
        description: apiErrorMessage(err),
      }),
  })

  useEffect(() => {
    if (open && !current && !startMutation.isPending) {
      startMutation.mutate()
    }
    if (!open) {
      setCurrent(null)
      setAnswers({})
      setFormError(null)
    }
  }, [open])

  const onAnswer = () => {
    if (!current) return
    const err = validateAnswers(current.questions, answers)
    if (err) {
      setFormError(err)
      return
    }
    answerMutation.mutate({
      node_id: current.node_id,
      answers: buildAnswers(current.questions, answers),
    })
  }

  const loading = startMutation.isPending && !current
  const canReplace = !!current?.can_replace

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5 text-primary" />
            Cambiar destino: {destinationName}
          </DialogTitle>
          <DialogDescription>
            Responde estas preguntas para entender qué alternativa prefieres.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {current && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Ronda {current.depth + 1}</Badge>
              {canReplace && (
                <Badge>Listo para reemplazar</Badge>
              )}
            </div>
            {current.questions.length > 0 ? (
              <DynamicQuestions
                questions={current.questions}
                value={answers}
                onChange={setAnswers}
              />
            ) : (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No hay más preguntas. Ya podemos reemplazar tu destino.
              </div>
            )}
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {current && current.questions.length > 0 && (
            <Button onClick={onAnswer} disabled={answerMutation.isPending}>
              {answerMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Siguiente
            </Button>
          )}
          <Button
            onClick={() => replaceMutation.mutate()}
            disabled={!canReplace || replaceMutation.isPending}
            variant={canReplace ? "default" : "outline"}
          >
            {replaceMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            Reemplazar destino
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
