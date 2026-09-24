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
