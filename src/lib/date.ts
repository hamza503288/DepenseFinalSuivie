/**
 * Formate une date en "YYYY-MM-DD" à partir de ses composants LOCAUX.
 *
 * À utiliser partout où l'on manipule une date de dépense (jour civil de
 * l'utilisateur), par opposition à `toISOString()` qui convertit en UTC et
 * peut faire glisser la date d'un jour selon le fuseau horaire — bug réel
 * rencontré ici (le graphique de tendance plaçait une dépense du jour sur
 * la veille pour un fuseau en avance sur UTC).
 */
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
