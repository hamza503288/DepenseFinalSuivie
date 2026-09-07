import { startOfMonth } from 'date-fns'
import { CATEGORIES } from '@/types'
import type { Category, Expense } from '@/types'
import { toLocalISODate } from '@/lib/date'

/** Total dépensé par jour sur les `days` derniers jours (inclus aujourd'hui), zéro comblé. */
export function lastNDaysTrend(expenses: Expense[], days: number): { date: string; total: number }[] {
  const totalsByDay = new Map<string, number>()
  for (const e of expenses) {
    totalsByDay.set(e.expense_date, (totalsByDay.get(e.expense_date) ?? 0) + e.amount)
  }

  const result: { date: string; total: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = toLocalISODate(d)
    result.push({ date: iso, total: Math.round((totalsByDay.get(iso) ?? 0) * 1000) / 1000 })
  }
  return result
}

export function categoryTotals(expenses: Expense[]): { category: Category; total: number }[] {
  const totals = new Map<Category, number>(CATEGORIES.map((c) => [c, 0]))
  for (const e of expenses) {
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount)
  }
  return CATEGORIES.map((category) => ({ category, total: totals.get(category) ?? 0 }))
}

export function expensesThisMonth(expenses: Expense[]): Expense[] {
  const start = toLocalISODate(startOfMonth(new Date()))
  return expenses.filter((e) => e.expense_date >= start)
}

export function topCategory(expenses: Expense[]): { category: Category; total: number } | null {
  const totals = categoryTotals(expenses).filter((t) => t.total > 0)
  if (totals.length === 0) return null
  return totals.reduce((best, current) => (current.total > best.total ? current : best))
}
