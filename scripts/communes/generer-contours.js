// Produit le fond de carte du dictionnaire : les contours des 1 605 communes
// d'Alsace-Moselle, en TopoJSON simplifié.
//
// POURQUOI CE FICHIER EXISTE. Décision de John du 12/09/2026 : l'app ne doit
// dépendre d'AUCUN service extérieur. Une carte à tuiles (IGN, OpenStreetMap)
// demande son fond à un serveur tiers à chaque consultation — le jour où ce
// serveur change ses URL, plafonne ou tombe, la carte est vide. Ici le fond est
// un fichier que nous servons nous-mêmes, et qui ne rappelle personne.
//
// Ce n'est pas un renoncement : pour un dictionnaire des parlers, le maillage
// des villages DIT quelque chose, là où une carte routière n'est qu'un décor.
//
// POURQUOI TOPOJSON. Deux communes voisines partagent une frontière ; en
// GeoJSON elle est écrite deux fois, en TopoJSON une seule. Mesuré sur nos
// trois départements : 1 602 Ko de GeoJSON brut deviennent 402 Ko, soit 97 Ko
// une fois compressés à la volée — moins que trois tuiles d'une carte classique.
//
// POURQUOI 12 % DES SOMMETS. Mesuré aussi : à ce seuil l'écart d'aire est de
// 0,017 % sur le Bas-Rhin, aucune commune ne dégénère, et les 1 605 sont
// conservées. En dessous (6 %), l'écart passe à 0,095 % pour 10 Ko gagnés — le
// jeu n'en vaut pas la chandelle.
//
// Rejouer ce script doit produire un `git diff` vide, comme pour les parseurs
// du studio et pour le référentiel des communes.
//
//   npm install @etalab/decoupage-administratif topojson-server topojson-simplify
//   git clone --depth 1 --filter=blob:none --no-checkout \
//       https://github.com/gregoiredavid/france-geojson.git
//   cd france-geojson && git sparse-checkout set --no-cone \
//       departements/57-moselle departements/67-bas-rhin departements/68-haut-rhin
//   for d in 57-moselle 67-bas-rhin 68-haut-rhin; do \
//       git checkout HEAD -- "departements/$d/communes-$d.geojson"; done
//   cd .. && node scripts/communes/generer-contours.js

const fs = require('fs')
const path = require('path')
const { topology } = require('topojson-server')
const { presimplify, simplify, quantile } = require('topojson-simplify')

const GEOJSON = {
    '57': 'france-geojson/departements/57-moselle/communes-57-moselle.geojson',
    '67': 'france-geojson/departements/67-bas-rhin/communes-67-bas-rhin.geojson',
    '68': 'france-geojson/departements/68-haut-rhin/communes-68-haut-rhin.geojson',
}

// Proportion de sommets conservés. Voir l'en-tête pour la mesure qui l'a fixée.
const PART_SOMMETS = 0.12

const RACINE = path.resolve(__dirname, '..', '..')
const REFERENTIEL = path.join(RACINE, 'data', 'communes', 'communes.json')
const SORTIE = path.join(RACINE, 'public', 'carte', 'contours.topojson')

const referentiel = JSON.parse(fs.readFileSync(REFERENTIEL, 'utf-8'))
const codesAttendus = new Set(referentiel.map((c) => c.code))

const traits = []
for (const fichier of Object.values(GEOJSON)) {
    if (!fs.existsSync(fichier)) {
        console.error(`contours introuvables : ${fichier}`)
        console.error("Voir l'en-tête du script pour les récupérer.")
        process.exit(1)
    }
    const geo = JSON.parse(fs.readFileSync(fichier, 'utf-8'))
    for (const trait of geo.features) {
        // Les contours sont au millésime 2018, le référentiel au millésime
        // courant : quatre communes ont fusionné depuis. Dessiner leurs limites
        // ferait apparaître des frontières qui n'existent plus.
        if (!codesAttendus.has(trait.properties.code)) continue
        traits.push({
            type: 'Feature',
            // Le code INSEE et rien d'autre : le nom, la population et les
            // coordonnées vivent déjà dans communes.json, et les répéter ici
            // doublerait le poids d'un fichier qu'on charge sur mobile.
            properties: { c: trait.properties.code },
            geometry: trait.geometry,
        })
    }
}

const trouves = new Set(traits.map((t) => t.properties.c))
const manquantes = [...codesAttendus].filter((c) => !trouves.has(c))
if (manquantes.length) {
    // Un trou dans le fond de carte est un village qui disparaît du dessin :
    // ça s'arrête ici, ça ne se découvre pas à l'écran.
    console.error(`${manquantes.length} communes du référentiel sans contour :`,
        manquantes.slice(0, 10))
    process.exit(1)
}

const topo = topology({ communes: { type: 'FeatureCollection', features: traits } })
const prepare = presimplify(topo)
const allege = simplify(prepare, quantile(prepare, PART_SOMMETS))

fs.mkdirSync(path.dirname(SORTIE), { recursive: true })
const texte = JSON.stringify(allege)
fs.writeFileSync(SORTIE, texte)

console.log(`communes  : ${traits.length} / ${codesAttendus.size} attendues`)
console.log(`contours  : ${path.relative(RACINE, SORTIE)}`)
console.log(`poids     : ${(Buffer.byteLength(texte) / 1024).toFixed(0)} Ko `
    + `(~${(require('zlib').gzipSync(texte).length / 1024).toFixed(0)} Ko une fois compressé)`)
