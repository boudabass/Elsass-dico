// Construit le référentiel des communes d'Alsace-Moselle : identité administrative
// (Etalab) croisée avec un point de placement carte (centroïde calculé sur les
// contours IGN). Aucune donnée n'est inventée : une commune sans contour est
// signalée, jamais placée approximativement.

const fs = require('fs')
const path = require('path')

const DEPARTEMENTS = ['67', '68', '57']
const GEOJSON = {
    '57': 'france-geojson/departements/57-moselle/communes-57-moselle.geojson',
    '67': 'france-geojson/departements/67-bas-rhin/communes-67-bas-rhin.geojson',
    '68': 'france-geojson/departements/68-haut-rhin/communes-68-haut-rhin.geojson',
}

// Centroïde d'aire d'un anneau (formule du polygone). Bien plus fidèle que le
// centre de la boîte englobante sur des communes de forme allongée — une vallée
// vosgienne verrait son point tomber sur la crête voisine.
function centroideAnneau(anneau) {
    let aire = 0
    let x = 0
    let y = 0
    for (let i = 0, j = anneau.length - 1; i < anneau.length; j = i++) {
        const [x0, y0] = anneau[j]
        const [x1, y1] = anneau[i]
        const f = x0 * y1 - x1 * y0
        aire += f
        x += (x0 + x1) * f
        y += (y0 + y1) * f
    }
    aire *= 0.5
    if (aire === 0) return null
    return { lon: x / (6 * aire), lat: y / (6 * aire), aire: Math.abs(aire) }
}

// Un MultiPolygon peut porter des enclaves : on retient le plus grand morceau,
// c'est celui où se trouve le village.
function centroide(geometrie) {
    if (!geometrie) return null
    const polygones =
        geometrie.type === 'Polygon' ? [geometrie.coordinates]
        : geometrie.type === 'MultiPolygon' ? geometrie.coordinates
        : []

    let meilleur = null
    for (const polygone of polygones) {
        const c = centroideAnneau(polygone[0])
        if (c && (!meilleur || c.aire > meilleur.aire)) meilleur = c
    }
    return meilleur
}

const communes = require('@etalab/decoupage-administratif/data/communes.json')
    .filter((c) => DEPARTEMENTS.includes(c.departement) && c.type === 'commune-actuelle')

const points = new Map()
for (const [dep, fichier] of Object.entries(GEOJSON)) {
    const fc = JSON.parse(fs.readFileSync(path.join(__dirname, fichier), 'utf8'))
    for (const f of fc.features) {
        const c = centroide(f.geometry)
        if (c) points.set(f.properties.code, { lat: c.lat, lon: c.lon })
    }
    console.log(`contours ${dep} : ${fc.features.length} communes`)
}

const sansPoint = []
const referentiel = communes
    .map((c) => {
        const p = points.get(c.code)
        if (!p) sansPoint.push(`${c.code} ${c.nom}`)
        return {
            code: c.code,
            nom: c.nom,
            departement: c.departement,
            codesPostaux: c.codesPostaux ?? [],
            population: c.population ?? null,
            // Arrondi à 5 décimales : ~1 m de précision, largement au-delà de ce
            // qu'un point de commune demande, et le fichier reste lisible.
            latitude: p ? Number(p.lat.toFixed(5)) : null,
            longitude: p ? Number(p.lon.toFixed(5)) : null,
            // L'aire linguistique ne s'invente pas : le 57 reste indéterminé,
            // tracer nous-mêmes la limite alsacien/francique fabriquerait une
            // donnée que personne n'a établie.
            aireLinguistique: c.departement === '57' ? null : 'alsacien',
        }
    })
    .sort((a, b) => a.code.localeCompare(b.code))

fs.writeFileSync(
    path.join(__dirname, 'communes.json'),
    JSON.stringify(referentiel, null, 2) + '\n',
)

console.log('---')
console.log('communes retenues :', referentiel.length)
for (const d of DEPARTEMENTS) {
    console.log(`  ${d} :`, referentiel.filter((c) => c.departement === d).length)
}
console.log('sans coordonnées :', sansPoint.length)
if (sansPoint.length) console.log('  ', sansPoint.slice(0, 20).join(' | '))
