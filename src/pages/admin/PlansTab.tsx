import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { adminApi } from "@/lib/endpoints"
import { useToast } from "@/hooks/use-toast"
import { apiErrorMessage } from "@/lib/api"
import type { PlanResponse } from "@/types/api"

const schema = z.object({
  code: z.string().min(2, "Requerido"),
  name: z.string().min(2, "Requerido"),
  amount_in_cents: z.coerce.number().int().min(0, "Monto inválido"),
  currency: z.string().min(3, "3 letras").max(3, "3 letras"),
  duration_days: z.coerce.number().int().min(1, "Mínimo 1 día"),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100)

export function PlansTab() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PlanResponse | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: adminApi.plans.list,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminApi.plans.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "plans"] }),
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "No se pudo actualizar el plan",
        description: apiErrorMessage(err),
      }),
  })

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (plan: PlanResponse) => {
    setEditing(plan)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Gestiona los planes de suscripción disponibles para el checkout.
        </p>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          Nuevo plan
        </Button>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-10 text-center text-sm text-destructive">
            No se pudieron cargar los planes.
          </CardContent>
        </Card>
      )}

      {data && data.length === 0 && (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Package className="h-7 w-7" />
            </div>
            <p className="text-sm text-muted-foreground">
              Aún no hay planes creados.
            </p>
          </CardContent>
        </Card>
      )}

      {data && data.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-apple-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Código</th>
                  <th className="px-5 py-3 font-medium">Nombre</th>
                  <th className="px-5 py-3 font-medium">Monto</th>
                  <th className="px-5 py-3 font-medium">Duración</th>
                  <th className="px-5 py-3 font-medium">Activo</th>
                  <th className="px-5 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.map((plan) => (
                  <tr
                    key={plan.id}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="px-5 py-3.5">
                      <Badge variant="secondary">{plan.code}</Badge>
                    </td>
                    <td className="px-5 py-3.5 font-medium">{plan.name}</td>
                    <td className="px-5 py-3.5 tabular-nums">
                      {money(plan.amount_in_cents, plan.currency)}
                    </td>
                    <td className="px-5 py-3.5 tabular-nums text-muted-foreground">
                      {plan.duration_days} días
                    </td>
                    <td className="px-5 py-3.5">
                      <Switch
                        checked={plan.is_active}
                        disabled={
                          toggleMutation.isPending &&
                          toggleMutation.variables?.id === plan.id
                        }
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: plan.id, is_active: checked })
                        }
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground"
                          onClick={() => openEdit(plan)}
                          aria-label={`Editar ${plan.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeletePlanButton plan={plan} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PlanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={editing}
      />
    </div>
  )
}

function DeletePlanButton({ plan }: { plan: PlanResponse }) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.plans.remove(plan.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "plans"] })
      toast({ title: "Plan eliminado" })
      setOpen(false)
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "No se pudo eliminar",
        description: apiErrorMessage(err),
      }),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setOpen(true)}
        aria-label={`Eliminar ${plan.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Eliminar plan
          </DialogTitle>
          <DialogDescription>
            ¿Seguro que quieres eliminar{" "}
            <span className="font-medium text-foreground">{plan.name}</span>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
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

function PlanFormDialog({
  open,
  onOpenChange,
  plan,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  plan: PlanResponse | null
}) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const isEdit = !!plan

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      name: "",
      amount_in_cents: 0,
      currency: "COP",
      duration_days: 30,
      is_active: true,
    },
  })

  useEffect(() => {
    if (!open) return
    reset(
      plan
        ? {
            code: plan.code,
            name: plan.name,
            amount_in_cents: plan.amount_in_cents,
            currency: plan.currency,
            duration_days: plan.duration_days,
            is_active: plan.is_active,
          }
        : {
            code: "",
            name: "",
            amount_in_cents: 0,
            currency: "COP",
            duration_days: 30,
            is_active: true,
          },
    )
  }, [open, plan, reset])

  const is_active = watch("is_active")

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      plan
        ? adminApi.plans.update(plan.id, {
            name: values.name,
            amount_in_cents: values.amount_in_cents,
            currency: values.currency,
            duration_days: values.duration_days,
            is_active: values.is_active,
          })
        : adminApi.plans.create(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "plans"] })
      toast({ title: plan ? "Plan actualizado" : "Plan creado" })
      onOpenChange(false)
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: plan ? "No se pudo actualizar" : "No se pudo crear",
        description: apiErrorMessage(err),
      }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar plan" : "Nuevo plan"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza la información del plan. El código no es editable."
              : "Define un nuevo plan de suscripción con su precio en centavos."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor="plan-code" className="text-[13px] text-muted-foreground">
              Código
            </Label>
            <Input
              id="plan-code"
              placeholder="PREMIUM"
              disabled={isEdit}
              {...register("code")}
            />
            {errors.code && (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-name" className="text-[13px] text-muted-foreground">
              Nombre
            </Label>
            <Input id="plan-name" placeholder="Premium mensual" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="plan-amount"
              className="text-[13px] text-muted-foreground"
            >
              Monto (centavos)
            </Label>
            <Input
              id="plan-amount"
              type="number"
              min={0}
              step={100}
              {...register("amount_in_cents")}
            />
            {errors.amount_in_cents && (
              <p className="text-xs text-destructive">
                {errors.amount_in_cents.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="plan-currency"
              className="text-[13px] text-muted-foreground"
            >
              Moneda
            </Label>
            <Input
              id="plan-currency"
              maxLength={3}
              placeholder="COP"
              {...register("currency")}
            />
            {errors.currency && (
              <p className="text-xs text-destructive">{errors.currency.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="plan-duration"
              className="text-[13px] text-muted-foreground"
            >
              Duración (días)
            </Label>
            <Input
              id="plan-duration"
              type="number"
              min={1}
              {...register("duration_days")}
            />
            {errors.duration_days && (
              <p className="text-xs text-destructive">
                {errors.duration_days.message}
              </p>
            )}
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-3 self-end rounded-2xl border border-border/70 bg-secondary/40 p-3.5">
            <span className="text-sm font-medium">Plan activo</span>
            <Switch
              checked={is_active}
              onCheckedChange={(c) =>
                setValue("is_active", c, { shouldDirty: true })
              }
            />
          </label>

          <DialogFooter className="gap-2 sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
