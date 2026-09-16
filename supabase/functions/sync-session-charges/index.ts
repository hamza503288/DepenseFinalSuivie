// Edge Function Supabase (Deno) : synchronise le montant d'une dépense avec
// la colonne `charges` de la table `sessions` d'un second projet Supabase
// (système de caisse externe), en comparant la date de la dépense à
// `date_session`. Les identifiants de ce second projet restent secrets
// côté serveur — ne jamais les exposer au client, sa table `sessions`
// contient des données financières réelles (dépôts bancaires, statuts...)
// et son RLS autorise l'écriture par clé anonyme.

// .trim() : les secrets collés depuis un tableau de bord embarquent parfois
// un espace ou saut de ligne final, ce qui invalide l'URL construite plus
// bas et faisait planter fetch() avant même d'atteindre le try/catch.
const SESSIONS_URL = Deno.env.get('SESSIONS_SUPABASE_URL')?.trim().replace(/\/+$/, '')
const SESSIONS_KEY = Deno.env.get('SESSIONS_SUPABASE_ANON_KEY')?.trim()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SyncRequestBody {
  /** Date de la dépense (YYYY-MM-DD), comparée à date_session. */
  date: string
  /** Variation à appliquer aux charges : positive à la création, négative à la suppression. */
  delta: number
}

interface SessionRow {
  id: number
  charges: number | null
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Méthode non supportée.' }, 405)

  if (!SESSIONS_URL || !SESSIONS_KEY) {
    return jsonResponse(
      { error: 'Synchronisation sessions non configurée (secrets SESSIONS_SUPABASE_* manquants).' },
      500,
    )
  }

  let body: SyncRequestBody
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Corps de requête invalide.' }, 400)
  }

  const { date, delta } = body
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || typeof delta !== 'number' || !Number.isFinite(delta)) {
    return jsonResponse({ error: 'Paramètres invalides (date ou delta).' }, 400)
  }

  const sessionsHeaders = {
    apikey: SESSIONS_KEY,
    Authorization: `Bearer ${SESSIONS_KEY}`,
    'Content-Type': 'application/json',
  }

  let sessions: SessionRow[]
  try {
    const findRes = await fetch(
      `${SESSIONS_URL}/rest/v1/sessions?date_session=eq.${date}&select=id,charges`,
      { headers: sessionsHeaders },
    )
    if (!findRes.ok) {
      return jsonResponse({ error: `Échec de la recherche de session (${findRes.status}).` }, 502)
    }
    sessions = await findRes.json()
  } catch (err) {
    return jsonResponse({ error: `Impossible de joindre le projet sessions : ${String(err)}` }, 502)
  }

  if (sessions.length === 0) {
    return jsonResponse({ matched: false, count: 0 })
  }

  let count = 0
  for (const session of sessions) {
    const newCharges = Math.max(0, Math.round(((session.charges ?? 0) + delta) * 1000) / 1000)
    try {
      const updateRes = await fetch(`${SESSIONS_URL}/rest/v1/sessions?id=eq.${session.id}`, {
        method: 'PATCH',
        headers: sessionsHeaders,
        body: JSON.stringify({ charges: newCharges }),
      })
      if (updateRes.ok) count++
    } catch {
      // Une session échoue à se mettre à jour : on continue avec les autres.
    }
  }

  return jsonResponse({ matched: true, count })
})
