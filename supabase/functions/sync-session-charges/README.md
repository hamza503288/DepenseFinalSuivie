# sync-session-charges — synchronisation avec un projet Supabase externe

Cette Edge Function répercute le montant d'une dépense sur la colonne
`charges` de la table `sessions` d'un **second projet Supabase** (système de
caisse externe), en associant la date de la dépense (`expense_date`) à la
colonne `date_session` de cette table.

- À la création d'une dépense : `charges += montant` sur la session dont
  `date_session` correspond à la date de la dépense.
- À la suppression d'une dépense : `charges -= montant` (jamais en dessous de 0).
- Si aucune session ne correspond à la date, rien n'est modifié : l'app
  affiche un avertissement mais la dépense reste enregistrée/supprimée
  normalement côté `expenses`.

## Pourquoi une Edge Function plutôt qu'un appel direct depuis le navigateur

La clé anonyme du projet `sessions` autorise l'écriture (RLS ouvert côté ce
projet). L'exposer dans le code du navigateur permettrait à n'importe quel
visiteur du site de modifier librement des données financières réelles
(dépôts bancaires, statuts de session...) de cet autre projet. Cette
fonction garde donc les identifiants du projet `sessions` strictement
côté serveur, sous forme de secrets Supabase.

## Déploiement

1. Renseigner les secrets côté Supabase (projet de l'app, pas celui des
   sessions) :
   ```bash
   supabase secrets set SESSIONS_SUPABASE_URL=https://oczueyplnlleismcamew.supabase.co
   supabase secrets set SESSIONS_SUPABASE_ANON_KEY=<clé anon du projet sessions>
   ```
   Ou via le tableau de bord Supabase : **Edge Functions → Secrets**.
2. Déployer la fonction :
   ```bash
   supabase functions deploy sync-session-charges
   ```
   Ou en collant le contenu de `index.ts` dans l'éditeur du tableau de bord
   (Edge Functions → Deploy a new function → nom exact `sync-session-charges`).

Sans cette fonction déployée (ou sans secrets configurés), l'enregistrement
et la suppression de dépenses continuent de fonctionner normalement : seule
la synchronisation avec `sessions` est silencieusement ignorée (avec un
avertissement affiché à l'utilisateur).
