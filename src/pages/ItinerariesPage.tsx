import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Calendar, Compass, MapPin, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DeleteItineraryDialog } from "@/components/itinerary/DeleteItineraryDialog"
import { itinerariesApi } from "@/lib/endpoints"
import { formatDate } from "@/lib/utils"
import type { ItinerarySummaryResponse } from "@/types/api"

export function ItinerariesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["itineraries"],
    queryFn: itinerariesApi.list,
  })

  const [selected, setSelected] = useState<ItinerarySummaryResponse | null>(null)

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
            Historial de los viajes que has planificado con Travelia
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link to="/planning/new">
            <Plus className="h-4 w-4" />
            Planificar nuevo viaje
          </Link>
        </Button>
      </div>

      {isLoading && (
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
      )}

      {isError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-10 text-center text-sm text-destructive">
            No se pudieron cargar tus itinerarios. Intenta nuevamente.
          </CardContent>
        </Card>
      )}

      {data && data.length === 0 && (
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
      )}

      {data && data.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((it, i) => (
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
      )}

      <DeleteItineraryDialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        itinerary={selected}
      />
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
