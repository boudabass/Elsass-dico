# Elsass Dico

Dictionnaire français/alsacien de la marque The Elsassisch, publié sur
elsass-dico.theelsassisch.com (`main`) et elsass-dico-dev.theelsassisch.com
(`dev`). La crédibilité linguistique est critique : du faux alsacien publié
sous cette marque serait un vrai problème.

**Où lire le reste** : Odoo 882 (cap produit), 883 (jalons, points ouverts),
884 (checklists) font foi. `PRODUCT.md` résume pour le design.
`documentation/23-JOURNAL.md` garde le détail daté de chaque décision et de
chaque incident jusqu'au 06/10/2026 : **y chercher avant de redécider une chose
déjà tranchée.** Index : `documentation/README.md`.

## Règles non négociables sur les données

1. **Aucune traduction générée par un LLM. Jamais**, même pour un exemple ou un
   test. Une entrée inventée est pire que pas d'entrée.
2. **Chaque forme dit ce qui la fonde** : nombre de sources écrites ET nombre
   de villages, deux chiffres, **jamais additionnés** (bug de la PR #41). Peu
   attesté est publiable ; le faire passer pour bien attesté ne l'est pas.
   Badge : 1 source = gris, 2 = jaune, 3+ = vert.
3. Les formes sont enregistrées **verbatim** (jamais recadrées vers l'ORTHAL).
4. Rien ne passe sans modération humaine. Toujours demander avant de supprimer
   des données existantes.

## Doctrine (refonte du 11/09/2026, « carte des parlers »)

- **Pas de forme canonique.** Toutes les variantes coexistent, portées par leurs
  sources et par les **villages** qui les revendiquent. La carte est centrale.
- **Un vote = un village** (`Temoignage{membreId, communeId}`). Jamais de vote
  contre. Le village se **choisit dans une liste**, ne se détecte jamais ; le
  mot « géolocalisation » n'apparaît pas dans l'UI.
- **Un toponyme EST une commune** (`Lemme.communeId`).
- **L'unification émerge, ne s'impose pas** : se préparer techniquement
  (journal des contributions), ne rien trancher à la place des locuteurs.
- Apprenant et locuteur sont **un seul profil**, mêmes droits.
- **Deux sens de lecture** : inverseur en haut des écrans connectés, **bleu =
  français, rouge = alsacien** (tokens `--sens-*`, cookie `ed_sens`). Le rouge
  de marque (home, jeu, login, partage) ne passe pas par `--sens-*`.
- **Accès** : compte obligatoire, créé sur theelsassisch.com (Odoo, SSO de tout
  l'univers), jamais depuis le dico. Retour après inscription vers
  `/application`, jamais vers un projet. Rôles : membre, admin.
- **Public sans compte** : `/` (présentation), `/village/[slug]`,
  `/prenom/[slug]`, `/sources`, et `/jeu` (défi du jour, sans rien enregistrer).
  Le dictionnaire reste réservé aux membres.
- **Aucun service extérieur à l'exécution.** Une bibliothèque dans le bundle et
  des données versionnées sont à nous ; un serveur interrogé ne l'est pas.
  Carte = Leaflet sans `tileLayer`, fond `public/carte/contours.topojson`.
- **Licences respectées** : la mention de paternité peut changer de place,
  jamais disparaître (Licence Ouverte IGN/INSEE sur `/sources`).
  `culture_alsace` = site d'André Nisslé (pas Raymond Matzen).
- `aireLinguistique` reste nulle pour la Moselle : personne n'a établi la liste.
- La source de vérité est **le dépôt** : la base se reconstruit des JSONL
  (`deriver.mts`) puis du journal (`importer-contributions.mts`).

## Public et voix

- **Le public a plutôt 60 ans que 40** : dire concrètement ce qu'on voit et ce
  qu'on doit faire, avec des chiffres. Pas de préambule, pas de tournure
  littéraire, pas de vocabulaire interne (forme, attester, témoin, « ce qui
  fonde »).
- **Tutoiement** partout dans l'app. **Jamais de tiret long « — »** dans le
  texte affiché.
- `/recherche` = la barre seule (décision de John, ne pas reproposer d'exemples).

## Stack

Next 15.5 (App Router, Server Actions), React 19.3, Prisma 7 sur Postgres 18,
sessions `jose` (`ed_session` 30 min avec rôle, `ed_refresh` 30 j sans rôle,
claim `typ`), Tailwind + shadcn/Radix/cmdk, Leaflet, `next/og`. Coolify sur un
VPS partagé ; `dev` et `main` **partagent la même base**.
`prisma migrate deploy` tourne au démarrage du conteneur
(`docker-entrypoint.sh`, CLI isolée dans `/opt/prisma-cli`).

## Pièges connus (tous déjà rencontrés)

- **pnpm, jamais npm.** `prisma@latest` = release candidate (tag `prev` = stable).
- `pnpm build` local finit toujours par l'**EPERM symlink Windows** (standalone) :
  normal si « Generating static pages (N/N) » est passé.
- `DATABASE_URL` est une **Build Variable** Coolify (`generateStaticParams`
  lit la base au build). Le secret BuildKit ne marche pas sur ce Coolify.
  `experimental.cpus = 1` évite l'OOM du build.
- **Une Server Action en vol ne survit ni à `router.replace` ni à
  `history.replaceState`** : réécrire l'URL après le chargement, jamais pendant.
- **Une Server Action de lecture se garde elle-même** (`estConnecte()`) : Next
  expose toutes les actions importées par une page, y compris une page publique.
- **Un fichier `'use server'` n'exporte que des actions publiques** : les
  utilitaires vont dans `src/lib/*-serveur.ts`.
- Redirection dans une route API : **chemin relatif**, jamais
  `new URL(x, request.url)` (derrière le proxy = `0.0.0.0:3000`).
- Leaflet fuit ses z-index (jusqu'à 1000) : `isolate` sur son conteneur.
- `unaccent` **jamais dans une clé d'identité** (fusionne `sur`/`sûr`) ; permis
  pour la recherche et l'ordre d'affichage. Fonctions SQL appelées dans un index :
  préfixer `public.`. Une colonne générée ne se recalcule pas quand sa fonction
  change. Écrire `[)]`, pas `\)`, dans une regex SQL.
- `toLocaleString("fr-FR")` met U+202F, que la police ne dessine pas.
- `space-y-*` compte aussi un label `sr-only`.
- cmdk ignore un `id` externe : libellé par la prop `label` de `<Command>`.
- Le rapport imprimé d'un parseur plafonne (80) : relire par lettre.
- **Branche `data` sous Windows** : un nom de fichier avec « ? » rend
  checkout, reset et index impossibles. Committer par plumbing (`mktree`,
  `commit-tree`, `update-ref`), jamais en désactivant `core.protectNTFS`.
- **Mot de passe Postgres** : le changer en base (`ALTER ROLE`), puis le
  recopier dans la ressource Postgres de Coolify (sinon les sauvegardes
  cassent) et dans `DATABASE_URL` runtime + build de dev et main. Le
  terminal web Coolify ne permet pas de coller.
- **Port 5444 fermé** depuis le 09/10 (Coolify, ressource Postgres, case
  « publicly available »). Les scripts locaux qui touchent la base
  (`deriver.mts`, `importer-*.mts`, `exporter-contributions.mts`, mesures en
  lecture) exigent que John le rouvre le temps du script, puis le referme.
- Le middleware renvoie 307 sur **toute** route sans session, même inexistante :
  un 307 ne prouve pas qu'une page est déployée.

## Vérification (méthode qui a fait ses preuves)

- **Mesurer avant d'écrire**, en base, script jetable en lecture seule, supprimé
  après. Jamais d'écriture de test laissée en base ; nettoyer le journal aussi.
- `pnpm run typecheck` puis `pnpm build` après chaque groupe de changements.
- Déploiement : attendre que `updated_at` Coolify avance **et** que le code
  servi contienne le changement, avant toute capture.
- **Vérifier à l'écran en passant par la nav**, pas seulement par l'URL.
- Chrome piloté n'atteint pas `pnpm dev` en local (ses requêtes n'arrivent
  pas au serveur) : tester sur dev.
- Chrome piloté : l'onglet est caché (`visibilityState: hidden`) → faire une
  capture avant de conclure qu'un écran ne charge pas ; les animations de sortie
  Radix ne finissent pas (lire `data-state`, pas la présence) ; `resize_window`
  est inerte (tester le mobile dans une iframe de 375 px) ; la touche « Return »
  n'arrive pas comme `Enter` à cmdk ; attendre le contenu réel, pas le squelette.
- Un « caprice » qui revient se reproduit en `curl -I` avant d'être classé
  incident navigateur.
- Restauration de sauvegarde : **toujours dans une base vide, jamais vers la
  production** (port 5444).

## Conventions

- Travail sur `dev`, PR `dev` → `main` **par commit de merge** (pas de squash).
- Clôture de session : l'export des contributions est automatique (workflow
  N8N `OP_EXPORT_CONTRIBUTIONS_DICO`, chaque nuit à 4 h, commit sur `dev`
  seulement si le journal a changé) ; faire `git pull` avant de travailler, mettre à jour `documentation/23-JOURNAL.md`, Odoo 883
  si un jalon bouge. **Ce fichier-ci ne reçoit que ce qui change une règle, un
  piège ou l'état ci-dessous** : le récit va dans le journal.
- Premier admin : `scripts/promouvoir-admin.mts` ; suppression d'un membre :
  `scripts/supprimer-membre.mts` (anonymise, puis supprimer le compte Odoo).
- Coolify via MCP : lecture seule.

## État au 09/10/2026 (soir)

- Toutes les étapes de la refonte sont faites (dérivation, session, fiches
  publiques, admin, carte, contribution, jeu, deux sens).
- **En production** : PR #96 (CSP complète avec nonce) et PR #97 (route
  d'export des contributions), 09/10. `dev` n'a en plus que de la doc et le
  journal exporté.
- **Sécurité : audit du 02/10 entièrement soldé.** Quatre failles (PR #95),
  secrets changés (`SESSION_SECRET` le 08/10 ; mot de passe Postgres,
  `AUTOMATISATION_API_TOKEN` + N8N, jeton Coolify le 09/10), port 5444 fermé,
  CSP avec nonce. Toutes les pages sont rendues à la demande : une page
  rendue statique perdrait son JavaScript.
- **Export des contributions automatique** : workflow N8N
  `OP_EXPORT_CONTRIBUTIONS_DICO` actif (4 h), watch paths Coolify de dev
  `**` + `!data/contributions/**`. Premier passage le 09/10 : 8 événements.
- Base : ~26 526 lemmes, 42 510 variantes (dont 863 insultes de la source
  `dj_fabz`, intégrées le 09/10), 2 membres, 8 événements de contribution.
- **À constater par John** : plus de 404 à la réouverture de l'app après
  30 min (cause non établie ; capture demandée si ça revient) ; qu'aucun
  déploiement de dev ne suit un commit `data:` de N8N. Le compte Odoo
  `theelsassisch+test@gmail.com` est **gardé** (ne plus proposer de le
  supprimer). Partage par lien sur téléphone : confirmé le 09/10.
- **En attente côté John** : feu vert du lancement public (workflow N8N
  `MET_DEFI_DICO_HEBDO`).
- **`/application`** (site Odoo) : terminé le 09/10 (carte Elsass Dico vers
  `/login`, boutons d'Elsass Chat, « Vos idées », Cours et Forum).
- **Prochaine session** : rien d'imposé. Les sources faibles s'intègrent
  comme `culture_alsace` (décision de John du 09/10), sans démarche préalable.
- **Ouvert, plus long terme** : faire venir des locuteurs, mesure de
  convergence, aire du 57, attribution de la police Azimut (John), seuil
  « proche » de la contribution (≤ 2 lettres et ≤ 25 %).
