import { useState } from 'react'
import { CalendarDays, List } from 'lucide-react'
import { useExpenses } from '@/context/ExpensesContext'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { ExpenseCalendar } from '@/components/expenses/ExpenseCalendar'
import { AddExpenseFab } from '@/components/expenses/AddExpenseFab'
import { CategoryIcon } from '@/components/CategoryIcon'
import { CATEGORIES, CATEGORY_LABELS } from '@/types'
import type { Category } from '@/types'

type ViewMode = 'agenda' | 'liste'

const VIEW_STORAGE_KEY = 'masrouf.expenses.view'

function readStoredView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === 'liste' ? 'liste' : 'agenda'
  } catch {
    return 'agenda'
  }
}

export function ExpensesPage() {
  const { expenses, deleteExpense, loading } = useExpenses()
  const [filter, setFilter] = useState<Category | 'toutes'>('toutes')
  const [view, setView] = useState<ViewMode>(readStoredView)

  const filtered = filter === 'toutes' ? expenses : expenses.filter((e) => e.category === filter)

  const changeView = (next: ViewMode) => {
    setView(next)
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next)
    } catch {
      // stockage indisponible (navigation privée) : la préférence n'est simplement pas retenue
    }
  }

  const chipClass = (active: boolean) =>
    `tap-scale flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium ${
      active ? 'bg-brand-500 text-white' : 'bg-black/5 text-[var(--text-secondary)] dark:bg-white/10'
    }`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Mes dépenses</h1>
        <div className="flex rounded-full bg-black/5 p-0.5 dark:bg-white/10" role="tablist" aria-label="Affichage">
          {(
            [
              { value: 'agenda', label: 'Agenda', Icon: CalendarDays },
              { value: 'liste', label: 'Liste', Icon: List },
            ] as const
          ).map(({ value, label, Icon }) => (
            <button
              key={value}
              role="tab"
              aria-selected={view === value}
              onClick={() => changeView(value)}
              className={`tap-scale flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                view === value
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button onClick={() => setFilter('toutes')} className={chipClass(filter === 'toutes')}>
          Toutes
        </button>
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)} className={chipClass(filter === cat)}>
            <CategoryIcon category={cat} size={13} />
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">Chargement…</p>
      ) : view === 'agenda' ? (
        <ExpenseCalendar expenses={filtered} onDelete={deleteExpense} />
      ) : (
        <ExpenseList expenses={filtered} onDelete={deleteExpense} emptyMessage="Aucune dépense dans cette catégorie." />
      )}

      <AddExpenseFab />
    </div>
  )
}
