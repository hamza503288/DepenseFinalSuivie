import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase'

/**
 * Répercute le montant d'une dépense sur la colonne `charges` de la table
 * `sessions` d'un second projet Supabase (voir supabase/functions/sync-session-charges).
 * Best-effort : ne lève jamais d'exception, la dépense elle-même doit rester
 * enregistrée/supprimée même si cette synchronisation échoue.
 */
export async function syncSessionCharges(
  date: string,
  delta: number,
): Promise<{ matched: boolean } | null> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/sync-session-charges`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date, delta }),
    })
    if (!response.ok) return null
    const data = await response.json()
    return { matched: Boolean(data.matched) }
  } catch {
    return null
  }
}

/** Formate une date "YYYY-MM-DD" en "DD/MM/YYYY" sans passer par Date (évite les décalages de fuseau). */
export function formatDateFR(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
