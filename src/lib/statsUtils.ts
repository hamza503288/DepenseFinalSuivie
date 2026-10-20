import {
  addMonths,
  addYears,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfYear,
} from 'date-fns'
import { CATEGORIES } from '@/types'
import type { Category, Expense } from '@/types'
import { toLocalISODate } from '@/lib/date'

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

export type StatsPeriod = 'mois' | 'annee'

const round3 = (n: number) => Math.round(n * 1000) / 1000

/** Bornes ISO (incluses) de la période contenant `anchor` : le mois ou l'année civile. */
export function periodRange(period: StatsPeriod, anchor: Date): { start: string; end: string } {
  if (period === 'mois') {
    return { start: toLocalISODate(startOfMonth(anchor)), end: toLocalISODate(endOfMonth(anchor)) }
  }
  return { start: toLocalISODate(startOfYear(anchor)), end: toLocalISODate(endOfYear(anchor)) }
}

/** Même période décalée de `offset` (mois ou années). */
export function shiftPeriod(period: StatsPeriod, anchor: Date, offset: number): Date {
  return period === 'mois' ? addMonths(anchor, offset) : addYears(anchor, offset)
}

export function expensesBetween(expenses: Expense[], start: string, end: string): Expense[] {
  return expenses.filter((e) => e.expense_date >= start && e.expense_date <= end)
}

/** Total par jour du mois de `anchor`, chaque jour du mois présent (zéro comblé). */
export function dailyTotalsForMonth(expenses: Expense[], anchor: Date): { key: string; label: string; total: number }[] {
  const days = eachDayOfInterval({ start: startOfMonth(anchor), end: endOfMonth(anchor) })
  const totals = new Map<string, number>()
  for (const e of expenses) totals.set(e.expense_date, (totals.get(e.expense_date) ?? 0) + e.amount)
  return days.map((d) => {
    const iso = toLocalISODate(d)
    return { key: iso, label: String(d.getDate()), total: round3(totals.get(iso) ?? 0) }
  })
}

const MONTH_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

/** Total par mois de l'année de `anchor` (12 entrées). */
export function monthlyTotalsForYear(expenses: Expense[], anchor: Date): { key: string; label: string; total: number }[] {
  const year = anchor.getFullYear()
  const totals = new Array<number>(12).fill(0)
  for (const e of expenses) {
    if (Number(e.expense_date.slice(0, 4)) !== year) continue
    totals[Number(e.expense_date.slice(5, 7)) - 1] += e.amount
  }
  return totals.map((total, i) => ({
    key: `${year}-${String(i + 1).padStart(2, '0')}`,
    label: MONTH_SHORT[i],
    total: round3(total),
  }))
}

const WEEKDAY_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

/** Total par jour de la semaine (lundi en premier). */
export function weekdayTotals(expenses: Expense[]): { key: string; label: string; total: number }[] {
  const totals = new Array<number>(7).fill(0)
  for (const e of expenses) {
    const jsDay = new Date(`${e.expense_date}T00:00:00`).getDay() // 0 = dimanche
    totals[(jsDay + 6) % 7] += e.amount
  }
  return totals.map((total, i) => ({ key: WEEKDAY_SHORT[i], label: WEEKDAY_SHORT[i], total: round3(total) }))
}

export interface PeriodSummary {
  total: number
  count: number
  /** Moyenne par jour écoulé de la période (jours futurs exclus). */
  dailyAverage: number
  activeDays: number
  biggest: Expense | null
}

export function summarizePeriod(expenses: Expense[], start: string, end: string): PeriodSummary {
  const inRange = expensesBetween(expenses, start, end)
  const total = inRange.reduce((s, e) => s + e.amount, 0)
  const today = toLocalISODate(new Date())
  const lastDay = end < today ? end : today
  const elapsedDays =
    lastDay < start
      ? 0
      : differenceInCalendarDays(new Date(`${lastDay}T00:00:00`), new Date(`${start}T00:00:00`)) + 1
  return {
    total: round3(total),
    count: inRange.length,
    dailyAverage: elapsedDays > 0 ? round3(total / elapsedDays) : 0,
    activeDays: new Set(inRange.map((e) => e.expense_date)).size,
    biggest: inRange.reduce<Expense | null>((best, e) => (!best || e.amount > best.amount ? e : best), null),
  }
}

/** Total des `n` mois se terminant au mois de `anchor` (inclus), du plus ancien au plus récent. */
export function lastNMonthsTotals(expenses: Expense[], anchor: Date, n: number): { key: string; label: string; total: number }[] {
  const totals = new Map<string, number>()
  for (const e of expenses) {
    const key = e.expense_date.slice(0, 7)
    totals.set(key, (totals.get(key) ?? 0) + e.amount)
  }
  const result: { key: string; label: string; total: number }[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = addMonths(startOfMonth(anchor), -i)
    const key = toLocalISODate(d).slice(0, 7)
    result.push({ key, label: MONTH_SHORT[d.getMonth()], total: round3(totals.get(key) ?? 0) })
  }
  return result
}
