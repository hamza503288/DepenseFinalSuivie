import { useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { useExpenses } from '@/context/ExpensesContext'
import { CategoryBreakdown } from '@/components/charts/CategoryBreakdown'
import { PeriodBarChart } from '@/components/charts/PeriodBarChart'
import { StatTile } from '@/components/charts/StatTile'
import { PeriodNavigator } from '@/components/ui/PeriodNavigator'
import { toLocalISODate } from '@/lib/date'
import {
  categoryTotals,
  dailyTotalsForMonth,
  expensesBetween,
  lastNMonthsTotals,
  monthlyTotalsForYear,
  periodRange,
  shiftPeriod,
  summarizePeriod,
  weekdayTotals,
  type StatsPeriod,
} from '@/lib/statsUtils'
import { CATEGORY_LABELS } from '@/types'

const PERIOD_TABS: { value: StatsPeriod; label: string }[] = [
  { value: 'mois', label: 'Mois' },
  { value: 'annee', label: 'Année' },
]

function periodLabel(period: StatsPeriod, anchor: Date): string {
  return period === 'mois'
    ? anchor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : String(anchor.getFullYear())
}

/** Variation en %, ou null si la période de référence est vide. */
function percentChange(current: number, previous: number): number | null {
  return previous > 0 ? ((current - previous) / previous) * 100 : null
}

function ChangeHint({ change, reference }: { change: number | null; reference: string }) {
  if (change === null) return <span>Pas de données {reference}</span>
  const up = change > 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className="flex items-center gap-1">
      <span className={`flex items-center gap-0.5 font-semibold ${up ? 'text-status-critical' : 'text-status-good'}`}>
        <Icon size={12} />
        {up ? '+' : ''}
        {change.toFixed(0)}%
      </span>
      {reference}
    </span>
  )
}

export function StatsPage() {
  const { expenses } = useExpenses()
  const [period, setPeriod] = useState<StatsPeriod>('mois')
  const [anchor, setAnchor] = useState(() => new Date())

  const today = toLocalISODate(new Date())
  const { start, end } = periodRange(period, anchor)
  const isCurrent = start <= today && today <= end

  const previousAnchor = shiftPeriod(period, anchor, -1)
  const previousRange = periodRange(period, previousAnchor)
  // Période en cours : on compare à la même durée écoulée de la période précédente
  // (ex: du 1er au 20 octobre vs du 1er au 20 septembre), sinon la comparaison est biaisée.
  const comparisonEnd = isCurrent ? toLocalISODate(shiftPeriod(period, new Date(), -1)) : previousRange.end

  const summary = summarizePeriod(expenses, start, end)
  const previousSummary = summarizePeriod(expenses, previousRange.start, comparisonEnd)
  const periodExpenses = expensesBetween(expenses, start, end)
  const previousExpenses = expensesBetween(expenses, previousRange.start, comparisonEnd)

  const reference = period === 'mois' ? 'vs mois précédent' : 'vs année précédente'
  const elapsedMonths = isCurrent ? new Date().getMonth() + 1 : 12

  const goTo = (offset: number) => setAnchor((a) => shiftPeriod(period, a, offset))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Statistiques</h1>
        <div className="flex rounded-full bg-black/5 p-0.5 dark:bg-white/10" role="tablist">
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={period === tab.value}
              onClick={() => setPeriod(tab.value)}
              className={`tap-scale rounded-full px-3.5 py-1 text-xs font-medium ${
                period === tab.value
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <PeriodNavigator
        label={periodLabel(period, anchor)}
        onPrevious={() => goTo(-1)}
        onNext={() => goTo(1)}
        nextDisabled={end >= today}
        onToday={isCurrent ? undefined : () => setAnchor(new Date())}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Total"
          value={`${summary.total.toFixed(3)} DT`}
          size="sm"
          hint={<ChangeHint change={percentChange(summary.total, previousSummary.total)} reference={reference} />}
        />
        <StatTile
          label={period === 'mois' ? 'Moyenne / jour' : 'Moyenne / mois'}
          value={`${(period === 'mois' ? summary.dailyAverage : summary.total / elapsedMonths).toFixed(3)} DT`}
          size="sm"
          hint={period === 'annee' ? `${summary.dailyAverage.toFixed(3)} DT / jour` : undefined}
        />
        <StatTile
          label="Dépenses"
          value={String(summary.count)}
          size="sm"
          hint={`${summary.activeDays} jour${summary.activeDays > 1 ? 's' : ''} avec dépenses`}
        />
        <StatTile
          label="Plus grosse dépense"
          value={summary.biggest ? `${summary.biggest.amount.toFixed(3)} DT` : '—'}
          size="sm"
          hint={
            summary.biggest && (
              <span className="block truncate">
                {summary.biggest.description || CATEGORY_LABELS[summary.biggest.category]} ·{' '}
                {new Date(`${summary.biggest.expense_date}T00:00:00`).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            )
          }
        />
      </div>

      {period === 'mois' ? (
        <>
          <PeriodBarChart
            title="Par jour"
            subtitle="ligne : moyenne / jour"
            data={dailyTotalsForMonth(periodExpenses, anchor)}
            tooltipLabel={(d) =>
              new Date(`${d.key}T00:00:00`).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })
            }
            average={summary.dailyAverage}
            highlightKey={today}
          />
          <PeriodBarChart
            title="6 derniers mois"
            subtitle="touchez un mois pour l'afficher"
            data={lastNMonthsTotals(expenses, anchor, 6)}
            tooltipLabel={(d) =>
              new Date(`${d.key}-01T00:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
            }
            highlightKey={start.slice(0, 7)}
            onSelect={(d) => setAnchor(new Date(`${d.key}-01T00:00:00`))}
          />
        </>
      ) : (
        <PeriodBarChart
          title="Par mois"
          subtitle="touchez un mois pour le détail"
          data={monthlyTotalsForYear(periodExpenses, anchor)}
          tooltipLabel={(d) =>
            new Date(`${d.key}-01T00:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
          }
          average={summary.total / elapsedMonths}
          highlightKey={today.slice(0, 7)}
          onSelect={(d) => {
            setAnchor(new Date(`${d.key}-01T00:00:00`))
            setPeriod('mois')
          }}
        />
      )}

      <CategoryBreakdown
        data={categoryTotals(periodExpenses)}
        previous={categoryTotals(previousExpenses)}
        previousLabel={period === 'mois' ? 'mois précédent' : 'année précédente'}
      />

      <PeriodBarChart title="Par jour de la semaine" data={weekdayTotals(periodExpenses)} />
    </div>
  )
}
