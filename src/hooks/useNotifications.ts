import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(new ArrayBuffer(rawData.length))
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

/**
 * Notifications de dépassement de budget.
 *
 * Deux niveaux, du plus simple au plus robuste :
 *  - notification locale (Notification API) : fonctionne immédiatement,
 *    tant que l'application est ouverte — c'est le mécanisme principal.
 *  - abonnement push (Web Push/VAPID) : permet de recevoir une alerte même
 *    app fermée, mais nécessite l'Edge Function serveur fournie dans
 *    supabase/functions/check-budgets (voir son README pour le déploiement).
 */
export function useNotifications(userId: string | undefined) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  )

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied' as NotificationPermission
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }, [])

  const notifyLocal = useCallback((title: string, body: string) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false
    new Notification(title, { body, icon: '/pwa-192x192.png', tag: 'budget-alert' })
    return true
  }, [])

  const subscribeToPush = useCallback(async (): Promise<{ error: string | null }> => {
    if (!userId) return { error: 'Utilisateur non authentifié.' }
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!vapidKey) return { error: 'Clé VAPID non configurée côté client.' }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { error: 'Notifications push non supportées par ce navigateur.' }
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      const json = subscription.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        return { error: 'Abonnement push incomplet.' }
      }

      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: userId,
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
        { onConflict: 'endpoint' },
      )
      return { error: error?.message ?? null }
    } catch {
      return { error: "Impossible d'activer les notifications push." }
    }
  }, [userId])

  return { permission, requestPermission, notifyLocal, subscribeToPush }
}
