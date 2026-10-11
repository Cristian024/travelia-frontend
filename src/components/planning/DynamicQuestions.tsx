import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import type {
  DynamicQuestion,
  QuestionAnswer,
} from "@/types/api"

type AnswerMap = Record<string, unknown>

interface Props {
  questions: DynamicQuestion[]
  value: AnswerMap
  onChange: (value: AnswerMap) => void
}

export function DynamicQuestions({ questions, value, onChange }: Props) {
  useEffect(() => {
    onChange({})

  }, [questions])

  const set = (qid: string, v: unknown) => onChange({ ...value, [qid]: v })

  return (
    <div className="space-y-6">
      {questions.map((q, i) => (
        <div
          key={q.question_id}
          className="animate-fade-up space-y-2.5"
          style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
        >
          <QuestionField
            question={q}
            value={value[q.question_id]}
            onChange={(v) => set(q.question_id, v)}
          />
        </div>
      ))}
    </div>
  )
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: DynamicQuestion
  value: unknown
  onChange: (v: unknown) => void
}) {
  const { question_id, question_text, question_type, options, required } = question

  return (
    <div className="space-y-2">
      <Label htmlFor={question_id} className="text-base">
        {question_text}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>

      {question_type === "text" && (
        <Textarea
          id={question_id}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {question_type === "number" && (
        <Input
          id={question_id}
          type="number"
          value={(value as number | string) ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
      )}

      {question_type === "date" && (
        <Input
          id={question_id}
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {question_type === "scale" && (
        <ScaleField value={value as number | undefined} onChange={onChange} />
      )}

      {question_type === "single_choice" && options && (
        <RadioGroup
          value={(value as string) ?? ""}
          onValueChange={onChange}
          className="gap-2.5"
        >
          {options.map((opt) => (
            <div
              key={opt}
              className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-all duration-200 ease-apple hover:border-primary/40 hover:bg-secondary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
            >
              <RadioGroupItem value={opt} id={`${question_id}-${opt}`} />
              <Label
                htmlFor={`${question_id}-${opt}`}
                className="flex-1 cursor-pointer font-normal"
              >
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {question_type === "multiple_choice" && options && (
        <MultipleChoiceField
          qid={question_id}
          options={options}
          value={(value as string[]) ?? []}
          onChange={onChange}
        />
      )}
    </div>
  )
}

function MultipleChoiceField({
  qid,
  options,
  value,
  onChange,
}: {
  qid: string
  options: string[]
  value: string[]
  onChange: (v: unknown) => void
}) {
  const toggle = (opt: string, checked: boolean) => {
    const next = checked ? [...value, opt] : value.filter((v) => v !== opt)
    onChange(next)
  }
  return (
    <div className="grid gap-2.5">
      {options.map((opt) => {
        const id = `${qid}-${opt}`
        const checked = value.includes(opt)
        return (
          <label
            key={opt}
            htmlFor={id}
            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-all duration-200 ease-apple hover:border-primary/40 hover:bg-secondary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
          >
            <Checkbox
              id={id}
              checked={checked}
              onCheckedChange={(c) => toggle(opt, c === true)}
            />
            <span className="flex-1 text-sm">{opt}</span>
          </label>
        )
      })}
    </div>
  )
}

function ScaleField({
  value,
  onChange,
}: {
  value: number | undefined
  onChange: (v: unknown) => void
}) {
  const [local, setLocal] = useState<number | undefined>(value)
  useEffect(() => setLocal(value), [value])
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => {
            setLocal(n)
            onChange(n)
          }}
          className={`h-11 w-11 rounded-xl border text-sm font-semibold transition-all duration-200 ease-apple active:scale-95 ${
            local === n
              ? "border-primary bg-primary text-primary-foreground shadow-apple-sm"
              : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

export function buildAnswers(
  questions: DynamicQuestion[],
  map: AnswerMap,
): QuestionAnswer[] {
  return questions.map((q) => ({
    question_id: q.question_id,
    answer: map[q.question_id] ?? null,
  }))
}

export function validateAnswers(
  questions: DynamicQuestion[],
  map: AnswerMap,
): string | null {
  for (const q of questions) {
    if (q.required === false) continue
    const v = map[q.question_id]
    if (v === undefined || v === null || v === "") {
      return `Por favor responde: "${q.question_text}"`
    }
    if (Array.isArray(v) && v.length === 0) {
      return `Selecciona al menos una opción en: "${q.question_text}"`
    }
  }
  return null
}
