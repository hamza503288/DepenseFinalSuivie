import { CategoryIcon, categoryColorVar } from '@/components/CategoryIcon'
import { CATEGORY_LABELS } from '@/types'
import type { Category } from '@/types'

interface CategoryBreakdownProps {
  data: { category: Category; total: number }[]
  /** Totaux de la période précédente, pour afficher l'évolution par catégorie. */
  previous?: { category: Category; total: number }[]
  previousLabel?: string
}

/**
 * Classement des catégories par montant. Avec 15 catégories, un camembert
 * devient illisible : des barres horizontales triées, chacune nommée et
 * accompagnée de son icône, gardent l'identité lisible sans dépendre de la couleur.
 */
export function CategoryBreakdown({ data, previous, previousLabel = 'période précédente' }: CategoryBreakdownProps) {
  const sorted = data.filter((d) => d.total > 0).sort((a, b) => b.total - a.total)
  const total = sorted.reduce((s, d) => s + d.total, 0)
  const max = sorted[0]?.total ?? 0
  const previousByCategory = new Map(previous?.map((p) => [p.category, p.total]))

  return (
    <div className="rounded-2xl bg-[var(--surface-card)] p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Par catégorie</h3>
        {previous && <span className="text-xs text-[var(--text-muted)]">vs {previousLabel}</span>}
      </div>

      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--text-muted)]">Aucune dépense à afficher.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((d) => {
            const prev = previousByCategory.get(d.category) ?? 0
            const delta = prev > 0 ? ((d.total - prev) / prev) * 100 : null
            return (
              <li key={d.category} className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `color-mix(in srgb, ${categoryColorVar(d.category)} 15%, transparent)` }}
                >
                  <CategoryIcon category={d.category} size={15} style={{ color: categoryColorVar(d.category) }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-[var(--text-primary)]">{CATEGORY_LABELS[d.category]}</span>
                    <span className="shrink-0 tabular-nums font-semibold text-[var(--text-primary)]">
                      {d.total.toFixed(3)} DT
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(d.total / max) * 100}%`, backgroundColor: categoryColorVar(d.category) }}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-[var(--text-muted)]">
                      {((d.total / total) * 100).toFixed(0)}%
                    </span>
                    {previous && (
                      <span
                        className={`w-12 shrink-0 text-right text-[11px] tabular-nums ${
                          delta === null
                            ? 'text-[var(--text-muted)]'
                            : delta > 0
                              ? 'text-status-critical'
                              : 'text-status-good'
                        }`}
                      >
                        {delta === null ? 'nouveau' : `${delta > 0 ? '+' : ''}${delta.toFixed(0)}%`}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
