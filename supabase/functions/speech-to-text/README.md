# speech-to-text — transcription vocale via Hugging Face (gratuit)

Cette Edge Function reçoit un enregistrement audio depuis l'app, le relaie
vers l'API d'inférence Hugging Face (modèle `openai/whisper-large-v3`) et
renvoie le texte transcrit. Le jeton Hugging Face reste secret côté serveur.

Remplace la reconnaissance vocale native du navigateur (`webkitSpeechRecognition`),
peu fiable et sujette à l'erreur `service-not-allowed` selon les navigateurs/régions.

## Limites du tier gratuit Hugging Face

- Les enregistrements de plus de ~25 secondes peuvent échouer silencieusement :
  gardez les messages vocaux courts (une dépense à la fois).
- Après une période d'inactivité, le modèle peut mettre quelques secondes à
  "redémarrer" côté Hugging Face (réponse 503) : l'app invite alors à réessayer.

## Déploiement

1. Créer un compte gratuit sur [huggingface.co](https://huggingface.co) (pas
   de carte bancaire requise).
2. Générer un jeton d'accès avec la permission "Make calls to Inference
   Providers" : https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained
3. Renseigner le secret côté Supabase :
   ```bash
   supabase secrets set HF_TOKEN=hf_votre_jeton
   ```
4. Déployer la fonction :
   ```bash
   supabase functions deploy speech-to-text
   ```

Sans cette fonction déployée (ou sans secret configuré), le bouton micro
affiche une erreur et l'utilisateur peut toujours saisir sa dépense au
clavier (mode "Écrire à la place").
