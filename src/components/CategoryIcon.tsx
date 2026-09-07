import {
  UtensilsCrossed,
  Car,
  Home,
  ShoppingBag,
  PartyPopper,
  HeartPulse,
  GraduationCap,
  CircleDollarSign,
  type LucideProps,
} from 'lucide-react'
import type { Category } from '@/types'
import { CATEGORY_ICONS } from '@/types'

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  UtensilsCrossed,
  Car,
  Home,
  ShoppingBag,
  PartyPopper,
  HeartPulse,
  GraduationCap,
  CircleDollarSign,
}

/** Couleur catégorielle en variable CSS (voir @theme dans index.css). */
export function categoryColorVar(category: Category): string {
  return `var(--color-cat-${category})`
}

export function CategoryIcon({ category, ...props }: { category: Category } & LucideProps) {
  const Icon = ICON_MAP[CATEGORY_ICONS[category]]
  return <Icon {...props} />
}
