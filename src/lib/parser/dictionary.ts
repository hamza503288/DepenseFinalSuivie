/**
 * Dictionnaires linguistiques pour le parser de dépenses en darja tunisienne.
 *
 * La darja n'a pas d'orthographe standardisée (arabizi, translittération libre,
 * mélange avec le français). Chaque entrée liste donc plusieurs variantes
 * d'écriture rencontrées dans l'usage courant. Pour enrichir la reconnaissance,
 * il suffit d'ajouter de nouvelles variantes dans les tableaux ci-dessous —
 * aucune autre partie du code n'a besoin d'être modifiée.
 */

import type { Category } from '@/types'

/** Nombres écrits en toutes lettres (arabizi/français), de 0 à 19. */
export const UNITS: Record<string, number> = {
  sifr: 0, zero: 0,
  wahed: 1, wa7ed: 1, wahda: 1,
  zouz: 2, jouj: 2, zoz: 2, itnin: 2,
  tlata: 3, thlata: 3,
  arbaa: 4, arba3a: 4, "arb3a": 4,
  khamsa: 5, khemsa: 5,
  sitta: 6, setta: 6,
  saba: 7, sab3a: 7, sabaa: 7,
  tmenya: 8, tmania: 8,
  tessa: 9, tes3a: 9, tsaa: 9,
  achra: 10, "3achra": 10, aachra: 10,
  hdach: 11, "7dach": 11,
  tnach: 12, "athnach": 12,
  tlettach: 13,
  arbaatach: 14,
  khmastach: 15,
  settach: 16,
  sbaatach: 17,
  tmentach: 18,
  tsaatach: 19,
}

export const TENS: Record<string, number> = {
  achrin: 20, "3achrin": 20, ichrin: 20,
  tlatin: 30, thlatin: 30,
  arbain: 40, "arb3in": 40,
  khamsin: 50, khemsin: 50,
  settin: 60,
  sabain: 70, "sab3in": 70,
  tmanin: 80,
  tesain: 90, "tes3in": 90,
}

export const HUNDRED_WORDS = ['miya', 'mya', 'meya']
export const THOUSAND_WORDS = ['alf', 'alaf', "elf"]
/** Conjonction "et" utilisée pour composer les nombres (ex: wahed w achrin = 21). */
export const AND_WORD = 'w'

/** Mots désignant explicitement le dinar tunisien. */
export const CURRENCY_DINAR = ['dinar', 'dinars', 'dt', 'd.t', 'tnd', 'din']
/** Le millime (1/1000 de dinar). */
export const CURRENCY_MILLIME = ['millim', 'millime', 'millimes', 'melim']

/**
 * Verbes/expressions signalant une action de dépense.
 * Utilisés pour renforcer la confiance du parsing et sont retirés de la
 * description finale.
 */
export const EXPENSE_VERBS = [
  'sarraft', 'sraft', 'sarrafet',
  'kharraft', 'kharrajt',
  'dfaat', 'dfa3t', 'dfait', "def3t",
  'khallast', 'khallaset', "khlast",
  'chrit', 'chriit', "cherit",
  "chedit", "khadhit",
  "9adit", "gadit",
  "rani sarraft", "rani dfaat",
  "j'ai payé", "jai paye", "j'ai payer",
  "j'ai dépensé", "jai depense",
  "j'ai acheté", "jai achete",
  "j'ai pris", "jai pris",
  'payé', 'paye', 'dépensé', 'depense', 'acheté', 'achete',
]

/**
 * Mots-clés par catégorie (darja + français + emprunts). L'ordre des clés
 * reflète l'ordre catégoriel fixe utilisé pour l'affichage et les couleurs
 * (voir CATEGORIES dans src/types).
 */
export const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  alimentation: [
    'makla', 'akla', 'mekla', 'akl', "manger", "bouffe", "nourriture",
    'khodhra', 'khodra', 'khodhrawet', 'ghlal', 'fwakih',
    'lham', "l'ham", 'djej', 'samak', 'hout',
    'khobz', 'xobz',
    'epicerie', 'épicerie', 'hanout', 'aatar', "3attar",
    'souk', 'marché', 'marche', 'supermarché', 'supermarche', 'magasin',
    'restaurant', 'resto', 'café', 'cafe', "9ahwa", 'gahwa', 'mahal',
    'ftour', 'ghda', 'aacha', "3icha", 'ftar',
    'pizza', 'sandwich', 'chawarma', 'tacos',
  ],
  transport: [
    'transport', 'taxi', 'louage', 'kraa', 'bus', 'métro', 'metro', 'train',
    'benzine', 'benzin', 'essence', 'mazout', 'gasoil', 'carburant',
    'parking', 'parc', 'autoroute', 'péage', 'peage',
    'voiture', 'sayara', "siyara", 'moto', 'triporteur',
    'billet', 'ticket', 'abonnement transport',
  ],
  logement: [
    'kra', 'kraya', 'loyer', 'sokna', 'logement', 'appartement',
    'fatura', 'facture', 'factures',
    'steg', 'sonede', 'electricité', 'électricité', 'kahraba',
    'eau', 'ma', 'gaz',
    'internet', 'wifi', 'topnet', 'ooredoo', 'orange', 'tunisie telecom',
    'telephone', 'téléphone', 'forfait', 'recharge',
    'menage', 'ménage', 'entretien', 'reparation', 'réparation',
  ],
  shopping: [
    'hwayej', "7wayej", 'hwayj', 'vetements', 'vêtements', 'nsibet',
    'chaussures', 'sabbat', 'sebbat',
    'tsawwo9', 'tsawok', 'achat', 'achats', 'shopping',
    'hdiya', 'cadeau', 'cadeaux',
    'zina', 'maquillage', 'parfum',
    'telephone portable', 'mobile', 'accessoires',
  ],
  loisirs: [
    'cinéma', 'cinema', 'sortie', 'sorties', 'voyage', 'vacances',
    'jeux', "jeu vidéo", 'jeu video', 'abonnement', 'netflix', 'spotify',
    'concert', 'match', 'foot', 'plage', 'piscine', 'fsha', 'tafarej',
    'gym', 'sport', 'salle de sport',
  ],
  sante: [
    'tbib', 'toubib', 'docteur', 'médecin', 'medecin',
    'dwa', 'dawa', 'médicament', 'medicament', 'pharmacie', 'farmacia',
    'hopital', 'hôpital', 'clinique', 'clinic',
    'dentiste', 'sinane',
    'analyse', 'radio', 'consultation',
  ],
  education: [
    'ecole', 'école', 'université', 'universite', 'faculté', 'faculte',
    'livre', 'livres', 'ktab', 'kotob',
    'formation', 'cours', 'droos', 'inscription',
    'crayon', 'fourniture', 'fournitures scolaires',
  ],
  autre: [],
}

/** Expressions de date relative, en jours par rapport à aujourd'hui (0). */
export const RELATIVE_DATES: Record<string, number> = {
  lyoum: 0, lyouma: 0, elyoum: 0, "el youm": 0, aujourdhui: 0, "aujourd'hui": 0,
  lbereh: -1, lbare7: -1, lbarah: -1, hier: -1,
  "awal ams": -2, "avant hier": -2, "avant-hier": -2,
}

/** Jours de la semaine (index JS: 0 = dimanche). */
export const WEEKDAYS: Record<string, number> = {
  hed: 0, lhed: 0, dimanche: 0,
  litnin: 1, ethnin: 1, lundi: 1,
  ttlata: 2, thlata: 2, mardi: 2,
  larbaa: 3, larbaa3: 3, mercredi: 3,
  lkhmis: 4, khmiss: 4, jeudi: 4,
  jemaa: 5, jomaa: 5, vendredi: 5,
  sebt: 6, samedi: 6,
}
