import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PeriodNavigatorProps {
  label: string
  onPrevious: () => void
  onNext: () => void
  /** Désactive "suivant" (ex: on ne navigue pas dans le futur). */
  nextDisabled?: boolean
  /** Raccourci de retour à la période courante, affiché seulement s'il est fourni. */
  onToday?: () => void
}

export function PeriodNavigator({ label, onPrevious, onNext, nextDisabled, onToday }: PeriodNavigatorProps) {
  const navButton =
    'tap-scale rounded-full p-2 text-[var(--text-secondary)] hover:bg-black/5 disabled:opacity-30 dark:hover:bg-white/10'
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[var(--surface-card)] px-2 py-1.5 shadow-sm">
      <button onClick={onPrevious} aria-label="Période précédente" className={navButton}>
        <ChevronLeft size={18} />
      </button>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold capitalize text-[var(--text-primary)]">{label}</span>
        {onToday && (
          <button
            onClick={onToday}
            className="tap-scale rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-500"
          >
            Aujourd'hui
          </button>
        )}
      </div>
      <button onClick={onNext} disabled={nextDisabled} aria-label="Période suivante" className={navButton}>
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
