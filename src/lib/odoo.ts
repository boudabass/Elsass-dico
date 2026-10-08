// Client Odoo réduit à l'AUTHENTIFICATION. Odoo est l'autorité sur les mots de
// passe ; il n'est appelé qu'au moment du login et répond à une seule question :
// « ce couple identifiant/mot de passe est-il valide ? ». Le rôle applicatif
// n'en est jamais dérivé, il est géré dans la table profiles.
//
// Le cookie de session renvoyé par Odoo n'est ni lu ni conservé : le dico porte
// sa propre session, un cookie signé avec `jose` (src/lib/session.ts) depuis le
// 12/09/2026 — c'était Supabase avant.

export interface UtilisateurOdoo {
    uid: number;
    name: string;
    username: string;
}

// Odoo est l'autorité sur les comptes : la création n'existe pas côté dico,
// elle se fait sur le portail public The Elsassisch. Lien public, pas un
// secret — safe à importer côté client.
//
// `redirect=/application` (décision de John, 06/10/2026) : après l'inscription,
// Odoo envoie vers la page de l'univers, jamais vers un projet. Un client de
// la boutique ou d'Elsass Game qui passe par le même formulaire ne doit pas se
// voir proposer Elsass Dico. Odoo garde ce paramètre dans un champ caché du
// formulaire.
export const URL_INSCRIPTION_ODOO = "https://www.theelsassisch.com/web/signup?redirect=/application";

// Les CGU sont communes à toutes les apps The Elsassisch et vivent sur le
// site, pas dans ce dépôt (décision de John, 23/09/2026).
export const URL_CGU = "https://www.theelsassisch.com/cgu";

// Les variables sont lues à l'appel et non au chargement du module : une
// vérification au niveau module casserait le build, qui n'a pas accès aux
// variables runtime de Coolify.
/** Panne technique (configuration, réseau, réponse HTTP ou JSON inattendue) :
 *  Odoo n'a pas répondu, il n'a pas refusé. Distinguée d'un refus pour que la
 *  limite de tentatives ne compte que les vrais mauvais identifiants. */
export class ErreurOdoo extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ErreurOdoo";
    }
}

// Renvoie `null` quand Odoo refuse le couple (identifiant inconnu ou mot de
// passe faux), et lève `ErreurOdoo` pour toute panne : le login reste fermé
// dans les deux cas, seul le compteur de tentatives les distingue.
export async function authentifierAupresDOdoo(
    login: string,
    password: string,
): Promise<UtilisateurOdoo | null> {
    const url = process.env.ODOO_URL;
    const db = process.env.ODOO_DB;

    if (!url || !db) {
        console.error("[Odoo] ODOO_URL ou ODOO_DB manquante, authentification impossible");
        throw new ErreurOdoo("configuration Odoo manquante");
    }

    let reponse: Response;
    try {
        reponse = await fetch(`${url}/web/session/authenticate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "call",
                params: { db, login, password },
                id: Math.floor(Math.random() * 1_000_000_000),
            }),
            cache: "no-store",
        });
    } catch (erreur) {
        console.error("[Odoo] Erreur réseau lors de l'authentification:", erreur);
        throw new ErreurOdoo("réseau");
    }

    if (!reponse.ok) {
        console.error(`[Odoo] Réponse HTTP ${reponse.status}`);
        throw new ErreurOdoo(`HTTP ${reponse.status}`);
    }

    // Odoo répond 200 même en cas d'échec : l'erreur est dans le corps JSON.
    let donnees;
    try {
        donnees = await reponse.json();
    } catch (erreur) {
        console.error("[Odoo] Réponse non JSON:", erreur);
        throw new ErreurOdoo("réponse non JSON");
    }

    if (donnees.error) {
        console.warn(`[Odoo] Authentification refusée: ${donnees.error.message ?? "raison inconnue"}`);
        return null;
    }

    const resultat = donnees.result;
    if (!resultat || typeof resultat.uid !== "number") {
        return null;
    }

    return {
        uid: resultat.uid,
        name: resultat.name ?? login,
        username: resultat.username ?? login,
    };
}
