import type { ReactNode } from 'react'

interface StatTileProps {
  label: string
  value: string
  icon?: ReactNode
  tone?: 'default' | 'good' | 'critical'
  /** Ligne secondaire sous la valeur (ex: comparaison). */
  hint?: ReactNode
  size?: 'md' | 'sm'
}

const TONE_CLASSES: Record<NonNullable<StatTileProps['tone']>, string> = {
  default: 'text-[var(--text-primary)]',
  good: 'text-status-good',
  critical: 'text-status-critical',
}

export function StatTile({ label, value, icon, tone = 'default', hint, size = 'md' }: StatTileProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl bg-[var(--surface-card)] p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
        {icon}
        {label}
      </div>
      <p className={`truncate font-bold tabular-nums ${size === 'sm' ? 'text-lg' : 'text-2xl'} ${TONE_CLASSES[tone]}`}>
        {value}
      </p>
      {hint && <div className="text-xs text-[var(--text-muted)]">{hint}</div>}
    </div>
  )
}
