import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Compass,
  Copy,
  Globe,
  Loader2,
  MapPin,
  Plus,
  Route,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeleteItineraryDialog } from "@/components/itinerary/DeleteItineraryDialog"
import { itinerariesApi } from "@/lib/endpoints"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { apiErrorMessage } from "@/lib/api"
import type { ItinerarySummaryResponse } from "@/types/api"

export function ItinerariesPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium uppercase tracking-wider text-primary">
            Tus viajes
          </p>
          <h1 className="text-[34px] font-semibold leading-tight tracking-tight sm:text-[40px]">
            Mis itinerarios
          </h1>
          <p className="max-w-xl text-[15px] text-muted-foreground">
            Gestiona tus viajes planificados e inspírate con la comunidad
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link to="/planning/new">
            <Plus className="h-4 w-4" />
            Planificar nuevo viaje
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">
            <Route className="h-4 w-4" />
            Mis Viajes
          </TabsTrigger>
          <TabsTrigger value="discover">
            <Compass className="h-4 w-4" />
            Descubrir
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mine">
          <MyItineraries />
        </TabsContent>

        <TabsContent value="discover">
          <DiscoverFeed />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MyItineraries() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [selected, setSelected] = useState<ItinerarySummaryResponse | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["itineraries"],
    queryFn: itinerariesApi.list,
  })

  const visibilityMutation = useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      itinerariesApi.setVisibility(id, isPublic),
    onMutate: async ({ id, isPublic }) => {
      await qc.cancelQueries({ queryKey: ["itineraries"] })
      const prev = qc.getQueryData<ItinerarySummaryResponse[]>(["itineraries"])
      qc.setQueryData<ItinerarySummaryResponse[]>(["itineraries"], (old) =>
        old?.map((it) => (it.id === id ? { ...it, is_public: isPublic } : it)),
      )
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["itineraries"], ctx.prev)
      toast({
        variant: "destructive",
        title: "No se pudo cambiar la visibilidad",
        description: apiErrorMessage(err),
      })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["itineraries"] })
      qc.invalidateQueries({ queryKey: ["public-feed"] })
    },
  })

  if (isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse overflow-hidden">
            <CardHeader className="space-y-3">
              <div className="h-5 w-2/3 rounded-full bg-secondary" />
              <div className="h-4 w-full rounded-full bg-secondary/70" />
              <div className="h-4 w-4/5 rounded-full bg-secondary/70" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-10 w-full rounded-xl bg-secondary/60" />
              <div className="h-10 w-full rounded-xl bg-secondary/60" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-10 text-center text-sm text-destructive">
          No se pudieron cargar tus itinerarios. Intenta nuevamente.
        </CardContent>
      </Card>
    )
  }

  if (data && data.length === 0) {
    return (
      <Card className="animate-fade-up border-dashed border-border bg-transparent shadow-none">
        <CardContent className="flex flex-col items-center gap-5 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-b from-primary/15 to-primary/5 text-primary">
            <Compass className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight">
              Aún no tienes itinerarios
            </h2>
            <p className="max-w-sm text-[15px] text-muted-foreground">
              Comienza planificando tu primer viaje personalizado
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/planning/new">
              <Plus className="h-4 w-4" />
              Crear mi primer viaje
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((it, i) => (
          <Card
            key={it.id}
            className="group flex animate-fade-up flex-col overflow-hidden transition-all duration-300 ease-apple hover:-translate-y-1 hover:shadow-apple-lg"
            style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
          >
            <CardHeader className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <Link
                  to={`/itineraries/${it.id}`}
                  className="text-[19px] font-semibold leading-snug tracking-tight transition-colors hover:text-primary"
                >
                  {it.title}
                </Link>
                <Badge
                  variant={it.status === "active" ? "default" : "secondary"}
                  className="mt-0.5 shrink-0"
                >
                  {it.status === "active" ? "Activo" : "Archivado"}
                </Badge>
              </div>
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {it.summary}
              </p>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <MetaRow
                icon={<Calendar className="h-4 w-4" />}
                label="Fechas"
                value={`${formatDate(it.arrival_date)} – ${formatDate(it.departure_date)}`}
              />
              <MetaRow
                icon={<MapPin className="h-4 w-4" />}
                label="Itinerario"
                value={`${it.destination_count} destinos · ${it.total_days} días`}
              />
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border/70 bg-secondary/40 p-3">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  Compartir en Descubrir
                </span>
                <Switch
                  checked={!!it.is_public}
                  disabled={
                    visibilityMutation.isPending &&
                    visibilityMutation.variables?.id === it.id
                  }
                  onCheckedChange={(checked) =>
                    visibilityMutation.mutate({ id: it.id, isPublic: checked })
                  }
                />
              </label>
            </CardContent>
            <div className="flex items-center gap-2 border-t border-border/60 bg-secondary/30 px-6 py-4">
              <Button asChild variant="outline" className="flex-1">
                <Link to={`/itineraries/${it.id}`}>Ver itinerario</Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setSelected(it)}
                aria-label={`Eliminar ${it.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <DeleteItineraryDialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        itinerary={selected}
      />
    </>
  )
}

function DiscoverFeed() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-feed", page],
    queryFn: () => itinerariesApi.publicFeed(page, 9),
  })

  const cloneMutation = useMutation({
    mutationFn: (id: string) => itinerariesApi.clone(id),
    onSuccess: (itinerary) => {
      qc.invalidateQueries({ queryKey: ["itineraries"] })
      toast({
        title: "Itinerario clonado",
        description: `"${itinerary.title}" se añadió a Mis Viajes.`,
      })
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "No se pudo clonar",
        description: apiErrorMessage(err),
      }),
  })

  if (isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse overflow-hidden">
            <CardHeader className="space-y-3">
              <div className="h-5 w-2/3 rounded-full bg-secondary" />
              <div className="h-4 w-full rounded-full bg-secondary/70" />
              <div className="h-4 w-4/5 rounded-full bg-secondary/70" />
            </CardHeader>
            <CardContent className="h-12 rounded-xl bg-secondary/60" />
          </Card>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-10 text-center text-sm text-destructive">
          No se pudo cargar el feed público. Intenta nuevamente.
        </CardContent>
      </Card>
    )
  }

  if (data && data.items.length === 0) {
    return (
      <Card className="border-dashed border-border bg-transparent shadow-none">
        <CardContent className="flex flex-col items-center gap-5 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-b from-primary/15 to-primary/5 text-primary">
            <Globe className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight">
              Todavía no hay itinerarios públicos
            </h2>
            <p className="max-w-sm text-[15px] text-muted-foreground">
              Marca tus viajes como públicos para que otros se inspiren.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((it, i) => (
          <Card
            key={it.id}
            className="flex animate-fade-up flex-col overflow-hidden transition-all duration-300 ease-apple hover:-translate-y-1 hover:shadow-apple-lg"
            style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
          >
            <CardHeader className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[19px] font-semibold leading-snug tracking-tight">
                  {it.title}
                </h3>
                <Badge variant="secondary" className="mt-0.5 shrink-0">
                  <Globe className="h-3 w-3" />
                  Público
                </Badge>
              </div>
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {it.summary}
              </p>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <MetaRow
                icon={<Calendar className="h-4 w-4" />}
                label="Fechas"
                value={`${formatDate(it.arrival_date)} – ${formatDate(it.departure_date)}`}
              />
              <MetaRow
                icon={<MapPin className="h-4 w-4" />}
                label="Itinerario"
                value={`${it.destination_count} destinos · ${it.total_days} días`}
              />
            </CardContent>
            <div className="flex items-center gap-2 border-t border-border/60 bg-secondary/30 px-6 py-4">
              <Button
                className="flex-1"
                disabled={
                  cloneMutation.isPending && cloneMutation.variables === it.id
                }
                onClick={() => cloneMutation.mutate(it.id)}
              >
                {cloneMutation.isPending &&
                cloneMutation.variables === it.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Clonar
              </Button>
            </div>
          </Card>
        ))}
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

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-sm font-medium">{value}</div>
      </div>
    </div>
  )
}
