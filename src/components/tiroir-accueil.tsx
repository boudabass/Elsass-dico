"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Smartphone, Sparkles } from "lucide-react";

import { monVillageAction } from "@/app/actions/membres";
import { useAuth } from "@/components/auth-provider";
import { RechercheVillage, type Village } from "@/components/contribution/habillage";
import { estInstalle, InstallerApp } from "@/components/installer-app";
import { useNotifications } from "@/components/notifications-defi";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";

// Le parcours du téléphone (10/10/2026, demande de John) : un tiroir qui monte
// du bas après la connexion, en trois temps au plus.
//
//   1. Le Dico n'est pas installé : on propose de le mettre sur l'écran
//      d'accueil, en disant ce qu'on y gagne.
//   2. Les notifications ne sont pas activées : on propose de recevoir le défi
//      chaque matin. Seulement si le Dico est installé ou en passe de l'être.
//   3. Le membre n'a pas de village : on le lui fait choisir (ajouté le 10/10,
//      pour tout demander en une fois). Choisi dans une liste, jamais détecté.
//
// Seules les étapes qui manquent sont montrées, numérotées si elles sont
// plusieurs. « Plus tard » passe à la suivante et fait taire celle-ci une
// semaine sur ce téléphone. Téléphone seulement : sur un ordinateur,
// « installer » n'apporte rien à ce public, « Mon espace » demande le village
// et l'encart de fin de défi propose les notifications. Une fois par visite.

type Etape = "installer" | "notifier" | "village";

const PLUS_TARD_MS = 7 * 86_400_000;
const CLES: Record<Etape, string> = {
    installer: "ed_tiroir_installer",
    notifier: "ed_tiroir_notifier",
    village: "ed_tiroir_village",
};
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

// `?tiroir` le force, pour le revoir ou le montrer (même idée que
// `?premiers-pas` dans « Mon espace »).
function estForce(): boolean {
    return new URLSearchParams(window.location.search).has("tiroir");
}

export function TiroirAccueil() {
    const { session } = useAuth();
    const chemin = usePathname();
    // `null` tant que rien n'est décidé ; une file vide = rien à proposer.
    const [file, setFile] = useState<Etape[] | null>(null);
    const [rang, setRang] = useState(0);
    const [ouvert, setOuvert] = useState(false);
    const [fini, setFini] = useState(false);
    // `undefined` = pas encore lu.
    const [village, setVillage] = useState<Village | null | undefined>(undefined);
    const [villageChoisi, setVillageChoisi] = useState(false);
    // Installé depuis ce tiroir, à l'instant : le Dico tourne encore dans le
    // navigateur, il faudra l'ouvrir depuis sa nouvelle icône.
    const [installeIci, setInstalleIci] = useState(false);
    const [activeIci, setActiveIci] = useState(false);
    const notifications = useNotifications();

    const exclu = EXCLUS.some((p) => chemin.startsWith(p));
    const candidat = !!session && !exclu && file === null;

    // Le village n'est lu que s'il y a une chance d'ouvrir le tiroir.
    useEffect(() => {
        if (!candidat || village !== undefined) return;
        if (!estForce() && (!estTelephone() || lire(() => sessionStorage, CLE_VU))) return;
        monVillageAction().then((v) => setVillage(v ?? null));
    }, [candidat, village]);

    useEffect(() => {
        if (!candidat || village === undefined || notifications.etat === "chargement") return;
        const force = estForce();
        const garde = (e: Etape) => force || !reporte(CLES[e]);
        const installe = estInstalle();
        const etapes: Etape[] = [];
        if (!installe && garde("installer")) etapes.push("installer");
        if ((installe || etapes.length > 0) && notifications.etat === "inactif" && garde("notifier"))
            etapes.push("notifier");
        if (village === null && garde("village")) etapes.push("village");
        setFile(etapes);
        if (etapes.length > 0) {
            setOuvert(true);
            ecrire(() => sessionStorage, CLE_VU, "1");
        }
    }, [candidat, village, notifications.etat]);

    if (!session || !file || file.length === 0) return null;

    const etape = fini ? null : file[rang];

    const remettre = () => {
        if (etape) ecrire(() => localStorage, CLES[etape], String(Date.now()));
    };

    // Étape faite ou remise : on passe à la suivante, ou on conclut s'il y a
    // quelque chose à dire.
    const suivante = (faite: boolean) => {
        if (rang + 1 < file.length) setRang(rang + 1);
        else if (faite || installeIci || villageChoisi || activeIci) setFini(true);
        else setOuvert(false);
    };

    // Installé par le bouton. Sur Android, l'abonnement pris dans le navigateur
    // vaut aussi pour l'app installée (même site, même service worker).
    const apresInstallation = () => {
        setInstalleIci(true);
        suivante(true);
    };

    const activer = async () => {
        if (await notifications.activer()) {
            setActiveIci(true);
            suivante(true);
        }
    };

    const apresVillage = (v: Village) => {
        setVillage(v);
        setVillageChoisi(true);
        suivante(true);
    };

    const titre = "text-[22px] font-extrabold leading-tight text-foreground";
    const texte = "mt-2 text-[15px] leading-[1.5] text-foreground";

    const bilan = [
        villageChoisi && village ? `Ton village : ${village.nom}.` : null,
        installeIci
            ? "Ferme cette page et ouvre le Dico depuis sa nouvelle icône, sur ton écran d'accueil."
            : null,
        notifications.etat === "actif" ? "Le prochain défi arrive sur ton téléphone à 10 h." : null,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <Drawer
            open={ouvert}
            onOpenChange={(o) => {
                if (o) return;
                remettre();
                setOuvert(false);
            }}
            repositionInputs={false}
            shouldScaleBackground={false}
        >
            <DrawerContent className="max-h-[92dvh]">
                <div className="overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
                    {file.length > 1 && etape && (
                        <p className="mb-1 text-sm font-semibold text-sens-texte">
                            Étape {rang + 1} sur {file.length}
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

                    {etape === "village" && (
                        <>
                            <DrawerTitle className={titre}>Choisis ton village</DrawerTitle>
                            <DrawerDescription className={texte}>
                                Quand tu dis comment on dit un mot chez toi, c&apos;est ton village qui apparaît
                                sur la carte. Tu peux le changer quand tu veux dans «&nbsp;Mon espace&nbsp;».
                            </DrawerDescription>
                            <p className={texte}>Écris son nom, puis appuie dessus dans la liste.</p>
                            <div className="mt-4">
                                <RechercheVillage onChoisi={apresVillage} />
                            </div>
                        </>
                    )}

                    {fini && (
                        <>
                            <DrawerTitle className={titre}>C&apos;est prêt</DrawerTitle>
                            <DrawerDescription className={texte}>{bilan}</DrawerDescription>
                        </>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            if (fini) return setOuvert(false);
                            remettre();
                            suivante(false);
                        }}
                        className="mt-2 flex h-12 w-full items-center justify-center text-[15px] font-semibold text-muted-foreground"
                    >
                        {fini ? "Fermer" : "Plus tard"}
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
