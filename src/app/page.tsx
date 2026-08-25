"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, BookOpenCheck, Loader2, Search } from "lucide-react";
import { rechercherAction, type ResultatRecherche } from "@/app/actions/recherche";
import { LIBELLES_REGION, LIBELLES_TYPE_TERME, type Region, type TypeTerme } from "@/lib/dictionnaire";
import { URL_INSCRIPTION_ODOO } from "@/lib/odoo";
import { useAuth } from "@/components/auth-provider";

export default function AccueilPage() {
  const { user, isLoading } = useAuth();
  const [terme, setTerme] = useState("");
  const [resultats, setResultats] = useState<ResultatRecherche[]>([]);
  const [recherche, setRecherche] = useState(false);
  const [aCherche, setACherche] = useState(false);

  // Recherche différée : la frappe ne doit pas déclencher un aller-retour par
  // caractère, et la RPC refuse de toute façon les termes d'un seul caractère.
  useEffect(() => {
    const requete = terme.trim();
    if (requete.length < 2) {
      setResultats([]);
      setACherche(false);
      // Sans ce retour à false, vider le champ pendant qu'une recherche est en
      // vol laisse le spinner tourner indéfiniment sur un champ vide : le
      // nettoyage annule bien le minuteur, mais personne ne réarme l'état.
      setRecherche(false);
      return;
    }

    setRecherche(true);
    const minuteur = setTimeout(async () => {
      const trouves = await rechercherAction(requete);
      setResultats(trouves);
      setACherche(true);
      setRecherche(false);
    }, 250);

    return () => clearTimeout(minuteur);
  }, [terme]);

  return (
    /* Fond du site, pas un fond à soi : cette page est destinée à une iframe
       dans www.theelsassisch.com, et toute teinte propre y dessinerait la
       frontière de l'iframe. Le halo doré reste sous 8 % d'opacité pour la
       même raison. */
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-marque-or/[0.18] via-background to-background z-0"></div>

      <div className="relative z-10 container mx-auto px-6 py-16 max-w-3xl space-y-10">
        <div className="flex justify-end">
          {/* h-11 : l'accueil est la surface publique, donc consultée au doigt.
              44px est la cible tactile, `size="sm"` n'en donnait que 32. */}
          {isLoading ? null : user ? (
            <Button asChild variant="outline" className="h-11">
              <Link href="/dashboard">Mon espace</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" className="h-11">
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button asChild className="h-11">
                <a href={URL_INSCRIPTION_ODOO}>Créer un compte</a>
              </Button>
            </div>
          )}
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-balance">
            Elsass Dico <br />
            {/* rouge-texte et non le rouge de marque : #FF0000 ne passe pas le
                seuil AA sur blanc, même en gros titre on garde le rouge lisible. */}
            <span className="text-marque-rouge-texte">Français ⇄ Alsacien</span>
          </h1>
          <p className="text-muted-foreground text-pretty">
            Cherchez dans les deux sens. Seules les entrées validées à la main sont publiées.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={terme}
            onChange={(e) => setTerme(e.target.value)}
            placeholder="Un mot en français ou en alsacien…"
            className="h-14 rounded-xl pl-12 pr-12 text-lg shadow-sm"
            autoFocus
          />
          {/* Toujours monté, jamais monté/démonté : une icône qui disparaît sec
              se remarque plus que le chargement qu'elle signale. Le centrage vit
              sur l'enveloppe et la rotation sur l'icône : les keyframes de
              `animate-spin` réécrivent `transform` en entier et emporteraient le
              `-translate-y-1/2` avec elles. */}
          <span
            aria-hidden
            className={`absolute right-4 top-1/2 -translate-y-1/2 transition-[opacity,transform,filter] duration-300 ease-doux ${
              recherche ? "opacity-100 blur-0" : "opacity-0 scale-[0.25] blur-[4px]"
            }`}
          >
            <Loader2 className={`w-5 h-5 text-muted-foreground ${recherche ? "animate-spin" : ""}`} />
          </span>
          {/* Le spinner est décoratif ; l'état de recherche se dit au lecteur
              d'écran, qui ne voit pas tourner une icône. */}
          <span role="status" aria-live="polite" className="sr-only">
            {recherche ? "Recherche en cours" : ""}
          </span>
        </div>

        {resultats.length > 0 && (
          /* `block` sur le lien : un Link est un <a> inline, dont le rectangle
             de focus se disloque autour d'un enfant en bloc. */
          <div className="space-y-3">
            {resultats.map((e) => (
              <Link
                key={e.id}
                href={`/entree/${e.id}`}
                className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="rounded-xl border bg-card p-4 shadow-sm hover:border-marque-or transition-colors">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{e.francais}</span>
                    {e.contexte && (
                      <Badge variant="outline" className="font-normal">
                        {e.contexte}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {LIBELLES_TYPE_TERME[e.type as TypeTerme] ?? e.type}
                    </span>
                  </div>
                  {/* La forme alsacienne est le contenu, pas un accent : elle
                      reste en couleur de texte pleine, et c'est la graisse qui
                      la met en avant. Réserver le rouge aux liens et au titre
                      évite que trois choses se disputent le regard. */}
                  <p className="text-lg font-semibold mt-1">
                    {e.traductions[0]?.alsacien}
                  </p>
                  {e.traductions.length > 1 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      aussi : {e.traductions.slice(1).map((t) => t.alsacien).join(" · ")}
                    </p>
                  )}
                  {e.traductions[0]?.region && (
                    <Badge variant="secondary" className="mt-2 font-normal">
                      {LIBELLES_REGION[e.traductions[0].region as Region]}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {aCherche && !recherche && resultats.length === 0 && (
          <div className="rounded-xl border bg-card p-6 text-center space-y-2 shadow-sm">
            <p className="text-pretty">Aucune entrée validée pour « {terme.trim()} ».</p>
            <p className="text-sm text-muted-foreground text-pretty">
              Le dictionnaire se construit par recoupement : un mot n&apos;apparaît ici qu&apos;une
              fois attesté puis arbitré. Vous connaissez la traduction ?{" "}
              <Link href="/login" className="text-marque-rouge-texte underline-offset-4 hover:underline">
                Connectez-vous
              </Link>{" "}
              si vous avez déjà un compte, ou{" "}
              <a href={URL_INSCRIPTION_ODOO} className="text-marque-rouge-texte underline-offset-4 hover:underline">
                créez-en un
              </a>
              .
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-left">
          <div className="p-4 rounded-xl border bg-card shadow-sm">
            {/* L'or ne peut pas porter de texte sur blanc (1,8:1), mais une
                icône n'est pas du texte : elle est doublée par son intitulé. */}
            <CheckCircle2 className="w-6 h-6 text-marque-or-sombre mb-2" />
            <h3 className="font-bold">Recoupement, pas génération</h3>
            <p className="text-sm text-muted-foreground text-pretty">
              Aucune entrée n&apos;est retenue si elle n&apos;est attestée que dans une seule source.
            </p>
          </div>
          <div className="p-4 rounded-xl border bg-card shadow-sm">
            <BookOpenCheck className="w-6 h-6 text-marque-rouge-texte mb-2" />
            <h3 className="font-bold">Graphie ORTHAL 2023</h3>
            <p className="text-sm text-muted-foreground text-pretty">
              Chaque entrée validée est réécrite selon la norme de l&apos;association AGATE.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Button asChild variant="outline" className="h-11">
            <Link href="/login">
              Espace contributeur <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
