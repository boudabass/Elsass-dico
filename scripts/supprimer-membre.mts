// Suppression d'un compte, sur demande du membre (CGU article 9, politique de
// confidentialité article 8).
//
// Pas de bouton dans l'app : la demande arrive par email à
// info@theelsassisch.com, et le geste reste explicite, comme la promotion d'un
// admin (scripts/promouvoir-admin.mts).
//
// Ce qui disparaît : le membre (email, nom, identifiant Odoo, village,
// dates) et ses signalements, dont le motif est un texte libre.
// Ce qui reste, anonyme : ses témoignages (la forme et le village demeurent,
// `membre_id` passe à NULL) et les variantes qu'il a créées (`cree_par` passe
// à NULL). C'est la base qui le fait, par ses clés étrangères (migration
// 20260924120000) : ce script ne fait que supprimer la ligne du membre.
//
//   pnpm exec tsx scripts/supprimer-membre.mts quelqu-un@example.com
//   pnpm exec tsx scripts/supprimer-membre.mts quelqu-un@example.com --confirmer
//
// Sans --confirmer, il n'écrit rien et dit seulement ce qui se passerait.

import { ouvrirBase } from "./lib/base.mts"

const email = process.argv[2]?.trim().toLowerCase()
const confirmer = process.argv.includes("--confirmer")

if (!email) {
    console.error("Usage : tsx scripts/supprimer-membre.mts <email> [--confirmer]")
    process.exit(2)
}

const prisma = ouvrirBase()

const membre = await prisma.membre.findUnique({
    where: { email },
    select: {
        id: true, email: true, nom: true, role: true,
        _count: { select: { temoignages: true, variantes: true, signalements: true, evenements: true } },
    },
})

if (!membre) {
    console.error(`Aucun membre avec l'e-mail « ${email} ».`)
    await prisma.$disconnect()
    process.exit(1)
}

// Même garde que promouvoir-admin : sans admin, /admin n'a plus personne.
if (membre.role === "admin" && (await prisma.membre.count({ where: { role: "admin" } })) <= 1) {
    console.error("C'est le dernier administrateur : promouvoir quelqu'un d'autre avant de le supprimer.")
    await prisma.$disconnect()
    process.exit(1)
}

const { temoignages, variantes, signalements, evenements } = membre._count
console.log(`${membre.email}${membre.nom ? ` (${membre.nom})` : ""}`)
console.log(`  ${temoignages} témoignage(s) et ${variantes} variante(s) créée(s) : gardés, anonymes`)
console.log(`  ${evenements} événement(s) du journal des contributions : gardés, anonymes`)
console.log(`  ${signalements} signalement(s) : supprimé(s) avec le compte`)

if (!confirmer) {
    console.log("\nRien n'a été modifié. Relancer avec --confirmer pour supprimer.")
    await prisma.$disconnect()
    process.exit(0)
}

// La suppression et le contrôle dans la même transaction : si un seul
// témoignage ou événement du journal disparaissait au lieu d'être anonymisé,
// rien n'est écrit.
const anonymes = await prisma.$transaction(async (tx) => {
    const ids = (await tx.temoignage.findMany({ where: { membreId: membre.id }, select: { id: true } }))
        .map((t) => t.id)
    const idsEvenements = (await tx.evenementContribution.findMany({
        where: { membreId: membre.id }, select: { id: true },
    })).map((e) => e.id)
    await tx.membre.delete({ where: { id: membre.id } })
    const restants = await tx.temoignage.count({ where: { id: { in: ids }, membreId: null } })
    if (restants !== ids.length) {
        throw new Error(`${ids.length - restants} témoignage(s) effacé(s) au lieu d'être anonymisé(s) : annulé.`)
    }
    const evenementsRestants = await tx.evenementContribution.count({
        where: { id: { in: idsEvenements }, membreId: null },
    })
    if (evenementsRestants !== idsEvenements.length) {
        throw new Error(`${idsEvenements.length - evenementsRestants} événement(s) du journal effacé(s) : annulé.`)
    }
    return restants
})

console.log(`\nSupprimé. ${anonymes} témoignage(s) anonymisé(s), toujours sur la carte.`)
// Son jeton de reconnexion ne rouvrira plus de session : /api/session/refresh
// relit le membre en base et ne le trouve plus.
console.log("Reste à faire à la main : supprimer son compte sur le site The Elsassisch (Odoo),")
console.log("sinon il pourra se reconnecter et un nouveau membre, vierge, sera créé.")

await prisma.$disconnect()
