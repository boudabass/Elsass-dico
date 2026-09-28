// Ce que partagent les refus du vote (`votes.ts`) et de la création de forme
// (`variantes.ts`), et le toast qui les affiche.
//
// Le refus « pas de village » était une impasse : un nouveau membre cliquait
// « + Chez moi aussi », lisait « Choisis d'abord ton village, dans Mon espace »,
// et devait trouver seul le chemin. Le drapeau `villageRequis` permet au toast
// de porter le bouton qui y mène (24/09/2026).

export const REFUS_VILLAGE_REQUIS = {
    succes: false,
    erreur: "Choisis d'abord ton village",
    villageRequis: true,
} as const

export type EchecContribution = { succes: false; erreur: string; villageRequis?: true }

/** Mon témoignage sur une forme, s'il existe : le village qu'il porte, et si
 *  c'est encore mon village (28/09/2026). Un booléen ne suffisait pas : après
 *  un changement de village, le bouton affirmait « chez moi aussi » pour un
 *  témoignage qui porte l'ancien village. `null` : pas de témoignage. */
export interface MonVote {
    village: string
    actuel: boolean
}
