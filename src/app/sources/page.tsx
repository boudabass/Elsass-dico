
import { FichePublique } from "@/components/fiche-publique"
import { prisma } from "@/lib/prisma"

// Les crédits du dictionnaire, en un seul endroit.
//
// Cette page porte la mention de paternité exigée par la Licence Ouverte pour
// les données géographiques — la licence n'impose aucun emplacement, seulement
// que la source et son millésime soient mentionnés quelque part de lisible.
// Elle la sort donc de la carte, sans la faire disparaître.
//
// Elle sert aussi le reste : un dictionnaire dont la doctrine est « aucune
// forme que personne n'ait écrite » se doit de dire qui a écrit quoi.

export const metadata = { title: "Sources" }

export default async function PageSources() {
    const sources = await prisma.source.findMany({
        orderBy: { code: "asc" },
        select: {
            code: true, nom: true, url: true, annee: true, licence: true,
            _count: { select: { attestations: true } },
        },
    })

    return (
        <FichePublique className="space-y-8">
            <header className="space-y-1">
                <h1 className="text-xl font-semibold">Sources</h1>
                <p className="text-sm text-muted-foreground">
                    Toute façon de dire en alsacien affichée par ce dictionnaire est copiée
                    d&apos;une de ces sources, ou proposée par un locuteur qui dit
                    d&apos;où vient son parler. Aucune n&apos;est inventée.
                </p>
            </header>

            <section className="space-y-3">
                <h2 className="text-base font-medium">Sources écrites</h2>
                <ul className="space-y-3">
                    {sources.map((s) => (
                        <li key={s.code} className="rounded-lg border p-3">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <span className="font-medium">{sansTiretLong(s.nom)}</span>
                                <span className="text-xs text-muted-foreground">
                                    {s._count.attestations.toLocaleString("fr-FR").replace(/ /g, " ")} entrées
                                </span>
                            </div>
                            {s.url && (
                                <a
                                    href={s.url}
                                    className="mt-1 block break-all text-xs text-marque-rouge-texte underline"
                                    rel="noreferrer noopener"
                                    target="_blank"
                                >
                                    {s.url}
                                </a>
                            )}
                            {(s.annee || s.licence) && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {[s.annee, licenceAffichee(s)].filter(Boolean).join(" · ")}
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-base font-medium">Données géographiques</h2>
                <ul className="space-y-3 text-sm">
                    <li className="rounded-lg border p-3">
                        <div className="font-medium">Communes d&apos;Alsace-Moselle</div>
                        <p className="mt-1 text-muted-foreground">
                            Identité administrative des 1 605 communes : code INSEE, nom,
                            département, codes postaux, population.
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Source : INSEE, Code Officiel Géographique, via{" "}
                            <span className="font-mono">@etalab/decoupage-administratif</span>{" "}
                            6.0.0, sous Licence Ouverte.
                        </p>
                    </li>
                    <li className="rounded-lg border p-3">
                        <div className="font-medium">Contours et points des communes</div>
                        <p className="mt-1 text-muted-foreground">
                            Le fond de carte et le point de chaque village. Les contours sont
                            simplifiés et hébergés par nous : la carte ne fait aucun appel à un
                            service extérieur.
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Source : IGN, ADMIN EXPRESS COG, millésime 2018, sous Licence Ouverte.
                        </p>
                    </li>
                </ul>
            </section>

            {/* Odoo 930 : la seule exception à « aucun service extérieur », dite
                là où le site dit déjà d'où viennent ses données. */}
            <section className="space-y-3">
                <h2 className="text-base font-medium">Notifications du défi du jour</h2>
                <p className="rounded-lg border p-3 text-sm text-muted-foreground">
                    Si tu les actives, on garde seulement l&apos;adresse technique de ton téléphone,
                    pour t&apos;envoyer le défi à 10 h. L&apos;envoi passe par Google (Android) ou
                    Apple (iPhone), seul service extérieur du Dico. Tu les coupes dans «&nbsp;Mon
                    espace&nbsp;» ; supprimer ton compte efface aussi cette adresse.
                </p>
            </section>

        </FichePublique>
    )
}

// Les champs nom et licence viennent des fiches de source versionnées, qui
// portent des tirets longs (« non précisée — site personnel »). La règle de
// l'écran est de n'en afficher aucun (John, 23/09/2026) : on les rend en point
// médian à l'affichage, sans toucher à la donnée.
function sansTiretLong(texte: string) {
    return texte.replace(/\s*—\s*/g, " · ")
}

// La fiche du Wörterbuch porte la mention brute de son relevé (« Nachdruck
// 1974 », identifiants internes). On affiche à la place la mention voulue par
// John. Affichage seulement : la donnée reste telle quelle. Repérée par son
// code ou par son URL, jamais par son texte.
const LICENCE_WOERTERBUCH =
    "Livre imprimé de 1899 à 1907, sans doute dans le domaine public. Version numérique : © Kompetenzzentrum, Trier Center for Digital Humanities."

function licenceAffichee(s: { code: string; url: string | null; licence: string | null }) {
    if (s.code === "martin_lienhart" || s.url?.includes("woerterbuchnetz")) return LICENCE_WOERTERBUCH
    return s.licence && sansTiretLong(s.licence)
}
