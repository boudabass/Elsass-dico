"use client";

import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { envoyerMessageMembreAction, listerMessagesEnvoyesAction, type MessageEnvoye } from "@/app/actions/messages";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { dateMessage, MESSAGE_TEXTE_MAX } from "@/lib/messages";

// Écrire à un membre (07/11/2026). Un bouton ouvre la fenêtre ; le message part dans
// l'espace du membre, signé « L'équipe The Elsassisch ». `historique` ajoute la liste
// des messages déjà envoyés, avec leur statut de lecture (la fiche du membre).

export function EcrireMembre({
    membreId,
    nom,
    historique = false,
    children,
}: {
    membreId: string;
    nom: string;
    historique?: boolean;
    children: ReactNode;
}) {
    const [ouvert, setOuvert] = useState(false);
    const [texte, setTexte] = useState("");
    const [enCours, setEnCours] = useState(false);
    const [envoyes, setEnvoyes] = useState<MessageEnvoye[] | null>(null);

    // La liste ne se charge qu'à l'ouverture, et seulement dans la fiche.
    useEffect(() => {
        if (!ouvert || !historique) return;
        let annule = false;
        listerMessagesEnvoyesAction(membreId).then((res) => {
            if (annule) return;
            if (res.succes) setEnvoyes(res.messages);
            else toast.error(res.erreur);
        });
        return () => {
            annule = true;
        };
    }, [ouvert, historique, membreId]);

    async function envoyer() {
        setEnCours(true);
        const res = await envoyerMessageMembreAction(membreId, texte);
        setEnCours(false);
        if (res.succes) {
            toast.success("Message envoyé");
            setTexte("");
            setOuvert(false);
        } else {
            toast.error(res.erreur);
        }
    }

    return (
        <Dialog open={ouvert} onOpenChange={setOuvert}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Écrire à {nom}</DialogTitle>
                    <DialogDescription>
                        Ton message arrive dans son espace, signé L&apos;équipe The Elsassisch.
                    </DialogDescription>
                </DialogHeader>

                <Textarea
                    value={texte}
                    onChange={(e) => setTexte(e.target.value)}
                    rows={6}
                    aria-label="Ton message"
                    placeholder="Écris ton message"
                />
                <p className="text-right text-xs text-muted-foreground">
                    {texte.trim().length} / {MESSAGE_TEXTE_MAX}
                </p>

                {historique && (
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">Messages déjà envoyés</p>
                        {envoyes === null ? (
                            <p className="text-sm text-muted-foreground">Chargement…</p>
                        ) : envoyes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucun message pour l&apos;instant.</p>
                        ) : (
                            <ul className="max-h-56 space-y-2 overflow-y-auto">
                                {envoyes.map((m) => (
                                    <li key={m.id} className="rounded-md border p-2.5 text-sm">
                                        <p className="whitespace-pre-line text-foreground">{m.texte}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Envoyé le {dateMessage(m.creeLe)} ·{" "}
                                            {m.luLe ? `Lu le ${dateMessage(m.luLe)}` : "Pas encore lu"}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOuvert(false)} disabled={enCours}>
                        Annuler
                    </Button>
                    <Button onClick={envoyer} disabled={enCours || !texte.trim()}>
                        Envoyer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
