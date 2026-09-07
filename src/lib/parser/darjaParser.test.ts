import { describe, expect, it } from 'vitest'
import { parseExpenseText } from './darjaParser'
import { toLocalISODate } from '@/lib/date'

describe('parseExpenseText — montants', () => {
  it('reconnaît un montant en chiffres avec "dt"', () => {
    const r = parseExpenseText('sarraft 20dt fi taxi')
    expect(r.amount).toBe(20)
    expect(r.category).toBe('transport')
  })

  it('reconnaît un montant décimal avec virgule', () => {
    const r = parseExpenseText('khallast 3,500 dinars 3al fatura')
    expect(r.amount).toBe(3.5)
  })

  it('convertit les millimes en dinars', () => {
    const r = parseExpenseText('dfaat 500 millim taxi')
    expect(r.amount).toBe(0.5)
  })

  it('interprète "alf" isolé comme un raccourci de millimes (colloquial)', () => {
    const r = parseExpenseText('sarraft 3achra alf fi l-makla')
    expect(r.amount).toBe(10)
  })

  it('garde "alf dinar" explicite comme mille dinars', () => {
    const r = parseExpenseText('chrit sayara b alf dinar')
    expect(r.amount).toBe(1000)
  })

  it('reconnaît un nombre écrit en toutes lettres avec combinaison "w"', () => {
    const r = parseExpenseText('dfaat khamsa w arbain dinar 3al restaurant')
    expect(r.amount).toBe(45)
  })

  it('signale un montant manquant', () => {
    const r = parseExpenseText('sarraft fi taxi')
    expect(r.amount).toBeNull()
    expect(r.warnings.length).toBeGreaterThan(0)
  })
})

describe('parseExpenseText — catégories', () => {
  it('détecte la catégorie alimentation via un mot darja', () => {
    expect(parseExpenseText('chrit khodra b 5 dinars').category).toBe('alimentation')
  })

  it('détecte la catégorie transport via "louage"', () => {
    expect(parseExpenseText('khallast 10dt louage').category).toBe('transport')
  })

  it('détecte la catégorie logement via "fatura steg"', () => {
    expect(parseExpenseText('dfaat fatura steg b 45 dinars').category).toBe('logement')
  })

  it('détecte la catégorie santé via "pharmacie" (français)', () => {
    expect(parseExpenseText("j'ai payé 12 dinars à la pharmacie").category).toBe('sante')
  })

  it('retombe sur "autre" si rien ne correspond', () => {
    expect(parseExpenseText('sarraft 7 dinars xyz123').category).toBe('autre')
  })
})

describe('parseExpenseText — dates', () => {
  it('par défaut, la date est aujourd\'hui', () => {
    const today = toLocalISODate(new Date())
    expect(parseExpenseText('sarraft 5 dinars').date).toBe(today)
  })

  it('reconnaît "lyoum"', () => {
    const today = toLocalISODate(new Date())
    expect(parseExpenseText('sarraft 5 dinars lyoum').date).toBe(today)
  })

  it('reconnaît "lbereh" (hier)', () => {
    const yesterday = toLocalISODate(new Date(Date.now() - 86400000))
    expect(parseExpenseText('sarraft 5 dinars lbereh').date).toBe(yesterday)
  })
})

describe('parseExpenseText — code-switching français/darja', () => {
  it('mélange français et darja dans la même phrase', () => {
    const r = parseExpenseText("j'ai dépensé 30 dinars pour l'épicerie w chwaya khodra")
    expect(r.amount).toBe(30)
    expect(r.category).toBe('alimentation')
  })

  it('produit une description nettoyée sans le montant ni le verbe', () => {
    const r = parseExpenseText('sarraft 20dt taxi vers l\'aéroport')
    expect(r.description.toLowerCase()).not.toContain('sarraft')
    expect(r.description.toLowerCase()).not.toContain('20dt')
  })
})

describe('parseExpenseText — confiance', () => {
  it('a une confiance élevée quand montant + catégorie + verbe sont trouvés', () => {
    const r = parseExpenseText('sarraft 20 dinars fi restaurant')
    expect(r.confidence).toBeGreaterThanOrEqual(0.8)
  })

  it('a une confiance faible sur une phrase ambiguë', () => {
    const r = parseExpenseText('bonjour ça va')
    expect(r.confidence).toBeLessThan(0.3)
  })
})
