# 20 — Refonte : la carte des parlers (11/09/2026)

> **Ce document fait foi sur la cible**, par exception à la règle du dossier qui
> renvoie tout vers Odoo. Motif : la refonte périme les articles Odoo 882, 883 et
> 884, qui décrivent la cible précédente. Tant qu'ils n'ont pas été réécrits, deux
> sources diraient deux choses — et c'est ici que se trouve la bonne.
>
> **À réécrire dans Odoo une fois la refonte engagée**, puis ce fichier
> redeviendra un renvoi comme les autres.

## Pourquoi

Cinq campagnes ont produit **27 179 attestations**. Quatre mois d'arbitrage en ont
tiré **338 entrées publiées, dont 331 toponymes** : un annuaire de communes, pas un
traducteur. Qui tape « bonjour » ne trouve rien.

Le goulot n'a jamais été la donnée. Il tenait à une exigence : désigner **une**
forme juste, dans une langue qui n'en a pas. `Riaschpa` contre `Rieschbi`, on a
appelé ça pendant des semaines une « divergence à trancher ». Ce sont deux
villages, et c'est l'information la plus intéressante de toute la base.

**Décision de John, 11/09/2026 : on arrête d'imposer, on affiche tout.** Toutes les
variantes coexistent, portées par leurs sources écrites et par les villages qui les
revendiquent. La carte devient l'écran central. ORTHAL redevient une norme externe
de lecture, pas un arbitre.

Ce que ça débloque : les 27 179 attestations deviennent visibles **le jour de la
bascule**, sans une décision humaine de plus.

## Les décisions

| Sujet | Décision |
|---|---|
| Doctrine | Plus de forme canonique. Toutes les variantes coexistent. |
| Vote | **Un vote = un village.** Bouton `+` sur une variante. Jamais de vote contre. |
| Village | **Choisi dans une liste**, jamais détecté. Le mot « géolocalisation » ne paraît nulle part dans l'UI. On demande **d'où vient ton parler**, pas où tu habites : un Colmarien à Paris choisit Colmar. |
| Référentiel | **67 + 68 + tout le 57**, 1 605 communes. |
| Accès | **Compte obligatoire**, création renvoyée vers le portail Odoo. Tous les membres sont des utilisateurs The Elsassisch. |
| Rôles | **Deux** : membre et admin. Tout membre contribue. |
| Public | Home de présentation + **une page par village et par prénom**, générées statiquement. Seul corpus indexable. |
| Tri d'une fiche | **Sources écrites d'abord**, contributions ensuite. |
| Correction | L'auteur édite sa variante **tant que personne d'autre ne l'a revendiquée**. Signalement à l'admin. Retirer son propre `+`. |
| Base | **Postgres + Prisma.** Supabase sort. |
| ORTHAL | Tables `propositions_orthal` et `automates` supprimées (vides, jamais servies). `documentation/orthal/` gardée. |
| Nom | Elsass Dico, même domaine. Sous-titre à réécrire. |
| Livraison | Socle technique d'abord. Tout sur `dev`, puis **une PR qui remplace `main`**. |
| Gameplay | Reporté, hors périmètre. |

**Conséquence assumée** : passer l'app derrière un compte retire le lexique de
l'indexation Google. Les pages villages et prénoms deviennent le seul corpus
indexable — c'est aussi un bon corpus (« nom alsacien de Colmar »), donc la perte
est atténuée, pas nulle.

## Modèle de données cible

```prisma
model Commune {
  id               Int     @id          // code INSEE
  nom              String
  departement      String               // "67" | "68" | "57"
  codesPostaux     String[]
  latitude         Float                // centroïde : un point, pas un polygone
  longitude        Float
  aireLinguistique String?              // "alsacien" | null (cf. plus bas)
  temoignages      Temoignage[]
  membres          Membre[]
}

model Lemme {
  id        String    @id @default(uuid())
  francais  String
  cle       String                      // lower(btrim(francais)), indexée
  contexte  String    @default("")      // sépare les homonymes
  type      TypeTerme                   // mot|expression|proverbe|toponyme|prenom
  communeId Int?                        // un toponyme EST une commune
  variantes Variante[]
  @@unique([cle, contexte])
}

model Variante {
  id               String   @id @default(uuid())
  lemmeId          String
  forme            String               // verbatim, jamais réécrite (règle 1)
  cleForme         String               // cleDeForme(), pour dédoublonner
  article          String?
  formeSansArticle String?
  creePar          String?              // membre auteur, si contribution
  masquee          Boolean  @default(false)  // modération : masquer, pas supprimer
  temoignages      Temoignage[]
  @@unique([lemmeId, cleForme])
}

model Temoignage {
  id            String   @id @default(uuid())
  varianteId    String
  // — soit une source écrite (aucun lieu) :
  sourceId      String?
  attestationId String?                 // remonte à l'archive brute
  // — soit un locuteur (un lieu) :
  membreId      String?
  communeId     Int?
  creeLe        DateTime @default(now())
  @@unique([varianteId, membreId])
  @@unique([varianteId, attestationId])
}

model Membre {
  id        String @id @default(uuid())
  email     String @unique
  odooUid   Int?   @unique
  role      Role   @default(membre)     // membre | admin
  communeId Int?                        // village par défaut, pré-remplit le +
}

model Signalement {
  id         String    @id @default(uuid())
  varianteId String
  membreId   String
  motif      String
  traiteLe   DateTime?
}
```

### Quatre points qui ne se négocient pas

1. **`communeId` est porté par le témoignage, pas seulement par le profil.** Si
   quelqu'un corrige son village, ses témoignages passés ne bougent pas sur la carte.
2. **Un témoignage a soit une source, soit un membre+commune** — jamais les deux,
   jamais aucun. À poser en `CHECK` SQL, pas seulement en intention.
3. **`attestations` survit intacte, en archive lecture seule.**
   `Temoignage.attestationId` y pointe, et la dérivation est un script **rejouable**.
4. **L'édition d'une variante se ferme dès qu'un second témoignage arrive**, sinon
   une forme change sous les yeux de ceux qui l'ont déjà revendiquée.

### Pourquoi ce n'est pas le retour de `attestations → entrees`

La dérivation est **automatique et exhaustive** : les 27 179 lignes deviennent
toutes des variantes visibles, sans décision humaine. `entrees` exigeait un
arbitrage par mot et plafonnait à 338 en quatre mois. C'est toute la différence, et
il faut la garder en tête si le modèle semble familier.

## Ce qu'on garde, ce qu'on jette

**Gardé** — le patrimoine :

- `attestations` (27 179) + `sources` + `anomalies_source` (390 coquilles connues).
- `data/` et les parseurs de la branche `data`.
- Le shell mobile-first : `app-header.tsx`, `app-nav-shell.tsx`,
  `layout-wrapper.tsx`, `badge-confiance.tsx`, les primitives `ui/`.
- Le cache de navigation : `src/lib/cache-navigation.ts`, `use-liste-memorisee.ts`,
  `use-scroll-memorise.ts` — éprouvés, et leur justification (un VPS sans rate
  limiting) est inchangée.
- De `src/lib/dictionnaire.ts` : les types, `TYPES_TERME`, `niveauConfiance()`,
  **`scinderSynonymes()`** (mesurée : 10 608 chaînes scindables, 0 violation de la
  règle 1 — sert à la dérivation), `cleDeForme()`, et les clés de normalisation
  `cleDeTri` / `cleSansAlternanceAE` / `cleSansSonorisation`, qui serviront à
  **rapprocher** des variantes voisines sur la carte, jamais à les fusionner.
- `src/lib/odoo.ts` (`authentifierAupresDOdoo()`), inchangé.

**Jeté** :

- Tables `entrees`, `entree_attestations`, `attestation_votes`,
  `propositions_orthal`, `automates`.
- Les 25 fonctions RPC Postgres, remplacées par du Prisma.
- `src/app/admin/arbitrage/**` (~1 000 lignes), `src/app/actions/arbitrage.ts`
  (418 lignes), `src/app/contributions/**`, `actions/contributions.ts`.
- De `dictionnaire.ts` : `traductionsRecoupees`, `analyserDivergence`,
  `traductionsArbitrees`, `formesRetenuesNonPubliees`, `grouperParForme`,
  `formeDuHautRhin`, `SOURCES_MINIMUM`, l'enum `Region` à trois valeurs.
- Tout `@supabase/*` : 5 fabriques de clients, 15 fichiers consommateurs,
  22 policies RLS, 47 `SECURITY DEFINER`, 21 `auth.uid()`. Plus trois modules déjà
  morts avant la refonte (`src/lib/database.ts`, `src/lib/supabase.ts`,
  `src/utils/supabase/middleware.ts`).
- « Un contributeur = une source » : un locuteur témoigne d'un parler, il n'est pas
  une source bibliographique. Attention, `sources.notes` contient des e-mails de
  contributeurs — ils ne sont pas repris.

**Perdu volontairement** : les 338 entrées arbitrées. Leur contenu est redérivable
des attestations. ~~Faire un dump SQL complet avant la bascule.~~ — **abandonné
le 12/09/2026** (décision de John) : la base se reconstruit intégralement du
dépôt, et ce qui n'existait qu'en base — entrées publiées, comptes, votes —
n'a plus d'intérêt.

## Étapes

### 1. Socle données — ✅ **fait le 12/09/2026**

Détail de la chaîne, de ses chiffres et de ses commandes : `21-REPRISE.md`.

- Conteneur **Postgres 18** sur Coolify — fait (`postgres:18-alpine`).
- `prisma/schema.prisma` et **`prisma migrate deploy` au démarrage du conteneur**
  (`docker-entrypoint.sh`), qui refuse de démarrer si une migration échoue. Ça
  tue la classe de bugs qui a frappé trois fois : migration passée à la main dans
  le SQL Editor, oubliée, invisible jusqu'à la première écriture (09/08, 10/08,
  23/08).
- **Référentiel communes** — fait, cf. `data/communes/`.
- **Script de dérivation** `scripts/deriver.mts` : `attestations` → `Lemme` /
  `Variante` / `Temoignage`. Réutilise `scinderSynonymes()` et `cleDeForme()`
  telles quelles. 27 179 attestations → 25 864 lemmes, 41 646 variantes,
  42 135 témoignages, **sans une décision humaine**.
- ~~Dump SQL complet de l'existant~~ — **abandonné** (décision de John,
  12/09/2026) : la base se reconstruit intégralement du dépôt, et ce qui
  n'existait qu'en base n'a plus d'intérêt.

**La source de vérité est le dépôt, pas la base** (décision du 12/09). Les
données sont reconstruites depuis les JSONL des parseurs versionnés sur la
branche `data`, jamais lues dans Supabase — qui portait quatre mois de purges,
de réingestions et de colonnes ajoutées au fil de l'arbitrage. Une seule
altération décisionnelle s'y était glissée, annulée par la **PR #44** : 349
contextes de `wiktionnaire_fr` recopiés de `culture_alsace` pour que l'ancienne
file d'arbitrage fasse se rencontrer les candidats.

**Un toponyme EST une commune** : le lemme s'indexe par sa commune, pas par
(français, contexte). `Roeschwoog` et `Rœschwoog` portent leurs deux formes sur
la même fiche de village — ce qui rend la recontextualisation inutile, le
département venant du référentiel INSEE et non d'une source recopiée sur une
autre.

**La mesure du marqueur a~e est faite, et positive** — `22-MESURE-MARQUEUR-AE.md`.
Elle a répondu par un chemin qui n'était pas prévu : `culture_alsace` **déclare
son parler elle-même** (« Fer s'Südliga Nederàlamànischa Üssdrucksgebiat », et sa
propre carte délimite l'aire — « région de Colmar et de Mulhouse »). Le marqueur
ne fait que confirmer, sans lien technique avec la déclaration : 99,9 % de
finales `-a` sur les 18 pages sans bandeau de mélange, 80,0 % sur les 7 autres.
D'où `Temoignage.aireDeclaree`, qui porte ce qu'une source dit d'elle-même et
jamais ce qu'on en déduit.

### 2. Auth autonome, Supabase dehors

- Odoo reste l'autorité sur les mots de passe. Ce qui disparaît, c'est le montage
  `createUser` + `generateLink` + `verifyOtp` de `actions/odoo-auth.ts`.
- Session par **cookie signé avec `jose`** (JWT court + refresh). Jamais de HMAC
  maison.
- **`middleware.ts` : plus aucun I/O.** Aujourd'hui il fait un `auth.getUser()`
  **réseau à chaque page vue**, visiteur anonyme compris, plus un `select profiles`
  sur `/admin` et `/contributions`. Demain : vérification de signature locale.
  C'est le gain CPU direct sur le VPS qui sature (audit du 30/08).
- Inscription : lien vers la création de compte du portail Odoo. **À vérifier côté
  Odoo** que l'auto-inscription portail est activée — c'est une config, pas du code.
- `Dockerfile` : les `ARG NEXT_PUBLIC_SUPABASE_*` sortent, `DATABASE_URL` entre en
  runtime.

### 3. Écrans

**Public, sans compte** — `/` présentation, `/village/[slug]` et `/prenom/[slug]`
**générées statiquement** (`generateStaticParams`) : zéro requête au runtime, donc
zéro CPU, et c'est tout ce que Google verra. Ne générer que les communes **qui ont
au moins une forme attestée** (954 sur 1 605) : une page vide est du thin content
qui dessert le référencement. Les autres répondent en `noindex`, avec un appel à
contribution.

**Authentifié** — recherche complète dans les deux sens (la recherche inverse
alsacien → français est conservée). Une fiche de mot montre **toutes** les
variantes : sources écrites d'abord avec leurs sources nommées, contributions
ensuite avec leurs villages. Les deux blocs restent visuellement distincts — on
n'additionne jamais un compte de sources et un compte de villages dans un même
chiffre. C'est l'erreur exacte de la PR #41, trouvée en production le 09/09.

**Admin, trois écrans** : membres (`/admin` existe déjà et fonctionne), file des
signalements, gestion des sources écrites.

### 4. La carte

- **Aucune tuile, aucun service extérieur** (décision de John, 12/09/2026 —
  révise ce que ce document prévoyait). Une carte à tuiles demande son fond à un
  serveur tiers à chaque consultation : le jour où il change ses URL, plafonne
  ou tombe, la carte est vide. Le projet ne peut pas en dépendre.

  Deux pistes ont été instruites puis écartées le même jour : les tuiles
  d'OpenStreetMap, dont la
  [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)
  prévoit un blocage « sans préavis » ; et la Géoplateforme de l'IGN, meilleure
  sur le papier (tuiles exclues de son plafonnement, testé à 200 sans clé) mais
  qui reste un service qu'on ne maîtrise pas.

- **Le fond est à nous** : `public/carte/contours.topojson`, produit par
  `scripts/communes/generer-contours.js`. Les 1 605 communes en TopoJSON — les
  frontières partagées n'y sont écrites qu'une fois — simplifié à 12 % des
  sommets. **401 Ko, ~97 Ko compressés**, chargés une seule fois : moins que
  trois tuiles d'une carte classique, qui elles se rechargent à chaque
  déplacement.

  Ce document affirmait que « 1 605 communes en contours GeoJSON pèsent
  plusieurs Mo, indéfendable en mobile-first ». **Mesuré, c'est faux** : 1,6 Mo
  en GeoJSON brut, et le format adapté à un maillage divise encore par quatre.
  À 12 % des sommets, l'écart d'aire est de 0,017 % sur le Bas-Rhin et aucune
  commune ne dégénère.

  Contours IGN Admin Express sous **Licence Ouverte**. La mention de paternité
  vit sur `/sources`, **pas sur la carte** : le texte de la licence demande la
  source et son millésime sans imposer d'emplacement — il accepte même un simple
  renvoi par URL. Elle n'est pas facultative pour autant. C'est la seule
  contrepartie d'une licence qui donne par ailleurs l'usage commercial, mondial,
  illimité et gratuit ; la retirer ne gagnerait aucun droit, elle ferait perdre
  le seul qu'on ait. Le projet a déjà écarté trois sources lexicales sur cette
  question en campagne 5.

- **Leaflet**, mais pour ce qu'il fait bien : le pan, le zoom et le tactile.
  Sans `tileLayer`, il n'émet aucune requête réseau. Une bibliothèque dans notre
  bundle n'est pas un service extérieur — c'est toute la distinction, et elle
  seule permet de ne pas tout réécrire. Rendu en canvas : 1 605 polygones en SVG
  font ramer un téléphone d'entrée de gamme.

- **Points aux centroïdes** pour les villages qui portent une forme ; le
  maillage sert de fond. Pour un dictionnaire des parlers, ce maillage *dit*
  quelque chose, là où une carte routière n'est qu'un décor.
- Recherche d'un mot → les variantes s'affichent aux villages qui les revendiquent,
  une couleur par variante.
- **Les formes sans lieu ne vont jamais sur la carte.** Elles s'affichent
  au-dessus, en mobile-first : « personne n'a encore dit d'où ça vient ». La dette
  de données devient le moteur de contribution.
- Au lancement la carte n'est pas vide : **819 communes portent une forme
  attestée** et peuvent afficher leur nom alsacien dès le premier jour. (Le
  chiffre de 954 écrit ici jusqu'au 12/09 comptait des attestations, pas des
  communes rattachées — 249 noms ne désignent aucune commune actuelle, cf.
  `21-REPRISE.md`.)
- **Prototype en place** : `/carte` et `/sources`, sur données réelles. Il sert à
  trancher sur pièces — densité des points, lisibilité en mobile — pas à figurer
  l'écran final. Deux points restent à traiter avant qu'il ne le devienne : les
  819 villages sont envoyés d'un coup (127 Ko de HTML), et la couleur par
  variante est prévue par le composant (`couleurDe`) mais pas encore utilisée.

### 5. Contribution

- Sur un mot : « ça se dit autrement chez moi » → forme + village.
- Sur une variante existante : bouton **`+`**, qui attache le village du profil en
  un clic. Profil sans village → une modale le demande une fois, et le mémorise.
- Retirer son propre `+`, signaler une variante douteuse, éditer sa propre variante
  tant qu'elle est seule.
- Aucun vote contre, aucune suppression par les pairs.

## Tranché par défaut, à corriger si besoin

- **Créer un mot français absent** : le choix « circuit de contributions remplacé
  entièrement » ne laissait aucun moyen d'ajouter un mot hors des 25 778 lemmes.
  Réglé sans rouvrir un second formulaire — une recherche infructueuse propose
  « ajoute-le », et le même écran crée le lemme *et* sa première variante.
- **La modération masque, elle ne supprime pas** (`Variante.masquee`) : rien de ce
  qu'un membre a écrit n'est effacé de la base.

## Vérification

La règle de maison s'applique partout : **recompter en base, jamais croire le
rapport d'un script**. Elle a rattrapé une erreur à chacune des cinq campagnes.

- **Étape 1** — ✅ fait, `scripts/verifier-derivation.mts` relit la base et sort
  un code 1 si un contrôle échoue. 11 contrôles passent : 0 forme qu'aucun de ses
  témoins n'écrit sur 41 646 (règle 1), 27 179/27 179 attestations ayant produit
  une variante, 0 orpheline, 0 témoignage hybride, 0 ponctuation finale publiée,
  une commune = un lemme.

  **« Rejouée deux fois = même résultat » a failli être une promesse creuse.** La
  dérivation lisait les attestations par `id`, or les UUID sont tirés au hasard à
  l'import : quand deux attestations écrivent la même forme, celle qui créait la
  variante changeait d'un chargement à l'autre. Écart constaté entre la base
  locale et la production : **une variante à article sur 8 882**. Un chiffre
  qu'on pouvait mettre sur le compte du bruit, et qui était une vraie faille.
  Corrigé par un ordre de lecture stable **et** par une règle qui ne dépend
  d'aucun ordre (à forme égale, la variante porteuse de l'article l'emporte),
  puis vérifié en reconstruisant une base entièrement neuve.

  **Deux bases valent mieux qu'une** : sans le double chargement, le défaut
  restait invisible. C'est « recompter en base » appliqué à deux bases.
- **Étape 2** : connexion Odoo bout en bout, session qui survit à un redémarrage,
  app inaccessible sans cookie valide, et **un middleware qui ne fait aucun appel
  réseau** — à vérifier au chrono, pas à la lecture.
- **Étape 3** : les pages publiques ne rendent **que** villages et prénoms, y
  compris en appelant la Server Action directement avec un terme du lexique. Le
  filtre est serveur ; une barrière qui vit dans le navigateur n'en est pas une.
- **Étapes 4-5** : à l'écran, à trois largeurs (mobile ~390 px, tablette ~1024 px,
  desktop ~1320 px). La leçon du 29/08 — vérifier au-delà de la largeur du
  mockup — tient toujours.
- Avant chaque push : `tsc --noEmit` **puis** un vrai `next build`, après la
  dernière édition. Un `tsc` propre ne prouve pas qu'un build passe (PR #39 :
  commentaire JSX accepté par TS, rejeté par SWC).

## Points ouverts

- ~~Marqueur a~e sur le lexique~~ — ✅ mesuré le 12/09, **positif** :
  `22-MESURE-MARQUEUR-AE.md`.
- ~~Licences des deux jeux de données communes~~ — ✅ confirmées le 12/09 :
  **Licence Ouverte** pour les deux. Identité administrative INSEE (via
  `@etalab/decoupage-administratif` 6.0.0), contours IGN ADMIN EXPRESS COG
  millésime 2018. Usage commercial permis, mention de paternité obligatoire —
  portée par `/sources`.
- ~~Communes fusionnées depuis la source~~ — ✅ tranché le 12/09 : on s'en tient
  aux communes actuelles, 249 noms restent sans point (détail dans
  `21-REPRISE.md`).
- Auto-inscription du portail Odoo : à activer et tester.
- Aire linguistique du 57 : laissée nulle, à qualifier plus tard ou jamais.
- Gameplay : hors périmètre, à concevoir une fois la carte vivante.

### Ce que le prototype de carte laisse à trancher

- **Combien de villages envoyer d'un coup.** Les 819 font 127 Ko de HTML —
  tenable en desktop, discutable en mobile-first. L'écran final n'affichera
  probablement que les villages du mot cherché.
- **La densité des points.** 819 marqueurs tiennent en canvas, mais rien ne dit
  qu'ils se lisent. À juger à l'écran, pas au raisonnement.
- **Le fond est volontairement muet** (gris clair sur blanc) pour que les points
  ne s'y noient pas. Deux valeurs à changer dans `carte-parlers.tsx` s'il est
  trop pâle ou trop présent.
