"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Le mode d'emploi de la carte, derrière un bouton « ? » plutôt qu'en texte
// fixe au-dessus d'elle. Écrit en rôles, jamais en chiffres (« 819 villages »),
// qui se périmeraient au premier import. Le contenu passe par un portail : le
// `Dialog` peut vivre à côté de son bouton, sans englober l'écran.
export function AideCarte() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    type="button"
                    aria-label="Comment lire cette carte"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-input bg-background text-sm font-semibold text-foreground hover:bg-muted"
                >
                    ?
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-md gap-3 p-5">
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold text-foreground">
                        Comment lire cette carte
                    </DialogTitle>
                </DialogHeader>
                <DialogDescription asChild>
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>
                            Sans recherche, chaque point est un village : sa couleur suit la
                            première forme qu'on lui connaît pour son propre nom.
                        </p>
                        <p>
                            En cherchant un mot, chaque point devient une variante de ce mot,
                            placée dans les villages qui la revendiquent. Chaque variante a
                            sa couleur.
                        </p>
                        <p>
                            Clique un point pour voir le détail. « + Chez moi aussi » et
                            « Ça se dit autrement chez moi » ajoutent directement ton village.
                        </p>
                    </div>
                </DialogDescription>
            </DialogContent>
        </Dialog>
    )
}
