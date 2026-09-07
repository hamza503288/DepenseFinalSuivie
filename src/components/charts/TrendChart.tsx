import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface TrendChartProps {
  data: { date: string; total: number }[]
}

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function ChartTooltip({ date, value }: { date: string; value: number }) {
  return (
    <div className="rounded-lg bg-[var(--surface-card)] px-3 py-2 text-xs shadow-lg ring-1 ring-black/5">
      <p className="font-semibold text-[var(--text-primary)]">{formatDay(date)}</p>
      <p className="text-[var(--text-secondary)]">{value.toFixed(3)} DT</p>
    </div>
  )
}

/** Évolution des dépenses jour par jour — une seule série, teinte séquentielle bleue. */
export function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="rounded-2xl bg-[var(--surface-card)] p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Évolution</h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a78d6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2a78d6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border-hairline)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={{ stroke: 'var(--border-hairline)' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            content={({ active, payload }) => {
              const raw = payload?.[0]?.payload as { date: string; total: number } | undefined
              if (!active || !raw) return null
              return <ChartTooltip date={raw.date} value={raw.total} />
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#2a78d6"
            strokeWidth={2}
            fill="url(#trendFill)"
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
