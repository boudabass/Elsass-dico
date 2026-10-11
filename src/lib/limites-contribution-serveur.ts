// Limites des contributions (audit du 11/10/2026). Une forme ou un mot ajouté,
// un vote, une proposition répétée sur le même mot : rien ne les bornait, et un
// compte bavard pouvait remplir la base en une heure.
//
// Les compteurs vivent dans `limite-tentatives-serveur.ts` (mémoire du processus,
// repart à zéro à chaque déploiement). Ici, seulement les chiffres et les
// messages, pour que les actions disent la même chose partout.
//
// Ce fichier n'est PAS un fichier `'use server'` : il n'exporte que des constantes.

/** Formes et mots ajoutés par heure et par membre (contribution commune). */
export const CONTRIBUTIONS_PAR_HEURE = 30

/** Votes (« chez moi aussi », changement de village) par heure et par membre. */
export const VOTES_PAR_HEURE = 100

/** Formes proposées par un même membre sur un même mot. */
export const PROPOSITIONS_PAR_MOT = 5

export const MESSAGE_CONTRIBUTIONS =
    `Tu as déjà ajouté ${CONTRIBUTIONS_PAR_HEURE} façons de dire cette heure-ci. Réessaie un peu plus tard.`

export const MESSAGE_VOTES =
    `Tu as déjà ajouté ton village ${VOTES_PAR_HEURE} fois cette heure-ci. Réessaie un peu plus tard.`

export const MESSAGE_PROPOSITIONS =
    `Tu as déjà proposé ${PROPOSITIONS_PAR_MOT} façons de dire ce mot.`
