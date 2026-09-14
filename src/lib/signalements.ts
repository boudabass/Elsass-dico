// Types d'affichage pour la file d'arbitrage des signalements (doc 20 :
// « Correction : l'auteur édite sa variante tant que personne d'autre ne l'a
// revendiquée. Signalement à l'admin. »). C'est le seul canal de correction
// qui reste une fois l'arbitrage abandonné : on ne réécrit plus une forme
// nous-mêmes (règle 1), on signale à un humain qui décide.

export interface SignalementListe {
    id: string
    motif: string
    creeLe: string
    traiteLe: string | null
    variante: { id: string; forme: string }
    lemme: { id: string; francais: string }
    membre: { email: string; nom: string | null }
}
