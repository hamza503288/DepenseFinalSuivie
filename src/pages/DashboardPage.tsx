import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, TrendingUp, Trophy } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useExpenses } from '@/context/ExpensesContext'
import { useBudgets } from '@/context/BudgetsContext'
import { useNotifications } from '@/hooks/useNotifications'
import { useBudgetAlerts } from '@/hooks/useBudgetAlerts'
import { computeBudgetStatus } from '@/lib/budgetUtils'
import { expensesThisMonth, topCategory } from '@/lib/statsUtils'
import { VoiceRecorder } from '@/components/expenses/VoiceRecorder'
import { ExpenseConfirmSheet } from '@/components/expenses/ExpenseConfirmSheet'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { StatTile } from '@/components/charts/StatTile'
import { CATEGORY_LABELS } from '@/types'
import type { ParsedExpense } from '@/types'

export function DashboardPage() {
  const { user } = useAuth()
  const { expenses, loading: expensesLoading, addExpense, deleteExpense } = useExpenses()
  const { budgets } = useBudgets()
  const { notifyLocal } = useNotifications(user?.id)
  const [parsed, setParsed] = useState<ParsedExpense | null>(null)

  const statuses = budgets.map((b) => computeBudgetStatus(b, expenses))
  useBudgetAlerts(statuses, notifyLocal)

  const monthExpenses = expensesThisMonth(expenses)
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const dayOfMonth = new Date().getDate()
  const avgPerDay = monthTotal / dayOfMonth
  const top = topCategory(monthExpenses)

  const worstAlert = statuses
    .filter((s) => s.level !== 'ok')
    .sort((a, b) => b.ratio - a.ratio)[0]

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Salut 👋</h1>
        <p className="text-sm text-[var(--text-secondary)]">Raconte ta dernière dépense.</p>
      </header>

      <VoiceRecorder onParsed={setParsed} />

      {worstAlert && (
        <Link
          to="/budgets"
          className="rounded-2xl bg-status-warning/15 px-4 py-3 text-sm font-medium text-[var(--text-primary)]"
        >
          ⚠️ {Math.round(worstAlert.ratio * 100)}% de ton budget{' '}
          {worstAlert.budget.category ? CATEGORY_LABELS[worstAlert.budget.category] : 'global'} est déjà utilisé.
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Ce mois-ci" value={`${monthTotal.toFixed(3)} DT`} icon={<Wallet size={14} />} />
        <StatTile label="Moyenne / jour" value={`${avgPerDay.toFixed(3)} DT`} icon={<TrendingUp size={14} />} />
        {top && (
          <StatTile
            label="Top catégorie"
            value={CATEGORY_LABELS[top.category]}
            icon={<Trophy size={14} />}
          />
        )}
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Dépenses récentes</h2>
          <Link to="/depenses" className="text-xs font-medium text-brand-500">
            Tout voir
          </Link>
        </div>
        {expensesLoading ? (
          <p className="py-10 text-center text-sm text-[var(--text-muted)]">Chargement…</p>
        ) : (
          <ExpenseList expenses={expenses.slice(0, 5)} onDelete={deleteExpense} />
        )}
      </section>

      {user && (
        <ExpenseConfirmSheet
          parsed={parsed}
          userId={user.id}
          onClose={() => setParsed(null)}
          onSave={addExpense}
        />
      )}
    </div>
  )
}
