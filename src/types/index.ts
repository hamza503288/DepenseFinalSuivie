/**
 * Types partagés de l'application Masrouf.
 */

/** Les 15 catégories de dépenses reconnues par le parser et les graphiques ('autre' toujours en dernier). */
export const CATEGORIES = [
  'alimentation',
  'courses',
  'transport',
  'logement',
  'maison',
  'shopping',
  'loisirs',
  'sport',
  'voyage',
  'sante',
  'education',
  'animaux',
  'it',
  'pret',
  'autre',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABELS: Record<Category, string> = {
  alimentation: 'Alimentation',
  courses: 'Courses',
  transport: 'Transport',
  logement: 'Logement & factures',
  maison: 'Maison',
  shopping: 'Shopping',
  loisirs: 'Loisirs',
  sport: 'Sport',
  voyage: 'Voyage',
  sante: 'Santé',
  education: 'Éducation',
  animaux: 'Animaux',
  it: 'IT & high-tech',
  pret: 'Prêt & crédit',
  autre: 'Autre',
}

/** Icônes lucide-react associées à chaque catégorie (nom du composant). */
export const CATEGORY_ICONS: Record<Category, string> = {
  alimentation: 'UtensilsCrossed',
  courses: 'ShoppingCart',
  transport: 'Car',
  logement: 'Home',
  maison: 'Sofa',
  shopping: 'ShoppingBag',
  loisirs: 'PartyPopper',
  sport: 'Dumbbell',
  voyage: 'Plane',
  sante: 'HeartPulse',
  education: 'GraduationCap',
  animaux: 'PawPrint',
  it: 'Laptop',
  pret: 'HandCoins',
  autre: 'CircleDollarSign',
}

export type BudgetPeriod = 'jour' | 'semaine' | 'mois'

export const BUDGET_PERIOD_LABELS: Record<BudgetPeriod, string> = {
  jour: 'Journalier',
  semaine: 'Hebdomadaire',
  mois: 'Mensuel',
}

export type ExpenseSource = 'vocal' | 'manuel'

/** Ligne de la table `expenses` en base. */
export interface Expense {
  id: string
  user_id: string
  amount: number
  category: Category
  description: string
  expense_date: string // format ISO yyyy-MM-dd
  source: ExpenseSource
  raw_text: string | null
  receipt_url: string | null
  confidence: number | null
  created_at: string
}

export type NewExpense = Omit<Expense, 'id' | 'user_id' | 'created_at'>

/** Ligne de la table `budgets` en base. */
export interface Budget {
  id: string
  user_id: string
  period: BudgetPeriod
  category: Category | null // null = budget global toutes catégories
  limit_amount: number
  alert_threshold: number // fraction (0-1) déclenchant l'alerte "attention", ex 0.8
  created_at: string
}

export type NewBudget = Omit<Budget, 'id' | 'user_id' | 'created_at'>

/** État calculé d'un budget par rapport aux dépenses réelles. */
export interface BudgetStatus {
  budget: Budget
  spent: number
  remaining: number
  ratio: number // spent / limit_amount
  level: 'ok' | 'warning' | 'serious' | 'critical'
}

/** Résultat structuré renvoyé par le parser darja. */
export interface ParsedExpense {
  amount: number | null
  category: Category
  description: string
  date: string // ISO yyyy-MM-dd
  /** Score de confiance global (0 à 1) utilisé pour proposer une confirmation manuelle. */
  confidence: number
  /** Texte brut d'origine (vocal ou saisi). */
  rawText: string
  /** Segments reconnus par le parser, utiles pour l'affichage pédagogique. */
  matched: {
    amount?: string
    category?: string
    date?: string
    verb?: string
  }
  /** Avertissements (ex: montant non détecté) affichés à l'utilisateur. */
  warnings: string[]
}

export interface PushSubscriptionRow {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}
