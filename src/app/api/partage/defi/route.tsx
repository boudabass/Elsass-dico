// L'image de partage du défi du jour (26/09/2026, revue le 27/09/2026 avec
// John). Facebook et Instagram n'acceptent pas de texte pré-rempli depuis un
// site : ce qui doit donner envie de jouer est donc DANS l'image. La signature
// The Elsassisch, le numéro, le score en grand et en cases, et un appel en
// texte simple (dans une image rien n'est cliquable, un faux bouton trompait
// l'aperçu). Plus aucune forme alsacienne : elle nommait la réponse de la
// manche 1, justement affichée dans le bilan du joueur.
//
// Rien n'est stocké : l'image est dessinée à chaque demande et ne vit que dans
// la réponse HTTP (et le cache du navigateur). Pour un défi, il n'en existe que
// 33 possibles (32 scores en cases, plus l'invitation sans score).
//
// Dessinée ici par `next/og`, une bibliothèque du bundle : aucun service
// extérieur. Police et signature sont versionnées dans `src/assets/`.
//
// `?n=` numéro du défi (défaut : celui du jour, jamais un défi à venir),
// `?r=` résultats en 0/1 (absent : image d'invitation, sans score),
// `?format=og` pour l'aperçu d'un lien (1200×630) au lieu du portrait.

import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

import { jourActuel, NB_MANCHES, numeroDefi } from "@/lib/jeu"

const C = {
    fond: "#F9F7F6",
    texte: "#222629",
    discret: "#616B75",
    rouge: "#A6070C",
    vert: "#2F7E50",
    vide: "#CFC7C4",
}

const DOMAINE = "elsass-dico.theelsassisch.com/jeu"
// Signature recadrée au plus près du tracé (1600×201), cf. src/assets/marque.
const SIGNATURE_RATIO = 1600 / 201

let polices: Promise<{ name: string; data: Buffer; weight: 400 | 700 | 800 }[]> | null = null
let signature: Promise<string> | null = null

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

function chargerSignature() {
    signature ??= readFile(join(process.cwd(), "src/assets/marque/signature.png")).then(
        (b) => `data:image/png;base64,${b.toString("base64")}`,
    )
    return signature
}

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams
    const actuel = numeroDefi(jourActuel())
    const demande = Number(params.get("n"))
    const numero = Number.isInteger(demande) && demande >= 1 && demande <= actuel ? demande : actuel
    const brut = params.get("r") ?? ""
    const resultats = new RegExp(`^[01]{${NB_MANCHES}}$`).test(brut) ? brut.split("").map((c) => c === "1") : null
    const og = params.get("format") === "og"

    const [fonts, logo] = await Promise.all([chargerPolices(), chargerSignature()])
    const score = resultats?.filter(Boolean).length ?? 0

    // Largeur utile : 1080 − 2×80 en portrait, 1200 − 2×72 en aperçu.
    const largeur = og ? 1056 : 920
    const hauteurLogo = og ? 64 : 84

    const entete = (
        <div style={{ display: "flex", flexDirection: "column", gap: og ? 20 : 28 }}>
            <img src={logo} width={hauteurLogo * SIGNATURE_RATIO} height={hauteurLogo} alt="" />
            <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
                <span style={{ fontSize: og ? 44 : 56, fontWeight: 800, color: C.texte }}>Le défi du jour</span>
                <span style={{ fontSize: og ? 34 : 44, fontWeight: 700, color: C.discret }}>n° {numero}</span>
            </div>
        </div>
    )

    const ecart = 20
    const cote = Math.floor((largeur - ecart * (NB_MANCHES - 1)) / NB_MANCHES)

    const bilan = resultats ? (
        <div style={{ display: "flex", flexDirection: "column", gap: og ? 20 : 32 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
                <span style={{ fontSize: og ? 120 : 220, fontWeight: 800, color: C.texte, lineHeight: 1 }}>
                    {score}/{resultats.length}
                </span>
                <span style={{ fontSize: og ? 36 : 48, fontWeight: 700, color: C.discret }}>
                    village{score > 1 ? "s" : ""} trouvé{score > 1 ? "s" : ""}
                </span>
            </div>
            <div style={{ display: "flex", gap: ecart }}>
                {resultats.map((r, i) => (
                    <div
                        key={i}
                        style={{
                            width: cote,
                            height: og ? 88 : cote,
                            borderRadius: og ? 16 : 24,
                            background: r ? C.vert : C.vide,
                        }}
                    />
                ))}
            </div>
        </div>
    ) : (
        <span style={{ fontSize: og ? 64 : 88, fontWeight: 800, color: C.texte, lineHeight: 1.1 }}>
            Quel village dit ça ? Un nouveau défi chaque jour.
        </span>
    )

    const appel = (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: og ? 44 : 60, fontWeight: 800, color: C.rouge }}>À toi de jouer →</span>
            <span style={{ fontSize: og ? 28 : 36, fontWeight: 700, color: C.discret }}>{DOMAINE}</span>
        </div>
    )

    return new ImageResponse(
        (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    width: "100%",
                    height: "100%",
                    padding: og ? "56px 72px" : 80,
                    background: C.fond,
                }}
            >
                {entete}
                {bilan}
                {appel}
            </div>
        ),
        {
            width: og ? 1200 : 1080,
            height: og ? 630 : 1350,
            fonts,
            headers: {
                // Un défi numéroté ne change plus : le même lien rend la même image.
                "Cache-Control": "public, max-age=86400",
            },
        },
    )
}
