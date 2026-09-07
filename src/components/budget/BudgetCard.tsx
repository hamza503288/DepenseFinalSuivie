import { motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, AlertCircle, Flame, Trash2 } from 'lucide-react'
import { BUDGET_PERIOD_LABELS, CATEGORY_LABELS } from '@/types'
import type { BudgetStatus } from '@/types'

const LEVEL_META: Record<
  BudgetStatus['level'],
  { color: string; icon: typeof CheckCircle2; label: string }
> = {
  ok: { color: 'var(--color-status-good)', icon: CheckCircle2, label: 'En bonne voie' },
  warning: { color: 'var(--color-status-warning)', icon: AlertTriangle, label: 'Attention, seuil approché' },
  serious: { color: 'var(--color-status-serious)', icon: AlertCircle, label: 'Budget dépassé' },
  critical: { color: 'var(--color-status-critical)', icon: Flame, label: 'Fortement dépassé' },
}

interface BudgetCardProps {
  status: BudgetStatus
  onDelete: (id: string) => void
}

export function BudgetCard({ status, onDelete }: BudgetCardProps) {
  const { budget, spent, remaining, ratio, level } = status
  const meta = LEVEL_META[level]
  const Icon = meta.icon
  const widthPercent = Math.min(100, Math.round(ratio * 100))

  return (
    <div className="rounded-2xl bg-[var(--surface-card)] p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {BUDGET_PERIOD_LABELS[budget.period]}
            {budget.category ? ` · ${CATEGORY_LABELS[budget.category]}` : ' · Global'}
          </p>
          <p className="flex items-center gap-1 text-xs font-medium" style={{ color: meta.color }}>
            <Icon size={13} /> {meta.label}
          </p>
        </div>
        <button
          onClick={() => onDelete(budget.id)}
          aria-label="Supprimer le budget"
          className="tap-scale rounded-full p-1.5 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="mb-1.5 h-2.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: meta.color }}
          initial={{ width: 0 }}
          animate={{ width: `${widthPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
        <span>
          {spent.toFixed(3)} / {budget.limit_amount.toFixed(3)} DT
        </span>
        <span>{remaining >= 0 ? `${remaining.toFixed(3)} DT restants` : `${Math.abs(remaining).toFixed(3)} DT en trop`}</span>
      </div>
    </div>
  )
}
