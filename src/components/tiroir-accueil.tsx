"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Smartphone, Sparkles } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { estInstalle, InstallerApp } from "@/components/installer-app";
import { useNotifications } from "@/components/notifications-defi";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";

// Le parcours du téléphone (10/10/2026, demande de John) : un tiroir qui monte
// du bas après la connexion, en deux temps.
//
//   1. Le Dico n'est pas installé : on propose de le mettre sur l'écran
//      d'accueil, en disant ce qu'on y gagne.
//   2. Le Dico est installé (ouvert depuis son icône) mais les notifications
//      ne sont pas activées : on propose de recevoir le défi chaque matin.
//
// Téléphone seulement : sur un ordinateur, « installer » n'apporte rien à ce
// public, et l'encart de fin de défi suffit. Une fois par visite au plus, et
// « Plus tard » le fait taire une semaine sur ce téléphone.

const PLUS_TARD_MS = 7 * 86_400_000;
const CLE_INSTALLER = "ed_tiroir_installer";
const CLE_NOTIFIER = "ed_tiroir_notifier";
const CLE_VU = "ed_tiroir_vu";

// Pas sur ces écrans : on y entre ou on y travaille, un tiroir couperait le geste.
const EXCLUS = ["/login", "/admin"];

function lire(stockage: () => Storage, cle: string): string | null {
    try {
        return stockage().getItem(cle);
    } catch {
        return null;
    }
}

function ecrire(stockage: () => Storage, cle: string, valeur: string) {
    try {
        stockage().setItem(cle, valeur);
    } catch {}
}

function reporte(cle: string): boolean {
    const t = Number(lire(() => localStorage, cle));
    return Number.isFinite(t) && t > 0 && Date.now() - t < PLUS_TARD_MS;
}

function estTelephone(): boolean {
    return window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(max-width: 767px)").matches;
}

export function TiroirAccueil() {
    const { session } = useAuth();
    const chemin = usePathname();
    const [etape, setEtape] = useState<"installer" | "notifier" | "fini" | null>(null);
    // Installé depuis ce tiroir, à l'instant : le Dico tourne encore dans le
    // navigateur, il faudra l'ouvrir depuis sa nouvelle icône.
    const [installeIci, setInstalleIci] = useState(false);
    // Parti de l'installation : on numérote alors les deux étapes.
    const [enDeuxTemps, setEnDeuxTemps] = useState(false);
    const notifications = useNotifications();

    const exclu = EXCLUS.some((p) => chemin.startsWith(p));

    useEffect(() => {
        if (!session || exclu || etape !== null) return;
        // `?tiroir` le force, pour le revoir ou le montrer (même idée que
        // `?premiers-pas` dans « Mon espace »).
        const force = new URLSearchParams(window.location.search).has("tiroir");
        if (!force && !estTelephone()) return;
        if (!force && lire(() => sessionStorage, CLE_VU)) return;
        if (!estInstalle()) {
            if (force || !reporte(CLE_INSTALLER)) {
                setEtape("installer");
                setEnDeuxTemps(true);
                ecrire(() => sessionStorage, CLE_VU, "1");
            }
            return;
        }
        // Installé : il faut attendre de savoir où en sont les notifications.
        if (notifications.etat === "chargement") return;
        if (notifications.etat === "inactif" && (force || !reporte(CLE_NOTIFIER))) {
            setEtape("notifier");
            ecrire(() => sessionStorage, CLE_VU, "1");
        }
    }, [session, exclu, etape, notifications.etat]);

    if (!session) return null;

    const fermer = (plusTard: boolean) => {
        if (plusTard && (etape === "installer" || etape === "notifier"))
            ecrire(() => localStorage, etape === "installer" ? CLE_INSTALLER : CLE_NOTIFIER, String(Date.now()));
        setEtape(null);
    };

    // Installé par le bouton : on enchaîne tout de suite sur les notifications,
    // dans le même tiroir. Sur Android, l'abonnement pris dans le navigateur
    // vaut aussi pour l'app installée (même site, même service worker).
    const apresInstallation = () => {
        setInstalleIci(true);
        setEtape(notifications.etat === "inactif" ? "notifier" : "fini");
    };

    const activer = async () => {
        if (await notifications.activer()) setEtape("fini");
    };

    const titre = "text-[22px] font-extrabold leading-tight text-foreground";
    const texte = "mt-2 text-[15px] leading-[1.5] text-foreground";

    return (
        <Drawer open={etape !== null} onOpenChange={(o) => !o && fermer(true)} shouldScaleBackground={false}>
            <DrawerContent className="max-h-[92dvh]">
                <div className="overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
                    {enDeuxTemps && etape !== "fini" && (
                        <p className="mb-1 text-sm font-semibold text-sens-texte">
                            Étape {etape === "installer" ? 1 : 2} sur 2
                        </p>
                    )}

                    {etape === "installer" && (
                        <>
                            <DrawerTitle className={titre}>Mets le Dico sur ton téléphone</DrawerTitle>
                            <DrawerDescription className="sr-only">
                                Ce que tu gagnes à installer le Dico, et comment faire.
                            </DrawerDescription>
                            <ul className="mt-4 space-y-3">
                                <Avantage icone={Smartphone}>
                                    Il s&apos;ouvre d&apos;un seul appui, depuis ton écran d&apos;accueil, comme une
                                    application.
                                </Avantage>
                                <Avantage icone={Bell}>
                                    Le défi du jour arrive sur ton téléphone chaque matin à 10 h.
                                </Avantage>
                                <Avantage icone={Sparkles}>Tu es prévenu des nouveautés du Dico.</Avantage>
                            </ul>
                            <InstallerApp
                                className="mt-5"
                                invite="Choisis ton téléphone :"
                                onInstalle={apresInstallation}
                            />
                        </>
                    )}

                    {etape === "notifier" && (
                        <>
                            <DrawerTitle className={titre}>
                                {installeIci ? "C'est installé. Reçois le défi chaque matin" : "Recevoir le défi chaque matin"}
                            </DrawerTitle>
                            <DrawerDescription className={texte}>
                                Une notification à 10 h, une fois par jour. Rien si tu as déjà joué. Tu
                                l&apos;arrêtes quand tu veux dans «&nbsp;Mon espace&nbsp;».
                            </DrawerDescription>
                            <p className={texte}>
                                Appuie sur «&nbsp;Activer&nbsp;», puis sur «&nbsp;Autoriser&nbsp;».
                            </p>
                            <button
                                type="button"
                                disabled={notifications.occupe}
                                onClick={activer}
                                className="mt-5 flex h-14 w-full items-center justify-center rounded-lg bg-sens-500 px-5 text-[17px] font-semibold text-white transition-colors hover:bg-sens-600 disabled:opacity-60"
                            >
                                Activer
                            </button>
                            {notifications.etat === "bloque" && (
                                <p className="mt-3 text-sm leading-[1.5] text-muted-foreground">
                                    Le téléphone a bloqué les notifications pour ce site. Tu peux les autoriser dans
                                    les réglages du navigateur, rubrique «&nbsp;Notifications&nbsp;».
                                </p>
                            )}
                        </>
                    )}

                    {etape === "fini" && (
                        <>
                            <DrawerTitle className={titre}>C&apos;est prêt</DrawerTitle>
                            <DrawerDescription className={texte}>
                                {installeIci
                                    ? "Ferme cette page et ouvre le Dico depuis sa nouvelle icône, sur ton écran d'accueil. Le prochain défi arrive à 10 h."
                                    : "Le prochain défi arrive sur ton téléphone à 10 h."}
                            </DrawerDescription>
                        </>
                    )}

                    <button
                        type="button"
                        onClick={() => fermer(etape !== "fini")}
                        className="mt-2 flex h-12 w-full items-center justify-center text-[15px] font-semibold text-muted-foreground"
                    >
                        {etape === "fini" ? "Fermer" : "Plus tard"}
                    </button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function Avantage({ icone: Icone, children }: { icone: typeof Bell; children: React.ReactNode }) {
    return (
        <li className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sens-50 text-sens-texte">
                <Icone className="h-5 w-5" strokeWidth={2.2} aria-hidden />
            </span>
            <span className="pt-1.5 text-[15px] leading-[1.45] text-foreground">{children}</span>
        </li>
    );
}
