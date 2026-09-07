import { motion } from 'framer-motion'
import { Trash2, Mic } from 'lucide-react'
import { CategoryIcon, categoryColorVar } from '@/components/CategoryIcon'
import { CATEGORY_LABELS } from '@/types'
import type { Expense } from '@/types'

interface ExpenseItemProps {
  expense: Expense
  onDelete: (id: string) => void
}

export function ExpenseItem({ expense, onDelete }: ExpenseItemProps) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 rounded-2xl bg-[var(--surface-card)] p-3 shadow-sm"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${categoryColorVar(expense.category)} 15%, transparent)` }}
      >
        <CategoryIcon category={expense.category} size={18} style={{ color: categoryColorVar(expense.category) }} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
          {expense.description || CATEGORY_LABELS[expense.category]}
        </p>
        <p className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          {expense.source === 'vocal' && <Mic size={11} />}
          {CATEGORY_LABELS[expense.category]} · {expense.expense_date}
        </p>
      </div>

      <p className="shrink-0 text-sm font-semibold text-[var(--text-primary)]">
        {expense.amount.toFixed(3)} DT
      </p>

      <button
        onClick={() => onDelete(expense.id)}
        aria-label="Supprimer"
        className="tap-scale shrink-0 rounded-full p-1.5 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
      >
        <Trash2 size={16} />
      </button>
    </motion.li>
  )
}
