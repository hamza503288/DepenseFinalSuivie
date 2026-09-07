// Edge Function Supabase (Deno) : vérifie les budgets de tous les
// utilisateurs et envoie une notification push aux dépassements détectés.
// Conçue pour être appelée périodiquement par un cron (voir README.md du
// dossier). Ne s'exécute pas côté client — nécessite un déploiement Supabase.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!

webpush.setVapidDetails('mailto:contact@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

type Period = 'jour' | 'semaine' | 'mois'

function periodStart(period: Period): string {
  const now = new Date()
  if (period === 'jour') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10)
  }
  if (period === 'semaine') {
    const day = (now.getDay() + 6) % 7 // lundi = 0
    const monday = new Date(now)
    monday.setDate(now.getDate() - day)
    return monday.toISOString().slice(0, 10)
  }
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

Deno.serve(async () => {
  const { data: budgets, error: budgetsError } = await supabase.from('budgets').select('*')
  if (budgetsError) {
    return new Response(JSON.stringify({ error: budgetsError.message }), { status: 500 })
  }

  let sent = 0

  for (const budget of budgets ?? []) {
    const start = periodStart(budget.period as Period)
    let query = supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', budget.user_id)
      .gte('expense_date', start)

    if (budget.category) query = query.eq('category', budget.category)

    const { data: expenses } = await query
    const spent = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0)
    const ratio = budget.limit_amount > 0 ? spent / budget.limit_amount : 0

    if (ratio < budget.alert_threshold) continue

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', budget.user_id)

    const level = ratio >= 1.2 ? 'critical' : ratio >= 1 ? 'serious' : 'warning'
    const percent = Math.round(ratio * 100)
    const payload = JSON.stringify({
      title: level === 'warning' ? '⚠️ Budget bientôt atteint' : '🚨 Budget dépassé',
      body: `${percent}% du budget ${budget.period}${budget.category ? ` (${budget.category})` : ''} utilisé.`,
    })

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
        sent++
      } catch {
        // Abonnement expiré ou invalide : on l'ignore, un nouveau sera créé
        // au prochain enregistrement du navigateur.
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, notificationsSent: sent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
