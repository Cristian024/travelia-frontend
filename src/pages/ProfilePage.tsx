import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/context/AuthContext"
import { usersApi } from "@/lib/endpoints"
import { useToast } from "@/hooks/use-toast"
import { apiErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/utils"

const schema = z.object({
  full_name: z.string().min(2, "Ingresa tu nombre"),
  birth_date: z.string().min(1, "Selecciona tu fecha de nacimiento"),
  country_of_residence: z.string().min(2, "Ingresa tu país"),
  phone: z.string().optional(),
  preferred_language: z.string().min(2),
})

type FormValues = z.infer<typeof schema>

const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
  { value: "fr", label: "Français" },
]

export function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const qc = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: user?.full_name ?? "",
      birth_date: user?.birth_date ?? "",
      country_of_residence: user?.country_of_residence ?? "",
      phone: user?.phone ?? "",
      preferred_language: user?.preferred_language ?? "es",
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name,
        birth_date: user.birth_date,
        country_of_residence: user.country_of_residence,
        phone: user.phone ?? "",
        preferred_language: user.preferred_language,
      })
    }
  }, [user, reset])

  const [serverError, setServerError] = useState<string | null>(null)
  const language = watch("preferred_language")

  const mutation = useMutation({
    mutationFn: usersApi.update,
    onSuccess: async () => {
      await refreshUser()
      await qc.invalidateQueries({ queryKey: ["me"] })
      toast({ title: "Perfil actualizado" })
      setServerError(null)
    },
    onError: (err) =>
      setServerError(apiErrorMessage(err, "No se pudo actualizar el perfil")),
  })

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      ...values,
      phone: values.phone?.trim() ? values.phone : null,
    })
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-muted-foreground">
          Revisa y actualiza tu información personal
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Información de la cuenta</CardTitle>
          <CardDescription>
            Miembro desde {formatDate(user.created_at)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Correo electrónico</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            El correo no se puede modificar desde aquí.
          </p>
        </CardContent>
      </Card>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="text-xl">Datos personales</CardTitle>
            <CardDescription>
              Actualiza tu información cuando quieras
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && (
                <p className="text-xs text-destructive">{errors.full_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date">Fecha de nacimiento</Label>
              <Input id="birth_date" type="date" {...register("birth_date")} />
              {errors.birth_date && (
                <p className="text-xs text-destructive">{errors.birth_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="country_of_residence">País de residencia</Label>
              <Input
                id="country_of_residence"
                {...register("country_of_residence")}
              />
              {errors.country_of_residence && (
                <p className="text-xs text-destructive">
                  {errors.country_of_residence.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label>Idioma preferido</Label>
              <Select
                value={language}
                onValueChange={(v) =>
                  setValue("preferred_language", v, { shouldDirty: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Idioma" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {serverError && (
              <p className="text-sm text-destructive sm:col-span-2">{serverError}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={!isDirty || mutation.isPending}
              className="ml-auto"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar cambios
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
