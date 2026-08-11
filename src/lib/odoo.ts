// Client Odoo réduit à l'AUTHENTIFICATION. Odoo est l'autorité sur les mots de
// passe ; il n'est appelé qu'au moment du login et répond à une seule question :
// « ce couple identifiant/mot de passe est-il valide ? ». Le rôle applicatif
// n'en est jamais dérivé, il est géré dans la table profiles.
//
// Le cookie de session renvoyé par Odoo n'est ni lu ni conservé : c'est Supabase
// qui porte la session côté dico.

export interface UtilisateurOdoo {
    uid: number;
    name: string;
    username: string;
}

// Odoo est l'autorité sur les comptes : la création n'existe pas côté dico,
// elle se fait sur le portail public The Elsassisch. Lien public, pas un
// secret — safe à importer côté client.
export const URL_INSCRIPTION_ODOO = "https://www.theelsassisch.com/web/signup";

// Les variables sont lues à l'appel et non au chargement du module : une
// vérification au niveau module casserait le build, qui n'a pas accès aux
// variables runtime de Coolify.
export async function authentifierAupresDOdoo(
    login: string,
    password: string,
): Promise<UtilisateurOdoo | null> {
    const url = process.env.ODOO_URL;
    const db = process.env.ODOO_DB;

    if (!url || !db) {
        console.error("[Odoo] ODOO_URL ou ODOO_DB manquante, authentification impossible");
        return null;
    }

    try {
        const reponse = await fetch(`${url}/web/session/authenticate`, {
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

        if (!reponse.ok) {
            console.error(`[Odoo] Réponse HTTP ${reponse.status}`);
            return null;
        }

        // Odoo répond 200 même en cas d'échec : l'erreur est dans le corps JSON.
        const donnees = await reponse.json();

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
    } catch (erreur) {
        // Échec fermé : toute erreur réseau ou réponse inattendue vaut refus.
        console.error("[Odoo] Erreur lors de l'authentification:", erreur);
        return null;
    }
}
