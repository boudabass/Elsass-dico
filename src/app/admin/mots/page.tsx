"use client";

import Link from "next/link";
import { BookPlus, MapPin } from "lucide-react";

import { listerMotsAjoutesAction, type MotAjoute } from "@/app/actions/mots";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useListeAdmin } from "@/hooks/use-liste-admin";
import { formeDictionnaire, LIBELLES_TYPE_TERME } from "@/lib/dictionnaire";

// Les mots français ajoutés par les membres (décision de John, 28/09/2026).
// En lecture, comme /admin/sources : un mot ajouté est publié tout de suite,
// avec sa première forme, et la modération passe par le signalement de ses
// formes. Cet écran sert à voir passer ce qui n'existe dans aucune source.

function dateCourte(iso: string): string {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminMotsPage() {
    const { estAdmin, items: mots, premierChargement } = useListeAdmin<MotAjoute>(
        "admin-mots",
        async () => {
            const res = await listerMotsAjoutesAction();
            return res.succes ? { succes: true, liste: res.mots } : res;
        },
    );

    if (!estAdmin) return <div className="p-8 text-center">Accès refusé</div>;

    return (
        <div className="flex min-h-ecran flex-col pb-16 md:pb-0 md:pl-20 lg:pl-56">
            <AppHeader variant="stack" titre="Mots ajoutés" backHref="/admin" actif="admin" />

            <div className="mx-auto w-full max-w-3xl space-y-6 p-4 pb-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookPlus className="h-5 w-5" /> Ajoutés par les membres ({mots.length})
                        </CardTitle>
                        <CardDescription>
                            Des mots français qu&apos;aucune source ne donnait, chacun avec au moins une
                            forme alsacienne. Ils sont déjà publiés. Si l&apos;un pose problème, ouvre sa
                            fiche et signale sa forme.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {premierChargement ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">Chargement…</p>
                        ) : mots.length === 0 ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">
                                Aucun mot ajouté pour l&apos;instant.
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {mots.map((m) => (
                                    <li key={m.id} className="rounded-lg border border-border p-3.5">
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                            <Link
                                                href={`/entree/${m.id}`}
                                                className="text-lg font-bold text-foreground underline-offset-4 hover:underline"
                                            >
                                                {m.francais}
                                            </Link>
                                            <span className="text-xs text-muted-foreground">
                                                {LIBELLES_TYPE_TERME[m.type]} · {dateCourte(m.creeLe)}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            {m.auteur ? `Par ${m.auteur}` : "Compte supprimé depuis"}
                                        </p>
                                        <ul className="mt-2.5 flex flex-col gap-1.5">
                                            {m.formes.map((f) => (
                                                <li key={f.forme} className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                                    <span lang="gsw" className="font-semibold text-foreground">
                                                        {formeDictionnaire(f.forme)}
                                                    </span>
                                                    {f.villages.length > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                                            <MapPin className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                                                            {f.villages.join(", ")}
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
