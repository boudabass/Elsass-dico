"use client"

import { useEffect, useRef } from "react"

// Leaflet touche `window` dès son import : il ne peut pas être chargé côté
// serveur. D'où l'import dynamique dans l'effet plutôt qu'en tête de fichier —
// c'est ce qui évite le « window is not defined » au build de Next.
//
// Pas de `react-leaflet` : une couche de plus pour ce que trois appels font
// déjà, sur une app dont la contrainte est justement le poids.

export interface PointParler {
    /** Code INSEE — sert de clé, jamais affiché. */
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

// Fond officiel français. La diffusion d'images tuilées de la Géoplateforme est
// exclue du plafonnement de ses API — contrairement aux tuiles d'OSM, dont la
// politique prévoit un blocage sans préavis en cas d'usage jugé lourd.
// Licence Ouverte Etalab : la mention de la source est obligatoire.
const TUILES_IGN = "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile"
    + "&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal"
    + "&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}"
const ATTRIBUTION = "source : <a href=\"https://www.ign.fr/\">IGN</a> — Géoplateforme"

// L'Alsace tient dans ce cadre : on l'ouvre dessus plutôt que sur un centre et
// un zoom fixes, qui cadreraient mal selon la taille de l'écran (mobile-first).
const ALSACE: [[number, number], [number, number]] = [[47.40, 6.85], [49.08, 8.30]]

export function CarteParlers({ points, couleurDe, className }: Props) {
    const conteneur = useRef<HTMLDivElement>(null)
    const carte = useRef<unknown>(null)

    useEffect(() => {
        let annule = false
        let instance: any = null

        void (async () => {
            const L = (await import("leaflet")).default
            if (annule || !conteneur.current) return

            instance = L.map(conteneur.current, {
                // Le zoom à la molette vole le défilement de la page sur une
                // carte posée au milieu d'un écran mobile-first.
                scrollWheelZoom: false,
            }).fitBounds(ALSACE)
            carte.current = instance

            L.tileLayer(TUILES_IGN, { attribution: ATTRIBUTION, maxZoom: 18 })
                .addTo(instance)

            for (const p of points) {
                const couleur = couleurDe?.(p.formes[0] ?? "") ?? "#C20000"
                L.circleMarker([p.latitude, p.longitude], {
                    radius: 6,
                    weight: 2,
                    color: "#ffffff",
                    fillColor: couleur,
                    fillOpacity: 0.95,
                })
                    .bindPopup(
                        `<strong>${p.formes.join(" · ")}</strong><br>${p.nom}`,
                    )
                    .addTo(instance)
            }
        })()

        return () => {
            annule = true
            instance?.remove()
            carte.current = null
        }
    }, [points, couleurDe])

    return <div ref={conteneur} className={className} />
}
