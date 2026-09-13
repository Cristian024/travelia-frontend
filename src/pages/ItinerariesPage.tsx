import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Calendar, Compass, Loader2, MapPin, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { itinerariesApi } from "@/lib/endpoints"
import { formatDate } from "@/lib/utils"

export function ItinerariesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["itineraries"],
    queryFn: itinerariesApi.list,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis itinerarios</h1>
          <p className="text-muted-foreground">
            Historial de los viajes que has planificado con Travelia
          </p>
        </div>
        <Button asChild>
          <Link to="/planning/new">
            <Plus className="h-4 w-4" />
            Planificar nuevo viaje
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            No se pudieron cargar tus itinerarios. Intenta nuevamente.
          </CardContent>
        </Card>
      )}

      {data && data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
              <Compass className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Aún no tienes itinerarios</h2>
              <p className="text-muted-foreground">
                Comienza planificando tu primer viaje personalizado
              </p>
            </div>
            <Button asChild>
              <Link to="/planning/new">
                <Plus className="h-4 w-4" />
                Crear mi primer viaje
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((it) => (
            <Card key={it.id} className="flex flex-col transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{it.title}</CardTitle>
                  <Badge variant={it.status === "active" ? "default" : "secondary"}>
                    {it.status === "active" ? "Activo" : "Archivado"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {it.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(it.arrival_date)} – {formatDate(it.departure_date)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {it.destination_count} destinos · {it.total_days} días
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/itineraries/${it.id}`}>Ver itinerario</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
