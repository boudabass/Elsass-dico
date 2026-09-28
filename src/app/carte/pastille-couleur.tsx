// La couleur d'une forme sur la carte, posée dans sa puce du panneau : le
// panneau sert ainsi de légende (revue du 28/09/2026). Seulement pour une
// forme qui a au moins un point, sinon la couleur ne renverrait à rien.
export function PastilleCouleur({ couleur }: { couleur: string }) {
    return (
        <span
            aria-hidden
            className="mr-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full align-[0.05em] ring-1 ring-white"
            style={{ backgroundColor: couleur }}
        />
    )
}
