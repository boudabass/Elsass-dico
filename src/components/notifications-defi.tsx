"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import {
    abonnerAction,
    clePubliqueAction,
    desabonnerAction,
    essaiAction,
    estAbonneAction,
} from "@/app/actions/notifications";
import { estInstalle, InstallerApp } from "@/components/installer-app";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Notifications du défi du jour (Odoo 930, 09/10/2026), côté navigateur :
// un encart à la fin du défi, un réglage dans « Mon espace ».
//
// La demande d'autorisation du téléphone ne part JAMAIS toute seule : seulement
// sur un appui sur « Activer ». Un refus du téléphone est définitif pour le
// site (il faut passer par ses réglages) : on ne le gaspille pas.

type Etat =
    | "chargement"
    // Clés absentes côté serveur, ou navigateur sans Web Push.
    | "indisponible"
    // iPhone : Safari ne permet les notifications qu'à une app ajoutée à
    // l'écran d'accueil (iOS 16.4 et plus).
    | "iphone-a-installer"
    | "bloque"
    | "inactif"
    | "actif";

function estIphone(): boolean {
    return (
        /iPhone|iPad|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
}

function pushPossible(): boolean {
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** La clé VAPID publique arrive en base64url ; `subscribe` la veut en octets. */
function octets(base64url: string): Uint8Array<ArrayBuffer> {
    const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
    const brut = atob(base64);
    const sortie = new Uint8Array(new ArrayBuffer(brut.length));
    for (let i = 0; i < brut.length; i++) sortie[i] = brut.charCodeAt(i);
    return sortie;
}

function appareil(): string {
    const ua = navigator.userAgent;
    if (/Android/.test(ua)) return "Android";
    if (estIphone()) return "iPhone";
    if (/Windows/.test(ua)) return "Windows";
    if (/Mac/.test(ua)) return "Mac";
    return "Autre";
}

async function abonnementActuel(): Promise<PushSubscription | null> {
    const enregistrement = await navigator.serviceWorker.getRegistration("/");
    return (await enregistrement?.pushManager.getSubscription()) ?? null;
}

export function useNotifications() {
    const [etat, setEtat] = useState<Etat>("chargement");
    const [cle, setCle] = useState<string | null>(null);
    const [occupe, setOccupe] = useState(false);

    const lire = useCallback(async () => {
        const r = await clePubliqueAction();
        if (!r.succes || !r.valeur) return setEtat("indisponible");
        setCle(r.valeur);
        if (estIphone() && !estInstalle()) return setEtat("iphone-a-installer");
        if (!pushPossible()) return setEtat("indisponible");
        if (Notification.permission === "denied") return setEtat("bloque");
        const abonnement = await abonnementActuel();
        if (!abonnement || Notification.permission !== "granted") return setEtat("inactif");
        const connu = await estAbonneAction(abonnement.endpoint);
        setEtat(connu.succes && connu.valeur ? "actif" : "inactif");
    }, []);

    useEffect(() => {
        lire().catch(() => setEtat("indisponible"));
    }, [lire]);

    const activer = useCallback(async () => {
        if (!cle) return;
        setOccupe(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setEtat(permission === "denied" ? "bloque" : "inactif");
                return;
            }
            const enregistrement = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
            await navigator.serviceWorker.ready;
            const abonnement =
                (await enregistrement.pushManager.getSubscription()) ??
                (await enregistrement.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: octets(cle) }));
            const r = await abonnerAction(abonnement.toJSON(), appareil());
            if (!r.succes) {
                toast.error(r.erreur);
                return;
            }
            setEtat("actif");
            toast.success("C'est fait. Le défi du jour arrivera chaque matin à 10 h.");
        } catch {
            toast.error("Le téléphone n'a pas accepté. Réessaie dans un moment.");
        } finally {
            setOccupe(false);
        }
    }, [cle]);

    const desactiver = useCallback(async () => {
        setOccupe(true);
        try {
            const abonnement = await abonnementActuel();
            if (abonnement) {
                await desabonnerAction(abonnement.endpoint);
                await abonnement.unsubscribe();
            }
            setEtat("inactif");
        } catch {
            toast.error("Ça n'a pas marché. Réessaie dans un moment.");
        } finally {
            setOccupe(false);
        }
    }, []);

    const essayer = useCallback(async () => {
        setOccupe(true);
        try {
            const abonnement = await abonnementActuel();
            if (!abonnement) return setEtat("inactif");
            const r = await essaiAction(abonnement.endpoint);
            if (r.succes) toast.success("Envoyé. La notification arrive dans quelques secondes.");
            else toast.error(r.erreur);
        } finally {
            setOccupe(false);
        }
    }, []);

    return { etat, occupe, activer, desactiver, essayer };
}

// --- L'encart de fin de défi ----------------------------------------------------

const CLE_PLUS_TARD = "ed_notif_plus_tard";
const PLUS_TARD_MS = 7 * 86_400_000;

function reporteRecemment(): boolean {
    try {
        const t = Number(localStorage.getItem(CLE_PLUS_TARD));
        return Number.isFinite(t) && Date.now() - t < PLUS_TARD_MS;
    } catch {
        return false;
    }
}

/** À la fin du défi du jour, pour un membre : le moment où l'envie de revenir
 *  existe. « Plus tard » le cache une semaine sur ce téléphone. */
export function EncartNotifications({ className }: { className?: string }) {
    const { etat, occupe, activer } = useNotifications();
    const [masque, setMasque] = useState(true);

    useEffect(() => setMasque(reporteRecemment()), []);

    if (masque || (etat !== "inactif" && etat !== "iphone-a-installer")) return null;

    const plusTard = () => {
        try {
            localStorage.setItem(CLE_PLUS_TARD, String(Date.now()));
        } catch {}
        setMasque(true);
    };

    return (
        <section
            aria-labelledby="notif-titre"
            className={cn("rounded-xl border border-border bg-card p-4", className)}
        >
            <h2 id="notif-titre" className="flex items-center gap-2 text-lg font-extrabold text-foreground">
                <Bell className="h-5 w-5 shrink-0 text-sens-texte" strokeWidth={2.2} aria-hidden />
                Recevoir le défi chaque matin
            </h2>
            {etat === "iphone-a-installer" ? (
                <AideIphone />
            ) : (
                <>
                    <p className="mt-1 max-w-[56ch] text-[15px] leading-[1.5] text-foreground">
                        Une notification sur ton téléphone à 10 h, une fois par jour. Rien si tu as déjà joué. Tu
                        l&apos;arrêtes quand tu veux dans «&nbsp;Mon espace&nbsp;».
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={activer}
                            disabled={occupe}
                            className="inline-flex h-11 items-center rounded-lg bg-sens-500 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-sens-600 disabled:opacity-60"
                        >
                            Activer
                        </button>
                        <button
                            type="button"
                            onClick={plusTard}
                            className="inline-flex h-11 items-center rounded-lg border border-bordure-forte px-5 text-[15px] font-semibold text-foreground transition-colors hover:bg-neutre-50"
                        >
                            Plus tard
                        </button>
                    </div>
                </>
            )}
            {etat === "iphone-a-installer" && (
                <button
                    type="button"
                    onClick={plusTard}
                    className="mt-4 inline-flex h-11 items-center rounded-lg border border-bordure-forte px-5 text-[15px] font-semibold text-foreground transition-colors hover:bg-neutre-50"
                >
                    Plus tard
                </button>
            )}
        </section>
    );
}

// --- Le réglage de « Mon espace » -------------------------------------------------

export function ReglageNotifications({ className }: { className?: string }) {
    const { etat, occupe, activer, desactiver, essayer } = useNotifications();

    if (etat === "chargement") return null;

    return (
        <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
            <div className="flex items-center justify-between gap-3">
                <label htmlFor="notif-defi" className="text-[15px] font-bold text-foreground">
                    Le défi du jour sur mon téléphone
                </label>
                {(etat === "actif" || etat === "inactif") && (
                    <Switch
                        id="notif-defi"
                        checked={etat === "actif"}
                        disabled={occupe}
                        onCheckedChange={(oui) => (oui ? activer() : desactiver())}
                    />
                )}
            </div>

            {etat === "actif" && (
                <>
                    <p className="mt-1.5 text-sm leading-[1.5] text-muted-foreground">
                        Activé sur ce téléphone. Une notification à 10 h, rien si tu as déjà joué.
                    </p>
                    <button
                        type="button"
                        onClick={essayer}
                        disabled={occupe}
                        className="mt-3 inline-flex h-11 items-center rounded-lg border border-bordure-forte px-4 text-sm font-semibold text-foreground transition-colors hover:bg-neutre-50 disabled:opacity-60"
                    >
                        M&apos;envoyer un essai
                    </button>
                </>
            )}
            {etat === "inactif" && (
                <p className="mt-1.5 text-sm leading-[1.5] text-muted-foreground">
                    Une notification chaque matin à 10 h, une fois par jour. Rien si tu as déjà joué.
                </p>
            )}
            {etat === "bloque" && (
                <p className="mt-1.5 text-sm leading-[1.5] text-muted-foreground">
                    Les notifications sont bloquées pour ce site. Pour les autoriser, ouvre les réglages de ton
                    navigateur, puis «&nbsp;Notifications&nbsp;», et autorise elsass-dico.theelsassisch.com.
                </p>
            )}
            {etat === "indisponible" && (
                <p className="mt-1.5 text-sm leading-[1.5] text-muted-foreground">
                    Pas possible sur ce navigateur pour l&apos;instant.
                </p>
            )}
            {etat === "iphone-a-installer" && <AideIphone />}

            <p className="mt-3 text-xs leading-[1.5] text-muted-foreground">
                On garde seulement l&apos;adresse technique de ton téléphone, pour t&apos;envoyer le défi. Elle
                est effacée quand tu coupes les notifications ou supprimes ton compte. L&apos;envoi passe par
                Google ou Apple.
            </p>
        </div>
    );
}

function AideIphone() {
    return (
        <div className="mt-1">
            <p className="max-w-[56ch] text-[15px] leading-[1.5] text-foreground">
                Sur iPhone, il faut d&apos;abord mettre le Dico sur ton écran d&apos;accueil, puis
                l&apos;ouvrir depuis sa nouvelle icône.
            </p>
            <InstallerApp className="mt-3" />
        </div>
    );
}
