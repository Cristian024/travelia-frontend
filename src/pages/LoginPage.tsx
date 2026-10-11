import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
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
import { useAuth } from "@/context/AuthContext"
import { apiErrorMessage } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const schema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const from = (location.state as { from?: Location })?.from?.pathname ?? "/"

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      await login(values)
      navigate(from, { replace: true })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo iniciar sesión",
        description: apiErrorMessage(err, "Credenciales incorrectas"),
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

      <Card className="animate-scale-in relative w-full max-w-md border-border/60 shadow-apple-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-primary to-primary/85 text-primary-foreground shadow-apple-sm">
            <Compass className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-[28px] leading-tight">
              Bienvenido a Travelia
            </CardTitle>
            <CardDescription className="text-balance">
              Inicia sesión para planificar tu próximo viaje
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] text-muted-foreground">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tunombre@email.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-[13px] text-muted-foreground"
              >
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
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
              Iniciar sesión
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link
                to="/register"
                className="font-medium text-primary hover:underline"
              >
                Regístrate
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
