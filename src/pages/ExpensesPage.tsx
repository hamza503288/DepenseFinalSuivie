import { useState } from 'react'
import { useExpenses } from '@/context/ExpensesContext'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { AddExpenseFab } from '@/components/expenses/AddExpenseFab'
import { CATEGORIES, CATEGORY_LABELS } from '@/types'
import type { Category } from '@/types'

export function ExpensesPage() {
  const { expenses, deleteExpense, loading } = useExpenses()
  const [filter, setFilter] = useState<Category | 'toutes'>('toutes')

  const filtered = filter === 'toutes' ? expenses : expenses.filter((e) => e.category === filter)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-[var(--text-primary)]">Mes dépenses</h1>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          onClick={() => setFilter('toutes')}
          className={`tap-scale shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ${
            filter === 'toutes' ? 'bg-brand-500 text-white' : 'bg-black/5 text-[var(--text-secondary)] dark:bg-white/10'
          }`}
        >
          Toutes
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`tap-scale shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ${
              filter === cat ? 'bg-brand-500 text-white' : 'bg-black/5 text-[var(--text-secondary)] dark:bg-white/10'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">Chargement…</p>
      ) : (
        <ExpenseList expenses={filtered} onDelete={deleteExpense} emptyMessage="Aucune dépense dans cette catégorie." />
      )}

      <AddExpenseFab />
    </div>
  )
}
