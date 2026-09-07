import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Budget, NewBudget } from '@/types'

export function useBudgets(userId: string | undefined) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (fetchError) setError(fetchError.message)
    else {
      setBudgets(data as Budget[])
      setError(null)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const upsertBudget = useCallback(
    async (budget: NewBudget, existingId?: string): Promise<{ error: string | null }> => {
      if (!userId) return { error: 'Utilisateur non authentifié.' }

      if (existingId) {
        const { data, error: updateError } = await supabase
          .from('budgets')
          .update(budget)
          .eq('id', existingId)
          .select()
          .single()
        if (updateError) return { error: updateError.message }
        setBudgets((prev) => prev.map((b) => (b.id === existingId ? (data as Budget) : b)))
        return { error: null }
      }

      const { data, error: insertError } = await supabase
        .from('budgets')
        .insert({ ...budget, user_id: userId })
        .select()
        .single()
      if (insertError) {
        // Contrainte unique (user_id, period, catégorie) déjà utilisée.
        if (insertError.code === '23505') {
          return { error: 'Un budget existe déjà pour cette période et cette catégorie.' }
        }
        return { error: insertError.message }
      }
      setBudgets((prev) => [...prev, data as Budget])
      return { error: null }
    },
    [userId],
  )

  const deleteBudget = useCallback(async (id: string): Promise<{ error: string | null }> => {
    const previous = budgets
    setBudgets((prev) => prev.filter((b) => b.id !== id))
    const { error: deleteError } = await supabase.from('budgets').delete().eq('id', id)
    if (deleteError) {
      setBudgets(previous)
      return { error: deleteError.message }
    }
    return { error: null }
  }, [budgets])

  return { budgets, loading, error, upsertBudget, deleteBudget, refetch }
}
