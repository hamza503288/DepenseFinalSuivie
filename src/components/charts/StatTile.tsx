import type { ReactNode } from 'react'

interface StatTileProps {
  label: string
  value: string
  icon?: ReactNode
  tone?: 'default' | 'good' | 'critical'
}

const TONE_CLASSES: Record<NonNullable<StatTileProps['tone']>, string> = {
  default: 'text-[var(--text-primary)]',
  good: 'text-status-good',
  critical: 'text-status-critical',
}

export function StatTile({ label, value, icon, tone = 'default' }: StatTileProps) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-[var(--surface-card)] p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
        {icon}
        {label}
      </div>
      <p className={`text-2xl font-bold tabular-nums ${TONE_CLASSES[tone]}`}>{value}</p>
    </div>
  )
}
