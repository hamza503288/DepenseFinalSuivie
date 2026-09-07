import { Bell, BellRing, LogOut, Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/hooks/useNotifications'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const { permission, requestPermission, subscribeToPush } = useNotifications(user?.id)
  const toast = useToast()

  async function handleEnableNotifications() {
    const result = await requestPermission()
    if (result !== 'granted') {
      toast.warning('Notifications refusées — active-les dans les réglages du navigateur.')
      return
    }
    toast.success('Notifications activées !')
    const { error } = await subscribeToPush()
    if (error) {
      // La notification locale fonctionne déjà même si le push serveur échoue
      // (clé VAPID absente, navigateur non compatible, etc.).
      toast.info("Alertes locales actives. Push serveur indisponible : " + error)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-[var(--text-primary)]">Réglages</h1>

      <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-card)] p-4 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
          <Mail size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{user?.email}</p>
          <p className="text-xs text-[var(--text-muted)]">Compte connecté</p>
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--surface-card)] p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          {permission === 'granted' ? (
            <BellRing size={18} className="text-status-good" />
          ) : (
            <Bell size={18} className="text-[var(--text-muted)]" />
          )}
          <p className="text-sm font-medium text-[var(--text-primary)]">Notifications de budget</p>
        </div>
        <p className="mb-3 text-xs text-[var(--text-secondary)]">
          Reçois une alerte quand un budget approche ou dépasse sa limite.
        </p>
        {permission === 'granted' ? (
          <p className="text-xs font-medium text-status-good">Activées ✓</p>
        ) : (
          <Button variant="secondary" onClick={handleEnableNotifications}>
            Activer les notifications
          </Button>
        )}
      </div>

      <Button variant="danger" icon={<LogOut size={16} />} onClick={signOut}>
        Se déconnecter
      </Button>
    </div>
  )
}
