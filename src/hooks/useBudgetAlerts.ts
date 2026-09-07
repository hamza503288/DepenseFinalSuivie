import { useEffect } from 'react'
import { BUDGET_PERIOD_LABELS, CATEGORY_LABELS } from '@/types'
import type { BudgetStatus } from '@/types'

const STORAGE_KEY = 'masrouf:notified-budget-levels'
const SEVERITY: Record<BudgetStatus['level'], number> = { ok: 0, warning: 1, serious: 2, critical: 3 }

function readNotified(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function writeNotified(map: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // Stockage indisponible (navigation privée...) : on ignore, l'alerte
    // visuelle reste affichée dans l'UI de toute façon.
  }
}

/**
 * Déclenche une notification locale uniquement quand un budget FRANCHIT un
 * nouveau palier de sévérité (jamais à chaque rendu), pour éviter de spammer
 * l'utilisateur. L'état déjà notifié est persisté en localStorage.
 */
export function useBudgetAlerts(
  statuses: BudgetStatus[],
  notify: (title: string, body: string) => void,
) {
  useEffect(() => {
    if (statuses.length === 0) return
    const notified = readNotified()
    let changed = false

    for (const status of statuses) {
      if (status.level === 'ok') continue
      const key = status.budget.id
      const previousSeverity = notified[key] ?? 0
      const currentSeverity = SEVERITY[status.level]

      if (currentSeverity > previousSeverity) {
        const scope = status.budget.category
          ? `${CATEGORY_LABELS[status.budget.category]} (${BUDGET_PERIOD_LABELS[status.budget.period]})`
          : `budget ${BUDGET_PERIOD_LABELS[status.budget.period].toLowerCase()}`
        const percent = Math.round(status.ratio * 100)
        const title = status.level === 'warning' ? '⚠️ Budget bientôt atteint' : '🚨 Budget dépassé'
        notify(title, `${percent}% du ${scope} déjà utilisé.`)
        notified[key] = currentSeverity
        changed = true
      } else if (currentSeverity < previousSeverity) {
        // Le budget est repassé sous le seuil (nouvelle période) : on réarme l'alerte.
        notified[key] = currentSeverity
        changed = true
      }
    }

    if (changed) writeNotified(notified)
  }, [statuses, notify])
}
