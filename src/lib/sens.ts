// Le sens du dictionnaire (27/09/2026, décision de John) : on cherche soit
// depuis le français, soit depuis l'alsacien, jamais les deux mélangés. Comme
// un dictionnaire bilingue papier qu'on retourne pour lire l'autre moitié.
//
// Module sans dépendance serveur ni client : lu par RootLayout (cookie), par
// le contexte `SensProvider` et par les écrans qui l'écrivent dans leur URL.

export type Sens = "fr" | "als"

export const COOKIE_SENS = "ed_sens"

/** Le français est le sens de départ : c'est celui de tout ce qui existait
 *  avant l'inverseur. */
export const SENS_PAR_DEFAUT: Sens = "fr"

export function lireSens(valeur: string | null | undefined): Sens {
    return valeur === "als" ? "als" : "fr"
}

/** Le paramètre d'URL d'un écran qui dépend du sens. Absent en français, pour
 *  que les liens d'avant l'inverseur restent valides tels quels. */
export function parametreSens(sens: Sens): string {
    return sens === "als" ? "sens=als" : ""
}
