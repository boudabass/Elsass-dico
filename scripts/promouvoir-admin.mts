// Amorçage du premier administrateur.
//
// Pourquoi un script et pas une variable d'environnement : le rôle vit en base,
// et un `ADMIN_EMAIL` lu au runtime rendrait quelqu'un admin par configuration —
// donc silencieusement, et de façon réversible au prochain déploiement. Ici le
// geste est explicite, daté par le commit qui le lance, et visible ensuite dans
// /admin comme n'importe quel autre rôle.
//
// Le premier admin ne peut pas être promu depuis l'app, faute d'admin pour le
// faire. Les suivants le sont — c'est le seul usage de ce script.
//
//   pnpm exec tsx scripts/promouvoir-admin.mts quelqu-un@example.com
//   pnpm exec tsx scripts/promouvoir-admin.mts quelqu-un@example.com --retirer
//
// Le membre doit exister : il est créé à sa PREMIÈRE CONNEXION, par Odoo. Se
// connecter d'abord, lancer ceci ensuite.

import { ouvrirBase } from "./lib/base.mts"

const email = process.argv[2]?.trim().toLowerCase()
const retirer = process.argv.includes("--retirer")

if (!email) {
    console.error("Usage : tsx scripts/promouvoir-admin.mts <email> [--retirer]")
    process.exit(2)
}

const prisma = ouvrirBase()

const membre = await prisma.membre.findUnique({
    where: { email },
    select: { id: true, email: true, nom: true, role: true },
})

if (!membre) {
    const connus = await prisma.membre.findMany({ select: { email: true }, orderBy: { creeLe: "asc" } })
    console.error(`Aucun membre avec l'e-mail « ${email} ».`)
    console.error(
        connus.length
            ? `Membres connus : ${connus.map((m) => m.email).join(", ")}`
            : "Aucun membre en base — personne ne s'est encore connecté.",
    )
    await prisma.$disconnect()
    process.exit(1)
}

const vise = retirer ? "membre" : "admin"

if (membre.role === vise) {
    console.log(`${membre.email} est déjà « ${vise} », rien à faire.`)
    await prisma.$disconnect()
    process.exit(0)
}

// Refuser de retirer le dernier admin : la promotion suivante n'aurait plus
// personne pour la faire, et il faudrait revenir ici.
if (retirer) {
    const admins = await prisma.membre.count({ where: { role: "admin" } })
    if (admins <= 1) {
        console.error("C'est le dernier administrateur — le retirer fermerait /admin à tout le monde.")
        await prisma.$disconnect()
        process.exit(1)
    }
}

await prisma.membre.update({ where: { id: membre.id }, data: { role: vise } })

console.log(`${membre.email} : ${membre.role} -> ${vise}`)
// Le jeton du membre porte encore l'ancien rôle ; il sera relu en base au
// prochain renouvellement, dans 30 minutes au plus (src/lib/session.ts).
console.log("Effet immédiat après reconnexion, sinon dans les 30 minutes.")

await prisma.$disconnect()
