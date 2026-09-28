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
                            Sans recherche, chaque point est un village dont on connaît le nom
                            en alsacien. Clique un point pour le lire.
                        </p>
                        <p>
                            En cherchant un mot, chaque point montre comment on le dit dans un
                            village. Chaque façon de le dire a sa couleur, rappelée devant elle
                            au-dessus de la carte.
                        </p>
                        <p>
                            Le bouton tout en haut choisit dans quelle langue tu cherches. En
                            alsacien, tu tapes une forme et chaque point montre ce qu'elle veut
                            dire là où on la dit : une couleur par sens.
                        </p>
                        <p>
                            Au-dessus de la carte, touche une forme pour y ajouter ton village,
                            ou « Ça se dit autrement chez moi ? » pour proposer la tienne.
                        </p>
                    </div>
                </DialogDescription>
            </DialogContent>
        </Dialog>
    )
}
