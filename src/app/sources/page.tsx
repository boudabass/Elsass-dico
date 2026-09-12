import Link from "next/link"

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
        <main className="mx-auto w-full max-w-3xl space-y-8 p-4 pb-16 md:pb-4 md:pl-20 lg:pl-56">
            <header className="space-y-1">
                <h1 className="text-xl font-semibold">Sources</h1>
                <p className="text-sm text-muted-foreground">
                    Toute forme alsacienne affichée par ce dictionnaire est copiée
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
                                <span className="font-medium">{s.nom}</span>
                                <span className="text-xs text-muted-foreground">
                                    {s._count.attestations.toLocaleString("fr-FR")} attestations
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
                                    {[s.annee, s.licence].filter(Boolean).join(" — ")}
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
                            Identité administrative des 1 605 communes — code INSEE, nom,
                            département, codes postaux, population.
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Source : INSEE, Code Officiel Géographique, via{" "}
                            <span className="font-mono">@etalab/decoupage-administratif</span>{" "}
                            6.0.0 — Licence Ouverte.
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
                            Source : IGN, ADMIN EXPRESS COG, millésime 2018 — Licence Ouverte.
                        </p>
                    </li>
                </ul>
            </section>

            <p className="text-xs text-muted-foreground">
                <Link href="/carte" className="underline">Retour à la carte</Link>
            </p>
        </main>
    )
}
