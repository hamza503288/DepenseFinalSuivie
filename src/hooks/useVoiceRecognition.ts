import { useCallback, useEffect, useRef, useState } from 'react'
import { parseExpenseText } from '@/lib/parser/darjaParser'
import type { ParsedExpense } from '@/types'

/**
 * Capture vocale via la Web Speech API du navigateur.
 *
 * Aucun moteur grand public ne propose de modèle "arabe tunisien" dédié : on
 * capture donc en arabe standard ('ar-SA'), la langue la plus proche
 * phonétiquement, et c'est le parser darja (voir lib/parser) qui interprète
 * le texte obtenu — y compris ses imperfections — plutôt que de dépendre
 * d'une reconnaissance parfaite. Comme la reconnaissance retourne plusieurs
 * hypothèses (`maxAlternatives`), on fait parser chacune et on garde celle
 * dont le parsing donne la meilleure confiance.
 */
export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const isSupported =
    typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)

  const start = useCallback(
    (onResult: (transcript: string, parsed: ParsedExpense) => void, lang: string = 'ar-SA') => {
      if (!isSupported) {
        setError("La reconnaissance vocale n'est pas supportée par ce navigateur.")
        return
      }

      const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition!
      const recognition = new Ctor()
      recognition.lang = lang
      recognition.continuous = false
      recognition.interimResults = true
      recognition.maxAlternatives = 4
      recognitionRef.current = recognition

      setError(null)
      setTranscript('')

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)

      recognition.onerror = (event) => {
        const messages: Record<string, string> = {
          'no-speech': "Aucune parole détectée, réessayez.",
          'not-allowed': "Accès au microphone refusé.",
          'audio-capture': 'Aucun microphone détecté.',
          network: 'Problème réseau pendant la reconnaissance vocale.',
        }
        setError(messages[event.error] ?? `Erreur de reconnaissance vocale (${event.error}).`)
        setIsListening(false)
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1]
        let bestText = ''
        let bestParsed: ParsedExpense | null = null

        for (let i = 0; i < result.length; i++) {
          const candidateText = result[i].transcript
          const parsed = parseExpenseText(candidateText)
          if (!bestParsed || parsed.confidence > bestParsed.confidence) {
            bestParsed = parsed
            bestText = candidateText
          }
        }

        setTranscript(bestText)

        if (result.isFinal && bestParsed) {
          onResult(bestText, bestParsed)
        }
      }

      recognition.start()
    },
    [isSupported],
  )

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  useEffect(() => () => recognitionRef.current?.abort(), [])

  return { isSupported, isListening, transcript, error, start, stop }
}
