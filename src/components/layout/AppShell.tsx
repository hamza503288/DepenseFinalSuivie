import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

/** Ossature commune des pages authentifiées : contenu scrollable + nav basse fixe. */
export function AppShell() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-[var(--surface-page)]">
      <main className="flex-1 px-4 pb-28 pt-[calc(env(safe-area-inset-top)+16px)]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
