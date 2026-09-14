// Types d'affichage pour l'écran admin des sources écrites (doc 20, troisième
// des trois écrans admin). `Source` fait partie de l'archive — « LECTURE
// SEULE » dans le schéma — donc cet écran n'édite rien : il donne à voir ce
// que chaque source déclare (licence, fiabilité) pour que l'admin puisse
// juger la doctrine, pas pour la modifier depuis l'app.

export interface SourceListe {
    id: string
    code: string
    nom: string
    url: string | null
    type: string
    annee: number | null
    licence: string | null
    fiabilite: number
    nbAttestations: number
    nbTemoignages: number
}
