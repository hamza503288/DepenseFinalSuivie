import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { VoiceRecorder } from './VoiceRecorder'
import { ExpenseConfirmSheet } from './ExpenseConfirmSheet'
import { useAuth } from '@/context/AuthContext'
import { useExpenses } from '@/context/ExpensesContext'
import type { ParsedExpense } from '@/types'

/** Bouton flottant d'ajout rapide, réutilisable sur les pages secondaires. */
export function AddExpenseFab() {
  const { user } = useAuth()
  const { addExpense } = useExpenses()
  const [recorderOpen, setRecorderOpen] = useState(false)
  const [parsed, setParsed] = useState<ParsedExpense | null>(null)

  return (
    <>
      <motion.button
        onClick={() => setRecorderOpen(true)}
        whileTap={{ scale: 0.9 }}
        aria-label="Ajouter une dépense"
        className="fixed bottom-24 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Plus size={26} />
      </motion.button>

      <Modal open={recorderOpen} onClose={() => setRecorderOpen(false)} title="Ajouter une dépense">
        <VoiceRecorder
          onParsed={(p) => {
            setRecorderOpen(false)
            setParsed(p)
          }}
        />
      </Modal>

      {user && (
        <ExpenseConfirmSheet
          parsed={parsed}
          userId={user.id}
          onClose={() => setParsed(null)}
          onSave={addExpense}
        />
      )}
    </>
  )
}
