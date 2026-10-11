import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
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
import { expensesApi } from "@/lib/endpoints"
import { useToast } from "@/hooks/use-toast"
import { apiErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import type { ExpenseCategory } from "@/types/api"

interface Props {
  itineraryId: string
}

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "food", label: "Comida" },
  { value: "transport", label: "Transporte" },
  { value: "accommodation", label: "Alojamiento" },
  { value: "activities", label: "Actividades" },
  { value: "shopping", label: "Compras" },
  { value: "other", label: "Otros" },
]

const categoryLabel = (value: string) =>
  CATEGORIES.find((c) => c.value === value)?.label ?? value

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount)

export function BudgetPanel({ itineraryId }: Props) {
  const { toast } = useToast()
  const qc = useQueryClient()

  const summaryQuery = useQuery({
    queryKey: ["expenses-summary", itineraryId],
    queryFn: () => expensesApi.summary(itineraryId),
    enabled: !!itineraryId,
  })

  const listQuery = useQuery({
    queryKey: ["expenses", itineraryId],
    queryFn: () => expensesApi.list(itineraryId),
    enabled: !!itineraryId,
  })

  const [category, setCategory] = useState<ExpenseCategory>("food")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [expenseDate, setExpenseDate] = useState("")

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["expenses", itineraryId] })
    qc.invalidateQueries({ queryKey: ["expenses-summary", itineraryId] })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      expensesApi.create(itineraryId, {
        category,
        description: description.trim(),
        amount: Number(amount),
        expense_date: expenseDate,
      }),
    onSuccess: () => {
      setDescription("")
      setAmount("")
      setExpenseDate("")
      invalidate()
      toast({ title: "Gasto registrado" })
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "No se pudo registrar el gasto",
        description: apiErrorMessage(err),
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (expenseId: string) => expensesApi.remove(expenseId),
    onSuccess: () => {
      invalidate()
      toast({ title: "Gasto eliminado" })
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "No se pudo eliminar el gasto",
        description: apiErrorMessage(err),
      }),
  })

  const summary = summaryQuery.data
  const currency = summary?.currency ?? "USD"
  const real = summary?.total_real ?? 0
  const estimated = summary?.total_estimated ?? 0
  const pct = estimated > 0 ? Math.min(100, (real / estimated) * 100) : 0
  const overBudget = real > estimated

  const canSubmit =
    description.trim().length > 0 &&
    Number(amount) > 0 &&
    expenseDate.length > 0 &&
    !createMutation.isPending

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    createMutation.mutate()
  }

  if (summaryQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Wallet className="h-5 w-5 text-primary" />
            Resumen de presupuesto
          </CardTitle>
          <CardDescription>
            Comparación entre el costo estimado del itinerario y tus gastos
            reales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Gastado
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {money(real, currency)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Estimado
              </div>
              <div className="text-lg font-medium tabular-nums text-muted-foreground">
                {money(estimated, currency)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Progress
              value={pct}
              className={overBudget ? "[&>div]:bg-destructive" : undefined}
            />
            <div className="flex items-center justify-between text-sm">
              <Badge variant={overBudget ? "destructive" : "success"}>
                {overBudget ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {money(summary?.difference ?? 0, currency)}
              </Badge>
              <span className="text-muted-foreground">
                {summary?.expenses_count ?? 0} gastos registrados
              </span>
            </div>
          </div>

          {summary && summary.by_category.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                {summary.by_category.map((c) => (
                  <div key={c.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span>{categoryLabel(c.category)}</span>
                      <span className="font-medium tabular-nums">
                        {money(c.total, currency)}
                      </span>
                    </div>
                    <Progress
                      value={real > 0 ? Math.min(100, (c.total / real) * 100) : 0}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Añadir un gasto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[13px] text-muted-foreground">
                Categoría
              </Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ExpenseCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount" className="text-[13px] text-muted-foreground">
                Monto ({currency})
              </Label>
              <Input
                id="expense-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label
                htmlFor="expense-description"
                className="text-[13px] text-muted-foreground"
              >
                Descripción
              </Label>
              <Input
                id="expense-description"
                placeholder="Cena en el centro, taxi al aeropuerto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-date" className="text-[13px] text-muted-foreground">
                Fecha
              </Label>
              <Input
                id="expense-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={!canSubmit} className="w-full">
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Registrar gasto
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gastos registrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {listQuery.isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {listQuery.data && listQuery.data.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aún no has registrado gastos.
            </p>
          )}
          {listQuery.data?.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-apple-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {expense.description}
                  </span>
                  <Badge variant="secondary" className="shrink-0">
                    {categoryLabel(expense.category)}
                  </Badge>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(expense.expense_date)}
                </div>
              </div>
              <div className="shrink-0 text-sm font-semibold tabular-nums">
                {money(expense.amount, expense.currency)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                disabled={
                  deleteMutation.isPending &&
                  deleteMutation.variables === expense.id
                }
                onClick={() => deleteMutation.mutate(expense.id)}
                aria-label="Eliminar gasto"
              >
                {deleteMutation.isPending &&
                deleteMutation.variables === expense.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
