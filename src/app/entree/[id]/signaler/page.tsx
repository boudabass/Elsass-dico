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

  // Toutes les formes, pas seulement la premiere : un signalement porte
  // souvent sur une variante precise, et le forum doit voir laquelle.
  const segment = `${lemme.francais} → ${lemme.variantes.map((v) => v.forme).join(", ")}`;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader variant="stack" titre="Signaler une erreur" leading="fermer" backHref={`/entree/${id}`} />

      <main className="flex-1 px-4 pt-5 pb-8">
        <div className="rounded-lg border border-border bg-neutre-50 p-3.5 text-sm text-muted-foreground">
          Segment concerné : <strong className="text-foreground">{segment}</strong>
        </div>

        <p className="my-[22px] text-base leading-[1.6] text-muted-foreground">
          Les signalements et propositions de correction se discutent sur le forum du dictionnaire,
          pas directement dans l&apos;app.
        </p>

        <SignalerActions segment={segment} />
      </main>
    </div>
  );
}
