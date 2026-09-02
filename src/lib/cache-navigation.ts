// Cache de navigation — mémoire de ce qu'un écran affichait quand on l'a
// quitté (données, position de scroll, dernière URL par onglet racine).
//
// Le problème qu'il résout (retour utilisateur du 02/09/2026) : chaque écran
// de liste est un composant client qui charge ses données dans un useEffect
// déclenché AU MONTAGE. Une navigation entre deux routes démonte le composant,
// donc au retour React remonte, l'état repart à sa valeur par défaut et
// l'effet refait l'appel réseau — la liste clignote et le scroll est perdu.
// Le correctif du 30/08 (PR #22) n'avait traité que la sélection (?q=,
// ?lettre=), jamais les données ni le scroll.
//
// Pourquoi un store maison plutôt que react-query ou swr :
//   1. Ces librairies ne couvrent que la moitié du besoin — elles ne
//      restaurent pas le scroll, qu'il aurait fallu écrire de toute façon,
//      avec un second modèle de clés à tenir en phase.
//   2. Leurs valeurs par défaut (`refetchOnWindowFocus`, `refetchOnReconnect`)
//      vont contre la contrainte de ce projet : le VPS n'a ni limite CPU ni
//      rate limiting, et chaque Server Action passe par middleware.ts, qui
//      fait un getUser() PLUS un select sur profiles. Un appel évité, ce
//      n'est pas une requête économisée mais trois. On aurait neutralisé 90 %
//      de la librairie.
//   3. Le repo n'a aucune dépendance de ce type et un style artisanal assumé.
//
// Contrepartie assumée : on réimplémente la déduplication des appels en vol,
// la protection contre les courses et l'éviction. Ce sont les trois endroits
// où un cache maison casse ; ils sont traités explicitement ci-dessous.
//
// JAMAIS de sessionStorage ni de localStorage ici. Le cache d'/admin/arbitrage
// contient des attestations NON PUBLIÉES — du brut qui ne sort jamais de la
// base pour un visiteur (GET /attestations rend [] en clé anonyme). Les
// écrire sur disque les laisserait lisibles après une déconnexion, sur un
// poste partagé, jusqu'à la fermeture de l'onglet. Un cache mémoire meurt
// avec le contexte JS de la page. Conséquence acceptée : un rechargement dur
// (F5) refetche tout — c'est le comportement voulu, « le retour conserve, le
// rechargement rafraîchit ».

interface EntreeCache {
    donnees: unknown
    datee: number
}

// Plafond d'entrées : la recherche crée une entrée par terme cherché, une
// session de frappe en produit vite des dizaines. Les Map itèrent dans
// l'ordre d'insertion, la première clé est donc la plus anciennement écrite.
const MAX_ENTREES = 40

const CACHE = new Map<string, EntreeCache>()
// Appels en cours, par clé. Sert la déduplication : en développement, le
// StrictMode de React 19 monte chaque composant deux fois — sans cette table,
// tout écran partirait sur deux appels réseau identiques.
const EN_VOL = new Map<string, Promise<unknown>>()
// Compteur d'invalidation par clé. Une revalidation partie AVANT un
// invaliderCache() ne doit pas réécrire dans le cache la file qu'on vient de
// publier : elle capture la version au départ et se tait si elle a changé.
const VERSIONS = new Map<string, number>()
const SCROLLS = new Map<string, number>()
const URLS_ONGLETS = new Map<string, string>()

// Compose une clé lisible. Les segments nuls sont ignorés, ce qui permet
// d'écrire cleCache("dashboard", user?.id) sans condition à l'appel.
export function cleCache(...segments: (string | null | undefined)[]): string {
    return segments.filter((s) => s !== null && s !== undefined && s !== "").join("|")
}

export function lireCache<T>(cle: string): { donnees: T; datee: number } | null {
    const entree = CACHE.get(cle)
    if (!entree) return null
    return { donnees: entree.donnees as T, datee: entree.datee }
}

function ecrireCache(cle: string, donnees: unknown): void {
    // Réinsérer après suppression remet la clé en fin d'ordre d'itération :
    // une entrée relue reste ainsi la dernière à être évincée.
    CACHE.delete(cle)
    CACHE.set(cle, { donnees, datee: Date.now() })
    if (CACHE.size > MAX_ENTREES) {
        const plusAncienne = CACHE.keys().next().value
        if (plusAncienne !== undefined) CACHE.delete(plusAncienne)
    }
}

// Charge en dédupliquant : deux appels concurrents sur la même clé partagent
// une seule promesse. Le retrait d'EN_VOL se fait dans le finally de la
// promesse et JAMAIS dans un cleanup d'effet — sinon le démontage du premier
// passage StrictMode annulerait la déduplication qu'on vient de poser.
export async function chargerAvecCache<T>(cle: string, charger: () => Promise<T>): Promise<T> {
    const enVol = EN_VOL.get(cle)
    if (enVol) return enVol as Promise<T>

    const version = VERSIONS.get(cle) ?? 0
    const promesse = charger()
        .then((donnees) => {
            if ((VERSIONS.get(cle) ?? 0) === version) ecrireCache(cle, donnees)
            return donnees
        })
        .finally(() => {
            EN_VOL.delete(cle)
        })

    EN_VOL.set(cle, promesse)
    return promesse
}

// Invalide par préfixe : invaliderCache("arbitrage") emporte toutes les
// combinaisons de filtre et d'identité d'un coup. Incrémente la version pour
// que les appels déjà partis n'écrivent plus rien.
export function invaliderCache(prefixe: string): void {
    // Clés relevées d'abord, supprimées ensuite : on ne modifie pas une Map
    // pendant qu'on la parcourt. (forEach plutôt que for..of : la cible du
    // tsconfig est ES5, itérer une Map y demanderait downlevelIteration.)
    const concernees: string[] = []
    const relever = (_valeur: unknown, cle: string) => {
        if (cle.startsWith(prefixe)) concernees.push(cle)
    }
    CACHE.forEach(relever)
    EN_VOL.forEach(relever)

    concernees.forEach((cle) => {
        CACHE.delete(cle)
        EN_VOL.delete(cle)
        VERSIONS.set(cle, (VERSIONS.get(cle) ?? 0) + 1)
    })
}

// Purge totale, appelée au changement d'identité. Synchrone (un simple clear)
// pour rester compatible avec le callback onAuthStateChange, qui n'admet
// aucun await.
export function viderCache(): void {
    CACHE.clear()
    EN_VOL.clear()
    VERSIONS.clear()
    SCROLLS.clear()
    URLS_ONGLETS.clear()
}

export function memoriserScroll(cle: string, y: number): void {
    SCROLLS.set(cle, y)
}

export function lireScroll(cle: string): number | undefined {
    return SCROLLS.get(cle)
}

// Dernière URL visitée par destination de la barre de nav, pour que cliquer
// « Recherche » depuis le Dictionnaire retrouve la recherche précédente au
// lieu d'un écran vide.
export function memoriserUrlOnglet(onglet: string, url: string): void {
    URLS_ONGLETS.set(onglet, url)
}

export function lireUrlOnglet(onglet: string): string | undefined {
    return URLS_ONGLETS.get(onglet)
}

// Distingue « je reviens » de « j'y vais ». Un retour (chevron router.back(),
// bouton du navigateur, swipe iOS) émet popstate ; un <Link> en push, non.
// C'est ce qui fait qu'on restaure le scroll sur un retour mais qu'un clic
// sur un onglet de la barre ouvre l'écran en haut de page — retrouver ses
// filtres est utile, être déposé au milieu d'une liste qu'on n'a pas quittée
// par un retour serait désorientant.
const DELAI_RETOUR_MS = 1500
let dernierRetour = 0

if (typeof window !== "undefined") {
    window.addEventListener("popstate", () => {
        dernierRetour = performance.now()
    })
}

export function estRetourHistorique(): boolean {
    return dernierRetour > 0 && performance.now() - dernierRetour < DELAI_RETOUR_MS
}
