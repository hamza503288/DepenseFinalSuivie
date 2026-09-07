/**
 * Calcul de l'état des budgets (dépensé / restant / niveau d'alerte) à partir
 * des dépenses réelles. Séparé des hooks pour rester facilement testable.
 */
import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from 'date-fns'
import type { Budget, BudgetStatus, Expense } from '@/types'

export function getPeriodRange(period: Budget['period'], reference = new Date()) {
  switch (period) {
    case 'jour':
      return { start: startOfDay(reference), end: endOfDay(reference) }
    case 'semaine':
      return {
        start: startOfWeek(reference, { weekStartsOn: 1 }),
        end: endOfWeek(reference, { weekStartsOn: 1 }),
      }
    case 'mois':
      return { start: startOfMonth(reference), end: endOfMonth(reference) }
  }
}

function levelFromRatio(ratio: number, alertThreshold: number): BudgetStatus['level'] {
  if (ratio >= 1.2) return 'critical'
  if (ratio >= 1) return 'serious'
  if (ratio >= alertThreshold) return 'warning'
  return 'ok'
}

export function computeBudgetStatus(
  budget: Budget,
  expenses: Expense[],
  reference = new Date(),
): BudgetStatus {
  const { start, end } = getPeriodRange(budget.period, reference)

  const spent = expenses
    .filter((e) => {
      if (budget.category && e.category !== budget.category) return false
      const d = new Date(`${e.expense_date}T00:00:00`)
      return d >= start && d <= end
    })
    .reduce((sum, e) => sum + e.amount, 0)

  const ratio = budget.limit_amount > 0 ? spent / budget.limit_amount : 0

  return {
    budget,
    spent: Math.round(spent * 1000) / 1000,
    remaining: Math.round((budget.limit_amount - spent) * 1000) / 1000,
    ratio,
    level: levelFromRatio(ratio, budget.alert_threshold),
  }
}
