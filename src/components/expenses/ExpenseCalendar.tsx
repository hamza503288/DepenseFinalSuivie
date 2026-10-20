import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { addMonths, eachDayOfInterval, endOfMonth, startOfMonth } from 'date-fns'
import { ExpenseItem } from './ExpenseItem'
import { ExpenseList } from './ExpenseList'
import { PeriodNavigator } from '@/components/ui/PeriodNavigator'
import { categoryColorVar } from '@/components/CategoryIcon'
import { toLocalISODate } from '@/lib/date'
import { CATEGORIES } from '@/types'
import type { Category, Expense } from '@/types'

interface ExpenseCalendarProps {
  expenses: Expense[]
  onDelete: (id: string) => void
}

const WEEKDAY_HEADERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

interface DaySummary {
  total: number
  count: number
  categories: Category[]
}

function summarizeByDay(expenses: Expense[]): Map<string, DaySummary> {
  const byDay = new Map<string, DaySummary>()
  for (const e of expenses) {
    const day = byDay.get(e.expense_date) ?? { total: 0, count: 0, categories: [] }
    day.total += e.amount
    day.count += 1
    if (!day.categories.includes(e.category)) day.categories.push(e.category)
    byDay.set(e.expense_date, day)
  }
  // Ordre catégoriel fixe pour que les pastilles d'une même catégorie soient toujours au même rang.
  for (const day of byDay.values()) {
    day.categories.sort((a, b) => CATEGORIES.indexOf(a) - CATEGORIES.indexOf(b))
  }
  return byDay
}

/** Montant compact pour une case de calendrier : 1250 → "1,3k", 45.5 → "45,5". */
function compactAmount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k`
  return n.toLocaleString('fr-FR', { maximumFractionDigits: n >= 100 ? 0 : 1 })
}

function formatDayHeading(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

/**
 * Agenda mensuel des dépenses : chaque case affiche le total du jour, avec un
 * fond d'autant plus soutenu que le jour est dépensier (une seule teinte).
 * Toucher un jour affiche son détail ; sans jour sélectionné, tout le mois est listé.
 */
export function ExpenseCalendar({ expenses, onDelete }: ExpenseCalendarProps) {
  const today = toLocalISODate(new Date())
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState<string | null>(today)

  const monthStart = toLocalISODate(startOfMonth(month))
  const monthEnd = toLocalISODate(endOfMonth(month))
  const monthExpenses = expenses.filter((e) => e.expense_date >= monthStart && e.expense_date <= monthEnd)
  const byDay = summarizeByDay(monthExpenses)
  const maxDay = Math.max(0, ...[...byDay.values()].map((d) => d.total))
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0)

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const leadingBlanks = (days[0].getDay() + 6) % 7 // calendrier commençant le lundi

  const changeMonth = (offset: number) => {
    const next = addMonths(month, offset)
    setMonth(next)
    const nextKey = toLocalISODate(next).slice(0, 7)
    setSelected(today.startsWith(nextKey) ? today : null)
  }

  const selectedExpenses = selected ? monthExpenses.filter((e) => e.expense_date === selected) : []
  const selectedTotal = selectedExpenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="flex flex-col gap-4">
      <PeriodNavigator
        label={month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        onPrevious={() => changeMonth(-1)}
        onNext={() => changeMonth(1)}
        onToday={
          monthStart <= today && today <= monthEnd
            ? undefined
            : () => {
                setMonth(startOfMonth(new Date()))
                setSelected(today)
              }
        }
      />

      <div className="rounded-2xl bg-[var(--surface-card)] p-3 shadow-sm">
        <div className="mb-2 flex items-baseline justify-between px-1 text-xs">
          <span className="text-[var(--text-muted)]">
            {monthExpenses.length} dépense{monthExpenses.length > 1 ? 's' : ''}
          </span>
          <span className="font-semibold tabular-nums text-[var(--text-primary)]">{monthTotal.toFixed(3)} DT</span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_HEADERS.map((d, i) => (
            <div key={i} className="pb-1 text-[11px] font-medium text-[var(--text-muted)]">
              {d}
            </div>
          ))}

          {Array.from({ length: leadingBlanks }, (_, i) => (
            <div key={`blank-${i}`} />
          ))}

          {days.map((d) => {
            const iso = toLocalISODate(d)
            const summary = byDay.get(iso)
            const isSelected = iso === selected
            const isToday = iso === today
            const isFuture = iso > today
            // Intensité séquentielle (une teinte) : 12 % à 55 % selon le poids du jour dans le mois.
            const intensity = summary && maxDay > 0 ? 12 + Math.round((summary.total / maxDay) * 43) : 0
            return (
              <button
                key={iso}
                onClick={() => setSelected(isSelected ? null : iso)}
                aria-pressed={isSelected}
                aria-label={`${formatDayHeading(iso)}${summary ? ` : ${summary.total.toFixed(3)} DT, ${summary.count} dépense(s)` : ' : aucune dépense'}`}
                className={`tap-scale flex aspect-square min-h-11 flex-col items-center justify-start gap-0.5 rounded-xl p-1 ${
                  isSelected ? 'ring-2 ring-brand-500' : isToday ? 'ring-1 ring-brand-500/50' : ''
                } ${isFuture ? 'opacity-50' : ''}`}
                style={
                  summary ? { backgroundColor: `color-mix(in srgb, #2a78d6 ${intensity}%, transparent)` } : undefined
                }
              >
                <span
                  className={`text-xs ${isToday ? 'font-bold text-brand-500' : 'font-medium text-[var(--text-primary)]'}`}
                >
                  {d.getDate()}
                </span>
                {summary && (
                  <>
                    <span className="text-[10px] font-semibold leading-none tabular-nums text-[var(--text-primary)]">
                      {compactAmount(summary.total)}
                    </span>
                    <span className="mt-auto flex gap-0.5" aria-hidden>
                      {summary.categories.slice(0, 3).map((c) => (
                        <span
                          key={c}
                          className="h-1.5 w-1.5 rounded-full ring-1 ring-[var(--surface-card)]"
                          style={{ backgroundColor: categoryColorVar(c) }}
                        />
                      ))}
                    </span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selected ? (
        <div>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {selected === today ? "Aujourd'hui" : formatDayHeading(selected)}
            </h3>
            {selectedExpenses.length > 0 && (
              <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">
                {selectedTotal.toFixed(3)} DT
              </span>
            )}
          </div>
          {selectedExpenses.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">Aucune dépense ce jour-là.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {selectedExpenses.map((expense) => (
                  <ExpenseItem key={expense.id} expense={expense} onDelete={onDelete} />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      ) : (
        <ExpenseList expenses={monthExpenses} onDelete={onDelete} emptyMessage="Aucune dépense ce mois-ci." />
      )}
    </div>
  )
}
