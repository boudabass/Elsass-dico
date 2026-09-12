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
des attestations. **Faire un dump SQL complet avant la bascule.**

## Étapes

### 1. Socle données — *en cours*

- Conteneur **Postgres 18** sur Coolify (vérifier l'image ; se rabattre sur 17 au
  besoin).
- `prisma/schema.prisma`, et **`prisma migrate deploy` au démarrage du conteneur**.
  Ça tue la classe de bugs qui a frappé trois fois : migration passée à la main
  dans le SQL Editor, oubliée, invisible jusqu'à la première écriture (09/08,
  10/08, 23/08).
- **Référentiel communes** — ✅ **fait**, cf. `data/communes/`.
- **Script de dérivation** `scripts/deriver.ts` : `attestations` → `Lemme` /
  `Variante` / `Temoignage`. Réutilise `scinderSynonymes()` et `cleDeForme()` tels
  quels. Les 954 toponymes se joignent aux communes **par nom exact**, jamais
  approché — un doute se signale (règle 3 du contrat `data/`).
- Dump SQL complet de l'existant.

**Mesure à faire ici, pas avant** : le marqueur a~e (finale `-a`, digrammes
`ia`/`ua`) n'a jamais été mesuré sur les 23 851 mots du lexique, seulement sur les
toponymes. Il dira si le lexique écrit peut teinter une zone sur la carte. Une
heure de travail, **et le résultat peut être négatif** — comme le 04/09, où la même
mesure préalable avait annulé un chantier entier.

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

- **Leaflet + tuiles OpenStreetMap** : ~40 Ko contre 200+ pour MapLibre GL, et les
  tuiles viennent d'un CDN — zéro charge serveur, ce qui compte ici.
- **Points aux centroïdes, pas des polygones** : 1 605 communes en contours GeoJSON
  pèsent plusieurs Mo, indéfendable en mobile-first.
- Recherche d'un mot → les variantes s'affichent aux villages qui les revendiquent,
  une couleur par variante.
- **Les formes sans lieu ne vont jamais sur la carte.** Elles s'affichent
  au-dessus, en mobile-first : « personne n'a encore dit d'où ça vient ». La dette
  de données devient le moteur de contribution.
- Au lancement la carte n'est pas vide : les **954 toponymes attestés sont des
  communes**, chacune peut afficher son nom alsacien dès le premier jour.

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

- **Étape 1** : comptages par type et par source ; 0 forme dérivée qui ne soit un
  fragment contigu d'une attestation (règle 1) ; dérivation rejouée deux fois =
  même résultat.
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

- Marqueur a~e sur le lexique : à mesurer à l'étape 1, peut ne rien donner.
- Auto-inscription du portail Odoo : à activer et tester.
- Aire linguistique du 57 : laissée nulle, à qualifier plus tard ou jamais.
- Licences des deux jeux de données communes : à confirmer avant publication.
- Gameplay : hors périmètre, à concevoir une fois la carte vivante.
