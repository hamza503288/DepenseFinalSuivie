import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Receipt, PieChart, Wallet, Settings } from 'lucide-react'

const TABS = [
  { to: '/', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/depenses', label: 'Dépenses', icon: Receipt, end: false },
  { to: '/stats', label: 'Stats', icon: PieChart, end: false },
  { to: '/budgets', label: 'Budgets', icon: Wallet, end: false },
  { to: '/reglages', label: 'Réglages', icon: Settings, end: false },
]

/** Barre de navigation mobile fixe, avec indicateur d'onglet actif animé. */
export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border-hairline)] bg-[var(--surface-card)]/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className="tap-scale relative flex flex-col items-center gap-1 px-2 py-2.5 text-xs font-medium"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-500"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={22}
                    className={isActive ? 'text-brand-500' : 'text-[var(--text-muted)]'}
                  />
                  <span className={isActive ? 'text-brand-500' : 'text-[var(--text-muted)]'}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
