import { useCallback, useRef, useState } from 'react'
import { parseExpenseText } from '@/lib/parser/darjaParser'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase'
import type { ParsedExpense } from '@/types'

/**
 * Capture vocale : enregistrement micro dans le navigateur (MediaRecorder),
 * puis transcription via une Edge Function Supabase qui relaie l'audio à
 * l'API Hugging Face (Whisper). On a abandonné la reconnaissance vocale
 * native du navigateur (`webkitSpeechRecognition`) : trop peu fiable selon
 * navigateurs/régions (erreurs `service-not-allowed` fréquentes, dépendante
 * d'un service Google hors de notre contrôle).
 *
 * Le parser darja interprète le texte obtenu — y compris ses imperfections —
 * plutôt que de dépendre d'une transcription parfaite.
 */
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']

function pickSupportedMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? null
}

export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const isSupported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    pickSupportedMimeType() !== null

  const start = useCallback(async (onResult: (transcript: string, parsed: ParsedExpense) => void) => {
    if (!isSupported) {
      setError("L'enregistrement vocal n'est pas supporté par ce navigateur.")
      return
    }

    setError(null)
    setTranscript('')

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('Accès au microphone refusé.')
      return
    }

    streamRef.current = stream
    const mimeType = pickSupportedMimeType()!
    const recorder = new MediaRecorder(stream, { mimeType })
    mediaRecorderRef.current = recorder
    const chunks: BlobPart[] = []

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }

    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      setIsListening(false)

      if (chunks.length === 0) return

      const audioBlob = new Blob(chunks, { type: mimeType })
      setIsTranscribing(true)

      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/speech-to-text`, {
          method: 'POST',
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': mimeType,
          },
          body: audioBlob,
        })

        const data = await response.json()
        if (!response.ok) {
          setError(data.error ?? 'Échec de la transcription vocale.')
          return
        }

        const text = (data.text ?? '').trim()
        if (!text) {
          setError('Aucune parole détectée, réessayez.')
          return
        }

        setTranscript(text)
        onResult(text, parseExpenseText(text))
      } catch {
        setError('Problème réseau pendant la transcription vocale.')
      } finally {
        setIsTranscribing(false)
      }
    }

    recorder.start()
    setIsListening(true)
  }, [isSupported])

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

  return { isSupported, isListening, isTranscribing, transcript, error, start, stop }
}
