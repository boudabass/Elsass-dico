// L'image de partage du défi du jour (26/09/2026). Facebook et Instagram
// n'acceptent pas de texte pré-rempli depuis un site : tout ce qui doit donner
// envie de jouer est donc DANS l'image. Numéro, score en cases, et la question
// de la manche 1 sans sa réponse (celle qu'on voit avant de répondre, déjà
// publique par la route d'automatisation). Aucun village n'y est nommé.
//
// Dessinée ici par `next/og`, une bibliothèque du bundle : aucun service
// extérieur. La police est versionnée dans `src/assets/polices/` (OFL).
//
// `?n=` numéro du défi (défaut : celui du jour, jamais un défi à venir),
// `?r=` résultats en 0/1 (absent : image d'invitation, sans score),
// `?format=og` pour l'aperçu d'un lien (1200×630) au lieu du portrait.

import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

import { chargerReserve, jourActuel, jourDuDefi, manchesDuJour, NB_MANCHES, numeroDefi } from "@/lib/jeu"

const C = {
    fond: "#F9F7F6",
    carte: "#FFFFFF",
    bordure: "#E6E1DE",
    texte: "#222629",
    discret: "#616B75",
    rouge: "#A6070C",
    vert: "#2F7E50",
    vide: "#CFC7C4",
}

const DOMAINE = "elsass-dico.theelsassisch.com/jeu"

let polices: Promise<{ name: string; data: Buffer; weight: 400 | 700 | 800 }[]> | null = null

function chargerPolices() {
    polices ??= Promise.all(
        ([400, 700, 800] as const).flatMap((weight) =>
            ["latin", "latin-ext"].map(async (sous) => ({
                name: "Archivo",
                weight,
                data: await readFile(join(process.cwd(), "src/assets/polices", `archivo-${sous}-${weight}-normal.woff`)),
            })),
        ),
    )
    return polices
}

async function question(numero: number): Promise<string[]> {
    const [manche] = await manchesDuJour(jourDuDefi(numero))
    if (!manche) return []
    return (await chargerReserve()).parId.get(manche.communeId)?.formes ?? []
}

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams
    const actuel = numeroDefi(jourActuel())
    const demande = Number(params.get("n"))
    const numero = Number.isInteger(demande) && demande >= 1 && demande <= actuel ? demande : actuel
    const brut = params.get("r") ?? ""
    const resultats = new RegExp(`^[01]{${NB_MANCHES}}$`).test(brut) ? brut.split("").map((c) => c === "1") : null
    const og = params.get("format") === "og"

    const [formes, fonts] = await Promise.all([question(numero), chargerPolices()])
    const score = resultats?.filter(Boolean).length ?? 0

    const titre = (
        <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
            <span style={{ fontSize: og ? 52 : 64, fontWeight: 800, color: C.texte }}>Le défi du jour</span>
            <span style={{ fontSize: og ? 40 : 48, fontWeight: 700, color: C.discret }}>n° {numero}</span>
        </div>
    )

    const carteQuestion = (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                background: C.carte,
                border: `2px solid ${C.bordure}`,
                borderRadius: 32,
                padding: og ? "36px 44px" : "56px 60px",
                gap: 16,
            }}
        >
            <span style={{ fontSize: og ? 30 : 38, fontWeight: 700, color: C.discret }}>Quel village dit :</span>
            <span style={{ fontSize: og ? 64 : 92, fontWeight: 800, color: C.texte, lineHeight: 1.1 }}>
                {formes.join(" · ") || "…"}
            </span>
        </div>
    )

    const bilan = resultats ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <span style={{ fontSize: og ? 40 : 54, fontWeight: 800, color: C.texte }}>
                {score} village{score > 1 ? "s" : ""} sur {resultats.length}
            </span>
            <div style={{ display: "flex", gap: 14 }}>
                {resultats.map((r, i) => (
                    <div
                        key={i}
                        style={{ width: og ? 56 : 84, height: og ? 56 : 84, borderRadius: 14, background: r ? C.vert : C.vide }}
                    />
                ))}
            </div>
        </div>
    ) : (
        <span style={{ fontSize: og ? 32 : 42, fontWeight: 700, color: C.discret }}>
            Cinq manches, un nouveau défi chaque jour.
        </span>
    )

    const appel = (
        <div style={{ display: "flex", flexDirection: "column", alignItems: og ? "flex-start" : "center", gap: 16 }}>
            <div
                style={{
                    display: "flex",
                    background: C.rouge,
                    color: "#FFFFFF",
                    borderRadius: 20,
                    padding: og ? "20px 40px" : "28px 64px",
                    fontSize: og ? 38 : 50,
                    fontWeight: 800,
                }}
            >
                À toi de jouer
            </div>
            <span style={{ fontSize: og ? 26 : 34, fontWeight: 700, color: C.discret }}>{DOMAINE}</span>
        </div>
    )

    const contenu = og ? (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: 56, gap: 32, background: C.fond }}>
            {titre}
            {carteQuestion}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
                {bilan}
                {appel}
            </div>
        </div>
    ) : (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                width: "100%",
                height: "100%",
                padding: 80,
                background: C.fond,
            }}
        >
            {titre}
            {carteQuestion}
            {bilan}
            {appel}
        </div>
    )

    return new ImageResponse(contenu, {
        width: og ? 1200 : 1080,
        height: og ? 630 : 1350,
        fonts,
        headers: {
            // Un défi numéroté ne change plus : le même lien rend la même image.
            "Cache-Control": "public, max-age=86400",
        },
    })
}
