import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useExpenses as useExpensesData } from '@/hooks/useExpenses'

type ExpensesContextValue = ReturnType<typeof useExpensesData>

const ExpensesContext = createContext<ExpensesContextValue | undefined>(undefined)

/**
 * Fournit une unique instance des dépenses (état + canal realtime Supabase)
 * partagée par toute l'app authentifiée. Appeler useExpenses() séparément
 * dans plusieurs composants créerait plusieurs canaux realtime de même nom
 * et fait planter le SDK Supabase ("cannot add postgres_changes callbacks
 * ... after subscribe()") — d'où ce fournisseur unique en haut de l'arbre.
 */
export function ExpensesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const value = useExpensesData(user?.id)
  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>
}

export function useExpenses(): ExpensesContextValue {
  const ctx = useContext(ExpensesContext)
  if (!ctx) throw new Error('useExpenses doit être utilisé à l\'intérieur de <ExpensesProvider>.')
  return ctx
}
