import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Mic, Square, Keyboard, Send } from 'lucide-react'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'
import { parseExpenseText } from '@/lib/parser/darjaParser'
import type { ParsedExpense } from '@/types'
import { Button } from '@/components/ui/Button'
import { inputClassName } from '@/components/ui/Field'

interface VoiceRecorderProps {
  onParsed: (parsed: ParsedExpense) => void
}

/**
 * Bouton micro principal. Le mode texte reste toujours accessible : la
 * reconnaissance vocale en darja n'étant jamais parfaite, corriger ou saisir
 * directement au clavier doit être aussi simple que parler.
 */
export function VoiceRecorder({ onParsed }: VoiceRecorderProps) {
  const { isSupported, isListening, transcript, error, start, stop } = useVoiceRecognition()
  const [manualMode, setManualMode] = useState(!isSupported)
  const [manualText, setManualText] = useState('')

  function handleMicClick() {
    if (isListening) {
      stop()
      return
    }
    start((_text, parsed) => onParsed(parsed))
  }

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault()
    if (!manualText.trim()) return
    onParsed(parseExpenseText(manualText.trim()))
    setManualText('')
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-[var(--surface-card)] p-6 text-center shadow-sm">
      {!manualMode ? (
        <>
          <motion.button
            onClick={handleMicClick}
            whileTap={{ scale: 0.92 }}
            className={`flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg transition-colors ${
              isListening ? 'bg-red-600 animate-pulse-ring' : 'bg-brand-500'
            }`}
            aria-label={isListening ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement vocal'}
          >
            {isListening ? <Square size={28} /> : <Mic size={32} />}
          </motion.button>

          <p className="min-h-[1.5rem] text-sm text-[var(--text-secondary)]">
            {isListening
              ? transcript || 'Je t\'écoute… parle en darja !'
              : 'Appuie et raconte ta dépense'}
          </p>

          {error && <p className="text-xs font-medium text-status-critical">{error}</p>}

          <button
            onClick={() => setManualMode(true)}
            className="tap-scale flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-brand-500"
          >
            <Keyboard size={14} /> Écrire à la place
          </button>
        </>
      ) : (
        <form onSubmit={handleManualSubmit} className="flex w-full flex-col gap-3">
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Ex: sarraft 20 dinars fi taxi lyoum"
            rows={2}
            className={`${inputClassName} resize-none text-left`}
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit" icon={<Send size={16} />} fullWidth>
              Analyser
            </Button>
            {isSupported && (
              <Button type="button" variant="ghost" onClick={() => setManualMode(false)} icon={<Mic size={16} />}>
                Vocal
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
