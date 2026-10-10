import type { PartiePublique } from "@/app/actions/jeu";

// Reprise du défi du jour quand on quitte l'écran (fiche d'un village) puis
// qu'on y revient. L'état vit dans sessionStorage : propre à l'onglet, perdu à
// sa fermeture, et jamais servi le lendemain puisque la clé porte le numéro du
// défi. Rien ne sort du navigateur. Chaque accès est protégé : sans stockage
// (navigation privée, stockage bloqué), le jeu marche comme avant.
//
// La clé porte aussi qui joue (membre ou invité) : deux comptes dans le même
// onglet ne se voient pas la partie l'un de l'autre.

export interface EtatReprise {
    partie: PartiePublique;
    indice: number;
}

function cle(qui: string, numero: number): string {
    return `elsass-dico:jeu-partie:${qui}:${numero}`;
}

export function lireReprise(qui: string, numero: number): EtatReprise | null {
    try {
        const brut = sessionStorage.getItem(cle(qui, numero));
        if (!brut) return null;
        const e = JSON.parse(brut) as EtatReprise;
        if (
            e?.partie?.mode !== "jour" ||
            e.partie.numero !== numero ||
            !Array.isArray(e.partie.manches) ||
            typeof e.indice !== "number"
        ) {
            return null;
        }
        return e;
    } catch {
        return null;
    }
}

export function ecrireReprise(qui: string, numero: number, etat: EtatReprise) {
    try {
        sessionStorage.setItem(cle(qui, numero), JSON.stringify(etat));
    } catch {}
}

export function effacerReprise(qui: string, numero: number) {
    try {
        sessionStorage.removeItem(cle(qui, numero));
    } catch {}
}
