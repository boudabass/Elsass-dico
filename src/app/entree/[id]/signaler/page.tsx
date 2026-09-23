import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { chargerLemme } from "@/app/actions/recherche";
import { SignalerActions } from "./signaler-actions";

// Écran 4 du handoff mobile : header empilé « fermer » (X), pas les 3 icônes
// de nav — écran modal, pas un onglet racine.
export default async function SignalerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lemme = await chargerLemme(id);

  if (!lemme) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader variant="stack" titre="Signaler une erreur" leading="fermer" backHref={`/entree/${id}`} />

      <main className="flex-1 px-4 pt-5 pb-8">
        <div className="rounded-lg border border-border bg-neutre-50 p-3.5 text-sm text-muted-foreground">
          Mot concerné : <strong className="text-foreground">{lemme.francais}</strong>
        </div>

        <p className="my-[22px] text-base leading-[1.6] text-muted-foreground">
          Ton signalement va directement à un admin, qui décide de la suite.
          D&apos;ici là, la forme, ses sources et ses villages restent tels quels.
        </p>

        <SignalerActions
          variantes={lemme.variantes.map((v) => ({ id: v.id, forme: v.forme }))}
        />
      </main>
    </div>
  );
}
