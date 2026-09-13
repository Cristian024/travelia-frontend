import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  BedDouble,
  Calendar,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  RefreshCcw,
  Sparkles,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { itinerariesApi } from "@/lib/endpoints"
import { formatDate } from "@/lib/utils"
import { ReplaceDestinationDialog } from "@/components/itinerary/ReplaceDestinationDialog"
import type { DestinationResponse } from "@/types/api"

export function ItineraryDetailPage() {
  const { itineraryId } = useParams<{ itineraryId: string }>()
  const [replacingId, setReplacingId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["itinerary", itineraryId],
    queryFn: () => itinerariesApi.get(itineraryId!),
    enabled: !!itineraryId,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-destructive">
          No se pudo cargar el itinerario.
        </CardContent>
      </Card>
    )
  }

  const replacingDestination = data.destinations.find(
    (d) => d.destination_id === replacingId,
  )

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/">
          <ArrowLeft className="h-4 w-4" />
          Volver a mis itinerarios
        </Link>
      </Button>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
            <Badge variant={data.status === "active" ? "default" : "secondary"}>
              {data.status === "active" ? "Activo" : "Archivado"}
            </Badge>
          </div>
          <p className="max-w-2xl text-muted-foreground">{data.summary}</p>
          <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(data.arrival_date)} → {formatDate(data.departure_date)}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {data.total_days} días
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {data.destinations.length} destinos
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-6">
        {data.destinations
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((dest) => (
            <DestinationCard
              key={dest.destination_id}
              destination={dest}
              onReplace={() => setReplacingId(dest.destination_id)}
            />
          ))}
      </div>

      {replacingDestination && itineraryId && (
        <ReplaceDestinationDialog
          open={!!replacingId}
          onOpenChange={(o) => !o && setReplacingId(null)}
          itineraryId={itineraryId}
          destinationId={replacingDestination.destination_id}
          destinationName={replacingDestination.name}
        />
      )}
    </div>
  )
}

function DestinationCard({
  destination,
  onReplace,
}: {
  destination: DestinationResponse
  onReplace: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {destination.order}
              </div>
              <CardTitle className="text-xl">{destination.name}</CardTitle>
            </div>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {destination.city}, {destination.country} · {destination.days_allocated}{" "}
              días
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onReplace}>
            <RefreshCcw className="h-4 w-4" />
            Cambiar destino
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="leading-relaxed">{destination.description}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          {destination.transportation && (
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Transporte
              </div>
              <div>{destination.transportation}</div>
            </div>
          )}
          {destination.estimated_cost && (
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                Costo estimado
              </div>
              <div>{destination.estimated_cost}</div>
            </div>
          )}
        </div>

        {destination.highlights.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Star className="h-4 w-4 text-primary" />
              Puntos destacados
            </div>
            <ul className="grid gap-1 sm:grid-cols-2">
              {destination.highlights.map((h, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  · {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {destination.accommodation_suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BedDouble className="h-4 w-4 text-primary" />
              Sugerencias de alojamiento
            </div>
            <ul className="grid gap-1 sm:grid-cols-2">
              {destination.accommodation_suggestions.map((a, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  · {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {destination.activities.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              Actividades sugeridas
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {destination.activities.map((act) => (
                <div
                  key={act.activity_id}
                  className="rounded-md border p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{act.name}</div>
                    <Badge variant="outline" className="shrink-0">
                      {act.category}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {act.description}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {act.duration_hours} h
                    </span>
                    {act.estimated_cost && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {act.estimated_cost}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
