import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  error?: string | null
  children: ReactNode
  htmlFor?: string
}

/** Enveloppe standard label + champ + message d'erreur pour les formulaires. */
export function Field({ label, error, children, htmlFor }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--text-secondary)]">
        {label}
      </label>
      {children}
      {error && <p className="text-xs font-medium text-status-critical">{error}</p>}
    </div>
  )
}

export const inputClassName =
  'w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-card)] px-3.5 py-2.5 text-[var(--text-primary)] outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
