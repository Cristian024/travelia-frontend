import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Backpack, Check, Loader2, Sparkles, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { itinerariesApi } from "@/lib/endpoints"
import { useToast } from "@/hooks/use-toast"
import { apiErrorMessage } from "@/lib/api"
import type { PackingItem, PackingList } from "@/types/api"

interface Props {
  itineraryId: string
}

interface PositionedItem {
  item: PackingItem
  position: number
}

export function PackingListPanel({ itineraryId }: Props) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const queryKey = ["packing-list", itineraryId]

  const { data: list, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await itinerariesApi.getPackingList(itineraryId)
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 404) return null
        throw err
      }
    },
    retry: false,
    staleTime: 5 * 60_000,
  })

  const generateMutation = useMutation({
    mutationFn: () => itinerariesApi.generatePackingList(itineraryId),
    onSuccess: (data) => {
      qc.setQueryData(queryKey, data)
      toast({ title: "Lista de equipaje generada" })
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "No se pudo generar la lista",
        description: apiErrorMessage(err),
      }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ position, checked }: { position: number; checked: boolean }) =>
      itinerariesApi.updatePackingItem(itineraryId, position, checked),
    onMutate: async ({ position, checked }) => {
      await qc.cancelQueries({ queryKey })
      const prev = qc.getQueryData<PackingList | null>(queryKey)
      qc.setQueryData<PackingList | null>(queryKey, (old) =>
        old
          ? {
              ...old,
              items: old.items.map((it, i) =>
                i === position ? { ...it, checked } : it,
              ),
            }
          : old,
      )
      return { prev }
    },
    onSuccess: (data) => {
      if (data) qc.setQueryData(queryKey, data)
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(queryKey, ctx.prev)
      toast({
        variant: "destructive",
        title: "No se pudo actualizar el item",
        description: apiErrorMessage(err),
      })
    },
  })

  const groups = useMemo(() => {
    if (!list) return []
    const map = new Map<string, PositionedItem[]>()
    list.items.forEach((item, position) => {
      const arr = map.get(item.category) ?? []
      arr.push({ item, position })
      map.set(item.category, arr)
    })
    return Array.from(map.entries())
  }, [list])

  const total = list?.items.length ?? 0
  const done = list ? list.items.filter((i) => i.checked).length : 0

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!list || list.items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Backpack className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Checklist de equipaje</h3>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Genera con IA una lista de equipaje adaptada al destino, el clima y
              el propósito de tu viaje.
            </p>
          </div>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            Generar lista con IA
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              {list.destination_summary}
            </div>
            {list.weather_summary && (
              <p className="text-sm text-muted-foreground">
                {list.weather_summary}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Badge variant="secondary">
              {done} / {total} listos
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Regenerar
            </Button>
          </div>
        </CardContent>
      </Card>

      {groups.map(([category, items]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {category}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map(({ item, position }) => {
              const isChecked = !!item.checked
              const isPending =
                toggleMutation.isPending &&
                toggleMutation.variables?.position === position
              return (
                <label
                  key={`${category}-${position}`}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-apple-xs transition-colors hover:bg-accent/40"
                >
                  <Checkbox
                    checked={isChecked}
                    disabled={isPending}
                    onCheckedChange={(c) =>
                      toggleMutation.mutate({ position, checked: c === true })
                    }
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={
                          isChecked
                            ? "text-sm font-medium text-muted-foreground line-through"
                            : "text-sm font-medium"
                        }
                      >
                        {item.item}
                      </span>
                      {item.quantity && (
                        <Badge variant="outline" className="shrink-0">
                          {item.quantity}
                        </Badge>
                      )}
                    </div>
                    {item.reason && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.reason}
                      </p>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      ))}

      {list.notes && (
        <>
          <Separator />
          <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {list.notes}
          </div>
        </>
      )}
    </div>
  )
}
