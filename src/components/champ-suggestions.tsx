"use client"

import { Command as CommandPrimitive } from "cmdk"
import { useRef, useState, type ReactNode } from "react"

import { Command, CommandEmpty, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Le champ à suggestions de l'app : la home (villages et prénoms), la carte
// (mots du dictionnaire) et « Mon espace » (choix du village). Un seul endroit
// pour le câblage cmdk + Radix, que les trois écrans recopiaient à l'identique.
//
// cmdk porte la sémantique combobox (flèches, Entrée, `aria-activedescendant`),
// Radix Popover le positionnement et la fermeture (Échap, clic extérieur).

interface Props<T> {
    /** Libellé accessible, non affiché. Passe par la prop `label` de cmdk :
     *  cmdk impose son propre id à l'input et ignore un `id` externe, un
     *  `<label htmlFor>` posé à la main resterait donc orphelin. */
    label: string
    valeur: string
    onValeurChange: (valeur: string) => void
    placeholder: string
    /** La liste peut s'ouvrir : une requête est en cours, ou il y a de quoi
     *  choisir. Le champ la referme de lui-même au choix, à Échap ou au clic
     *  extérieur, et la rouvre à la frappe ou au focus. */
    actif: boolean
    /** `null` : en cours de chargement. */
    suggestions: T[] | null
    cleDe: (suggestion: T) => string
    rendre: (suggestion: T) => ReactNode
    onChoisir: (suggestion: T) => void
    vide?: string
    inputClassName?: string
    /** Posé dans le champ, par-dessus l'input (bouton d'effacement…). */
    ornement?: ReactNode
    className?: string
}

export function ChampSuggestions<T>({
    label,
    valeur,
    onValeurChange,
    placeholder,
    actif,
    suggestions,
    cleDe,
    rendre,
    onChoisir,
    vide = "Aucun résultat.",
    inputClassName,
    ornement,
    className,
}: Props<T>) {
    // Fermé tant que le membre n'a pas tapé ou pris le focus : sans cet état,
    // une liste dérivée du seul `actif` se rouvrirait aussitôt après Échap.
    const [ferme, setFerme] = useState(true)
    const ancre = useRef<HTMLDivElement>(null)

    return (
        <Command shouldFilter={false} label={label} className={cn("overflow-visible bg-transparent", className)}>
            <Popover open={actif && !ferme} onOpenChange={(ouvert) => setFerme(!ouvert)}>
                <PopoverAnchor asChild>
                    <div ref={ancre} className="relative">
                        <CommandPrimitive.Input
                            value={valeur}
                            onValueChange={(v) => { onValeurChange(v); setFerme(false) }}
                            onFocus={() => setFerme(false)}
                            placeholder={placeholder}
                            autoComplete="off"
                            // `text-base` et non `text-sm` : sous 16 px, iOS zoome sur le
                            // champ au focus.
                            className={cn(
                                "h-10 w-full rounded-md border border-input bg-background px-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
                                inputClassName,
                            )}
                        />
                        {ornement}
                    </div>
                </PopoverAnchor>
                <PopoverContent
                    align="start"
                    sideOffset={4}
                    // Le focus reste dans le champ : on continue de taper pendant
                    // que la liste est ouverte.
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    // Cliquer dans son propre champ n'est pas un clic extérieur.
                    onInteractOutside={(e) => {
                        if (ancre.current?.contains(e.target as Node)) e.preventDefault()
                    }}
                    className="w-[--radix-popover-trigger-width] rounded-md p-0 shadow-md"
                >
                    <CommandList className="max-h-64">
                        {suggestions === null ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">Chargement…</div>
                        ) : (
                            <>
                                <CommandEmpty className="px-3 py-2 text-left text-sm text-muted-foreground">
                                    {vide}
                                </CommandEmpty>
                                {suggestions.map((s) => (
                                    <CommandItem
                                        key={cleDe(s)}
                                        value={cleDe(s)}
                                        onSelect={() => { setFerme(true); onChoisir(s) }}
                                        className="w-full cursor-pointer gap-0 rounded-none px-3 py-2 text-left text-sm data-[selected=true]:bg-muted"
                                    >
                                        {rendre(s)}
                                    </CommandItem>
                                ))}
                            </>
                        )}
                    </CommandList>
                </PopoverContent>
            </Popover>
        </Command>
    )
}
