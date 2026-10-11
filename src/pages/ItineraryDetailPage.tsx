import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import {
  ArrowLeft,
  Backpack,
  BedDouble,
  Calendar,
  Clock,
  CloudSun,
  DollarSign,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  RefreshCcw,
  Route,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { itinerariesApi } from "@/lib/endpoints"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { apiErrorMessage } from "@/lib/api"
import { ReplaceDestinationDialog } from "@/components/itinerary/ReplaceDestinationDialog"
import { PackingListPanel } from "@/components/itinerary/PackingListPanel"
import { BudgetPanel } from "@/components/itinerary/BudgetPanel"
import type { DailyForecast, DestinationResponse, WeatherForecast } from "@/types/api"

export function ItineraryDetailPage() {
  const { itineraryId } = useParams<{ itineraryId: string }>()
  const [replacingId, setReplacingId] = useState<string | null>(null)
  const { toast } = useToast()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["itinerary", itineraryId],
    queryFn: () => itinerariesApi.get(itineraryId!),
    enabled: !!itineraryId,
  })

  const exportMutation = useMutation({
    mutationFn: () => itinerariesApi.exportPdf(itineraryId!),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const safeTitle =
        (data?.title ?? "itinerario").replace(/[^\w\s-]/g, "").trim() ||
        "itinerario"
      a.download = `${safeTitle}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast({ title: "PDF descargado" })
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "No se pudo exportar el PDF",
        description: apiErrorMessage(err),
      }),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  if (isError || !data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
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
    <div className="space-y-8">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-3 w-fit text-muted-foreground"
      >
        <Link to="/">
          <ArrowLeft className="h-4 w-4" />
          Volver a mis itinerarios
        </Link>
      </Button>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[34px] font-semibold leading-tight tracking-tight sm:text-[40px]">
                {data.title}
              </h1>
              <Badge variant={data.status === "active" ? "default" : "secondary"}>
                {data.status === "active" ? "Activo" : "Archivado"}
              </Badge>
              {data.is_public && <Badge variant="success">Público</Badge>}
            </div>
            <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {data.summary}
            </p>
          </div>
          <Button
            variant="outline"
            className="shrink-0"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Descargar PDF
          </Button>
        </div>

        <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
          <StatTile
            icon={<Calendar className="h-4 w-4" />}
            label="Fechas"
            value={`${formatDate(data.arrival_date)} → ${formatDate(data.departure_date)}`}
          />
          <StatTile
            icon={<Clock className="h-4 w-4" />}
            label="Duración"
            value={`${data.total_days} días`}
          />
          <StatTile
            icon={<MapPin className="h-4 w-4" />}
            label="Destinos"
            value={`${data.destinations.length} paradas`}
          />
        </div>

        {data.weather && <WeatherStrip weather={data.weather} />}
      </div>

      <Separator />

      <Tabs defaultValue="itinerary">
        <TabsList>
          <TabsTrigger value="itinerary">
            <Route className="h-4 w-4" />
            Itinerario
          </TabsTrigger>
          <TabsTrigger value="packing">
            <Backpack className="h-4 w-4" />
            Equipaje
          </TabsTrigger>
          <TabsTrigger value="budget">
            <Wallet className="h-4 w-4" />
            Presupuesto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="itinerary" className="space-y-6">
          {data.destinations
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((dest, i) => (
              <DestinationCard
                key={dest.destination_id}
                destination={dest}
                index={i}
                onReplace={() => setReplacingId(dest.destination_id)}
              />
            ))}
        </TabsContent>

        <TabsContent value="packing">
          {itineraryId && <PackingListPanel itineraryId={itineraryId} />}
        </TabsContent>

        <TabsContent value="budget">
          {itineraryId && <BudgetPanel itineraryId={itineraryId} />}
        </TabsContent>
      </Tabs>

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

function WeatherStrip({ weather }: { weather: WeatherForecast }) {
  return (
    <div className="max-w-3xl rounded-3xl border border-border/70 bg-card p-4 shadow-apple-xs">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <CloudSun className="h-4 w-4 text-primary" />
        Clima en {weather.city}, {weather.country}
      </div>
      {weather.summary && (
        <p className="mt-1 text-xs text-muted-foreground">{weather.summary}</p>
      )}
      {weather.days.length > 0 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {weather.days.map((day) => (
            <WeatherDay key={day.date} day={day} />
          ))}
        </div>
      )}
    </div>
  )
}

function WeatherDay({ day }: { day: DailyForecast }) {
  const isUrl = !!day.icon && /^(https?:)?\//.test(day.icon)
  return (
    <div className="flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-2xl bg-secondary/50 p-3 text-center">
      <span className="text-xs font-medium capitalize text-muted-foreground">
        {format(parseISO(day.date), "EEE d", { locale: es })}
      </span>
      {isUrl ? (
        <img src={day.icon!} alt={day.description} className="h-8 w-8" />
      ) : (
        <span className="text-2xl leading-none">{day.icon ?? "🌤️"}</span>
      )}
      <span className="text-sm font-semibold tabular-nums">
        {Math.round(day.temp_max)}° / {Math.round(day.temp_min)}°
      </span>
      <span className="line-clamp-1 text-[11px] text-muted-foreground">
        {day.description}
      </span>
    </div>
  )
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-apple-xs">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-sm font-semibold">{value}</div>
      </div>
    </div>
  )
}

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      {children}
    </div>
  )
}

function DestinationCard({
  destination,
  index,
  onReplace,
}: {
  destination: DestinationResponse
  index: number
  onReplace: () => void
}) {
  return (
    <Card
      className="animate-fade-up overflow-hidden"
      style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
    >
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-primary to-primary/85 text-[15px] font-semibold text-primary-foreground shadow-apple-sm">
              {destination.order}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl">{destination.name}</CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {destination.city}, {destination.country} ·{" "}
                {destination.days_allocated} días
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onReplace} className="shrink-0">
            <RefreshCcw className="h-4 w-4" />
            Cambiar destino
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <p className="leading-relaxed text-foreground/90">
          {destination.description}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {destination.transportation && (
            <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Transporte
              </div>
              <div className="mt-1 font-medium">{destination.transportation}</div>
            </div>
          )}
          {destination.estimated_cost && (
            <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                Costo estimado
              </div>
              <div className="mt-1 font-medium">{destination.estimated_cost}</div>
            </div>
          )}
        </div>

        {destination.google_maps_url && (
          <Button asChild variant="outline" size="sm" className="w-fit">
            <a
              href={destination.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Ver en Google Maps
            </a>
          </Button>
        )}

        {destination.highlights.length > 0 && (
          <div className="space-y-3">
            <SectionLabel icon={<Star className="h-3.5 w-3.5" />}>
              Puntos destacados
            </SectionLabel>
            <ul className="grid gap-2 sm:grid-cols-2">
              {destination.highlights.map((h, i) => (
                <li
                  key={i}
                  className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {destination.accommodation_suggestions.length > 0 && (
          <div className="space-y-3">
            <SectionLabel icon={<BedDouble className="h-3.5 w-3.5" />}>
              Sugerencias de alojamiento
            </SectionLabel>
            <ul className="grid gap-2 sm:grid-cols-2">
              {destination.accommodation_suggestions.map((a, i) => (
                <li
                  key={i}
                  className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {destination.activities.length > 0 && (
          <div className="space-y-3">
            <SectionLabel icon={<Sparkles className="h-3.5 w-3.5" />}>
              Actividades sugeridas
            </SectionLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {destination.activities.map((act) => (
                <div
                  key={act.activity_id}
                  className="rounded-2xl border border-border/70 bg-card p-4 shadow-apple-xs transition-all duration-300 ease-apple hover:-translate-y-0.5 hover:shadow-apple"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold">{act.name}</div>
                    <Badge variant="secondary" className="shrink-0">
                      {act.category}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {act.description}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
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
