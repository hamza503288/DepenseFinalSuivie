/**
 * Parser de dépenses en darja tunisienne avec code-switching français.
 *
 * Approche : extraction indépendante de 4 signaux (montant, catégorie, date,
 * verbe d'action) sur un texte normalisé, puis reconstruction d'une
 * description en retirant les segments déjà reconnus. Chaque signal est
 * optionnel : un montant manquant ne bloque pas la catégorie, etc. Le score
 * de confiance reflète combien de signaux ont été trouvés, pour piloter
 * l'UI de confirmation/correction côté utilisateur.
 */

import type { Category, ParsedExpense } from '@/types'
import { CATEGORIES } from '@/types'
import { toLocalISODate } from '@/lib/date'
import {
  UNITS,
  TENS,
  HUNDRED_WORDS,
  THOUSAND_WORDS,
  AND_WORD,
  CURRENCY_DINAR,
  CURRENCY_MILLIME,
  EXPENSE_VERBS,
  CATEGORY_KEYWORDS,
  RELATIVE_DATES,
  WEEKDAYS,
} from './dictionary'

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Normalise le texte pour la reconnaissance de mots-clés (minuscule, sans accents). */
function normalize(text: string): string {
  return stripAccents(text.toLowerCase())
    .replace(/[''`]/g, "'")
    // conserve lettres latines, chiffres, apostrophe, séparateurs décimaux,
    // trait d'union et écriture arabe (U+0600-U+06FF) au cas où
    .replace(/[^a-z0-9'\s.,؀-ۿ-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

function mostRecentWeekday(today: Date, targetDay: number): Date {
  const diff = (today.getDay() - targetDay + 7) % 7
  return addDays(today, -diff)
}

/** Convertit une valeur numérique brute en montant en dinars selon le mot-unité détecté. */
function applyUnit(value: number, unitWord?: string): number {
  if (!unitWord) return value
  const w = unitWord.replace(/\./g, '')
  if (CURRENCY_DINAR.includes(w)) return value
  if (CURRENCY_MILLIME.includes(w)) return value / 1000
  if (THOUSAND_WORDS.includes(w)) return value / 1000
  return value
}

const CURRENCY_UNIT_PATTERN = [...CURRENCY_DINAR, ...CURRENCY_MILLIME, ...THOUSAND_WORDS]
  .map(escapeRegex)
  .join('|')

interface AmountResult {
  value: number
  /** Sous-chaîne du texte normalisé correspondant au montant, à retirer de la description. */
  rawMatch: string
}

/** Étape 1 : montants écrits en chiffres (le cas le plus courant, y compris via reconnaissance vocale). */
function extractDigitAmount(normalizedText: string): AmountResult | null {
  const re = new RegExp(
    `(?<![a-z])(\\d+(?:[.,]\\d+)?)\\s*(${CURRENCY_UNIT_PATTERN})?(?![a-z])`,
    'i',
  )
  const match = re.exec(normalizedText)
  if (!match) return null
  const numeric = parseFloat(match[1].replace(',', '.'))
  if (Number.isNaN(numeric) || numeric <= 0) return null
  return { value: applyUnit(numeric, match[2]), rawMatch: match[0] }
}

/** Étape 2 (repli) : nombres écrits en toutes lettres en darja (ex: "tlata w achrin dinar"). */
function extractWordAmount(tokens: string[]): AmountResult | null {
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    let value: number | null = null

    if (t in UNITS) value = UNITS[t]
    else if (t in TENS) value = TENS[t]
    else if (HUNDRED_WORDS.includes(t)) value = 100
    else if (THOUSAND_WORDS.includes(t)) value = 1000
    if (value === null) continue

    let end = i + 1
    let usedThousand = THOUSAND_WORDS.includes(t)

    // Combinaison unité + "w" + dizaine, ou dizaine + "w" + unité (ex: khamsa w arbain = 45)
    if (tokens[end] === AND_WORD && tokens[end + 1] !== undefined) {
      const nxt = tokens[end + 1]
      if (t in UNITS && nxt in TENS) {
        value = UNITS[t] + TENS[nxt]
        end += 2
      } else if (t in TENS && nxt in UNITS) {
        value = TENS[t] + UNITS[nxt]
        end += 2
      }
    }

    // Multiplicateur cent/mille directement après (ex: "khamsa miya" = 500)
    if (HUNDRED_WORDS.includes(tokens[end])) {
      value *= 100
      end += 1
    }
    if (THOUSAND_WORDS.includes(tokens[end])) {
      value *= 1000
      end += 1
      usedThousand = true
    }

    const rawMatch = tokens.slice(i, end).join(' ')
    const currencyContext = tokens.slice(end, end + 2)
    const dinarWord = currencyContext.find((w) => CURRENCY_DINAR.includes(w))
    const millimeWord = currencyContext.find((w) => CURRENCY_MILLIME.includes(w))

    let finalValue = value
    if (dinarWord) finalValue = value
    else if (millimeWord) finalValue = value / 1000
    else if (usedThousand) finalValue = value / 1000

    const fullRaw = dinarWord || millimeWord ? `${rawMatch} ${dinarWord ?? millimeWord}` : rawMatch
    return { value: finalValue, rawMatch: fullRaw }
  }
  return null
}

function extractCategory(normalizedText: string): { category: Category; matched?: string } {
  let best: Category = 'autre'
  let bestLength = 0
  let bestKeyword: string | undefined

  for (const cat of CATEGORIES) {
    if (cat === 'autre') continue
    for (const kw of CATEGORY_KEYWORDS[cat]) {
      const needle = normalize(kw)
      if (needle && normalizedText.includes(needle) && needle.length > bestLength) {
        bestLength = needle.length
        best = cat
        bestKeyword = kw
      }
    }
  }
  return { category: best, matched: bestKeyword }
}

function extractDate(normalizedText: string): { iso: string; matched?: string } {
  const today = new Date()

  for (const [phrase, offset] of Object.entries(RELATIVE_DATES)) {
    if (normalizedText.includes(normalize(phrase))) {
      return { iso: toLocalISODate(addDays(today, offset)), matched: phrase }
    }
  }
  for (const [name, weekdayIdx] of Object.entries(WEEKDAYS)) {
    if (normalizedText.includes(normalize(name))) {
      return { iso: toLocalISODate(mostRecentWeekday(today, weekdayIdx)), matched: name }
    }
  }
  return { iso: toLocalISODate(today) }
}

function extractVerb(normalizedText: string): string | undefined {
  const sorted = [...EXPENSE_VERBS].sort((a, b) => b.length - a.length)
  for (const verb of sorted) {
    if (normalizedText.includes(normalize(verb))) return verb
  }
  return undefined
}

/** Retire du texte brut les segments déjà identifiés pour ne garder que la description utile. */
function buildDescription(rawText: string, segments: (string | undefined)[]): string {
  let desc = rawText
  for (const seg of segments) {
    if (!seg) continue
    desc = desc.replace(new RegExp(escapeRegex(seg), 'ig'), ' ')
  }
  desc = desc
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .replace(/^(w|b|fi|el|la|le|de|du|pour|li|men)\s+/i, '')
    .trim()
  if (!desc) return ''
  return desc.charAt(0).toUpperCase() + desc.slice(1)
}

/**
 * Point d'entrée principal : transforme un texte (issu de la voix ou saisi)
 * en dépense structurée, tolérante aux fautes et au mélange darja/français.
 */
export function parseExpenseText(rawText: string): ParsedExpense {
  const normalized = normalize(rawText)
  const tokens = normalized.split(' ').filter(Boolean)

  const digitAmount = extractDigitAmount(normalized)
  const amountResult = digitAmount ?? extractWordAmount(tokens)

  const { category, matched: categoryMatch } = extractCategory(normalized)
  const { iso: date, matched: dateMatch } = extractDate(normalized)
  const verbMatch = extractVerb(normalized)

  const description = buildDescription(rawText, [
    amountResult?.rawMatch,
    verbMatch,
    dateMatch,
  ])

  const warnings: string[] = []
  let confidence = 0.15

  if (amountResult) confidence += 0.5
  else warnings.push('Montant non détecté — merci de le vérifier.')

  if (category !== 'autre') confidence += 0.25
  else warnings.push('Catégorie non reconnue — sélectionnez-la manuellement.')

  if (verbMatch) confidence += 0.1

  confidence = Math.min(1, Number(confidence.toFixed(2)))

  return {
    amount: amountResult ? Math.round(amountResult.value * 1000) / 1000 : null,
    category,
    description: description || (categoryMatch ?? ''),
    date,
    confidence,
    rawText,
    matched: {
      amount: amountResult?.rawMatch,
      category: categoryMatch,
      date: dateMatch,
      verb: verbMatch,
    },
    warnings,
  }
}
