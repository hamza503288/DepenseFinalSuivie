# check-budgets — notifications push serveur (optionnel)

Cette Edge Function vérifie, pour tous les utilisateurs, si un budget est
proche ou en dépassement, puis envoie une notification push aux appareils
abonnés. Elle permet de recevoir une alerte même application fermée — chose
que le navigateur seul ne peut pas faire.

Sans cette fonction déployée, l'application fonctionne quand même : les
alertes s'affichent en notification locale + toast tant que l'app est ouverte
(voir `src/hooks/useNotifications.ts`).

## Déploiement

1. Générer une paire de clés VAPID (une fois) :
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Renseigner les secrets côté Supabase :
   ```bash
   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=...
   ```
3. Mettre la clé publique dans `.env.local` du frontend :
   ```
   VITE_VAPID_PUBLIC_KEY=...
   ```
4. Déployer la fonction :
   ```bash
   supabase functions deploy check-budgets
   ```
5. Planifier son exécution périodique (ex: toutes les 30 minutes) avec
   `pg_cron` (extension activable dans Database > Extensions), en appelant
   l'URL de la fonction via `net.http_post`, ou via le planificateur de
   fonctions du dashboard Supabase si disponible sur votre offre.
