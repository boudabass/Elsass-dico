// Contrôle de la recherche Prisma — la MÊME requête que
// `rechercherAction()`, exécutée sur la base réelle. Jetable : sert à voir ce
// que l'écran rendra avant de le regarder à l'écran.
import { ouvrirBase } from "../lib/base.mts"

const prisma = ouvrirBase()

const TERMES = ["bonjour", "salaire", "epreuve", "Milhüsa", "mardi", "barr", "zz"]

for (const terme of TERMES) {
    const lignes = await prisma.$queryRaw<
        { id: string; francais: string; contexte: string; type: string; score: number }[]
    >`
        WITH t AS (SELECT immutable_unaccent(lower(btrim(${terme}))) AS q),
        par_francais AS (
            SELECT l.id,
                   similarity(immutable_unaccent(l.cle), t.q)
                     + CASE WHEN immutable_unaccent(l.cle) = t.q THEN 1 ELSE 0 END AS score
            FROM lemmes l, t
            WHERE immutable_unaccent(l.cle) LIKE '%' || t.q || '%'
        ),
        par_alsacien AS (
            SELECT v.lemme_id AS id,
                   max(similarity(immutable_unaccent(lower(v.forme)), t.q)
                         + CASE WHEN immutable_unaccent(lower(v.forme)) = t.q THEN 1 ELSE 0 END) AS score
            FROM variantes v, t
            WHERE v.masquee = false
              AND immutable_unaccent(lower(v.forme)) LIKE '%' || t.q || '%'
            GROUP BY v.lemme_id
        ),
        reunis AS (
            SELECT id, max(score) AS score
            FROM (SELECT * FROM par_francais UNION ALL SELECT * FROM par_alsacien) x
            GROUP BY id
        )
        SELECT l.id, l.francais, l.contexte, l.type::text AS type, r.score
        FROM reunis r
        JOIN lemmes l ON l.id = r.id
        ORDER BY r.score DESC, length(l.francais) ASC, l.francais ASC
        LIMIT 30
    `

    const premier = lignes[0]
    let formes = ""
    if (premier) {
        const v = await prisma.variante.findMany({
            where: { lemmeId: premier.id, masquee: false },
            select: { forme: true, temoignages: { select: { sourceId: true, communeId: true } } },
            orderBy: { forme: "asc" },
        })
        formes = v
            .map((x) => {
                const s = new Set(x.temoignages.map((t) => t.sourceId).filter(Boolean)).size
                const c = new Set(x.temoignages.map((t) => t.communeId).filter(Boolean)).size
                return `${x.forme} [${s} src, ${c} vil]`
            })
            .join(" | ")
    }

    console.log(
        `${terme.padEnd(10)} → ${String(lignes.length).padStart(2)} résultats`
        + (premier ? ` ; 1er = ${premier.francais}${premier.contexte ? ` (${premier.contexte})` : ""} : ${formes}` : ""),
    )
}

// Le parcours A-Z : les lettres réellement disponibles, et un volume par lettre.
const lettres = await prisma.$queryRaw<{ lettre: string; n: bigint }[]>`
    SELECT upper(left(immutable_unaccent(cle), 1)) AS lettre, count(*) AS n
    FROM lemmes WHERE cle <> ''
    GROUP BY lettre ORDER BY lettre
`
console.log(
    "\nlettres :",
    lettres.filter((l) => /^[A-Z]$/.test(l.lettre)).map((l) => `${l.lettre}:${l.n}`).join(" "),
)
console.log(
    "hors A-Z :",
    lettres.filter((l) => !/^[A-Z]$/.test(l.lettre)).map((l) => `${JSON.stringify(l.lettre)}:${l.n}`).join(" ") || "aucune",
)

await prisma.$disconnect()
