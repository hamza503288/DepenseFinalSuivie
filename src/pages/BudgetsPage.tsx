import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useExpenses } from '@/context/ExpensesContext'
import { useBudgets } from '@/context/BudgetsContext'
import { computeBudgetStatus } from '@/lib/budgetUtils'
import { BudgetCard } from '@/components/budget/BudgetCard'
import { BudgetFormModal } from '@/components/budget/BudgetFormModal'
import { Button } from '@/components/ui/Button'

export function BudgetsPage() {
  const { expenses } = useExpenses()
  const { budgets, upsertBudget, deleteBudget } = useBudgets()
  const [formOpen, setFormOpen] = useState(false)

  const statuses = budgets.map((b) => computeBudgetStatus(b, expenses))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Mes budgets</h1>
        <Button icon={<Plus size={16} />} onClick={() => setFormOpen(true)}>
          Ajouter
        </Button>
      </div>

      {statuses.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">
          Aucun budget défini. Crée-en un pour recevoir des alertes de dépassement.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {statuses.map((status) => (
            <BudgetCard key={status.budget.id} status={status} onDelete={deleteBudget} />
          ))}
        </div>
      )}

      <BudgetFormModal open={formOpen} onClose={() => setFormOpen(false)} onSave={upsertBudget} />
    </div>
  )
}
