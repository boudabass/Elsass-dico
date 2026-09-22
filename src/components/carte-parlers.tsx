"use client"

import type { LayerGroup, Map as LeafletMap } from "leaflet"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

// CARTE AUTONOME — aucun appel vers un service extérieur.
//
// Décision de John du 12/09/2026 : l'app ne doit dépendre d'aucun outil
// extérieur. Il n'y a donc PAS de couche de tuiles ici : ni OpenStreetMap, ni
// la Géoplateforme de l'IGN, ni aucun autre serveur tiers. Le fond est dessiné
// à partir de `public/carte/contours.topojson`, un fichier que nous produisons
// et que nous servons — 1 605 communes, ~97 Ko compressés, soit moins que trois
// tuiles d'une carte classique.
//
// Leaflet est ici pour le pan, le zoom et le tactile, qui sont beaucoup de
// travail à refaire et qu'il fait bien. Sans `tileLayer`, il n'émet aucune
// requête réseau. C'est une bibliothèque dans notre bundle, pas un service :
// la distinction est tout l'objet de cette décision.

export interface PointParler {
    /** Code INSEE — sert de clé et de lien vers le contour, jamais affiché. */
    id: number
    nom: string
    latitude: number
    longitude: number
    /** Les formes attestées pour ce village, dans l'ordre où elles viennent. */
    formes: string[]
}

interface Props {
    points: PointParler[]
    /** Couleur par forme : deux villages qui disent pareil se voient d'un coup
     *  d'œil. Non fournie, tous les points sont de la même couleur. */
    couleurDe?: (forme: string) => string
    className?: string
}

/** Le fond, servi par nous. Chargé une fois, mis en cache par le navigateur. */
const CONTOURS = "/carte/contours.topojson"

// L'Alsace-Moselle tient dans ce cadre : on l'ouvre dessus plutôt que sur un
// centre et un zoom fixes, qui cadreraient mal selon la taille de l'écran.
const CADRE: [[number, number], [number, number]] = [[47.40, 6.80], [49.60, 7.70]]

// `formes`/`nom` viennent d'un champ saisi verbatim par un membre
// (`creerVarianteAction`, jamais recadré — règle 1 du projet). Construire ce
// contenu par `textContent` plutôt que par une chaîne HTML interpolée évite
// toute injection : `bindPopup` accepte un `HTMLElement` directement, donc
// rien n'est jamais interprété comme du balisage.
function creerContenuPopup(formes: string[], nom: string): HTMLElement {
    const conteneur = document.createElement("span")
    const gras = document.createElement("strong")
    gras.textContent = formes.join(" · ")
    conteneur.append(gras, document.createElement("br"), document.createTextNode(nom))
    return conteneur
}

// Ce dont l'effet des points a besoin une fois la carte montée : Leaflet
// lui-même (chargé dynamiquement) et la couche qui porte les marqueurs.
interface CarteMontee {
    L: typeof import("leaflet")
    marqueurs: LayerGroup
}

export function CarteParlers({ points, couleurDe, className }: Props) {
    const conteneur = useRef<HTMLDivElement>(null)
    const [carte, setCarte] = useState<CarteMontee | null>(null)

    // La carte et son fond se construisent UNE fois. Seuls les marqueurs
    // suivent `points` (effet suivant) : reconstruire toute la carte à chaque
    // changement rechargeait le fond et remettait le cadrage à zéro — un
    // membre zoomé sur son coin perdait sa vue à chaque filtre et à chaque vote.
    useEffect(() => {
        let annule = false
        let instance: LeafletMap | null = null

        void (async () => {
            // Leaflet lit `window` dès son import : il ne peut pas être chargé
            // côté serveur, d'où l'import dans l'effet.
            const [{ default: L }, { feature }] = await Promise.all([
                import("leaflet"),
                import("topojson-client"),
            ])
            if (annule || !conteneur.current) return

            const map = L.map(conteneur.current, {
                // Le zoom à la molette vole le défilement de la page sur une
                // carte posée au milieu d'un écran mobile-first.
                scrollWheelZoom: false,
                // 1 605 polygones en SVG font ramer un téléphone d'entrée de
                // gamme ; en canvas, c'est un seul élément à repeindre.
                preferCanvas: true,
                attributionControl: false,
            }).fitBounds(CADRE)
            instance = map

            // Le fond d'abord, la couche des points ensuite : sur un canvas,
            // l'ordre d'ajout est l'ordre de peinture, et les points passeraient
            // sous les communes. Un fond qui ne charge pas n'empêche pas les
            // points de s'afficher.
            const reponse = await fetch(CONTOURS)
            if (annule) return
            if (reponse.ok) {
                const topo = await reponse.json()
                if (annule) return
                L.geoJSON(feature(topo, topo.objects.communes), {
                    interactive: false,
                    style: {
                        // Un fond qui se tait : le maillage se devine, il ne
                        // concurrence pas les formes qu'on est venu lire.
                        color: "#94a3b8",
                        weight: 0.5,
                        fillColor: "#f8fafc",
                        fillOpacity: 1,
                    },
                }).addTo(map)
            }

            setCarte({ L, marqueurs: L.layerGroup().addTo(map) })

            // Pas de bandeau d'attribution SUR la carte : la Licence Ouverte
            // demande de mentionner la paternité, jamais à un endroit imposé —
            // vérifié dans son texte, qui accepte même une simple URL renvoyant
            // vers l'information. La mention vit donc sur /sources, où elle est
            // lisible sans encombrer l'écran central de l'app.
            //
            // Elle n'est pas facultative pour autant : c'est la seule condition
            // d'une licence qui donne par ailleurs tout (usage commercial,
            // monde entier, durée illimitée). Sans elle, on n'a plus de droit
            // d'usage du tout sur ces contours.
        })()

        return () => {
            annule = true
            instance?.remove()
            setCarte(null)
        }
    }, [])

    useEffect(() => {
        if (!carte) return
        const { L, marqueurs } = carte
        marqueurs.clearLayers()
        for (const p of points) {
            L.circleMarker([p.latitude, p.longitude], {
                radius: 5,
                weight: 1.5,
                color: "#ffffff",
                fillColor: couleurDe?.(p.formes[0] ?? "") ?? "#C20000",
                fillOpacity: 0.95,
            })
                .bindPopup(creerContenuPopup(p.formes, p.nom))
                .addTo(marqueurs)
        }
    }, [carte, points, couleurDe])

    // `isolate` : Leaflet pose ses propres panes internes avec des z-index
    // allant jusqu'à 1000 (`.leaflet-top`/`.leaflet-bottom`, les contrôles de
    // zoom) SANS jamais les confiner dans son propre conteneur. Sans ce
    // contexte d'empilement dédié, ces z-index se comparent directement au
    // reste de la page dans le contexte racine — la carte passait ainsi
    // par-dessus la barre d'onglets mobile fixe (`AppNavShell`, z-30) dès que
    // leurs rectangles se chevauchaient à l'écran, quel que soit l'ordre du
    // DOM. Trouvé le 17/09/2026 après un bug analogue sur le dropdown de
    // recherche de la carte.
    return <div ref={conteneur} className={cn("isolate", className)} />
}
