"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Loader2, Unlink } from "lucide-react";

const LONGUEUR_MINIMALE = 8;

// Écrans 9 (lien valide) et 9b (lien expiré) du handoff mobile — pas de
// header (écran d'arrivée après un lien d'invitation transmis à la main par
// un admin, cf. CLAUDE.md, aucun envoi automatique). Juste le dégagement de
// la barre de statut (env(safe-area-inset-top)) puis le contenu centré.
export default function SetPasswordPage() {
    const supabase = useMemo(() => createClient(), []);
    const [motDePasse, setMotDePasse] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [enCours, setEnCours] = useState(false);
    const [sessionValide, setSessionValide] = useState<boolean | null>(null);

    useEffect(() => {
        // La session a été posée par /auth/confirm. Sans elle, le lien est
        // expiré ou la page a été ouverte directement.
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSessionValide(Boolean(session));
        });
    }, [supabase]);

    const soumettre = async (evenement: React.FormEvent) => {
        evenement.preventDefault();

        if (motDePasse.length < LONGUEUR_MINIMALE) {
            toast.error(`Le mot de passe doit faire au moins ${LONGUEUR_MINIMALE} caractères.`);
            return;
        }
        if (motDePasse !== confirmation) {
            toast.error("Les deux mots de passe ne correspondent pas.");
            return;
        }

        setEnCours(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: motDePasse });

            if (error) {
                console.error("[SetPassword] updateUser a échoué:", error);
                toast.error(error.message);
                return;
            }

            toast.success("Mot de passe enregistré.");
            // Navigation complète : AuthProvider ne relit la session qu'au
            // montage, une navigation douce le laisserait sur un état périmé.
            window.location.href = "/dashboard";
        } catch (erreur) {
            console.error("[SetPassword] Erreur inattendue:", erreur);
            toast.error("Enregistrement impossible, réessayez.");
        } finally {
            setEnCours(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
            <main className="flex flex-1 flex-col items-center justify-center px-6 py-8">
                {sessionValide === null ? (
                    <Loader2 className="h-6 w-6 animate-spin text-neutre-400" />
                ) : !sessionValide ? (
                    <div className="flex flex-col items-center text-center">
                        <Unlink className="h-10 w-10 text-neutre-400" strokeWidth={1.8} />
                        <h1 className="mt-[18px] text-xl font-extrabold text-foreground">Lien expiré</h1>
                        <p className="mt-2 text-sm leading-[1.5] text-muted-foreground">
                            Ce lien n&apos;est plus valide. Demande à un administrateur de t&apos;en générer
                            un nouveau.
                        </p>
                    </div>
                ) : (
                    <div className="w-full">
                        <p className="font-display text-center text-[26px] text-marque-rouge-texte">
                            Elsass Dico
                        </p>
                        <h1 className="mt-[18px] text-center text-xl font-extrabold text-foreground">
                            Définir ton mot de passe
                        </h1>
                        <p className="mt-1.5 mb-[26px] text-center text-sm text-muted-foreground">
                            Choisis le mot de passe qui te servira à te connecter.
                        </p>

                        <form onSubmit={soumettre} className="flex flex-col">
                            <label htmlFor="motDePasse" className="mb-1.5 block text-[13px] font-semibold text-foreground">
                                Mot de passe
                            </label>
                            <input
                                id="motDePasse"
                                type="password"
                                value={motDePasse}
                                onChange={(e) => setMotDePasse(e.target.value)}
                                placeholder="••••••••"
                                minLength={LONGUEUR_MINIMALE}
                                required
                                className="h-[46px] w-full rounded-sm border border-neutre-300 px-3 text-base text-foreground outline-none placeholder:text-neutre-400 focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <p className="mb-3.5 mt-1.5 text-xs text-neutre-400">8 caractères minimum.</p>

                            <label htmlFor="confirmation" className="mb-1.5 block text-[13px] font-semibold text-foreground">
                                Confirmer le mot de passe
                            </label>
                            <input
                                id="confirmation"
                                type="password"
                                value={confirmation}
                                onChange={(e) => setConfirmation(e.target.value)}
                                placeholder="••••••••"
                                minLength={LONGUEUR_MINIMALE}
                                required
                                className="mb-[22px] h-[46px] w-full rounded-sm border border-neutre-300 px-3 text-base text-foreground outline-none placeholder:text-neutre-400 focus-visible:ring-2 focus-visible:ring-ring"
                            />

                            <button
                                type="submit"
                                disabled={enCours}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-marque-rouge-500 text-sm font-semibold text-white transition-colors hover:bg-marque-rouge-600 disabled:opacity-50"
                            >
                                {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
                                Enregistrer
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
