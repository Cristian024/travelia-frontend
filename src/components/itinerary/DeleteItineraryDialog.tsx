import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { itinerariesApi } from "@/lib/endpoints"
import { useToast } from "@/hooks/use-toast"
import { apiErrorMessage } from "@/lib/api"
import type { ItinerarySummaryResponse } from "@/types/api"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  itinerary: ItinerarySummaryResponse | null
}

export function DeleteItineraryDialog({ open, onOpenChange, itinerary }: Props) {
  const { toast } = useToast()
  const qc = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => itinerariesApi.remove(itinerary!.id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["itineraries"] })
      toast({
        title: "Itinerario eliminado",
        description: "El itinerario se eliminó correctamente.",
      })
      onOpenChange(false)
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "No se pudo eliminar",
        description: apiErrorMessage(err),
      }),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (deleteMutation.isPending) return
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Eliminar itinerario
          </DialogTitle>
          <DialogDescription>
            ¿Seguro que quieres eliminar{" "}
            <span className="font-medium text-foreground">
              {itinerary?.title}
            </span>
            ? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
