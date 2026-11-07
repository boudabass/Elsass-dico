"use client";

import { useEffect, useState } from "react";

import { mesMessagesAction, type MessageRecu } from "@/app/actions/messages";
import { dateMessage, SIGNATURE_MESSAGE } from "@/lib/messages";

// Les messages que l'équipe a écrits au membre (07/11/2026). Lus une fois : ouvrir
// Mon espace les marque lus côté serveur. Texte brut, retours à la ligne gardés.

export function MessagesEquipe({ actif }: { actif: boolean }) {
    const [messages, setMessages] = useState<MessageRecu[]>([]);

    useEffect(() => {
        if (!actif) return;
        let annule = false;
        mesMessagesAction().then((liste) => {
            if (!annule) setMessages(liste);
        });
        return () => {
            annule = true;
        };
    }, [actif]);

    if (messages.length === 0) return null;

    return (
        <section className="mt-[18px] space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Messages de l&apos;équipe
            </p>
            {messages.map((m) => (
                <article key={m.id} className="rounded-lg border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">
                        {dateMessage(m.creeLe)}
                        {m.nouveau ? " · Nouveau" : ""}
                    </p>
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-[1.5] text-foreground">{m.texte}</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{SIGNATURE_MESSAGE}</p>
                </article>
            ))}
        </section>
    );
}
