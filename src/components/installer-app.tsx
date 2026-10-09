"use client";

import { useEffect, useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Mettre le Dico sur l'écran d'accueil (10/10/2026, retour de John : une
// consigne iPhone lue en continu perdait les gens sur Android). Deux gros
// boutons côte à côte, Android et iPhone, chacun ouvre sa marche à suivre.
// Quand le navigateur le permet (Chrome sur Android), un seul bouton
// « Installer » déclenche directement l'installation, comme l'autorisation des
// notifications. Safari ne le permet pas : l'iPhone garde la marche à suivre.

interface EvenementInstallation extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Chrome envoie `beforeinstallprompt` une seule fois, souvent avant que
// l'écran ne soit monté : on l'attrape dès le chargement du module et on le
// garde pour le bouton.
let installation: EvenementInstallation | null = null;
const abonnes = new Set<() => void>();
if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        installation = e as EvenementInstallation;
        abonnes.forEach((f) => f());
    });
    window.addEventListener("appinstalled", () => {
        installation = null;
        abonnes.forEach((f) => f());
    });
}

export function estInstalle(): boolean {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

/** La carte de « Mon espace » : rien du tout si le Dico est déjà installé. */
export function CarteInstallation({ className }: { className?: string }) {
    const [installe, setInstalle] = useState(true);
    useEffect(() => setInstalle(estInstalle()), []);
    if (installe) return null;
    return (
        <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
            <p className="text-[15px] font-bold text-foreground">Le Dico sur ton écran d&apos;accueil</p>
            <p className="mt-1.5 text-sm leading-[1.5] text-muted-foreground">
                Une icône sur ton téléphone, comme une application. Choisis ton téléphone :
            </p>
            <InstallerApp className="mt-3" />
        </div>
    );
}

export function InstallerApp({ className, onInstalle }: { className?: string; onInstalle?: () => void }) {
    const [pret, setPret] = useState(false);
    const [installe, setInstalle] = useState(true);
    const [, forcer] = useState(0);

    useEffect(() => {
        setInstalle(estInstalle());
        setPret(true);
        const f = () => forcer((n) => n + 1);
        abonnes.add(f);
        return () => {
            abonnes.delete(f);
        };
    }, []);

    if (!pret || installe) return null;

    const installer = async () => {
        if (!installation) return;
        await installation.prompt();
        const { outcome } = await installation.userChoice;
        installation = null;
        forcer((n) => n + 1);
        if (outcome === "accepted") {
            setInstalle(true);
            onInstalle?.();
        }
    };

    return (
        <div className={cn("grid grid-cols-2 gap-2", className)}>
            {installation ? (
                <button
                    type="button"
                    onClick={installer}
                    className="col-span-2 flex h-14 items-center justify-center rounded-lg bg-sens-500 px-5 text-[17px] font-semibold text-white transition-colors hover:bg-sens-600"
                >
                    Installer le Dico sur mon téléphone
                </button>
            ) : (
                <>
                    <MarcheASuivre systeme="Android" etapes={ETAPES_ANDROID} />
                    <MarcheASuivre systeme="iPhone" etapes={ETAPES_IPHONE} />
                </>
            )}
        </div>
    );
}

const ETAPES_ANDROID = [
    "Ouvre ce site dans Chrome.",
    "Appuie sur les trois points, en haut à droite.",
    "Choisis « Ajouter à l'écran d'accueil » ou « Installer l'application ».",
    "Appuie sur « Installer ».",
    "Ouvre le Dico depuis sa nouvelle icône.",
];

const ETAPES_IPHONE = [
    "Ouvre ce site dans Safari.",
    "Appuie sur le bouton Partager : le carré avec une flèche vers le haut, en bas de l'écran.",
    "Fais défiler et choisis « Sur l'écran d'accueil ».",
    "Appuie sur « Ajouter », en haut à droite.",
    "Ouvre le Dico depuis sa nouvelle icône.",
];

function MarcheASuivre({ systeme, etapes }: { systeme: string; etapes: string[] }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="flex h-14 items-center justify-center rounded-lg border-2 border-bordure-forte bg-background px-3 text-[17px] font-bold text-foreground transition-colors hover:bg-neutre-50"
                >
                    {systeme}
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-md gap-3 p-5">
                <DialogHeader>
                    <DialogTitle className="text-lg font-extrabold text-foreground">
                        Mettre le Dico sur ton {systeme}
                    </DialogTitle>
                </DialogHeader>
                <DialogDescription asChild>
                    <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-[1.5] text-foreground">
                        {etapes.map((e) => (
                            <li key={e}>{e}</li>
                        ))}
                    </ol>
                </DialogDescription>
            </DialogContent>
        </Dialog>
    );
}
