import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Compass, Loader2 } from "lucide-react"
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
import { useAuth } from "@/context/AuthContext"
import { apiErrorMessage } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const schema = z.object({
  full_name: z.string().min(2, "Ingresa tu nombre completo"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  birth_date: z.string().min(1, "Selecciona tu fecha de nacimiento"),
  country_of_residence: z.string().min(2, "Selecciona tu país"),
  phone: z.string().optional(),
  preferred_language: z.string().min(2).default("es"),
})

type FormValues = z.infer<typeof schema>

const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
  { value: "fr", label: "Français" },
]

export function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      birth_date: "",
      country_of_residence: "",
      phone: "",
      preferred_language: "es",
    },
  })

  const language = watch("preferred_language")

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      await registerUser({
        ...values,
        phone: values.phone?.trim() ? values.phone : null,
      })
      navigate("/", { replace: true })
      toast({
        title: "¡Bienvenido a Travelia!",
        description: "Tu cuenta fue creada correctamente.",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo registrar",
        description: apiErrorMessage(err, "Revisa los datos ingresados"),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-primary/12 blur-[130px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-sky-400/12 blur-[130px]"
      />

      <Card className="animate-scale-in relative w-full max-w-xl border-border/60 shadow-apple-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-primary to-primary/85 text-primary-foreground shadow-apple-sm">
            <Compass className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-[28px] leading-tight">
              Crea tu cuenta
            </CardTitle>
            <CardDescription className="text-balance">
              Cuéntanos un poco sobre ti para personalizar tus viajes
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name" className="text-[13px] text-muted-foreground">
                Nombre completo
              </Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && (
                <p className="text-xs text-destructive">{errors.full_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] text-muted-foreground">
                Correo electrónico
              </Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px] text-muted-foreground">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date" className="text-[13px] text-muted-foreground">
                Fecha de nacimiento
              </Label>
              <Input id="birth_date" type="date" {...register("birth_date")} />
              {errors.birth_date && (
                <p className="text-xs text-destructive">{errors.birth_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="country_of_residence"
                className="text-[13px] text-muted-foreground"
              >
                País de residencia
              </Label>
              <Input
                id="country_of_residence"
                placeholder="Ej. Colombia"
                {...register("country_of_residence")}
              />
              {errors.country_of_residence && (
                <p className="text-xs text-destructive">
                  {errors.country_of_residence.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[13px] text-muted-foreground">
                Teléfono (opcional)
              </Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] text-muted-foreground">
                Idioma preferido
              </Label>
              <Select
                value={language}
                onValueChange={(v) => setValue("preferred_language", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un idioma" />
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
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              size="lg"
              className="w-full text-[15px]"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear cuenta
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Inicia sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
