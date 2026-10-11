import type { TypeTerme } from "@/lib/dictionnaire"

// Quelques mots de base de tout cours de débutant, par leur clé naturelle
// `(cle, contexte, type)` : elle survit à une redérivation, un UUID non (leçon
// du 12/09/2026). Mesurés en base le 18/09/2026 : chaque entrée existe et porte
// au moins une forme réelle. Seules les CLÉS sont fixées ici ; les formes
// viennent de la base à chaque appel (règle 1).
//
// Sorti de `actions/accueil.ts` le 25/09/2026 : la vitrine de la home et la fin
// de partie du jeu tendent les mêmes mots, et un fichier `'use server'`
// n'exporte que des fonctions.
// 11/10/2026 : « maison » remplacé par « pain » ; Culture Alsace y range aussi « s' Unternamma » (entreprise), qui s'affichait sur l'accueil.
export const MOTS_DE_BASE: { cle: string; contexte: string; type: TypeTerme }[] = [
    { cle: "bonjour", contexte: "", type: "mot" },
    { cle: "bonsoir", contexte: "", type: "mot" },
    { cle: "au revoir", contexte: "", type: "expression" },
    { cle: "merci", contexte: "", type: "mot" },
    { cle: "pardon", contexte: "", type: "mot" },
    { cle: "oui", contexte: "", type: "mot" },
    { cle: "non", contexte: "", type: "mot" },
    { cle: "ami", contexte: "(l')", type: "mot" },
    { cle: "pain", contexte: "(le)", type: "mot" },
    { cle: "famille", contexte: "(la)", type: "mot" },
]
