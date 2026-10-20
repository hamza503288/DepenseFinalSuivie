import { AnimatePresence } from 'framer-motion'
import { ExpenseItem } from './ExpenseItem'
import { toLocalISODate } from '@/lib/date'
import type { Expense } from '@/types'

interface ExpenseListProps {
  expenses: Expense[]
  onDelete: (id: string) => void
  emptyMessage?: string
}

function formatDateHeading(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  const today = toLocalISODate(new Date())
  const yesterday = toLocalISODate(new Date(Date.now() - 86_400_000))
  if (iso === today) return "Aujourd'hui"
  if (iso === yesterday) return 'Hier'
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Regroupe les dépenses par jour (elles arrivent déjà triées par date décroissante). */
function groupByDate(expenses: Expense[]): [string, Expense[]][] {
  const groups = new Map<string, Expense[]>()
  for (const expense of expenses) {
    const list = groups.get(expense.expense_date) ?? []
    list.push(expense)
    groups.set(expense.expense_date, list)
  }
  return [...groups.entries()]
}

export function ExpenseList({ expenses, onDelete, emptyMessage }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[var(--text-muted)]">
        {emptyMessage ?? 'Aucune dépense pour le moment.'}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {groupByDate(expenses).map(([date, items]) => (
        <div key={date}>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {formatDateHeading(date)}
            </h3>
            <span className="text-xs font-semibold tabular-nums text-[var(--text-secondary)]">
              {items.reduce((s, e) => s + e.amount, 0).toFixed(3)} DT
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {items.map((expense) => (
                <ExpenseItem key={expense.id} expense={expense} onDelete={onDelete} />
              ))}
            </AnimatePresence>
          </ul>
        </div>
      ))}
    </div>
  )
}
