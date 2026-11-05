// Le prénom et le nom que le membre choisit pour être affiché à côté des textes
// qu'il ajoute (04/11/2026). Module pur : la feuille, Mon espace et le serveur
// lisent la même règle.
//
// Lettres de toutes les langues (accents, tréma), espaces, traits d'union et
// apostrophes (« Jean-Pierre », « D'Andlau »). Chiffres, adresses et symboles
// refusés. Chaque mot compte au moins deux lettres : « S » seul ne passe pas.

export const NOM_MAX = 80

/** Changements de nom permis par membre et par jour glissant. */
export const CHANGEMENTS_NOM_PAR_JOUR = 3

// La cible TypeScript de ce projet est es5 : une regex littérale avec le drapeau
// `u` y serait refusée, d'où le constructeur. Les navigateurs qui font tourner
// l'app savent tous lire `\p{L}`.
const LETTRE = "\\p{L}"
const LETTRES = new RegExp(LETTRE, "gu")

// Un mot : des lettres, éventuellement reliées par un trait d'union ou une
// apostrophe. Le contrôle des deux lettres minimum se fait à part.
const MOT = new RegExp(`^${LETTRE}+(?:['’-]${LETTRE}+)*$`, "u")

export type ResultatNom = { ok: true; nom: string } | { ok: false; erreur: string }

function mots(saisie: string): string[] {
    return saisie.trim().replace(/\s+/g, " ").split(" ").filter(Boolean)
}

function motsValides(saisie: string): boolean {
    const liste = mots(saisie)
    return liste.length > 0
        && liste.every((m) => MOT.test(m) && (m.match(LETTRES) ?? []).length >= 2)
}

/** Le prénom et le nom, séparés dans la feuille et dans Mon espace. Renvoie le
 *  nom complet tel qu'il sera enregistré, « Prénom Nom ». */
export function validerNom(prenom: string, nomFamille: string): ResultatNom {
    if (!motsValides(prenom)) {
        return { ok: false, erreur: "Écris ton prénom : des lettres, au moins deux par mot" }
    }
    if (!motsValides(nomFamille)) {
        return { ok: false, erreur: "Écris ton nom : des lettres, au moins deux par mot" }
    }
    const nom = `${mots(prenom).join(" ")} ${mots(nomFamille).join(" ")}`
    if (nom.length > NOM_MAX) return { ok: false, erreur: "Ton prénom et ton nom sont trop longs" }
    return { ok: true, nom }
}

/** Découpe un nom enregistré pour le pré-remplir : le dernier mot est le nom,
 *  le reste le prénom. Le membre corrige s'il s'est trompé. */
export function decouperNom(nom: string | null): { prenom: string; nomFamille: string } {
    const liste = nom ? mots(nom) : []
    if (liste.length < 2) return { prenom: liste.join(" "), nomFamille: "" }
    return { prenom: liste.slice(0, -1).join(" "), nomFamille: liste[liste.length - 1] }
}
