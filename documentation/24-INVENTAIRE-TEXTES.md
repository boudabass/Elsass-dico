# Inventaire des textes de l'app

- **Date du relevé** : 08/10/2026
- **Commit de dev lu** : b71a937 (`git rev-parse --short HEAD`)
- **Périmètre** : `src/app/**` (pages, composants locaux, actions, routes API),
  `src/components/**` (y compris `contribution/`), et `src/components/ui/**` pour
  les seuls textes français en dur. Les commentaires de code, les logs et les
  noms de variables sont exclus.
- **Lecture seule** : aucun fichier source modifié, aucun commit.

## Conventions

- **Texte exact** : copié tel quel. Une partie dynamique s'écrit `{variable}`.
  Les variantes conditionnelles sont sur des lignes séparées.
- **Visible par** : `invité`, `membre`, `admin` ou `tous`.
- **Un texte réutilisé** est décrit une seule fois, puis « voir #n » ailleurs.
- **Colonne `!`** : drapeaux mécaniques, vides sinon.
  - `TIRET` : contient « — ».
  - `VOUS` : vouvoiement (vous, votre, vos).
  - `INTERNE` : contient un des mots suivants : forme, formes, variante, lemme,
    attester, attesté, attestation, témoin, témoignage, « ce qui fonde »,
    source(s) au sens technique, géolocalisation.
  - `ANGLAIS` : texte en anglais.
  - `U202F` : nombre formaté sans remplacement de l'espace fine.

## Décompte

- **Lignes du tableau** : 577, dont 10 renvois (texte décrit ailleurs ou composant).
- **Par écran** (sommes exactes) :

| Écran ou bloc | Lignes |
|---|---|
| `/` accueil publique | 45 |
| `/jeu` (accueil, partie, bilan, partage) | 81 |
| `/login` | 15 |
| `/village/[slug]` | 13 |
| `/prenom/[slug]` | 8 |
| `/sources` | 15 |
| En-tête, navigation, inverseur (membre) | 22 |
| `/dashboard` (Mon espace) | 42 |
| `/recherche` | 18 |
| `/dictionnaire` | 19 |
| `/entree/[id]` | 19 |
| `/entree/[id]/signaler` | 15 |
| `/forme` | 10 |
| `/profile` (redirection) | 1 |
| `/carte` | 33 |
| Contribution et « Chez moi aussi » (composants) | 87 |
| `/admin` | 26 |
| `/admin/mots` | 10 |
| `/admin/signalements` | 9 |
| `/admin/sources` | 13 |
| Messages renvoyés par les actions | 33 |
| Composants partagés et libellés | 35 |
| Transversal (erreurs, introuvable, métadonnées) | 8 |
| **Total** | **577** |

- **Drapeaux mécaniques** (colonne « ! ») :
  - `INTERNE` : 80
  - `ANGLAIS` : 3 (page introuvable et erreur serveur, textes par défaut de Next.js, non vérifiés à l'écran)
  - `U202F` : 1 (population de la fiche village, `src/app/village/[slug]/page.tsx:75`)
  - `TIRET` : 0 (les deux tirets longs trouvés dans le code sont dans un commentaire et une regex, pas dans du texte affiché)
  - `VOUS` : 0

- **Fichiers du périmètre** : 120, dont 64 avec au moins un texte relevé et 56 à zéro (voir la table en fin de document).

## Limites du relevé

- **Relevé dans le code**, pas à l'écran. Les textes conditionnels sont décrits
  avec leur condition ; les textes issus de la base (noms de sources, villages,
  mots) sont décrits comme données, pas recopiés.
- **Pas de capture** : les états d'erreur et de chargement n'ont pas été vus.
- **Relevé par lecture ciblée** pour les fichiers longs (`feuille-contribution.tsx`,
  `dictionnaire/page.tsx`, `habillage.tsx`) : chaque ligne à texte a été repérée
  par extraction, mais quelques libellés de branches secondaires peuvent manquer.
  À confirmer par le tri.
- **Pages introuvables et erreur serveur** : le texte affiché par Next.js n'est
  pas dans le dépôt ; il est noté comme non vérifié.
- **Composants `ui` inutilisés** (39 fichiers) : ils contiennent des textes
  anglais (« Close », « Toggle Sidebar », « Previous slide »…) mais ne sont importés
  par aucun écran. Ils ne sont pas comptés.

## / : accueil publique

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | En-tête | texte | Elsass Dico | invité | src/app/page.tsx:50 | |
| 2 | En-tête | lien | Se connecter | invité | src/app/page.tsx:55 | |
| 3 | Ouverture | titre | L'alsacien, village par village | invité | src/app/page.tsx:64-65 | |
| 4 | Ouverture | texte | L'alsacien ne se dit pas pareil d'un village à l'autre. Ici, on garde toutes les façons de le dire. Rien n'est inventé : chaque mot vient d'un dictionnaire ou d'un Alsacien qui le parle. | invité | src/app/page.tsx:68-70 | |
| 5 | Porte Défi | titre | Défi du jour | invité | src/app/page.tsx:80 | |
| 6 | Porte Défi | texte | n° {numero} | invité | src/app/page.tsx:81 | |
| 7 | Porte Défi | texte | {NB_MANCHES} questions à la suite | invité | src/app/page.tsx:84 | |
| 8 | Porte Défi, aperçu | a11y | Quel village dit : | invité | src/app/page.tsx:89 (sr-only) | |
| 9 | Porte Défi, aperçu | texte | {formes de la manche, séparées par « · »} | invité | src/app/page.tsx:94-99 | |
| 10 | Porte Défi, aperçu | texte | Quel village dit ça ? | invité | src/app/page.tsx:102 (aria-hidden) | |
| 11 | Porte Défi, aperçu | texte | {nom du village, une ligne par choix} | invité | src/app/page.tsx:110 | |
| 12 | Porte Défi, sans manche | texte | On te montre un mot alsacien, tu devines de quel village il vient. | invité | src/app/page.tsx:117 | |
| 13 | Porte Défi | bouton | Jouer | invité | src/app/page.tsx:122 | |
| 14 | Porte Dictionnaire | titre | Participer au dictionnaire | invité | src/app/page.tsx:131 | |
| 15 | Porte Dictionnaire | texte | Gratuit, avec un compte The Elsassisch | invité | src/app/page.tsx:133 | |
| 16 | Porte Dictionnaire | texte | {nombre(nbMots)} mots | invité | src/app/page.tsx:138 | |
| 17 | Porte Dictionnaire | texte | Cherche n'importe quel mot, regarde sur la carte où on le dit, et ajoute la façon dont on le dit chez toi. | invité | src/app/page.tsx:141-142 | |
| 18 | Porte Dictionnaire | bouton | Créer mon compte | invité | src/app/page.tsx:147 | |
| 19 | Recherche | titre | Ton village, ton prénom en alsacien | invité | src/app/page.tsx:156 | |
| 20 | Recherche | texte | Tape-le ici, pas besoin de compte. | invité | src/app/page.tsx:158 | |
| 21 | Recherche (composant RechercheAccueil) | placeholder | Un village, un prénom… | invité | src/app/recherche-accueil.tsx:94 | |
| 22 | Recherche (composant RechercheAccueil) | a11y | Chercher un village ou un prénom | invité | src/app/recherche-accueil.tsx:91 (label du champ) | |
| 23 | Section compte | titre | Connecte-toi pour découvrir tout le dictionnaire | invité | src/app/page.tsx:170 | |
| 24 | Section compte | texte | Et aide à sauvegarder la façon dont on parle dans ton village. Voici ce que tu trouveras une fois connecté. | invité | src/app/page.tsx:173-174 | |
| 25 | Carte aperçu | a11y | Carte de l'Alsace et de la Moselle, avec un point pour chacun des {nbVillages} villages dont on connaît le nom en alsacien. | invité | src/app/page.tsx:295 | |
| 26 | Carte aperçu | titre | La carte des parlers | invité | src/app/page.tsx:184 | |
| 27 | Carte aperçu | texte | Chaque point est un village dont on connaît le nom en alsacien : il y en a déjà {nombre(nbVillages)}. Une fois connecté, tape un mot et regarde dans quels villages on le dit de telle ou telle façon. | invité | src/app/page.tsx:186-188 | |
| 28 | Dictionnaire aperçu | titre | Le dictionnaire : {nombre(nbMots)} mots | invité | src/app/page.tsx:196 | |
| 29 | Dictionnaire aperçu | texte | Cherche un mot ou feuillette-le de A à Z. Pour chaque mot, tu vois toutes les façons de le dire et d'où elles viennent. Aucune n'est « la bonne ». | invité | src/app/page.tsx:199-201 | |
| 30 | Dictionnaire aperçu, exemple | texte | {francais de l'exemple} | invité | src/app/page.tsx:206 | |
| 31 | Dictionnaire aperçu, exemple | texte | {forme alsacienne} | invité | src/app/page.tsx:215 | |
| 32 | Dictionnaire aperçu, exemple | pastille | {nbSources} source{s} | invité | src/components/badge-confiance.tsx:44 | INTERNE |
| 33 | Dictionnaire aperçu, exemple | pastille | {nbVillages} village{s} | invité | src/components/badge-confiance.tsx:52 | |
| 34 | Dictionnaire aperçu, exemple | pastille, sans source ni village | Sans témoin | invité | src/components/badge-confiance.tsx:59 | INTERNE |
| 35 | Pastille source (infobulle) | a11y | Une source / Deux sources / Trois sources ou plus | invité | src/lib/dictionnaire.ts:187-189 (title) | INTERNE |
| 36 | Pastille village (infobulle) | a11y | {n} village(s) revendique(nt) cette forme | invité | src/components/badge-confiance.tsx:49 (title) | INTERNE |
| 37 | Sauvegarde | titre | Sauvegarde le parler de ton village | invité | src/app/page.tsx:226 | |
| 38 | Sauvegarde | texte | Indique d'où tu viens. Quand un mot se dit comme chez toi, un clic suffit pour le confirmer. Quand on le dit autrement, ajoute ta version. Que tu parles alsacien depuis toujours ou que tu l'apprennes, tout le monde peut participer. | invité | src/app/page.tsx:228-231 | |
| 39 | Mots du quotidien | titre | Quelques mots de tous les jours | invité | src/app/page.tsx:241 | |
| 40 | Mots du quotidien | texte | {mot français} | invité | src/app/page.tsx:248 | |
| 41 | Mots du quotidien | texte | {forme alsacienne} | invité | src/app/page.tsx:252 | |
| 42 | Mots du quotidien | pastille | (voir #32 et #33, mêmes pastilles) | invité | src/components/badge-confiance.tsx | |
| 43 | Bas de page | bouton | Jouer le défi du jour | invité | src/app/page.tsx:269 | |
| 44 | Bas de page | bouton | Créer mon compte | invité | src/app/page.tsx:275 | |
| 45 | Pied | lien | Sources et licences | invité | src/app/page.tsx:281 | |

Compte de l'écran `/` : 45 textes (dont 2 « voir #n » sans texte propre : #42 et #44).

## /jeu : jeu (accueil, partie, bilan, partage)

Les textes des composants partagés (`CarteParlers`, `AppHeader`, `BoutonChezMoi`,
`BoutonContribuer`, libellés de département) sont dans la section transversale
« Composants partagés ».

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | Métadonnées (page) | metadata | Le défi du jour | tous | src/app/jeu/page.tsx:38 | |
| 2 | Métadonnées (page) | metadata | Un nom en alsacien, 4 réponses en français : trouve la bonne. Un nouveau défi chaque jour. | tous | src/app/jeu/page.tsx:13 | |
| 3 | Métadonnées, aperçu de lien | metadata | Le défi du jour n° {n} : {score}/{NB_MANCHES} (si résultat partagé) | tous | src/app/jeu/page.tsx:35 | |
| 4 | Métadonnées, aperçu de lien | metadata | Le défi du jour (sans résultat) | tous | src/app/jeu/page.tsx:35 | |
| 5 | Image de partage | texte dans l'image | Le défi du jour | tous | src/app/api/partage/defi/route.tsx:85-86 | |
| 6 | Image de partage | texte dans l'image | n° {numero} | tous | src/app/api/partage/defi/route.tsx:86 | |
| 7 | Image de partage, avec résultat | texte dans l'image | {score}/{total} | tous | src/app/api/partage/defi/route.tsx:99-101 | |
| 8 | Image de partage, avec résultat | texte dans l'image | village{s} trouvé{s} | tous | src/app/api/partage/defi/route.tsx:102 | |
| 9 | Image de partage, sans résultat | texte dans l'image | Un nom en alsacien, 4 réponses en français. Trouve la bonne ! | tous | src/app/api/partage/defi/route.tsx:116-117 | |
| 10 | Image de partage | texte dans l'image | À toi de jouer → | tous | src/app/api/partage/defi/route.tsx:126 | |
| 11 | Image de partage | texte dans l'image | elsass-dico.theelsassisch.com/jeu | tous | src/app/api/partage/defi/route.tsx:37,127 | |
| 12 | En-tête | titre | Jeu | tous | src/app/jeu/ecran-jeu.tsx:105,107 | |
| 13 | Accueil | titre | Le défi du jour | tous | src/app/jeu/ecran-jeu.tsx:157 | |
| 14 | Accueil | texte | Le jeu te montre un nom en alsacien. Tu as 4 réponses en français : à toi de trouver la bonne. | tous | src/app/jeu/ecran-jeu.tsx:163 | |
| 15 | Carte du défi | titre | Défi n° {numero} | tous | src/app/jeu/ecran-jeu.tsx:172 | |
| 16 | Carte du défi, série | texte | {serie} jour{s} de suite | membre | src/app/jeu/ecran-jeu.tsx:177 | |
| 17 | Carte du défi, défi terminé | texte | Tu as trouvé {n} village{s} sur {total}. Le prochain défi arrive demain. | tous | src/app/jeu/ecran-jeu.tsx:186-190 | |
| 18 | Carte du défi, défi en cours | texte | Ta partie t'attend à la manche {manche} sur 5. | tous | src/app/jeu/ecran-jeu.tsx:201 | |
| 19 | Carte du défi, défi non commencé | texte | Aujourd'hui, 5 villages à retrouver. Le même défi pour tout le monde. | tous | src/app/jeu/ecran-jeu.tsx:202 | |
| 20 | Carte du défi | bouton | Reprendre le défi | tous | src/app/jeu/ecran-jeu.tsx:213 | |
| 21 | Carte du défi | bouton | Jouer le défi du jour | tous | src/app/jeu/ecran-jeu.tsx:214 | |
| 22 | Carte du défi, pendant chargement | bouton | Chargement… | tous | src/app/jeu/ecran-jeu.tsx:211 | |
| 23 | Accueil, invité | section | Encart de compte (même texte que #64 à #68 du bilan) | invité | src/app/jeu/ecran-jeu.tsx:222 | |
| 24 | Accueil, membre | titre | Partie libre | membre | src/app/jeu/ecran-jeu.tsx:226 | |
| 25 | Accueil, membre | texte | Autant de parties que tu veux, tirées au hasard. Elles ne comptent pas dans ta série. | membre | src/app/jeu/ecran-jeu.tsx:229-230 | |
| 26 | Accueil, membre | bouton | Lancer une partie libre | membre | src/app/jeu/ecran-jeu.tsx:238 | |
| 27 | Accueil, membre | bouton | Chargement… | membre | src/app/jeu/ecran-jeu.tsx:238 | |
| 28 | Erreur de lancement | erreur | (message renvoyé par commencerPartieAction ou commencerDefiInviteAction, affiché en toast : voir section Actions du jeu) | tous | src/app/jeu/ecran-jeu.tsx:147 | |
| 29 | Partie, en-tête | texte | Défi n° {numero} | tous | src/app/jeu/partie.tsx:73 | |
| 30 | Partie, en-tête | texte | Partie libre | tous | src/app/jeu/partie.tsx:73 | |
| 31 | Partie, en-tête | texte | Manche {n} sur {total} | tous | src/app/jeu/partie.tsx:76 | |
| 32 | Partie, en-tête | bouton | Quitter | tous | src/app/jeu/partie.tsx:84 | |
| 33 | Progression | a11y | Progression (aria-label) | tous | src/app/jeu/partie.tsx:113 | |
| 34 | Progression | a11y | Manche {n} : trouvée | tous | src/app/jeu/partie.tsx:129-130 | |
| 35 | Progression | a11y | Manche {n} : manquée | tous | src/app/jeu/partie.tsx:130 | |
| 36 | Progression | a11y | Manche {n} : en cours | tous | src/app/jeu/partie.tsx:130 | |
| 37 | Progression | a11y | Manche {n} : à venir | tous | src/app/jeu/partie.tsx:130 | |
| 38 | Manche, question | a11y | Nom alsacien : | tous | src/app/jeu/partie.tsx:204 (sr-only) | |
| 39 | Manche, question | titre | {formes du village, séparées par « · »} | tous | src/app/jeu/partie.tsx:209-214 | |
| 40 | Manche, question | texte | Quel est le nom français de ce village ? | tous | src/app/jeu/partie.tsx:217 | |
| 41 | Manche, choix | bouton | {nom du village proposé} | tous | src/app/jeu/partie.tsx:270 | |
| 42 | Manche, choix | texte | {département du village proposé} | tous | src/app/jeu/partie.tsx:272 | |
| 43 | Manche, révélation | texte | Bien vu, c'est {village} ({département}). | tous | src/app/jeu/partie.tsx:326-328 | |
| 44 | Manche, révélation | texte | Raté, c'était {village} ({département}). | tous | src/app/jeu/partie.tsx:326-328 | |
| 45 | Manche, révélation | texte | {n} forme{s} : | tous | src/app/jeu/partie.tsx:334 | INTERNE |
| 46 | Manche, révélation | texte | {forme alsacienne} | tous | src/app/jeu/partie.tsx:341 | |
| 47 | Manche, révélation | pastille | (BadgeConfiance : voir composants partagés) | tous | src/app/jeu/partie.tsx:343 | |
| 48 | Manche, révélation | texte | {noms des sources, séparés par une virgule} | tous | src/app/jeu/partie.tsx:347 | |
| 49 | Manche, révélation | lien | Voir la fiche de {village} | tous | src/app/jeu/partie.tsx:363 | |
| 50 | Manche, révélation | bouton | Manche suivante | tous | src/app/jeu/partie.tsx:290 | |
| 51 | Manche, révélation | bouton | Voir le bilan | tous | src/app/jeu/partie.tsx:290 | |
| 52 | Erreur de réponse | erreur | (message renvoyé par repondreAction ou repondreInviteAction, affiché en toast : voir section Actions du jeu) | tous | src/app/jeu/partie.tsx:166 | |
| 53 | Bilan | texte | Défi n° {numero} | tous | src/app/jeu/bilan.tsx:41 | |
| 54 | Bilan | texte | Partie libre | tous | src/app/jeu/bilan.tsx:41 | |
| 55 | Bilan | titre | {score} village{s} sur {total} | tous | src/app/jeu/bilan.tsx:47 | |
| 56 | Bilan, cases | a11y | Manche {n} trouvée | tous | src/app/jeu/bilan.tsx:131 (sr-only) | |
| 57 | Bilan, cases | a11y | Manche {n} manquée | tous | src/app/jeu/bilan.tsx:131 (sr-only) | |
| 58 | Bilan, liste | a11y | Trouvé | tous | src/app/jeu/bilan.tsx:62 (aria-label) | |
| 59 | Bilan, liste | a11y | Manqué | tous | src/app/jeu/bilan.tsx:64 (aria-label) | |
| 60 | Bilan, liste | texte | {formes de la manche, séparées par « · »} | tous | src/app/jeu/bilan.tsx:68 | |
| 61 | Bilan, liste | texte | {nom du village} | tous | src/app/jeu/bilan.tsx:70 | |
| 62 | Bilan | bouton | Partager mon résultat | tous | src/app/jeu/partage.tsx:416 | |
| 63 | Bilan | bouton | Terminer la partie | tous | src/app/jeu/bilan.tsx:84 | |
| 64 | Bilan, invité | titre | Avec un compte The Elsassisch | invité | src/app/jeu/bilan.tsx:100 | |
| 65 | Bilan, invité | texte | Tu accèdes au dictionnaire, à la carte et tu joues autant que tu veux. Surtout, tu peux contribuer à la sauvegarde de l'alsacien, là où il se parle et comment il se parle. | invité | src/app/jeu/bilan.tsx:103 | |
| 66 | Bilan, invité | bouton | Créer mon compte | invité | src/app/jeu/bilan.tsx:110 | |
| 67 | Bilan, invité | bouton | Me connecter | invité | src/app/jeu/bilan.tsx:116 | |
| 68 | Bilan, invité | texte | Le compte se crée sur theelsassisch.com. Reviens ensuite ici et connecte-toi avec le même email et le même mot de passe. | invité | src/app/jeu/bilan.tsx:120 | |
| 69 | Bilan, membre | titre | Pour finir : comment dis-tu ce mot dans ton village ? | membre | src/app/jeu/bilan.tsx:156 | |
| 70 | Bilan, membre | texte | Si tu le dis comme l'une de ces façons, clique sur « Chez moi aussi ». Sinon, ajoute la tienne. C'est facultatif et ça ne compte pas dans le score. | membre | src/app/jeu/bilan.tsx:165-167 | |
| 71 | Bilan, membre | texte | {mot français} | membre | src/app/jeu/bilan.tsx:170 | |
| 72 | Bilan, membre | texte | {forme alsacienne} | membre | src/app/jeu/bilan.tsx:176 | |
| 73 | Bilan, membre | bouton | (BoutonChezMoi : « Chez moi aussi » et variantes, voir composants contribution) | membre | src/app/jeu/bilan.tsx:178 | |
| 74 | Bilan, membre | bouton | (BoutonContribuer : voir composants contribution) | membre | src/app/jeu/bilan.tsx:182 | |
| 75 | Partage, texte envoyé | texte | The Elsassisch · Le défi du jour n° {numero} | tous | src/app/jeu/partage.tsx:392 | |
| 76 | Partage, texte envoyé | texte | {score}/{total} village{s} trouvé{s} | tous | src/app/jeu/partage.tsx:393 | |
| 77 | Partage, texte envoyé | texte | {suite de cases vertes ou blanches} | tous | src/app/jeu/partage.tsx:394 | |
| 78 | Partage, texte envoyé | texte | À toi de jouer : {lien} | tous | src/app/jeu/partage.tsx:396 | |
| 79 | Partage, toast | confirmation | Texte copié. Colle-le dans un message pour le partager. | tous | src/app/jeu/partage.tsx:404 | |
| 80 | Partage, toast | erreur | La copie a échoué. Réessaie. | tous | src/app/jeu/partage.tsx:405 | |
| 81 | Partage, toast | erreur | Le partage a échoué. Réessaie. | tous | src/app/jeu/partage.tsx:422 | |

Compte de l'écran `/jeu` : 81 lignes (dont des renvois « voir »).

## /login : connexion

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | En-tête | titre | Connexion | invité | src/app/login/page.tsx:46 (AppHeader, titre de l'en-tête) | |
| 2 | Contenu | texte | Elsass Dico | invité | src/app/login/page.tsx:49 | |
| 3 | Contenu | titre | Connecte-toi | invité | src/app/login/page.tsx:51 | |
| 4 | Contenu | texte | Avec ton compte The Elsassisch, le même que sur le site. | invité | src/app/login/page.tsx:54 | |
| 5 | Formulaire | libellé | Adresse email | invité | src/app/login/page.tsx:60 | |
| 6 | Formulaire | placeholder | toi@example.com | invité | src/app/login/page.tsx:68 | |
| 7 | Formulaire | libellé | Mot de passe | invité | src/app/login/page.tsx:75 | |
| 8 | Formulaire | placeholder | •••••••• | invité | src/app/login/page.tsx:83 | |
| 9 | Formulaire | bouton | Se connecter | invité | src/app/login/page.tsx:95 | |
| 10 | Séparation | texte | ou | invité | src/app/login/page.tsx:99 | |
| 11 | Séparation | bouton | Créer un compte | invité | src/app/login/page.tsx:105 | |
| 12 | Bas de page | texte | En continuant, tu acceptes nos | invité | src/app/login/page.tsx:109 | |
| 13 | Bas de page | lien | conditions générales d'utilisation | invité | src/app/login/page.tsx:116 | |
| 14 | Bas de page | texte | . | invité | src/app/login/page.tsx:118 | |
| 15 | Erreur de connexion | erreur | (message renvoyé par connexionAction, affiché en toast : voir section Actions d'authentification) | invité | src/app/login/page.tsx:35 | |

Compte de l'écran `/login` : 15 lignes.

## /village/[slug] : fiche publique d'un village

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | Métadonnées, sans forme | metadata | {Village} · Elsass Dico | tous | src/app/village/[slug]/page.tsx:36 | |
| 2 | Métadonnées, sans forme | metadata | {Village} ({département}) n'a pas encore de nom alsacien dans Elsass Dico. | tous | src/app/village/[slug]/page.tsx:37 | |
| 3 | Métadonnées, avec forme | metadata | {Village} ({première forme}) · Elsass Dico | tous | src/app/village/[slug]/page.tsx:47 | |
| 4 | Métadonnées, avec forme | metadata | {Village} ({département}) en alsacien : {trois formes}. Chaque forme avec ses sources et ses villages. | tous | src/app/village/[slug]/page.tsx:49 | INTERNE |
| 5 | Métadonnées, sans forme | metadata | {Village} ({département}) dans Elsass Dico. | tous | src/app/village/[slug]/page.tsx:50 | |
| 6 | En-tête de fiche | texte | {département} | tous | src/app/village/[slug]/page.tsx:70 | |
| 7 | En-tête de fiche | titre | {Village} | tous | src/app/village/[slug]/page.tsx:72 | |
| 8 | En-tête de fiche | texte | {population} habitants | tous | src/app/village/[slug]/page.tsx:75 | U202F |
| 9 | Formes | titre | Nom alsacien ou Noms alsaciens (selon le nombre de formes) | tous | src/app/village/[slug]/page.tsx:83 | |
| 10 | Formes | (composant) | Cartes de variante : voir composant CarteVariante dans la section transversale | tous | src/app/village/[slug]/page.tsx:87 | |
| 11 | Sans forme | texte | Personne n'a encore proposé de nom alsacien pour {Village}. | tous | src/app/village/[slug]/page.tsx:95 | |
| 12 | Pied | lien | Sources et licences | tous | src/app/village/[slug]/page.tsx:103 | |
| 13 | Invitation | (composant) | Bloc InvitationPublique : voir composants partagés | tous | src/app/village/[slug]/page.tsx:99 | |

Compte de l'écran `/village/[slug]` : 13 lignes (dont 2 renvois vers les composants).

## /prenom/[slug] : fiche publique d'un prénom

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | Métadonnées, avec forme | metadata | {Prénom} ({première forme}) · Elsass Dico | tous | src/app/prenom/[slug]/page.tsx:30 | |
| 2 | Métadonnées, avec forme | metadata | Le prénom {Prénom} en alsacien : {trois formes}. Chaque forme avec ses sources et ses villages. | tous | src/app/prenom/[slug]/page.tsx:32 | INTERNE |
| 3 | Métadonnées, sans forme | metadata | Le prénom {Prénom} dans Elsass Dico. | tous | src/app/prenom/[slug]/page.tsx:33 | |
| 4 | En-tête de fiche | texte | Prénom | tous | src/app/prenom/[slug]/page.tsx:49 | |
| 5 | En-tête de fiche | titre | {Prénom} | tous | src/app/prenom/[slug]/page.tsx:50 | |
| 6 | Formes | (composant) | Cartes de variante : voir composant CarteVariante | tous | src/app/prenom/[slug]/page.tsx:56 | |
| 7 | Invitation | (composant) | Bloc InvitationPublique : voir composants partagés | tous | src/app/prenom/[slug]/page.tsx:61 | |
| 8 | Pied | lien | Sources et licences | tous | src/app/prenom/[slug]/page.tsx:65 | |

Compte de l'écran `/prenom/[slug]` : 8 lignes (dont 2 renvois vers les composants).

## /sources : sources et licences

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | Métadonnées | metadata | Sources | tous | src/app/sources/page.tsx:15 | |
| 2 | En-tête | titre | Sources | tous | src/app/sources/page.tsx:29 | |
| 3 | En-tête | texte | Toute forme alsacienne affichée par ce dictionnaire est copiée d'une de ces sources, ou proposée par un locuteur qui dit d'où vient son parler. Aucune n'est inventée. | tous | src/app/sources/page.tsx:31-33 | INTERNE |
| 4 | Sources écrites | titre | Sources écrites | tous | src/app/sources/page.tsx:38 | INTERNE |
| 5 | Sources écrites, liste | texte | {nom de la source, sans tiret long} (donnée de base, chargée depuis la table des sources) | tous | src/app/sources/page.tsx:43 | |
| 6 | Sources écrites, liste | texte | {nombre d'entrées} entrées | tous | src/app/sources/page.tsx:45 | |
| 7 | Sources écrites, liste | lien | {adresse de la source} | tous | src/app/sources/page.tsx:55 | |
| 8 | Sources écrites, liste | texte | {année} · {licence de la source} | tous | src/app/sources/page.tsx:60 | |
| 9 | Données géographiques | titre | Données géographiques | tous | src/app/sources/page.tsx:69 | |
| 10 | Communes | texte | Communes d'Alsace-Moselle | tous | src/app/sources/page.tsx:72 | |
| 11 | Communes | texte | Identité administrative des 1 605 communes : code INSEE, nom, département, codes postaux, population. | tous | src/app/sources/page.tsx:74-75 | |
| 12 | Communes | texte | Source : INSEE, Code Officiel Géographique, via @etalab/decoupage-administratif 6.0.0, sous Licence Ouverte. | tous | src/app/sources/page.tsx:78-80 | INTERNE |
| 13 | Contours | texte | Contours et points des communes | tous | src/app/sources/page.tsx:84 | |
| 14 | Contours | texte | Le fond de carte et le point de chaque village. Les contours sont simplifiés et hébergés par nous : la carte ne fait aucun appel à un service extérieur. | tous | src/app/sources/page.tsx:86-88 | |
| 15 | Contours | texte | Source : IGN, ADMIN EXPRESS COG, millésime 2018, sous Licence Ouverte. | tous | src/app/sources/page.tsx:91 | INTERNE |

Compte de l'écran `/sources` : 15 lignes. Les lignes 5 à 8 sont alimentées par la base : leur texte réel dépend des données.

## Écrans connectés : en-tête, navigation, inverseur de sens (transversal, membre)

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | En-tête (sans titre) | texte | Elsass Dico | membre | src/components/app-header.tsx:147 | |
| 2 | En-tête | titre | {titre de la page} (variable, voir chaque écran) | membre | src/components/app-header.tsx:145,182,202 | |
| 3 | En-tête | a11y | Retour (aria-label du bouton retour) | membre | src/components/app-header.tsx:135,141,163,179,194,198 | |
| 4 | En-tête (écran modal) | a11y | Fermer (aria-label, quand leading="fermer") | membre | src/components/app-header.tsx:163 | |
| 5 | En-tête mobile | a11y | Mon espace (aria-label de l'icône de compte) | membre | src/components/app-header.tsx:112 | |
| 6 | Navigation | a11y | Navigation (aria-label des deux barres de navigation) | membre | src/components/app-nav-shell.tsx:91,120 | |
| 7 | Rail (tablette, bureau) | lien | Recherche | membre | src/components/app-nav-shell.tsx:42 | |
| 8 | Rail (tablette, bureau) | lien | Dictionnaire | membre | src/components/app-nav-shell.tsx:43 | |
| 9 | Rail (tablette, bureau) | lien | Carte | membre | src/components/app-nav-shell.tsx:44 | |
| 10 | Rail (tablette, bureau) | lien | Jeu | membre | src/components/app-nav-shell.tsx:47 | |
| 11 | Rail (tablette, bureau) | lien | Mon espace | membre | src/components/app-nav-shell.tsx:48 | |
| 12 | Rail et barre mobile | lien | Admin (seulement si rôle admin) | admin | src/components/app-nav-shell.tsx:63 | |
| 13 | Barre mobile | lien | Recherche / Dictionnaire / Carte / Jeu / Admin (mêmes libellés que #7 à #10 et #12, sans « Mon espace ») | membre | src/components/app-nav-shell.tsx:137 | |
| 14 | Inverseur de sens | a11y | Sens du dictionnaire (aria-label du groupe) | membre | src/components/inverseur-sens.tsx:33 | |
| 15 | Inverseur de sens | bouton | Français | membre | src/components/inverseur-sens.tsx:43 | |
| 16 | Inverseur de sens | bouton | Alsacien | membre | src/components/inverseur-sens.tsx:73 | |
| 17 | Inverseur de sens | a11y | Inverser : chercher depuis l'alsacien (aria-label, quand le sens est français vers alsacien) | membre | src/components/inverseur-sens.tsx:49 | |
| 18 | Inverseur de sens | a11y | Inverser : chercher depuis le français (aria-label, dans l'autre sens) | membre | src/components/inverseur-sens.tsx:49 | |
| 19 | Inverseur de sens | a11y | Du français vers l'alsacien (annonce, role status) | membre | src/components/inverseur-sens.tsx:77 | |
| 20 | Inverseur de sens | a11y | De l'alsacien vers le français (annonce, role status) | membre | src/components/inverseur-sens.tsx:77 | |
| 21 | Métadonnées (layout racine) | metadata | Elsass Dico · Traducteur français-alsacien | tous | src/app/layout.tsx:34 | |
| 22 | Métadonnées (layout racine) | metadata | Le français-alsacien, village par village : tiré de sources écrites et des Alsaciens qui le parlent, jamais une traduction inventée. Un projet de The Elsassisch. | tous | src/app/layout.tsx:35-36 | INTERNE |

Compte : 22 lignes.

## /dashboard : Mon espace

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | Invité | texte | Connecte-toi pour accéder à ton espace. | invité | src/app/dashboard/page.tsx:61 | |
| 2 | Invité | bouton | Se connecter | invité | src/app/dashboard/page.tsx:67 | |
| 3 | En-tête | titre | Mon espace | membre | src/app/dashboard/page.tsx:53 | |
| 4 | Identité | titre | {nom, ou adresse email si pas de nom} | membre | src/app/dashboard/page.tsx:178 | |
| 5 | Identité | pastille | Admin (avec icône de bouclier) | admin | src/app/dashboard/page.tsx:197 | |
| 6 | Identité | pastille | Membre | membre | src/app/dashboard/page.tsx:203 | |
| 7 | Identité | texte | {nom du village} (avec icône de repère) | membre | src/app/dashboard/page.tsx:183-185 | |
| 8 | Premiers pas | titre | Fais entrer ton village dans le dico | membre | src/app/dashboard/premiers-pas.tsx:41 | |
| 9 | Premiers pas | texte | Deux gestes. Chaque forme que tu reconnais porte ensuite ton village, et ton village apparaît sur la carte de ce mot. | membre | src/app/dashboard/premiers-pas.tsx:44-45 | INTERNE |
| 10 | Premiers pas, étape 1 | titre | D'où vient ton alsacien ? | membre | src/app/dashboard/premiers-pas.tsx:49 | |
| 11 | Premiers pas, étape 1 | texte | Le village où tu as appris à le parler. Il se choisit dans la liste, rien n'est déduit de ta position. | membre | src/app/dashboard/premiers-pas.tsx:52-53 | |
| 12 | Premiers pas, étape 1 | a11y | Étape 1, faite : (annonce, puis le titre) | membre | src/app/dashboard/premiers-pas.tsx:126 | |
| 13 | Premiers pas, étape 2 | titre | Lequel dis-tu chez toi ? | membre | src/app/dashboard/premiers-pas.tsx:62 | |
| 14 | Premiers pas, étape 2 | texte | Dès que ton village est choisi. | membre | src/app/dashboard/premiers-pas.tsx:68 | |
| 15 | Premiers pas, étape 2 | a11y | Étape 2, faite : (annonce, puis le titre) | membre | src/app/dashboard/premiers-pas.tsx:126 | |
| 16 | Premiers pas, mot | texte | Pour dire {mot français} | membre | src/app/dashboard/premiers-pas.tsx:160-161 | |
| 17 | Premiers pas, mot | bouton | (BoutonChezMoi : voir composants contribution) | membre | src/app/dashboard/premiers-pas.tsx:166 | |
| 18 | Premiers pas, mot | lien | Ça se dit autrement chez moi | membre | src/app/dashboard/premiers-pas.tsx:182 | |
| 19 | Premiers pas, réussite | texte | « {forme} » se dit maintenant à {village}. (annonce, role status) | membre | src/app/dashboard/premiers-pas.tsx:207 | |
| 20 | Premiers pas, réussite | texte | Ton village est sur la carte de « {mot français} ». Continue avec les autres mots, ou va voir d'où parlent les autres. | membre | src/app/dashboard/premiers-pas.tsx:210-212 | |
| 21 | Premiers pas, réussite | lien | Voir sur la carte | membre | src/app/dashboard/premiers-pas.tsx:219 | |
| 22 | Premiers pas, réussite | lien | Parcourir le dictionnaire | membre | src/app/dashboard/premiers-pas.tsx:225 | |
| 23 | Compteurs | texte | {nombre} (valeur) + formes apportées | membre | src/app/dashboard/page.tsx:95 | INTERNE |
| 24 | Compteurs | texte | {nombre} (valeur) + villages attachés | membre | src/app/dashboard/page.tsx:96 | |
| 25 | Carte du défi | titre | Le défi du jour | membre | src/app/dashboard/page.tsx:106 | |
| 26 | Carte du défi | texte | Cinq questions par jour sur de vrais mots alsaciens. | membre | src/app/dashboard/page.tsx:108 | |
| 27 | Ton village | titre | Ton village | membre | src/app/dashboard/page.tsx:118 | |
| 28 | Ton village | texte | Choisis ton village pour pouvoir y rattacher les formes que tu reconnais. Il se choisit dans une liste, rien n'est déduit de ta position, et reste modifiable à tout moment. | membre | src/app/dashboard/page.tsx:121-123 | INTERNE |
| 29 | Ton village, affichage | texte | {nom du village} (ou vide si pas de village) | membre | src/app/dashboard/village-profil.tsx:70 | |
| 30 | Ton village, affichage | bouton | Changer | membre | src/app/dashboard/village-profil.tsx:81 | |
| 31 | Ton village, édition | libellé | Chercher un village | membre | src/app/dashboard/village-profil.tsx:90 | |
| 32 | Ton village, édition | placeholder | Chercher un village… | membre | src/app/dashboard/village-profil.tsx:96 | |
| 33 | Ton village, édition | texte | {nom} ({département}) (chaque proposition de la liste) | membre | src/app/dashboard/village-profil.tsx:100 | |
| 34 | Ton village, édition | texte | Aucun village trouvé | membre | src/app/dashboard/village-profil.tsx:102 | |
| 35 | Ton village, édition | bouton | Valider | membre | src/app/dashboard/village-profil.tsx:112 | |
| 36 | Ton village, édition | bouton | Annuler | membre | src/app/dashboard/village-profil.tsx:120 | |
| 37 | Ton village, confirmation | confirmation | (message renvoyé par definirVillageAction, affiché en toast : voir section Actions membres) | membre | src/app/dashboard/village-profil.tsx:65 | |
| 38 | Ton village, erreur | erreur | (message renvoyé par definirVillageAction, affiché en toast : voir section Actions membres) | membre | src/app/dashboard/village-profil.tsx:68 | |
| 39 | Administration | titre | Administration | admin | src/app/dashboard/page.tsx:132 | |
| 40 | Administration | lien | Membres | admin | src/app/dashboard/page.tsx:138 | |
| 41 | Administration | lien | Ouvrir | admin | src/app/dashboard/page.tsx:140 | |
| 42 | Pied | bouton | Se déconnecter | membre | src/app/dashboard/page.tsx:151 | |

Compte de l'écran `/dashboard` : 42 lignes.

## /recherche : recherche

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | En-tête | texte | Elsass Dico (wordmark, sans titre) | membre | src/components/app-header.tsx:147 | |
| 2 | Champ de recherche | a11y | Chercher un mot en alsacien (aria-label, sens alsacien) | membre | src/app/recherche/page.tsx:120 | |
| 3 | Champ de recherche | a11y | Chercher un mot en français (aria-label, sens français) | membre | src/app/recherche/page.tsx:120 | |
| 4 | Champ de recherche | placeholder | Un mot en alsacien… | membre | src/app/recherche/page.tsx:123 | |
| 5 | Champ de recherche | placeholder | Un mot en français… | membre | src/app/recherche/page.tsx:123 | |
| 6 | Résultats | titre | Résultats (en-tête de liste, côté alsacien) | membre | src/app/recherche/page.tsx:151 | |
| 7 | Résultats | titre | Résultats (en-tête de liste, côté français) | membre | src/app/recherche/page.tsx:170 | |
| 8 | Résultats, forme | texte | {forme} (affichée avec sa carte de forme) | membre | src/app/recherche/page.tsx:160 | |
| 9 | Résultats, mot | texte | {mot français} | membre | src/app/recherche/page.tsx:185 | |
| 10 | Résultats, mot | texte | {précision du mot} entre parenthèses | membre | src/app/recherche/page.tsx:187 | |
| 11 | Résultats, mot | pastille | (BadgeConfiance : voir composants partagés) | membre | src/app/recherche/page.tsx:194 | |
| 12 | Aucun résultat | texte | Aucun résultat pour « {terme} ». | membre | src/app/recherche/page.tsx:216 | |
| 13 | Aucun résultat, côté alsacien | texte | Aucune forme alsacienne ne s'écrit comme ça pour l'instant. | membre | src/app/recherche/page.tsx:220 | INTERNE |
| 14 | Aucun résultat, côté français | texte | Aucun mot français ne s'écrit comme ça pour l'instant. | membre | src/app/recherche/page.tsx:221 | |
| 15 | Aucun résultat | bouton | Chercher « {terme} » en alsacien (si on change de sens) | membre | src/app/recherche/page.tsx:232 | |
| 16 | Aucun résultat | bouton | Chercher « {terme} » en français (si on change de sens) | membre | src/app/recherche/page.tsx:232 | |
| 17 | Aucun résultat | bouton (ajout) | Ajouter « {terme} » au dictionnaire (BoutonContribuer) | membre | src/app/recherche/page.tsx:240 | |
| 18 | Chargement | a11y | (squelette de liste, sans texte) | membre | src/app/recherche/page.tsx:144 | |

Compte de l'écran `/recherche` : 18 lignes.

## /dictionnaire : dictionnaire A-Z

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | En-tête | titre | Dictionnaire | membre | src/app/dictionnaire/page.tsx:226 | |
| 2 | Lettres | bouton | A B C D E F G H I J K L M N O P Q R S T U V W X Y Z (boutons lettres, une par lettre) | membre | src/app/dictionnaire/page.tsx:33,235 | |
| 3 | Liste, état vide | texte | Aucun {unité} pour la lettre {lettre}. | membre | src/app/dictionnaire/page.tsx:267 | INTERNE si unité = forme |
| 4 | Liste, état vide | texte | Aucun {unité} pour l'instant. | membre | src/app/dictionnaire/page.tsx:267 | INTERNE si unité = forme |
| 5 | Compteur | texte | {total} {unité}s, page {page} sur {nbPages} (côté alsacien : « formes ») | membre | src/app/dictionnaire/page.tsx:279 | INTERNE (unité forme) |
| 6 | Compteur | texte | {nombre} {unité}{s} (sans pagination) | membre | src/app/dictionnaire/page.tsx:280 | INTERNE si unité = forme |
| 7 | Aller à | placeholder | Aller à une forme… | membre | src/app/dictionnaire/page.tsx:287 | INTERNE |
| 8 | Aller à | placeholder | Aller à un mot… | membre | src/app/dictionnaire/page.tsx:287 | |
| 9 | Aller à | a11y | Aller à une forme (aria-label, même texte sans le point de suspension) | membre | src/app/dictionnaire/page.tsx:413 | INTERNE |
| 10 | Aller à | a11y | Aller à un mot (aria-label) | membre | src/app/dictionnaire/page.tsx:413 | |
| 11 | Aller à | bouton | Aller | membre | src/app/dictionnaire/page.tsx:423 | |
| 12 | Ligne | texte | {titre (mot français ou forme)} | membre | src/app/dictionnaire/page.tsx:317 | |
| 13 | Ligne | texte | {précision entre parenthèses} | membre | src/app/dictionnaire/page.tsx:317 | |
| 14 | Ligne | texte | {sous-titre (première forme ou premier sens)} | membre | src/app/dictionnaire/page.tsx:324 | |
| 15 | Ligne | texte | +{nombre d'autres} | membre | src/app/dictionnaire/page.tsx:325 | |
| 16 | Pagination | bouton | Précédent | membre | src/app/dictionnaire/page.tsx:368 | |
| 17 | Pagination | texte | {page} / {nbPages} | membre | src/app/dictionnaire/page.tsx:372 | |
| 18 | Pagination | bouton | Suivant | membre | src/app/dictionnaire/page.tsx:379 | |
| 19 | Erreur | erreur | (écran d'échec de chargement : voir composant EchecChargement, transversal) | membre | src/app/dictionnaire/page.tsx:256-258 | |

Compte de l'écran `/dictionnaire` : 19 lignes. Le texte exact des lignes 3 à 6 dépend de l'onglet (mot ou forme) : `unité` vaut « mot » en français et « forme » du côté alsacien.

## /entree/[id] : fiche d'un mot (membre)

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | En-tête | titre | {mot français} (titre de la fiche) | membre | src/app/entree/[id]/page.tsx:41 | |
| 2 | Sous-titre | texte | {contexte, ou type de terme} | membre | src/app/entree/[id]/page.tsx:44 | |
| 3 | Sous-titre | texte | {département de la commune} (avec icône de repère) | membre | src/app/entree/[id]/page.tsx:48 | |
| 4 | Actions du mot | bouton | (BoutonContribuer, variante pleine : voir composants contribution) | membre | src/app/entree/[id]/page.tsx:57 | |
| 5 | Actions du mot | lien | (LienCarte : voir composants transversaux, « Voir sur la carte ») | membre | src/app/entree/[id]/page.tsx:62 | |
| 6 | Compteur de formes | texte | {n} façons de le dire | membre | src/app/entree/[id]/page.tsx:67 | |
| 7 | Compteur de formes | texte | 1 façon de le dire | membre | src/app/entree/[id]/page.tsx:68 | |
| 8 | Sans village | texte | Aucun village ne s'est encore rattaché à ces formes. Si l'une se dit chez toi, touche « Chez moi aussi ». | membre | src/app/entree/[id]/page.tsx:74-75 | INTERNE |
| 9 | Formes | (composant) | Carte de forme (CarteVariante) avec bouton « Chez moi aussi » et bouton « Modifier » : voir composants | membre | src/app/entree/[id]/page.tsx:81-88 | |
| 10 | Bas de liste | (composant) | Bouton de contribution (BoutonContribuer, variante pleine) quand il y a plus de deux formes | membre | src/app/entree/[id]/page.tsx:98-100 | |
| 11 | Actions du bas | bouton | Copier « {première forme} » | membre | src/app/entree/[id]/actions-row.tsx:30 | |
| 12 | Actions du bas | lien | Signaler | membre | src/app/entree/[id]/actions-row.tsx:34 | |
| 13 | Copie | confirmation | Copié (toast) | membre | src/app/entree/[id]/actions-row.tsx:16 | |
| 14 | Copie | erreur | Copie impossible (toast) | membre | src/app/entree/[id]/actions-row.tsx:18 | |
| 15 | Modifier une forme | bouton | Modifier | membre | src/app/entree/[id]/editer-variante.tsx:73 | |
| 16 | Modifier une forme | bouton | Enregistrer | membre | src/app/entree/[id]/editer-variante.tsx:87 | |
| 17 | Modifier une forme | bouton | Annuler | membre | src/app/entree/[id]/editer-variante.tsx:95 | |
| 18 | Modifier une forme | confirmation | Forme modifiée (toast) | membre | src/app/entree/[id]/editer-variante.tsx:57 | INTERNE |
| 19 | Modifier une forme | erreur | (message renvoyé par l'action de modification, affiché en toast : voir section Actions des variantes) | membre | src/app/entree/[id]/editer-variante.tsx:61 | |

Compte de l'écran `/entree/[id]`  : 19 lignes. Les textes de `ChampForme` (formulaire de modification) sont dans la section Contribution.

## /entree/[id]/signaler : signaler une erreur

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | En-tête (écran modal) | titre | Signaler une erreur | membre | src/app/entree/[id]/signaler/page.tsx:16 | |
| 2 | En-tête (écran modal) | a11y | Fermer (aria-label) | membre | src/components/app-header.tsx:163 | |
| 3 | Mot concerné | texte | Mot concerné : {mot français} | membre | src/app/entree/[id]/signaler/page.tsx:22 | |
| 4 | Introduction | texte | Ton signalement va directement à un admin, qui décide de la suite. D'ici là, la forme, ses sources et ses villages restent tels quels. | membre | src/app/entree/[id]/signaler/page.tsx:24-25 | INTERNE |
| 5 | Champ | libellé | Forme concernée | membre | src/app/entree/[id]/signaler/signaler-actions.tsx:44 | INTERNE |
| 6 | Champ | option | {forme} (chaque forme du mot) | membre | src/app/entree/[id]/signaler/signaler-actions.tsx:54 | |
| 7 | Champ | libellé | Ce qui cloche | membre | src/app/entree/[id]/signaler/signaler-actions.tsx:60 | |
| 8 | Champ | placeholder | Graphie, source, village attaché par erreur… | membre | src/app/entree/[id]/signaler/signaler-actions.tsx:67 | INTERNE (source) |
| 9 | Envoi | bouton | Envoyer à l'admin | membre | src/app/entree/[id]/signaler/signaler-actions.tsx:77 | |
| 10 | Envoi | bouton | Envoi… (pendant l'envoi) | membre | src/app/entree/[id]/signaler/signaler-actions.tsx:77 | |
| 11 | Envoi | erreur | Choisis une forme et décris le problème (toast) | membre | src/app/entree/[id]/signaler/signaler-actions.tsx:27 | INTERNE |
| 12 | Envoi | confirmation | (message renvoyé par signalerAction, affiché en toast : voir section Actions des signalements) | membre | src/app/entree/[id]/signaler/signaler-actions.tsx:34 | |
| 13 | Envoi | erreur | (message renvoyé par signalerAction, affiché en toast : voir section Actions des signalements) | membre | src/app/entree/[id]/signaler/signaler-actions.tsx:37 | |
| 14 | Forum | lien | Ouvrir le forum du dictionnaire ↗ | membre | src/app/entree/[id]/signaler/signaler-actions.tsx:47 | |
| 15 | Forum | texte | Pour une discussion plus large, ça quitte l'app et ouvre theelsassisch.com dans un nouvel onglet. | membre | src/app/entree/[id]/signaler/signaler-actions.tsx:50-51 | |

Compte de l'écran `/entree/[id]/signaler` : 15 lignes (la ligne 2 renvoie au transversal).

## /forme : fiche d'une forme (membre)

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | En-tête | titre | {forme} (titre de la page, la forme elle-même) | membre | src/app/forme/page.tsx:37 | |
| 2 | Compteur de sens | texte | {n} sens en français | membre | src/app/forme/page.tsx:40 | |
| 3 | Compteur de sens | texte | 1 sens en français | membre | src/app/forme/page.tsx:40 | |
| 4 | Actions | bouton | (BoutonContribuer, variante pleine : voir composants contribution) | membre | src/app/forme/page.tsx:43 | |
| 5 | Actions | lien | (LienCarte vers la carte de cette forme : voir composants transversaux) | membre | src/app/forme/page.tsx:48 | |
| 6 | Sens | titre | {mot français} (chaque sens, lien vers la fiche du mot) | membre | src/app/forme/page.tsx:60 | |
| 7 | Sens | texte | {précision entre parenthèses} | membre | src/app/forme/page.tsx:63 | |
| 8 | Sens | lien | Toutes ses formes | membre | src/app/forme/page.tsx:67 | INTERNE |
| 9 | Formes | (composant) | Carte de forme (CarteVariante) : voir composants | membre | src/app/forme/page.tsx:74 | |
| 10 | Bas de page | (composant) | Bouton de contribution (variante par défaut) quand il y a plus de deux sens | membre | src/app/forme/page.tsx:86 | |

Compte de l'écran `/forme` : 10 lignes.

## /profile : ancienne adresse

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | (aucun texte) | redirection | La page redirige vers /dashboard (Mon espace). Aucun texte affiché. | membre | src/app/profile/page.tsx:6-8 | |

Compte de l'écran `/profile` : 0 texte affiché (redirection).

## /carte : carte des parlers (membre)

Les textes de `CarteParlers` (fond de carte, infobulles des points) sont dans la
section transversale « Composants partagés ».

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | En-tête | titre | Carte des parlers | membre | src/app/carte/carte-demo.tsx:214 (AppHeader), src/app/carte/page.tsx (metadata title) | |
| 2 | Chargement | texte | Chargement de la carte… | membre | src/app/carte/carte-demo.tsx:40 | |
| 3 | Chargement | texte | Chargement… | membre | src/app/carte/carte-demo.tsx:300 | |
| 4 | Recherche | libellé | Chercher une forme alsacienne (sens alsacien) | membre | src/app/carte/carte-demo.tsx:223 | INTERNE |
| 5 | Recherche | libellé | Chercher un mot français (sens français) | membre | src/app/carte/carte-demo.tsx:223 | |
| 6 | Recherche | placeholder | Une forme : buschur, Lohn… | membre | src/app/carte/carte-demo.tsx:224 | INTERNE |
| 7 | Recherche | placeholder | Un mot : bonjour, salaire… | membre | src/app/carte/carte-demo.tsx:224 | |
| 8 | Recherche, suggestion | texte | {mot français} (suggestion de mot) | membre | src/app/carte/carte-demo.tsx:233 | |
| 9 | Recherche, suggestion | texte | {forme} (suggestion de forme) | membre | src/app/carte/carte-demo.tsx:238 | INTERNE si affichée comme forme |
| 10 | Recherche, suggestion | texte | ({sens de la forme}, +{n}) | membre | src/app/carte/carte-demo.tsx:241 | |
| 11 | Recherche | a11y | Revenir à la carte des villages (bouton d'effacement) | membre | src/app/carte/carte-demo.tsx:254 | |
| 12 | Aide | bouton | ? | membre | src/app/carte/aide-carte.tsx:18 | |
| 13 | Aide | a11y | Comment lire cette carte (aria-label du bouton ?) | membre | src/app/carte/aide-carte.tsx:15 | |
| 14 | Aide, fenêtre | titre | Comment lire cette carte | membre | src/app/carte/aide-carte.tsx:24 | |
| 15 | Aide, fenêtre | texte | Sans recherche, chaque point est un village dont on connaît le nom en alsacien. Clique un point pour le lire. | membre | src/app/carte/aide-carte.tsx:30-31 | |
| 16 | Aide, fenêtre | texte | En cherchant un mot, chaque point montre comment on le dit dans un village. Chaque façon de le dire a sa couleur, rappelée devant elle au-dessus de la carte. | membre | src/app/carte/aide-carte.tsx:34-36 | |
| 17 | Aide, fenêtre | texte | Le bouton tout en haut choisit dans quelle langue tu cherches. En alsacien, tu tapes une forme et chaque point montre ce qu'elle veut dire là où on la dit : une couleur par sens. | membre | src/app/carte/aide-carte.tsx:39-41 | INTERNE |
| 18 | Aide, fenêtre | texte | Au-dessus de la carte, touche une forme pour y ajouter ton village, ou « Ça se dit autrement chez moi ? » pour proposer la tienne. | membre | src/app/carte/aide-carte.tsx:44-45 | INTERNE |
| 19 | Filtre | a11y | Filtrer les villages affichés (aria-label) | membre | src/app/carte/carte-demo.tsx:310 | |
| 20 | Filtre | placeholder | Filtrer par village ou par forme… | membre | src/app/carte/carte-demo.tsx:311 | INTERNE |
| 21 | Compteur | texte | {n} point{s} affiché{s}. | membre | src/app/carte/carte-demo.tsx:318-319 | |
| 22 | Pied | lien | Sources | membre | src/app/carte/carte-demo.tsx (lien vers /sources) | |
| 23 | Panneau forme | texte | Veut dire : (intitulé des sens, voir carte-forme) | membre | src/components/carte-forme.tsx:15 | |
| 24 | Panneau forme | texte | {sens en français} (boutons de sens, cliquables) | membre | src/app/carte/panneau-forme.tsx:43 | |
| 25 | Panneau forme | texte | {n} autre{s} sens | membre | src/components/carte-forme.tsx:32 | |
| 26 | Panneau forme | bouton | (BoutonChezMoi, sens : voir composants contribution) | membre | src/app/carte/panneau-forme.tsx:36 | |
| 27 | Panneau forme | bouton | (BoutonContribuer, forme : voir composants contribution) | membre | src/app/carte/panneau-forme.tsx:52 | |
| 28 | Panneau mot | texte | Aucun village n'a encore dit comment il dit ce mot. Touche une forme si on la dit chez toi, et ton village apparaîtra sur la carte. | membre | src/app/carte/panneau-contribution.tsx:36 | INTERNE |
| 29 | Panneau mot | texte | {forme alsacienne} (boutons de forme) | membre | src/app/carte/panneau-contribution.tsx:53 | |
| 30 | Panneau mot | bouton | (BoutonChezMoi par forme : voir composants contribution) | membre | src/app/carte/panneau-contribution.tsx:47 | |
| 31 | Panneau mot | bouton | (BoutonContribuer, mot : voir composants contribution) | membre | src/app/carte/panneau-contribution.tsx:60 | |
| 32 | Liens | lien | Voir sur la carte (LienCarte, présent sur les fiches) | membre | src/components/lien-carte.tsx:14 | |
| 33 | Erreur | erreur | Le chargement n'a pas abouti. / Le serveur est peut-être occupé. Réessaie dans un instant. / Réessayer (EchecChargement, transversal) | membre | src/app/carte/carte-demo.tsx:294 | |

Compte de l'écran `/carte` : 33 lignes.

## Contribution et « Chez moi aussi » (composants, membre)

Ces textes apparaissent sur les écrans /entree, /forme, /recherche, /carte,
/dashboard et /jeu. Ils sont relevés une fois ici, puis renvoyés depuis ces écrans.

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | Bouton « ajouter » (cadre) | bouton | Ça se dit autrement chez moi ? (défaut pour un mot) | membre | src/components/contribution/bouton-contribuer.tsx:37 | |
| 2 | Bouton « ajouter » (cadre) | bouton | Ce mot veut aussi dire… (défaut pour une forme) | membre | src/components/contribution/bouton-contribuer.tsx:37 | INTERNE |
| 3 | Bouton « ajouter » (libellé libre) | bouton | (libellé passé par l'écran, ex. « Ajouter « {terme} » au dictionnaire ») | membre | src/components/contribution/bouton-contribuer.tsx:36 | |
| 4 | Bouton « Chez moi aussi » | bouton | Chez moi aussi | membre | src/components/contribution/bouton-chez-moi.tsx:44 | |
| 5 | Bouton « Chez moi aussi » (déjà voté) | bouton | Dit à {village} | membre | src/components/contribution/bouton-chez-moi.tsx:44 | |
| 6 | Bouton « Chez moi aussi » (sr-only) | a11y | , Chez moi aussi / , Dit à {village} (annonce après la forme) | membre | src/components/contribution/bouton-chez-moi.tsx:66 | |
| 7 | Fenêtre « Chez moi aussi » | titre | Chez moi aussi | membre | src/components/contribution/feuille-chez-moi.tsx:64 | |
| 8 | Fenêtre « Chez moi aussi » | texte | Rattacher ton village à cette forme, ou l'en retirer. | membre | src/components/contribution/feuille-chez-moi.tsx:65 | INTERNE |
| 9 | Fenêtre « Chez moi aussi » | titre | Cette forme n'est plus là | membre | src/components/contribution/feuille-chez-moi.tsx:130 | INTERNE |
| 10 | Fenêtre « Chez moi aussi » | texte | Elle a peut-être été retirée entre-temps. | membre | src/components/contribution/feuille-chez-moi.tsx:130 | INTERNE |
| 11 | Fenêtre « Chez moi aussi » | texte | Au sens de « {mot français} ». / Pour dire « {mot français} ». | membre | src/components/contribution/feuille-chez-moi.tsx:158-159 | |
| 12 | Fenêtre « Chez moi aussi » | bouton | La dire pour {village} à la place (ou Enregistrement… pendant l'envoi) | membre | src/components/contribution/feuille-chez-moi.tsx:180 | |
| 13 | Fenêtre « Chez moi aussi » | bouton | Retirer {village} | membre | src/components/contribution/feuille-chez-moi.tsx:189 | |
| 14 | Fenêtre « Chez moi aussi » | bouton | Garder {village} | membre | src/components/contribution/feuille-chez-moi.tsx:196 | |
| 15 | Fenêtre « Chez moi aussi » | titre | Retirer ton village ? | membre | src/components/contribution/feuille-chez-moi.tsx:206 | |
| 16 | Fenêtre « Chez moi aussi » | bouton | Retirer {village} (pendant l'envoi : Enregistrement…) | membre | src/components/contribution/feuille-chez-moi.tsx:216 | |
| 17 | Fenêtre « Chez moi aussi » | bouton | Garder | membre | src/components/contribution/feuille-chez-moi.tsx:219 | |
| 18 | Fenêtre « Chez moi aussi » | titre | Ça veut dire ça chez toi ? (côté alsacien) | membre | src/components/contribution/feuille-chez-moi.tsx:227 | |
| 19 | Fenêtre « Chez moi aussi » | titre | Ça se dit comme ça chez toi ? (côté français) | membre | src/components/contribution/feuille-chez-moi.tsx:227 | |
| 20 | Fenêtre « Chez moi aussi » | libellé | Ton village | membre | src/components/contribution/feuille-chez-moi.tsx:230 | |
| 21 | Fenêtre « Chez moi aussi » | bouton | Changer | membre | src/components/contribution/feuille-chez-moi.tsx:241 | |
| 22 | Fenêtre « Chez moi aussi » | texte | {village} s'ajoute aux villages de cette forme, sur la fiche et sur la carte. | membre | src/components/contribution/feuille-chez-moi.tsx:247 | INTERNE |
| 23 | Fenêtre « Chez moi aussi » | confirmation | {village} ajouté à « {forme} » (toast) | membre | src/components/contribution/feuille-chez-moi.tsx:255 | INTERNE |
| 24 | Fenêtre « Chez moi aussi » | confirmation | « {forme} » se dit maintenant à {village} (toast) | membre | src/components/contribution/feuille-chez-moi.tsx:176 | INTERNE |
| 25 | Fenêtre « Chez moi aussi » | bouton | Oui, chez moi aussi | membre | src/components/contribution/feuille-chez-moi.tsx:257 | |
| 26 | Fenêtre « Chez moi aussi » | bouton | Annuler | membre | src/components/contribution/feuille-chez-moi.tsx:260 | |
| 27 | Fenêtre « Chez moi aussi » | erreur | (message d'erreur renvoyé par l'action de vote, affiché en toast) | membre | src/components/contribution/feuille-chez-moi.tsx:152 | |
| 28 | Fenêtre « Ajouter ta façon de dire » | description | Ajouter ta façon de dire, avec ton village. | membre | src/components/contribution/feuille-contribution.tsx:118 | |
| 29 | Choix du type | option | Un mot | membre | src/components/contribution/feuille-contribution.tsx:94 | |
| 30 | Choix du type | option | Une expression | membre | src/components/contribution/feuille-contribution.tsx:95 | |
| 31 | Choix du type | option | Un proverbe | membre | src/components/contribution/feuille-contribution.tsx:96 | |
| 32 | Étape « forme » | titre | Comment tu le dis ? | membre | src/components/contribution/feuille-contribution.tsx:285 | |
| 33 | Étape « forme » | bouton | Chargement des formes… / Vérifier | membre | src/components/contribution/feuille-contribution.tsx:296 | |
| 34 | Étape « recap » | titre | On publie ? | membre | src/components/contribution/feuille-contribution.tsx:316 | |
| 35 | Étape « recap » | libellé | Ta forme | membre | src/components/contribution/feuille-contribution.tsx:318 | |
| 36 | Étape « recap » | libellé | Pour | membre | src/components/contribution/feuille-contribution.tsx:321 | |
| 37 | Étape « recap » | libellé | Village | membre | src/components/contribution/feuille-contribution.tsx:329 | |
| 38 | Étape « recap » | texte | Nouveau dans le dictionnaire · {type de terme} | membre | src/components/contribution/feuille-contribution.tsx:325 | |
| 39 | Étape « recap » | bouton | Changer (le village) | membre | src/components/contribution/feuille-contribution.tsx:336 | |
| 40 | Étape « recap » | texte | Tout le monde la verra. Tu pourras la modifier tant que personne d'autre ne l'a ajoutée chez lui. | membre | src/components/contribution/feuille-contribution.tsx:342 | |
| 41 | Étape « recap » | bouton | Publication… / Publier | membre | src/components/contribution/feuille-contribution.tsx:345 | |
| 42 | Étape « nouveau mot » | titre | Quel mot français ? | membre | src/components/contribution/feuille-contribution.tsx:383 | |
| 43 | Étape « nouveau mot » | texte | (sous-titre : « Le mot français que ta forme traduit. » ou variante, selon le cas) | membre | src/components/contribution/feuille-contribution.tsx:386 | |
| 44 | Étape « nouveau mot » | libellé | Chercher le mot français | membre | src/components/contribution/feuille-contribution.tsx:393 | |
| 45 | Étape « nouveau mot » | placeholder | salaire, bonjour… | membre | src/components/contribution/feuille-contribution.tsx:394 | |
| 46 | Étape « nouveau mot » | texte | {n} forme{s} (nombre de formes d'un mot proposé) | membre | src/components/contribution/feuille-contribution.tsx:410 | INTERNE |
| 47 | Étape « nouveau mot » | texte | Il n'est pas dans la liste ? | membre | src/components/contribution/feuille-contribution.tsx:419 | |
| 48 | Étape « nouveau mot » | texte | « {terme} » n'est pas encore dans le dictionnaire. | membre | src/components/contribution/feuille-contribution.tsx:419 | |
| 49 | Étape « nouveau mot » | bouton | Ajouter « {terme} » | membre | src/components/contribution/feuille-contribution.tsx:422 | |
| 50 | Étape « mot français » | titre | Le mot français | membre | src/components/contribution/feuille-contribution.tsx:465 | |
| 51 | Étape « mot français » | sous-titre | Il entre dans le dictionnaire avec ta forme alsacienne, jamais sans elle. | membre | src/components/contribution/feuille-contribution.tsx:466 | INTERNE |
| 52 | Étape « mot français » | libellé | (champ du mot, id contribution-francais) | membre | src/components/contribution/feuille-contribution.tsx:470 | |
| 53 | Étape « mot français » | texte | Ce mot existe déjà. / Un mot s'écrit déjà comme ça. | membre | src/components/contribution/feuille-contribution.tsx:504 | |
| 54 | Étape « mot français » | texte | {contexte ou type} · {n} forme{s} (mot existant) | membre | src/components/contribution/feuille-contribution.tsx:513 | INTERNE |
| 55 | Étape « mot français » | bouton | Non, c'est un autre mot | membre | src/components/contribution/feuille-contribution.tsx:523 | |
| 56 | Étape « mot français » | bouton | Vérification… / Continuer | membre | src/components/contribution/feuille-contribution.tsx:531 | |
| 57 | Étape « vérification » | texte | « {mot} » n'est pas encore dans le dictionnaire. {forme} sera sa première forme. | membre | src/components/contribution/feuille-contribution.tsx:576 | INTERNE |
| 58 | Étape « vérification » | texte | {forme} sera la première forme de « {mot} ». | membre | src/components/contribution/feuille-contribution.tsx:578 | INTERNE |
| 59 | Étape « vérification » | texte | {forme} ne ressemble pas à la seule forme déjà connue pour « {mot} ». | membre | src/components/contribution/feuille-contribution.tsx:580 | INTERNE |
| 60 | Étape « vérification » | texte | {forme} ne ressemble à aucune des {n} formes déjà connues pour « {mot} ». | membre | src/components/contribution/feuille-contribution.tsx:581 | INTERNE |
| 61 | Étape « vérification » | bouton | Voir les formes connues | membre | src/components/contribution/feuille-contribution.tsx:592 | INTERNE |
| 62 | Étape « vérification » | bouton | Continuer | membre | src/components/contribution/feuille-contribution.tsx:608 | |
| 63 | Étape « elle existe déjà » | titre | Elle existe déjà | membre | src/components/contribution/feuille-contribution.tsx:617 | INTERNE |
| 64 | Étape « elle existe déjà » | texte | {forme} est déjà connue pour « {mot} ». Ajoute simplement ton village. | membre | src/components/contribution/feuille-contribution.tsx:617 | INTERNE |
| 65 | Étape « elle existe déjà » | bouton | Chez moi aussi (libellé du vote) | membre | src/components/contribution/feuille-contribution.tsx:618 | |
| 66 | Étape « elle existe déjà » | bouton | Ton village y est déjà (si déjà voté) | membre | src/components/contribution/feuille-contribution.tsx:553 | |
| 67 | Étape « elle existe déjà » | bouton | Modifier ma forme | membre | src/components/contribution/feuille-contribution.tsx:620 | INTERNE |
| 68 | Étape « proche » | titre | Tu penses à celle-ci ? | membre | src/components/contribution/feuille-contribution.tsx:627 | |
| 69 | Étape « proche » | texte | Une forme proche de {forme} existe déjà pour « {mot} ». | membre | src/components/contribution/feuille-contribution.tsx:627 | INTERNE |
| 70 | Étape « proche » | bouton | Déjà chez toi (forme déjà votée) | membre | src/components/contribution/feuille-contribution.tsx:640 | |
| 71 | Étape « proche » | bouton | C'est celle-là | membre | src/components/contribution/feuille-contribution.tsx:640 | |
| 72 | Étape « proche » | bouton | Non, la mienne est différente | membre | src/components/contribution/feuille-contribution.tsx:647 | |
| 73 | Étape « village » | titre | D'où vient ton parler ? | membre | src/components/contribution/habillage.tsx:160 | |
| 74 | Étape « village » | libellé | Chercher ton village (aria-label) | membre | src/components/contribution/habillage.tsx:169 | |
| 75 | Étape « village » | placeholder | Ton village | membre | src/components/contribution/habillage.tsx:170 | |
| 76 | Étape « village » | texte | Chargement… | membre | src/components/contribution/habillage.tsx:178 | |
| 77 | Étape « village » | texte | Aucun village de ce nom en Alsace ni en Moselle. | membre | src/components/contribution/habillage.tsx:179 | |
| 78 | Étape « village » | texte | {nom du village} et {département} (chaque proposition) | membre | src/components/contribution/habillage.tsx:184-185 | |
| 79 | Cadres | a11y | Étape précédente (bouton retour, aria-label) | membre | src/components/contribution/habillage.tsx:94 | |
| 80 | Champ « forme » | a11y | Ton article (aria-label de l'article libre) | membre | src/components/contribution/champ-forme.tsx:179 | |
| 81 | Champ « forme » | placeholder | dr, e… | membre | src/components/contribution/champ-forme.tsx:180 | |
| 82 | Champ « forme » | texte | Sera publié ainsi : {forme} | membre | src/components/contribution/champ-forme.tsx:131-134 | INTERNE |
| 83 | Champ « forme » | texte | Écris-la comme tu la prononces chez toi, sans chercher la « bonne » orthographe. | membre | src/components/contribution/champ-forme.tsx:137 | INTERNE |
| 84 | Champ « forme » | bouton | Sans article / Autre (choix d'article, avec les articles proposés) | membre | src/components/contribution/champ-forme.tsx:148-150 | |
| 85 | Champ « forme » | a11y | Ta forme en alsacien (libellé sr-only du champ) | membre | src/components/contribution/champ-forme.tsx:105 | INTERNE |
| 87 | Champ « forme » | placeholder | Comme tu l'écris (champ hors mode compact) | membre | src/components/contribution/champ-forme.tsx:108 | |
| 86 | Forme existante (carte candidate) | texte | {village} et {n} autre{s} (villages qui revendiquent la forme, 4 max) | membre | src/components/contribution/habillage.tsx:211-212 | |

Compte de la section Contribution : 87 lignes.

## /admin : administration (accueil)

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | En-tête | titre | Administration | admin | src/app/admin/page.tsx:50 | |
| 2 | En-tête | a11y | Actualiser (aria-label du bouton) | admin | src/app/admin/page.tsx:57 | |
| 3 | Liens | lien | Signalements | admin | src/app/admin/page.tsx:72 | |
| 4 | Liens | lien | Sources | admin | src/app/admin/page.tsx:79 | |
| 5 | Liens | lien | Mots ajoutés | admin | src/app/admin/page.tsx:86 | |
| 6 | Carte membres | titre | Membres ({nombre}) | admin | src/app/admin/page.tsx:93 | |
| 7 | Carte membres | texte | Un membre apparaît ici à sa première connexion. Les comptes se créent sur le portail The Elsassisch, qui reste l'autorité sur les identifiants. | admin | src/app/admin/page.tsx:97-99 | |
| 8 | Carte membres | texte | Chargement… | admin | src/app/admin/page.tsx:103 | |
| 9 | Carte membres | texte | Aucun membre pour l'instant. | admin | src/app/admin/page.tsx:42 | |
| 10 | Tableau | en-tête | Membre | admin | src/app/admin/page.tsx:113 | |
| 11 | Tableau | en-tête | Village | admin | src/app/admin/page.tsx:114 | |
| 12 | Tableau | en-tête | Témoignages | admin | src/app/admin/page.tsx:115 | INTERNE |
| 13 | Tableau | en-tête | Vu le | admin | src/app/admin/page.tsx:116 | |
| 14 | Tableau | en-tête | Rôle | admin | src/app/admin/page.tsx:117 | |
| 15 | Tableau | texte | {nom ou adresse email du membre} | admin | src/app/admin/page.tsx:127 | |
| 16 | Tableau | texte | {adresse email} (si le nom est renseigné) | admin | src/app/admin/page.tsx:131 | |
| 17 | Tableau | texte | {village} ou Aucun (si pas de village) | admin | src/app/admin/page.tsx:129 | |
| 18 | Tableau | texte | {nombre de témoignages} | admin | src/app/admin/page.tsx:133 | INTERNE (témoignage) |
| 19 | Tableau | texte | {date de dernière connexion} | admin | src/app/admin/page.tsx:134 | |
| 20 | Rôle | choix | Membre | admin | src/lib/membres.ts:15 | |
| 21 | Rôle | choix | Administrateur | admin | src/lib/membres.ts:16 | |
| 22 | Rôle | confirmation | Rôle mis à jour (toast, message de changerRoleAction) | admin | src/app/actions/membres.ts:165 | |
| 23 | Rôle | erreur | Tu ne peux pas retirer ton propre rôle d'administrateur (toast) | admin | src/app/actions/membres.ts:150 | |
| 24 | Rôle | erreur | Modification impossible, réessaie dans un instant (toast) | admin | src/app/actions/membres.ts:157 | |
| 25 | Rôle | erreur | Réservé aux administrateurs (toast, si la session n'est pas admin) | admin | src/app/actions/membres.ts:29 | |
| 26 | Date | texte | Inconnu (si la date est absente) | admin | src/app/admin/page.tsx:24 | |

Compte de l'écran `/admin` : 26 lignes.

## /admin/mots : mots ajoutés par les membres

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | En-tête | titre | Mots ajoutés | admin | src/app/admin/mots/page.tsx:34 | |
| 2 | Carte | titre | Ajoutés par les membres ({nombre}) | admin | src/app/admin/mots/page.tsx:40 | |
| 3 | Carte | texte | Des mots français qu'aucune source ne donnait, chacun avec au moins une forme alsacienne. Ils sont déjà publiés. Si l'un pose problème, ouvre sa fiche et signale sa forme. | admin | src/app/admin/mots/page.tsx:43-45 | INTERNE |
| 4 | Liste vide | texte | Aucun mot ajouté pour l'instant. | admin | src/app/admin/mots/page.tsx:52-54 | |
| 5 | Ligne | lien | {mot français} (lien vers la fiche) | admin | src/app/admin/mots/page.tsx:60 | |
| 6 | Ligne | texte | {type de terme} · {date de création} | admin | src/app/admin/mots/page.tsx:67 | |
| 7 | Ligne | texte | Par {auteur} ou Compte supprimé depuis | admin | src/app/admin/mots/page.tsx:71 | |
| 8 | Ligne, formes | texte | {forme} (chaque forme ajoutée) | admin | src/app/admin/mots/page.tsx | |
| 9 | Ligne, formes | texte | {villages, séparés par une virgule} | admin | src/app/admin/mots/page.tsx | |
| 10 | Date | texte | (date formatée en fr-FR, jj/mm/aaaa) | admin | src/app/admin/mots/page.tsx:18 | |

Compte de l'écran `/admin/mots` : 10 lignes.

## /admin/signalements : signalements à traiter

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | En-tête | titre | Signalements | admin | src/app/admin/signalements/page.tsx:54 | |
| 2 | Carte | titre | À traiter ({nombre}) | admin | src/app/admin/signalements/page.tsx:60 | |
| 3 | Carte | texte | Un membre a signalé une forme précise. Rien n'a changé : à toi de juger, puis de marquer traité. | admin | src/app/admin/signalements/page.tsx:63-64 | INTERNE |
| 4 | Liste vide | texte | Aucun signalement en attente. | admin | src/app/admin/signalements/page.tsx:72 | |
| 5 | Ligne | lien | {mot français} → {forme} | admin | src/app/admin/signalements/page.tsx:84 | |
| 6 | Ligne | texte | {nom ou email du membre} · {date} | admin | src/app/admin/signalements/page.tsx:87 | |
| 7 | Ligne | bouton | Marquer traité | admin | src/app/admin/signalements/page.tsx:96 | |
| 8 | Ligne | confirmation | Marqué traité (toast, message de marquerTraiteAction) | admin | src/app/actions/signalements.ts:98 | |
| 9 | Ligne | erreur | Réservé aux administrateurs (toast) | admin | src/app/actions/signalements.ts:13 | |

Compte de l'écran `/admin/signalements` : 9 lignes.

## /admin/sources : sources écrites

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | En-tête | titre | Sources | admin | src/app/admin/sources/page.tsx:29 | |
| 2 | Carte | titre | Sources écrites ({nombre}) | admin | src/app/admin/sources/page.tsx:35 | INTERNE |
| 3 | Carte | texte | L'archive dont dérive le dictionnaire. Elle est en lecture seule : elle se régénère depuis data/sources/, pas depuis cet écran. | admin | src/app/admin/sources/page.tsx:38-40 | INTERNE (sens technique : source) |
| 4 | Tableau | en-tête | Source | admin | src/app/admin/sources/page.tsx:53 | INTERNE |
| 5 | Tableau | en-tête | Licence | admin | src/app/admin/sources/page.tsx:54 | |
| 6 | Tableau | en-tête | Fiabilité | admin | src/app/admin/sources/page.tsx:55 | |
| 7 | Tableau | en-tête | Attestations | admin | src/app/admin/sources/page.tsx:56 | |
| 8 | Tableau | en-tête | Témoignages | admin | src/app/admin/sources/page.tsx:57 | INTERNE |
| 9 | Tableau | texte | {nom de la source} (lien si une adresse existe) | admin | src/app/admin/sources/page.tsx:71 | |
| 10 | Tableau | texte | {code} · {année} | admin | src/app/admin/sources/page.tsx:77-78 | |
| 11 | Tableau | texte | Chargement… | admin | src/app/admin/sources/page.tsx:44 | |
| 12 | Tableau | texte | Aucune source. | admin | src/app/admin/sources/page.tsx:46 | |
| 13 | Tableau | erreur | Réservé aux administrateurs (si la session n'est pas admin) | admin | src/app/actions/sources.ts:7 | |

Compte de l'écran `/admin/sources` : 13 lignes.
est une hypothèse de libellé à confirmer).

## Messages renvoyés par les actions (affichés en toast ou en ligne)

Ces messages sont renvoyés par les actions serveur. Ils s'affichent dans les écrans
qui les déclenchent (voir les renvois « voir section Actions » ci-dessus).

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | Connexion | erreur | Indique ton adresse email et ton mot de passe | invité | src/app/actions/auth.ts:27 | |
| 2 | Connexion | erreur | Compte indisponible, contacte un administrateur | invité | src/app/actions/auth.ts:49 | |
| 3 | Connexion | erreur | Connexion impossible, réessaie dans un instant | invité | src/app/actions/auth.ts:54 | |
| 4 | Commun | erreur | Connecte-toi pour continuer (variantes, votes, villages, signalements) | membre | src/app/actions/variantes.ts:32, votes.ts:22 | |
| 5 | Commun | erreur | Connecte-toi pour jouer (jeu) | membre | src/app/actions/jeu.ts:71 | |
| 6 | Commun | erreur | Enregistrement impossible, réessaie dans un instant | membre | src/app/actions/votes.ts:68, variantes.ts:72, mots.ts:111, membres.ts:132 | |
| 7 | Commun | erreur | Réservé aux administrateurs | admin | src/app/actions/membres.ts:29, mots.ts:132, signalements.ts:13, sources.ts:7 | |
| 8 | Village | confirmation | Village enregistré | membre | src/app/actions/membres.ts:136 | |
| 9 | Village | erreur | Village introuvable | membre | src/app/actions/membres.ts:126 | |
| 10 | Village | erreur | Choisis d'abord ton village | membre | src/lib/contribution.ts:11 | |
| 11 | Mot | erreur | Écris le mot français | membre | src/app/actions/mots.ts:73 | |
| 12 | Mot | erreur | Trop long pour un mot | membre | src/app/actions/mots.ts:74 | |
| 13 | Mot | erreur | Choisis s'il s'agit d'un mot, d'une expression ou d'un proverbe | membre | src/app/actions/mots.ts:75 | |
| 14 | Mot | erreur | Ajoute sa forme alsacienne : un mot ne se crée pas sans elle | membre | src/app/actions/mots.ts:80 | INTERNE |
| 15 | Mot | erreur | Ce mot existe déjà. Ajoute ta forme sur sa fiche | membre | src/app/actions/mots.ts:90 | INTERNE |
| 16 | Forme | erreur | Cette forme est déjà connue de la base | membre | src/app/actions/variantes.ts:60 | INTERNE |
| 17 | Forme | erreur | Cette forme existe déjà. Ajoute plutôt ton village avec « Chez moi aussi » | membre | src/app/actions/variantes.ts:61 | INTERNE |
| 18 | Forme | erreur | Forme introuvable | membre | src/app/actions/variantes.ts:109, votes.ts:37,146 | INTERNE |
| 19 | Forme | erreur | Tu ne peux modifier que tes propres contributions | membre | src/app/actions/variantes.ts:111 | INTERNE |
| 20 | Forme | erreur | Quelqu'un d'autre a déjà revendiqué cette forme, elle ne se modifie plus | membre | src/app/actions/variantes.ts:114 | INTERNE |
| 21 | Forme | erreur | Cette forme existe déjà sur ce mot | membre | src/app/actions/variantes.ts:125 | INTERNE |
| 22 | Mot | erreur | Mot introuvable | membre | src/app/actions/variantes.ts:41 | |
| 23 | Signalement | confirmation | Signalement envoyé | membre | src/app/actions/signalements.ts:45 | |
| 24 | Signalement | erreur | Décris le problème | membre | src/app/actions/signalements.ts:28 | |
| 25 | Signalement | erreur | Envoi impossible, réessaie dans un instant | membre | src/app/actions/signalements.ts:42 | |
| 26 | Signalement | erreur | Forme introuvable (signalements) | membre | src/app/actions/signalements.ts:34 | INTERNE |
| 27 | Jeu | erreur | Partie introuvable | membre | src/app/actions/jeu.ts:171 | |
| 28 | Jeu | erreur | Cette manche n'est pas encore ouverte | membre | src/app/actions/jeu.ts:185 | |
| 29 | Jeu | erreur | Ce village ne fait pas partie des choix | membre | src/app/actions/jeu.ts:187,238 | |
| 30 | Jeu | erreur | Ta réponse est déjà enregistrée. Recharge la page pour continuer. | membre | src/app/actions/jeu.ts:199 | |
| 31 | Jeu | erreur | Ce défi n'est pas ouvert | membre | src/app/actions/jeu.ts:234 | |
| 32 | Jeu | erreur | Cette manche n'existe pas | membre | src/app/actions/jeu.ts:237 | |
| 33 | Rôle | confirmation | Rôle mis à jour | admin | src/app/actions/membres.ts:165 | |

Compte de la section « Messages des actions » : 33 lignes (dont des renvois).

## Composants partagés et libellés (transversal)

Ces textes apparaissent sur plusieurs écrans. Chacun est relevé une seule fois ici.

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | Carte de forme | texte | article : {article} (si l'article est connu) | tous | src/components/carte-variante.tsx:126 | |
| 2 | Carte de forme | texte | Écrit dans : (libellé suivi des noms des sources, séparés par « · », avec lien si une adresse existe) | tous | src/components/carte-variante.tsx:135-152 | |
| 3 | Carte de forme | texte | Dit à : (libellé suivi des noms des villages, séparés par « · ») | tous | src/components/carte-variante.tsx:158-159 | |
| 4 | Carte de forme | pastille | {nombre de sources} source{s} (pastille de confiance) | tous | src/components/badge-confiance.tsx:44 | INTERNE |
| 5 | Carte de forme | pastille | {nombre de villages} village{s} (pastille de confiance) | tous | src/components/badge-confiance.tsx:52 | |
| 6 | Carte de forme | pastille | Sans témoin (si ni source ni village) | tous | src/components/badge-confiance.tsx:59 | INTERNE |
| 7 | Carte de forme (infobulles) | a11y | Une source / Deux sources / Trois sources ou plus (title, selon le nombre) | tous | src/lib/dictionnaire.ts:187-189 | INTERNE |
| 8 | Carte de forme (infobulles) | a11y | {n} village(s) revendique(nt) cette forme (title) | tous | src/components/badge-confiance.tsx:49 | INTERNE |
| 9 | Carte de forme, sens | texte | Veut dire : (intitulé de la liste des sens) | membre | src/components/carte-forme.tsx:15 | |
| 10 | Carte de forme, sens | texte | et {n} autre{s} sens | membre | src/components/carte-forme.tsx:32 | |
| 11 | Fiche publique, en-tête | a11y | Retour à l'accueil (aria-label du chevron) | invité | src/components/fiche-publique.tsx:33 | |
| 12 | Fiche publique, en-tête | texte | Elsass Dico | invité | src/components/fiche-publique.tsx:42 | |
| 13 | Invitation publique | titre | Et chez toi, comment on le dit ? | invité | src/components/fiche-publique.tsx:58 | |
| 14 | Invitation publique | texte | Elsass Dico garde toutes les façons de dire l'alsacien, village par village. Rien n'est inventé : chaque mot vient d'un dictionnaire ou d'un Alsacien qui le parle. Avec un compte, tu ajoutes le parler de ton village. | invité | src/components/fiche-publique.tsx:61-63 | |
| 15 | Invitation publique | bouton | Jouer au défi du jour | invité | src/components/fiche-publique.tsx:70 | |
| 16 | Invitation publique | bouton | Créer mon compte | invité | src/components/fiche-publique.tsx:76 | |
| 17 | Invitation publique | texte | Déjà un compte ? | invité | src/components/fiche-publique.tsx:80 | |
| 18 | Invitation publique | lien | Se connecter | invité | src/components/fiche-publique.tsx:85 | |
| 19 | Carte des parlers | infobulle | {formes du village, séparées par « · »} puis {nom du village} (contenu du popup d'un point) | tous | src/components/carte-parlers.tsx:59-60 | |
| 20 | Recherche (liste) | texte | Aucun résultat. (message vide par défaut de la liste de suggestions) | tous | src/components/champ-suggestions.tsx:51 | |
| 21 | Chargement | a11y | Chargement (aria-label du squelette de liste) | tous | src/components/ui/list-skeleton.tsx:17 | |
| 22 | Erreur de chargement | texte | Le chargement n'a pas abouti. | tous | src/components/echec-chargement.tsx:14 | |
| 23 | Erreur de chargement | texte | Le serveur est peut-être occupé. Réessaie dans un instant. | tous | src/components/echec-chargement.tsx:15 | |
| 24 | Erreur de chargement | bouton | Réessayer | tous | src/components/echec-chargement.tsx:31 | |
| 25 | Fenêtres (dialogues) | a11y | Fermer (sr-only, bouton de fermeture de toute fenêtre) | membre | src/components/ui/dialog.tsx:49 | |
| 26 | Lien vers la carte | lien | Voir sur la carte | membre | src/components/lien-carte.tsx:14 | |
| 27 | Libellé de département | texte | Bas-Rhin / Haut-Rhin / Moselle (selon le code du département) | tous | src/lib/dictionnaire.ts:85-87 | |
| 28 | Libellé de type de terme | texte | Mot / Expression / Proverbe / Toponyme / Prénom | tous | src/lib/dictionnaire.ts:16-20 | |
| 29 | Libellé de rôle | texte | Membre / Administrateur | admin | src/lib/membres.ts:15-16 | |
| 30 | Libellé de confiance | texte | Une source / Deux sources / Trois sources ou plus | tous | src/lib/dictionnaire.ts:187-189 | INTERNE (voir #7) |
| 31 | Articles proposés | choix | d'r / d' / s' / de (libellés des articles proposés), avec « Sans article » et « Autre » dans le champ | membre | src/lib/saisie-forme.ts:32-35 | |
| 32 | Libellé de chargement de la carte | texte | Chargement de la carte… | membre | src/app/carte/carte-demo.tsx:40 | |
| 33 | Page introuvable (pages dynamiques) | texte | Texte par défaut de Next.js (aucun fichier not-found dans l'app) : « This page could not be found. » (non vérifié à l'écran) | tous | src/app (aucun not-found.tsx) | ANGLAIS |
| 34 | Fichier de l'application installée | metadata | Elsass Dico (nom court et nom) | tous | src/app/manifest.ts:8-9 | |
| 35 | Fichier de l'application installée | metadata | Le français-alsacien, village par village. | tous | src/app/manifest.ts:10 | |

Compte de la section : 35 lignes.

## Transversal : erreurs, chargements, pages introuvables, métadonnées

| # | Bloc | Type | Texte exact | Visible par | Fichier:ligne | ! |
|---|---|---|---|---|---|---|
| 1 | Page introuvable | texte | Texte par défaut de Next.js (voir composants #33) | tous | src/app (aucun fichier not-found) | ANGLAIS |
| 2 | Erreur serveur | texte | Texte par défaut de Next.js (aucun fichier error.tsx ni global-error.tsx dans l'app) | tous | src/app (aucun fichier error) | ANGLAIS |
| 3 | Chargement de page | texte | Aucun fichier loading.tsx : pas de texte propre (squelettes de liste, voir composants #21) | tous | src/app (aucun fichier loading) | |
| 4 | Métadonnées racine | metadata | Elsass Dico · Traducteur français-alsacien | tous | src/app/layout.tsx:34 | |
| 5 | Métadonnées racine | metadata | Le français-alsacien, village par village : tiré de sources écrites et des Alsaciens qui le parlent, jamais une traduction inventée. Un projet de The Elsassisch. | tous | src/app/layout.tsx:35-36 | |
| 6 | Image de partage | texte | voir /jeu, lignes 5 à 11 (image générée par src/app/api/partage/defi/route.tsx) | tous | src/app/api/partage/defi/route.tsx | |
| 7 | Routes non affichées | (aucun) | src/app/api/automatisation/defi-du-jour/route.ts : messages d'erreur JSON consommés par l'automatisation (N8N), jamais affichés à l'écran | (non affiché) | src/app/api/automatisation/defi-du-jour/route.ts:42-43 | |
| 8 | Routes non affichées | (aucun) | src/app/api/session/refresh/route.ts : pas de texte affiché (réponse de session) | (non affiché) | src/app/api/session/refresh/route.ts | |

Compte de la section : 8 lignes (dont 2 hors écran, 1 renvoi à /jeu, 2 renvois et 1 constat).


## Fichiers couverts (périmètre complet)

Chaque fichier du périmètre, zéro compris. « Textes relevés » compte les lignes du tableau qui pointent vers ce fichier.

| Fichier | Textes relevés | Remarque |
|---|---|---|
| `src/app/actions/accueil.ts` | 0 | renvoie des données, aucun message affiché |
| `src/app/actions/auth.ts` | 3 | |
| `src/app/actions/carte.ts` | 0 | renvoie des données, aucun message affiché |
| `src/app/actions/communes.ts` | 0 | renvoie des données, aucun message affiché |
| `src/app/actions/formes.ts` | 0 | renvoie des données, aucun message affiché |
| `src/app/actions/jeu.ts` | 7 | |
| `src/app/actions/membres.ts` | 8 | |
| `src/app/actions/mots.ts` | 5 | |
| `src/app/actions/navigation.ts` | 0 | renvoie des données, aucun message affiché |
| `src/app/actions/premiers-pas.ts` | 0 | renvoie des données, aucun message affiché |
| `src/app/actions/recherche.ts` | 0 | renvoie des données, aucun message affiché |
| `src/app/actions/signalements.ts` | 6 | |
| `src/app/actions/sources.ts` | 1 | |
| `src/app/actions/variantes.ts` | 8 | |
| `src/app/actions/votes.ts` | 1 | |
| `src/app/admin/mots/page.tsx` | 10 | |
| `src/app/admin/page.tsx` | 20 | |
| `src/app/admin/signalements/page.tsx` | 7 | |
| `src/app/admin/sources/page.tsx` | 12 | |
| `src/app/api/automatisation/defi-du-jour/route.ts` | 1 | |
| `src/app/api/partage/defi/route.tsx` | 8 | |
| `src/app/api/session/refresh/route.ts` | 1 | |
| `src/app/carte/aide-carte.tsx` | 7 | |
| `src/app/carte/carte-demo.tsx` | 17 | |
| `src/app/carte/page.tsx` | 1 | |
| `src/app/carte/panneau-contribution.tsx` | 4 | |
| `src/app/carte/panneau-forme.tsx` | 3 | |
| `src/app/carte/pastille-couleur.tsx` | 0 | aucun texte affiché |
| `src/app/dashboard/page.tsx` | 17 | |
| `src/app/dashboard/premiers-pas.tsx` | 15 | |
| `src/app/dashboard/village-profil.tsx` | 10 | |
| `src/app/dictionnaire/page.tsx` | 19 | |
| `src/app/entree/[id]/actions-row.tsx` | 4 | |
| `src/app/entree/[id]/editer-variante.tsx` | 5 | |
| `src/app/entree/[id]/page.tsx` | 10 | |
| `src/app/entree/[id]/signaler/page.tsx` | 3 | |
| `src/app/entree/[id]/signaler/signaler-actions.tsx` | 11 | |
| `src/app/forme/page.tsx` | 10 | |
| `src/app/jeu/bilan.tsx` | 21 | |
| `src/app/jeu/ecran-jeu.tsx` | 17 | |
| `src/app/jeu/page.tsx` | 4 | |
| `src/app/jeu/partage.tsx` | 8 | |
| `src/app/jeu/partie.tsx` | 24 | |
| `src/app/layout.tsx` | 4 | |
| `src/app/login/page.tsx` | 15 | |
| `src/app/manifest.ts` | 2 | |
| `src/app/page.tsx` | 37 | |
| `src/app/prenom/[slug]/page.tsx` | 8 | |
| `src/app/profile/page.tsx` | 1 | |
| `src/app/recherche-accueil.tsx` | 2 | |
| `src/app/recherche/page.tsx` | 17 | |
| `src/app/sources/page.tsx` | 15 | |
| `src/app/village/[slug]/page.tsx` | 13 | |
| `src/components/app-header.tsx` | 7 | |
| `src/components/app-nav-shell.tsx` | 8 | |
| `src/components/auth-provider.tsx` | 0 | aucun texte affiché |
| `src/components/badge-confiance.tsx` | 9 | |
| `src/components/carte-forme.tsx` | 4 | |
| `src/components/carte-parlers.tsx` | 1 | |
| `src/components/carte-variante.tsx` | 3 | |
| `src/components/champ-suggestions.tsx` | 1 | |
| `src/components/contribution/bouton-chez-moi.tsx` | 3 | |
| `src/components/contribution/bouton-contribuer.tsx` | 3 | |
| `src/components/contribution/champ-forme.tsx` | 7 | |
| `src/components/contribution/feuille-chez-moi.tsx` | 21 | |
| `src/components/contribution/feuille-contribution.tsx` | 45 | |
| `src/components/contribution/habillage.tsx` | 8 | |
| `src/components/echec-chargement.tsx` | 3 | |
| `src/components/fiche-publique.tsx` | 8 | |
| `src/components/inverseur-sens.tsx` | 7 | |
| `src/components/layout-wrapper.tsx` | 0 | aucun texte affiché |
| `src/components/lien-carte.tsx` | 2 | |
| `src/components/sens-provider.tsx` | 0 | aucun texte affiché |
| `src/components/ui/accordion.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/alert-dialog.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/alert.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/aspect-ratio.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/avatar.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/badge.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/breadcrumb.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/button.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/calendar.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/card.tsx` | 0 | importé, sans texte propre |
| `src/components/ui/carousel.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/chart.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/checkbox.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/collapsible.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/command.tsx` | 0 | importé, sans texte propre |
| `src/components/ui/context-menu.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/dialog.tsx` | 1 | |
| `src/components/ui/drawer.tsx` | 0 | importé, sans texte propre |
| `src/components/ui/dropdown-menu.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/form.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/hover-card.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/input-otp.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/input.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/label.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/list-skeleton.tsx` | 1 | |
| `src/components/ui/menubar.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/navigation-menu.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/pagination.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/popover.tsx` | 0 | importé, sans texte propre |
| `src/components/ui/progress.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/radio-group.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/resizable.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/scroll-area.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/select.tsx` | 0 | importé, sans texte propre |
| `src/components/ui/separator.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/sheet.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/sidebar.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/skeleton.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/slider.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/sonner.tsx` | 0 | importé, sans texte propre |
| `src/components/ui/switch.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/table.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/tabs.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/textarea.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/toggle-group.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/toggle.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
| `src/components/ui/tooltip.tsx` | 0 | non importé par l'app (inutilisé à l'écran) |
