import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Expense, NewExpense } from '@/types'

/**
 * Gère la liste des dépenses de l'utilisateur avec mise à jour optimiste :
 * une dépense ajoutée apparaît immédiatement à l'écran, avant même la
 * confirmation du serveur, pour une interface sans latence perçue.
 * Un canal realtime garde la liste synchronisée entre appareils.
 */
export function useExpenses(userId: string | undefined) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (fetchError) setError(fetchError.message)
    else {
      setExpenses(data as Expense[])
      setError(null)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`expenses-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as Expense
            setExpenses((prev) => (prev.some((e) => e.id === row.id) ? prev : [row, ...prev]))
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as Expense
            setExpenses((prev) => prev.map((e) => (e.id === row.id ? row : e)))
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as { id: string }
            setExpenses((prev) => prev.filter((e) => e.id !== oldRow.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const addExpense = useCallback(
    async (expense: NewExpense): Promise<{ error: string | null }> => {
      if (!userId) return { error: 'Utilisateur non authentifié.' }

      const tempId = `temp-${crypto.randomUUID()}`
      const optimistic: Expense = {
        ...expense,
        id: tempId,
        user_id: userId,
        created_at: new Date().toISOString(),
      }
      setExpenses((prev) => [optimistic, ...prev])

      const { data, error: insertError } = await supabase
        .from('expenses')
        .insert({ ...expense, user_id: userId })
        .select()
        .single()

      if (insertError) {
        setExpenses((prev) => prev.filter((e) => e.id !== tempId))
        return { error: insertError.message }
      }

      setExpenses((prev) => prev.map((e) => (e.id === tempId ? (data as Expense) : e)))
      return { error: null }
    },
    [userId],
  )

  const deleteExpense = useCallback(async (id: string): Promise<{ error: string | null }> => {
    const previous = expenses
    setExpenses((prev) => prev.filter((e) => e.id !== id))
    const { error: deleteError } = await supabase.from('expenses').delete().eq('id', id)
    if (deleteError) {
      setExpenses(previous)
      return { error: deleteError.message }
    }
    return { error: null }
  }, [expenses])

  return { expenses, loading, error, addExpense, deleteExpense, refetch }
}
