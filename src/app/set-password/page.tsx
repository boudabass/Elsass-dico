"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const LONGUEUR_MINIMALE = 8;

export default function SetPasswordPage() {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();
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
        const { error } = await supabase.auth.updateUser({ password: motDePasse });
        setEnCours(false);

        if (error) {
            toast.error(error.message);
            return;
        }

        toast.success("Mot de passe enregistré.");
        router.push("/dashboard");
    };

    if (sessionValide === null) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    if (!sessionValide) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Lien expiré</CardTitle>
                        <CardDescription>
                            Ce lien n&apos;est plus valide. Demandez à un administrateur de vous en
                            générer un nouveau.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Définir votre mot de passe</CardTitle>
                    <CardDescription>
                        Choisissez le mot de passe qui vous servira à vous connecter.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={soumettre} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="motDePasse">Mot de passe</Label>
                            <Input
                                id="motDePasse"
                                type="password"
                                value={motDePasse}
                                onChange={(e) => setMotDePasse(e.target.value)}
                                minLength={LONGUEUR_MINIMALE}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
                            <Input
                                id="confirmation"
                                type="password"
                                value={confirmation}
                                onChange={(e) => setConfirmation(e.target.value)}
                                minLength={LONGUEUR_MINIMALE}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={enCours}>
                            {enCours && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
