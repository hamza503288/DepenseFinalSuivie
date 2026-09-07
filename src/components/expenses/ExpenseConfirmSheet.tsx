import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, inputClassName } from '@/components/ui/Field'
import { ReceiptUpload } from './ReceiptUpload'
import { CategoryIcon, categoryColorVar } from '@/components/CategoryIcon'
import { CATEGORIES, CATEGORY_LABELS } from '@/types'
import type { Category, NewExpense, ParsedExpense } from '@/types'
import { newExpenseSchema } from '@/lib/validation'
import { useToast } from '@/context/ToastContext'
import { toLocalISODate } from '@/lib/date'

interface ExpenseConfirmSheetProps {
  parsed: ParsedExpense | null
  userId: string
  onClose: () => void
  onSave: (expense: NewExpense) => Promise<{ error: string | null }>
}

/**
 * Étape de confirmation systématique entre le parsing (vocal ou texte) et
 * l'enregistrement : la darja étant ambiguë, l'utilisateur voit et corrige
 * chaque champ avant validation plutôt que de subir un enregistrement
 * automatique potentiellement faux.
 */
export function ExpenseConfirmSheet({ parsed, userId, onClose, onSave }: ExpenseConfirmSheetProps) {
  const toast = useToast()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>('autre')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    if (!parsed) return
    setAmount(parsed.amount !== null ? String(parsed.amount) : '')
    setCategory(parsed.category)
    setDescription(parsed.description)
    setDate(parsed.date)
    setReceiptUrl(null)
    setFieldError(null)
  }, [parsed])

  async function handleSave() {
    const parsedAmount = parseFloat(amount.replace(',', '.'))
    const candidate = {
      amount: parsedAmount,
      category,
      description: description.trim(),
      expense_date: date,
      source: (parsed?.rawText ? 'vocal' : 'manuel') as NewExpense['source'],
      raw_text: parsed?.rawText ?? null,
      receipt_url: receiptUrl,
      confidence: parsed?.confidence ?? null,
    }

    const result = newExpenseSchema.safeParse(candidate)
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? 'Formulaire invalide.')
      return
    }

    setSaving(true)
    const { error } = await onSave(result.data)
    setSaving(false)

    if (error) {
      toast.error(`Échec de l'enregistrement : ${error}`)
      return
    }
    toast.success('Dépense enregistrée !')
    onClose()
  }

  return (
    <Modal open={Boolean(parsed)} onClose={onClose} title="Confirmer la dépense">
      {parsed && (
        <div className="flex flex-col gap-4">
          {parsed.rawText && (
            <div className="rounded-xl bg-black/5 px-3 py-2 text-sm italic text-[var(--text-secondary)] dark:bg-white/5">
              « {parsed.rawText} »
            </div>
          )}

          {parsed.warnings.length > 0 ? (
            <div className="flex items-start gap-2 rounded-xl bg-status-warning/15 px-3 py-2 text-xs text-[var(--text-primary)]">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-status-warning" />
              <ul className="space-y-0.5">
                {parsed.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-status-good/15 px-3 py-2 text-xs font-medium text-status-good">
              <CheckCircle2 size={16} /> Compris avec confiance ({Math.round(parsed.confidence * 100)}%)
            </div>
          )}

          <Field label="Montant (DT)" htmlFor="amount">
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClassName}
            />
          </Field>

          <Field label="Catégorie">
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`tap-scale flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-[10px] font-medium ${
                    category === cat
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                      : 'border-transparent bg-black/5 dark:bg-white/5'
                  }`}
                >
                  <CategoryIcon category={cat} size={18} style={{ color: categoryColorVar(cat) }} />
                  <span className="leading-tight text-[var(--text-secondary)]">
                    {CATEGORY_LABELS[cat]}
                  </span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Description" htmlFor="description">
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={280}
              className={inputClassName}
              placeholder="Optionnel"
            />
          </Field>

          <Field label="Date" htmlFor="date">
            <input
              id="date"
              type="date"
              value={date}
              max={toLocalISODate(new Date())}
              onChange={(e) => setDate(e.target.value)}
              className={inputClassName}
            />
          </Field>

          <Field label="Photo de la facture">
            <ReceiptUpload userId={userId} value={receiptUrl} onChange={setReceiptUrl} />
          </Field>

          {fieldError && <p className="text-sm font-medium text-status-critical">{fieldError}</p>}

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} fullWidth type="button">
              Annuler
            </Button>
            <Button onClick={handleSave} loading={saving} fullWidth type="button">
              Enregistrer
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
