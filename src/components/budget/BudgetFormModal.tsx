import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, inputClassName } from '@/components/ui/Field'
import { BUDGET_PERIOD_LABELS, CATEGORIES, CATEGORY_LABELS } from '@/types'
import type { BudgetPeriod, Category, NewBudget } from '@/types'
import { newBudgetSchema } from '@/lib/validation'
import { useToast } from '@/context/ToastContext'

interface BudgetFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (budget: NewBudget) => Promise<{ error: string | null }>
}

const PERIODS: BudgetPeriod[] = ['jour', 'semaine', 'mois']

export function BudgetFormModal({ open, onClose, onSave }: BudgetFormModalProps) {
  const toast = useToast()
  const [period, setPeriod] = useState<BudgetPeriod>('mois')
  const [category, setCategory] = useState<Category | 'global'>('global')
  const [limitAmount, setLimitAmount] = useState('')
  const [alertThreshold, setAlertThreshold] = useState(80)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    const candidate = {
      period,
      category: category === 'global' ? null : category,
      limit_amount: parseFloat(limitAmount.replace(',', '.')),
      alert_threshold: alertThreshold / 100,
    }
    const result = newBudgetSchema.safeParse(candidate)
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Formulaire invalide.')
      return
    }

    setSaving(true)
    const { error: saveError } = await onSave(result.data)
    setSaving(false)

    if (saveError) {
      setError(saveError)
      return
    }
    toast.success('Budget créé !')
    setLimitAmount('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouveau budget">
      <div className="flex flex-col gap-4">
        <Field label="Période">
          <div className="grid grid-cols-3 gap-2">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`tap-scale rounded-xl border-2 py-2 text-sm font-medium ${
                  period === p
                    ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10'
                    : 'border-transparent bg-black/5 text-[var(--text-secondary)] dark:bg-white/5'
                }`}
              >
                {BUDGET_PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Catégorie" htmlFor="budget-category">
          <select
            id="budget-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | 'global')}
            className={inputClassName}
          >
            <option value="global">Toutes catégories (global)</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Plafond (DT)" htmlFor="limit">
          <input
            id="limit"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.001"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            className={inputClassName}
          />
        </Field>

        <Field label={`Seuil d'alerte : ${alertThreshold}%`} htmlFor="threshold">
          <input
            id="threshold"
            type="range"
            min={10}
            max={100}
            step={5}
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(Number(e.target.value))}
            className="w-full accent-brand-500"
          />
        </Field>

        {error && <p className="text-sm font-medium text-status-critical">{error}</p>}

        <div className="flex gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} fullWidth type="button">
            Annuler
          </Button>
          <Button onClick={handleSubmit} loading={saving} fullWidth type="button">
            Créer
          </Button>
        </div>
      </div>
    </Modal>
  )
}
