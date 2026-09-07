import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useBudgets as useBudgetsData } from '@/hooks/useBudgets'

type BudgetsContextValue = ReturnType<typeof useBudgetsData>

const BudgetsContext = createContext<BudgetsContextValue | undefined>(undefined)

/**
 * Même raison que ExpensesContext : une seule instance partagée évite des
 * requêtes dupliquées et garde le tableau de bord et la page Budgets
 * synchronisés (créer un budget sur l'un doit se refléter sur l'autre).
 */
export function BudgetsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const value = useBudgetsData(user?.id)
  return <BudgetsContext.Provider value={value}>{children}</BudgetsContext.Provider>
}

export function useBudgets(): BudgetsContextValue {
  const ctx = useContext(BudgetsContext)
  if (!ctx) throw new Error('useBudgets doit être utilisé à l\'intérieur de <BudgetsProvider>.')
  return ctx
}
