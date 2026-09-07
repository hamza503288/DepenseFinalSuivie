import { useExpenses } from '@/context/ExpensesContext'
import { CategoryPieChart } from '@/components/charts/CategoryPieChart'
import { TrendChart } from '@/components/charts/TrendChart'
import { StatTile } from '@/components/charts/StatTile'
import { categoryTotals, expensesThisMonth, lastNDaysTrend } from '@/lib/statsUtils'

export function StatsPage() {
  const { expenses } = useExpenses()

  const monthExpenses = expensesThisMonth(expenses)
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const trend = lastNDaysTrend(expenses, 14)
  const totals = categoryTotals(monthExpenses)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-[var(--text-primary)]">Statistiques</h1>

      <StatTile label="Total ce mois-ci" value={`${monthTotal.toFixed(3)} DT`} />

      <TrendChart data={trend} />
      <CategoryPieChart data={totals} />
    </div>
  )
}
