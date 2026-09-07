import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Table2, PieChartIcon } from 'lucide-react'
import { CATEGORY_LABELS } from '@/types'
import type { Category } from '@/types'
import { categoryColorVar } from '@/components/CategoryIcon'

interface CategoryPieChartProps {
  data: { category: Category; total: number }[]
}

interface TooltipPayloadItem {
  name: string
  value: number
  payload: { category: Category }
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg bg-[var(--surface-card)] px-3 py-2 text-xs shadow-lg ring-1 ring-black/5">
      <p className="font-semibold text-[var(--text-primary)]">{item.name}</p>
      <p className="text-[var(--text-secondary)]">{item.value.toFixed(3)} DT</p>
    </div>
  )
}

/** Répartition des dépenses par catégorie, avec bascule vers une vue tableau accessible. */
export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const [tableView, setTableView] = useState(false)
  const sorted = [...data].filter((d) => d.total > 0).sort((a, b) => b.total - a.total)
  const total = sorted.reduce((s, d) => s + d.total, 0)

  if (sorted.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--text-muted)]">Aucune dépense à afficher.</p>
  }

  return (
    <div className="rounded-2xl bg-[var(--surface-card)] p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Par catégorie</h3>
        <button
          onClick={() => setTableView((v) => !v)}
          aria-label={tableView ? 'Afficher le graphique' : 'Afficher le tableau'}
          className="tap-scale rounded-full p-1.5 text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/10"
        >
          {tableView ? <PieChartIcon size={16} /> : <Table2 size={16} />}
        </button>
      </div>

      {tableView ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--text-muted)]">
              <th className="pb-2 font-medium">Catégorie</th>
              <th className="pb-2 text-right font-medium">Montant</th>
              <th className="pb-2 text-right font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => (
              <tr key={d.category} className="border-t border-[var(--border-hairline)]">
                <td className="flex items-center gap-2 py-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: categoryColorVar(d.category) }}
                  />
                  {CATEGORY_LABELS[d.category]}
                </td>
                <td className="py-2 text-right tabular-nums">{d.total.toFixed(3)} DT</td>
                <td className="py-2 text-right tabular-nums text-[var(--text-muted)]">
                  {((d.total / total) * 100).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={sorted}
                dataKey="total"
                nameKey="category"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                strokeWidth={2}
                stroke="var(--surface-card)"
              >
                {sorted.map((d) => (
                  <Cell key={d.category} fill={categoryColorVar(d.category)} />
                ))}
              </Pie>
              <Tooltip
                content={(props) => (
                  <ChartTooltip
                    active={props.active}
                    payload={props.payload?.map((p) => ({
                      name: CATEGORY_LABELS[p.payload.category as Category],
                      value: p.value as number,
                      payload: p.payload,
                    }))}
                  />
                )}
              />
            </PieChart>
          </ResponsiveContainer>

          <ul className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
            {sorted.map((d) => (
              <li key={d.category} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: categoryColorVar(d.category) }}
                />
                {CATEGORY_LABELS[d.category]}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
