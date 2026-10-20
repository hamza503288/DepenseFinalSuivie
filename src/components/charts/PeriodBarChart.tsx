import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface PeriodBarDatum {
  key: string
  label: string
  total: number
}

interface PeriodBarChartProps {
  title: string
  subtitle?: string
  data: PeriodBarDatum[]
  /** Libellé complet affiché dans l'infobulle (ex: "12 octobre"). */
  tooltipLabel?: (d: PeriodBarDatum) => string
  /** Trace une ligne pointillée de moyenne. */
  average?: number
  averageLabel?: string
  /** Barre mise en avant (ex: aujourd'hui) — même teinte, plus foncée. */
  highlightKey?: string
  onSelect?: (d: PeriodBarDatum) => void
}

const BAR_COLOR = '#2a78d6'
const BAR_HIGHLIGHT = '#1a4f8f'

/** Une seule série (montant) : une seule teinte, barres fines arrondies côté données. */
export function PeriodBarChart({
  title,
  subtitle,
  data,
  tooltipLabel = (d) => d.label,
  average,
  averageLabel = 'Moyenne',
  highlightKey,
  onSelect,
}: PeriodBarChartProps) {
  const hasData = data.some((d) => d.total > 0)

  return (
    <div className="rounded-2xl bg-[var(--surface-card)] p-4 shadow-sm">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {subtitle && <span className="text-xs text-[var(--text-muted)]">{subtitle}</span>}
      </div>
      {!hasData ? (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">Aucune dépense sur cette période.</p>
      ) : (
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barCategoryGap={2}>
            <CartesianGrid vertical={false} stroke="var(--border-hairline)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              axisLine={{ stroke: 'var(--border-hairline)' }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={6}
            />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              cursor={{ fill: 'var(--border-hairline)', opacity: 0.5 }}
              content={({ active, payload }) => {
                const raw = payload?.[0]?.payload as PeriodBarDatum | undefined
                if (!active || !raw) return null
                return (
                  <div className="rounded-lg bg-[var(--surface-card)] px-3 py-2 text-xs shadow-lg ring-1 ring-black/5">
                    <p className="font-semibold text-[var(--text-primary)]">{tooltipLabel(raw)}</p>
                    <p className="tabular-nums text-[var(--text-secondary)]">{raw.total.toFixed(3)} DT</p>
                  </div>
                )
              }}
            />
            {average !== undefined && average > 0 && (
              <ReferenceLine
                y={average}
                stroke="var(--text-muted)"
                strokeDasharray="4 4"
                label={{ value: averageLabel, position: 'insideTopRight', fontSize: 10, fill: 'var(--text-muted)' }}
              />
            )}
            <Bar
              dataKey="total"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
              cursor={onSelect ? 'pointer' : undefined}
              onClick={onSelect ? (_, index) => onSelect(data[index]) : undefined}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.key === highlightKey ? BAR_HIGHLIGHT : BAR_COLOR} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
