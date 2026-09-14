// Edge Function Supabase (Deno) : proxy de transcription vocale.
//
// Le navigateur envoie un enregistrement audio brut (webm/opus) ; cette
// fonction le relaie vers l'API d'inférence Hugging Face (modèle Whisper)
// et renvoie le texte transcrit. Le jeton HF_TOKEN reste côté serveur : il
// ne doit jamais être exposé au client.

const HF_TOKEN = Deno.env.get('HF_TOKEN')
const HF_MODEL_URL = 'https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non supportée.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!HF_TOKEN) {
    return new Response(
      JSON.stringify({ error: "Transcription vocale non configurée (secret HF_TOKEN manquant)." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const audio = await req.arrayBuffer()
  if (audio.byteLength === 0) {
    return new Response(JSON.stringify({ error: 'Aucun audio reçu.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const contentType = req.headers.get('content-type') ?? 'audio/webm'

  const hfResponse = await fetch(HF_MODEL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      'Content-Type': contentType,
    },
    body: audio,
  })

  if (!hfResponse.ok) {
    // 503 : modèle en cours de chargement côté Hugging Face (fréquent sur le
    // tier gratuit après une période d'inactivité) — le client peut réessayer.
    const status = hfResponse.status === 503 ? 503 : 502
    return new Response(
      JSON.stringify({
        error:
          status === 503
            ? "Le service de transcription démarre, réessayez dans quelques secondes."
            : 'Échec de la transcription vocale.',
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const result = await hfResponse.json()
  return new Response(JSON.stringify({ text: result.text ?? '' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
