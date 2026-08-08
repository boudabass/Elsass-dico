"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Crown,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { arbitrerAction, chargerCandidat, type DetailCandidat } from "@/app/actions/arbitrage";
import {
  LIBELLES_REGION,
  LIBELLES_STATUT,
  LIBELLES_TYPE_TERME,
  REGIONS,
  SOURCES_MINIMUM,
  STATUTS_ENTREE,
  TYPES_TERME,
  traductionVide,
  type Region,
  type StatutEntree,
  type Traduction,
  type TypeTerme,
} from "@/lib/dictionnaire";

const AUCUNE_REGION = "__aucune__";

export default function ArbitragePage() {
  const { user, role, isLoading } = useAuth();
  const params = useParams<{ cle: string }>();
  const searchParams = useSearchParams();
  const cle = decodeURIComponent(params.cle);
  const contexteUrl = searchParams.get("contexte") ?? "";

  const [detail, setDetail] = useState<DetailCandidat | null>(null);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);

  const [francais, setFrancais] = useState("");
  const [contexte, setContexte] = useState(contexteUrl);
  const [type, setType] = useState<TypeTerme>("mot");
  const [traductions, setTraductions] = useState<Traduction[]>([traductionVide()]);
  const [selection, setSelection] = useState<string[]>([]);
  const [statut, setStatut] = useState<StatutEntree>("a_valider");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    (async () => {
      const d = await chargerCandidat(cle, contexteUrl);
      setDetail(d);
      if (d) {
        setFrancais(d.francais);
        setContexte(d.contexte);
        setType(d.type);
        if (d.entree) {
          setTraductions(d.entree.traductions.length ? d.entree.traductions : [traductionVide()]);
          setStatut(d.entree.statut);
          setNotes(d.entree.notes_arbitrage ?? "");
          setSelection(d.variantes.filter((v) => v.retenue).map((v) => v.attestation_id));
        } else {
          // Par défaut on retient toutes les attestations du candidat : c'est
          // le geste courant, décocher reste possible pour écarter une source.
          setSelection(d.variantes.map((v) => v.attestation_id));
        }
      }
      setChargement(false);
    })();
  }, [cle, contexteUrl]);

  // Le recoupement se compte en sources distinctes, pas en attestations : deux
  // lignes de la même source ne valent qu'un seul témoignage (règle 2).
  const nbSourcesRetenues = useMemo(() => {
    if (!detail) return 0;
    const sources = new Set(
      detail.variantes
        .filter((v) => selection.includes(v.attestation_id))
        .map((v) => v.source_id)
    );
    return sources.size;
  }, [detail, selection]);

  const sourceUnique = nbSourcesRetenues < SOURCES_MINIMUM;
  const justificationManquante = statut === "valide" && sourceUnique && notes.trim() === "";

  const basculerAttestation = (id: string) => {
    setSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const reprendreVariante = (alsacien: string, region: Region | null) => {
    setTraductions((ts) => {
      if (ts.some((t) => t.alsacien.trim() === alsacien.trim())) return ts;
      const propre = ts.filter((t) => t.alsacien.trim() !== "");
      return [...propre, { ...traductionVide(), alsacien, region }];
    });
  };

  const modifierTraduction = (index: number, champ: keyof Traduction, valeur: string | null) => {
    setTraductions((ts) => ts.map((t, i) => (i === index ? { ...t, [champ]: valeur } : t)));
  };

  const deplacerTraduction = (index: number, delta: number) => {
    setTraductions((ts) => {
      const cible = index + delta;
      if (cible < 0 || cible >= ts.length) return ts;
      const copie = [...ts];
      [copie[index], copie[cible]] = [copie[cible], copie[index]];
      return copie;
    });
  };

  const enregistrer = async () => {
    setEnCours(true);
    const res = await arbitrerAction({
      entreeId: detail?.entree_id ?? null,
      francais,
      contexte,
      type,
      traductions,
      attestationIds: selection,
      statut,
      notes,
    });
    setEnCours(false);

    if (res.success) {
      toast.success(res.message);
      const d = await chargerCandidat(cle, contexte);
      setDetail(d);
    } else {
      toast.error(res.error);
    }
  };

  if (isLoading || chargement) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (!user || role !== "admin") return <div className="p-8 text-center">Accès refusé</div>;

  if (!detail) {
    return (
      <div className="container mx-auto p-8 max-w-3xl space-y-4 text-center">
        <p className="text-muted-foreground">
          Aucune attestation ne correspond à « {cle} »{contexteUrl && ` (${contexteUrl})`}.
        </p>
        <Link href="/admin/arbitrage">
          <Button variant="outline">Retour à la file</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/arbitrage">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> File
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{detail.francais}</h1>
        {detail.entree_id && <Badge variant="outline">Entrée existante</Badge>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Ce que disent les sources — jamais modifiable ici. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attestations</CardTitle>
            <CardDescription>
              Contenu brut des sources, non retouché. Décocher une attestation la retire de la
              traçabilité de l&apos;entrée.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail.variantes.map((v) => (
              <div
                key={v.attestation_id}
                className="flex gap-3 items-start border rounded-md p-3"
              >
                <Checkbox
                  checked={selection.includes(v.attestation_id)}
                  onCheckedChange={() => basculerAttestation(v.attestation_id)}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{v.alsacien}</span>
                    {v.region && (
                      <Badge variant="outline" className="font-normal">
                        {LIBELLES_REGION[v.region]}
                      </Badge>
                    )}
                    {v.votes > 0 && (
                      <Badge variant="secondary" className="font-normal">
                        {v.votes} validation{v.votes > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {v.source_nom} · fiabilité {v.fiabilite}/5
                    {v.graphie_origine !== v.alsacien && ` · graphie d'origine : ${v.graphie_origine}`}
                    {v.reference && ` · ${v.reference}`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => reprendreVariante(v.alsacien, v.region)}
                >
                  <Plus className="w-3 h-3 mr-1" /> Reprendre
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* L'entrée en construction, réécrite en Orthal par l'administrateur. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Entrée retenue</CardTitle>
            <CardDescription>
              À réécrire en ORTHAL 2023. La première traduction est la forme canonique
              (« Premier est Roi »).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Français</Label>
                <Input value={francais} onChange={(e) => setFrancais(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Contexte</Label>
                <Input
                  value={contexte}
                  onChange={(e) => setContexte(e.target.value)}
                  placeholder="Sépare les homonymes"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as TypeTerme)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_TERME.map((t) => (
                    <SelectItem key={t} value={t}>
                      {LIBELLES_TYPE_TERME[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Traductions</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTraductions((ts) => [...ts, traductionVide()])}
                >
                  <Plus className="w-3 h-3 mr-1" /> Variante
                </Button>
              </div>

              {traductions.map((t, i) => (
                <div key={i} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {i === 0 ? (
                      <Badge className="gap-1 bg-amber-500 hover:bg-amber-500 shrink-0">
                        <Crown className="w-3 h-3" /> Canonique
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0">
                        Variante {i}
                      </Badge>
                    )}
                    <div className="ml-auto flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={i === 0}
                        onClick={() => deplacerTraduction(i, -1)}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={i === traductions.length - 1}
                        onClick={() => deplacerTraduction(i, 1)}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={traductions.length === 1}
                        onClick={() => setTraductions((ts) => ts.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <Input
                    value={t.alsacien}
                    onChange={(e) => modifierTraduction(i, "alsacien", e.target.value)}
                    placeholder="Forme alsacienne en Orthal"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Select
                      value={t.region ?? AUCUNE_REGION}
                      onValueChange={(v) =>
                        modifierTraduction(i, "region", v === AUCUNE_REGION ? null : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Région" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AUCUNE_REGION}>Non précisée</SelectItem>
                        {REGIONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {LIBELLES_REGION[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={t.niveau ?? ""}
                      onChange={(e) => modifierTraduction(i, "niveau", e.target.value || null)}
                      placeholder="Niveau de langue"
                    />
                  </div>

                  <Input
                    value={t.note ?? ""}
                    onChange={(e) => modifierTraduction(i, "note", e.target.value || null)}
                    placeholder="Note"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={statut} onValueChange={(v) => setStatut(v as StatutEntree)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUTS_ENTREE.map((s) => (
                    <SelectItem key={s} value={s}>
                      {LIBELLES_STATUT[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note d&apos;arbitrage</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Pourquoi cette forme, ce classement, ce rejet…"
                rows={3}
              />
            </div>

            <div className="rounded-md border p-3 text-sm flex items-start gap-2">
              {sourceUnique ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>
                    <strong>{nbSourcesRetenues} source retenue.</strong> La règle 2 demande un
                    recoupement d&apos;au moins {SOURCES_MINIMUM} sources indépendantes. Publier
                    quand même est possible, mais exige une note d&apos;arbitrage — la base la
                    refusera sinon.
                  </span>
                </>
              ) : (
                <span className="text-emerald-700">
                  <strong>{nbSourcesRetenues} sources indépendantes</strong> justifient cette
                  entrée.
                </span>
              )}
            </div>

            <Button
              className="w-full"
              disabled={enCours || justificationManquante || selection.length === 0}
              onClick={enregistrer}
            >
              {enCours && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {statut === "valide" ? "Valider et publier" : "Enregistrer"}
            </Button>
            {justificationManquante && (
              <p className="text-xs text-amber-600 text-center">
                Renseignez la note d&apos;arbitrage pour publier sur source unique.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
