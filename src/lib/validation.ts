/**
 * Schémas de validation des entrées utilisateur (défense en profondeur : la
 * base impose déjà des contraintes via RLS/CHECK, mais on valide côté client
 * pour un retour immédiat et pour ne jamais envoyer de données mal formées).
 */
import { z } from 'zod'
import { CATEGORIES } from '@/types'

export const categorySchema = z.enum(CATEGORIES)

export const newExpenseSchema = z.object({
  amount: z
    .number({ message: 'Le montant doit être un nombre.' })
    .positive('Le montant doit être supérieur à 0.')
    .max(1_000_000, 'Montant invraisemblable, vérifiez la saisie.'),
  category: categorySchema,
  description: z.string().trim().max(280, 'Description trop longue (280 caractères max).'),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide.'),
  source: z.enum(['vocal', 'manuel']),
  raw_text: z.string().max(1000).nullable(),
  receipt_url: z.string().url().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
})

export const newBudgetSchema = z.object({
  period: z.enum(['jour', 'semaine', 'mois']),
  category: categorySchema.nullable(),
  limit_amount: z
    .number({ message: 'Le plafond doit être un nombre.' })
    .positive('Le plafond doit être supérieur à 0.')
    .max(1_000_000, 'Plafond invraisemblable, vérifiez la saisie.'),
  alert_threshold: z.number().min(0.1).max(1),
})

/** Valide un fichier de facture avant envoi vers le stockage Supabase. */
export function validateReceiptFile(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  const maxSizeBytes = 5 * 1024 * 1024
  if (!allowedTypes.includes(file.type)) {
    return 'Format non supporté. Utilisez JPEG, PNG, WEBP ou HEIC.'
  }
  if (file.size > maxSizeBytes) {
    return 'Fichier trop volumineux (5 Mo maximum).'
  }
  return null
}
