# Product

<!-- impeccable:product-schema 1 -->

Contexte produit pour le travail de design (skill Impeccable). Ce fichier
résume, il ne tranche rien : la cible fait foi dans
`documentation/20-REFONTE-CARTE-DES-PARLERS.md`, l'historique des décisions
dans `CLAUDE.md`. S'ils divergent, ce sont eux qui ont raison, et ce fichier
est à corriger.

## Platform

web

## Users

**Le membre qui fait vivre son parler.** Il ne se contente pas de remplir un
dictionnaire : il construit sa propre version de l'alsacien, celle de son
village. Il ajoute les formes qu'il emploie, les situe en choisissant son
village, et confirme celles qu'il partage déjà : voter pour une forme, c'est
simplement y attacher son village (confirmé par John le 23/09/2026). Tous les
membres sont des utilisateurs The Elsassisch, avec un compte créé sur le
portail Odoo. Deux rôles seulement : membre (tout membre contribue) et admin
(modération).

**Le visiteur sans compte** arrive sur la home ou sur une fiche de village ou
de prénom, souvent depuis un moteur de recherche. Il doit comprendre ce
qu'est le site et voir de vrais mots alsaciens avant qu'on lui demande un
compte.

**Décision ouverte** : le 02/09/2026, l'apprenant / le curieux avait été
désigné comme l'utilisateur qui arbitre les conflits de conception. Ce rôle
n'a pas été reconduit explicitement depuis que les membres construisent le
contenu. Qui tranche quand l'apprenant et le locuteur ont des besoins
opposés reste à décider.

## Product Purpose

Elsass Dico est un traducteur français-alsacien, publié sur
elsass-dico.theelsassisch.com sous la marque The Elsassisch.

Le projet a changé de nature le 11/09/2026. Il visait un dictionnaire à
contenu fixe, d'un alsacien unifié sans variantes, arbitré mot par mot :
quatre mois d'arbitrage avaient produit 338 entrées, dont 331 toponymes. Il
est devenu une **carte des parlers** :

- les sources écrites forment le contenu de départ, mais ne sont plus la
  seule source de vérité ;
- toutes les variantes coexistent, chacune portée par ses sources écrites et
  par les villages qui la revendiquent ;
- le dictionnaire n'a plus de limite de contenu : chaque membre peut le faire
  vivre avec son parler.

**But final, toujours visé : un alsacien unifié** (confirmé par John le
23/09/2026). La carte en est la matière première. **Décision ouverte** :
comment et quand un standard sera tiré de la carte. Rien dans le produit
actuel ne promeut une forme plutôt qu'une autre, et la doctrine en vigueur
reste « aucune forme n'est la bonne ».

Le produit réussit quand un membre retrouve le parler de son village, avec
ce qui fonde chaque forme, et peut y ajouter le sien.

## Positioning

Aucune forme n'est déclarée « la bonne ». Chaque forme dit ce qui la fonde :
combien de sources écrites, combien de villages, jamais un chiffre qui
mélange les deux. Une divergence entre deux villages n'est pas une erreur à
arbitrer, c'est l'information que la carte montre (`Riaschpa` et `Rieschbi`
sont deux villages). Un dictionnaire classique ne peut pas prétendre à ça
sans reconstruire sa doctrine.

## Operating Context

- **Mobile-first.** L'app a été reconstruite d'après un handoff mobile
  (28/08/2026) : barre d'onglets en bas sur mobile, rail latéral dès la
  tablette.
- **Écrans authentifiés** : recherche, dictionnaire A-Z paginé, carte des
  parlers (l'écran central), fiche de mot, « Mon espace » (choix du village),
  signalement d'une forme, admin (membres, signalements, sources).
- **Écrans publics**, les seuls indexables : la home de présentation, une
  page par village et par prénom attestés (générées statiquement), et
  `/sources`.
- **Le village se choisit dans une liste**, il n'est jamais détecté. Le mot
  « géolocalisation » ne paraît nulle part dans l'interface : on demande d'où
  vient ton parler, pas où tu habites.
- **Pas de vote contre.** Un vote rattache un village à une forme ; on le
  retire, on ne vote pas contre une forme.

## Capabilities and Constraints

- **Rien d'inventé.** Aucune forme alsacienne générée par un LLM, jamais, pas
  même pour un exemple ou un test. Une forme de locuteur s'enregistre
  verbatim, jamais recadrée vers une graphie.
- **Toujours dire ce qui fonde une forme** : sources écrites et villages, en
  deux chiffres distincts. Peu attesté est publiable ; le faire passer pour
  bien attesté ne l'est pas.
- **Compte obligatoire** hors des pages publiques ; la création de compte se
  fait uniquement sur le portail Odoo, qui sert de SSO à d'autres projets.
- **Modération humaine** : rien ne passe sans validation, via les
  signalements traités en admin.
- **Aucun service extérieur à l'exécution.** Une bibliothèque dans le bundle
  et des données versionnées sont à nous ; un serveur tiers interrogé à
  chaque visite ne l'est pas. La carte n'a pas de tuiles : son fond est un
  fichier que nous servons.
- **Les licences des données réutilisées sont respectées**, y compris la
  mention de paternité, qui peut changer de place mais jamais disparaître
  (elle vit sur `/sources`).
- **Référentiel** : 1 605 communes (Bas-Rhin, Haut-Rhin, toute la Moselle).
  L'aire linguistique de la Moselle reste non renseignée : aucune liste
  officielle n'existe, et la tracer nous-mêmes fabriquerait une donnée.
- **ORTHAL** (AGATE, 2023) n'est plus l'arbitre des formes, mais reste la
  clé de lecture des graphies (`Barr` et `Bàrr` ne notent pas le même /a/).
- **Hors périmètre, reportés** : le gameplay, l'auto-inscription hors Odoo,
  l'aire linguistique du 57.

## Brand Commitments

- **Marque** : Elsass Dico, adossé à The Elsassisch. La crédibilité
  linguistique est critique : du faux alsacien publié sous cette marque
  serait un vrai problème.
- **Voix** (confirmé par John le 23/09/2026) :
  - **tutoiement** partout dans l'interface (« Choisis ton village »,
    « Clique un point ») ;
  - **jamais de tiret long (« — »)** dans le texte affiché à l'écran, quelle
    que soit sa justesse grammaticale : deux phrases courtes, ou une virgule.
- **Police des titres** : Azimut, celle du logotype du site The Elsassisch.
  Sa licence (CC BY-ND 4.0) demande une attribution qui n'est encore faite
  nulle part : John traite ce point séparément.

## Evidence on Hand

- **Contenu dérivé des sources** (12/09/2026) : 25 864 lemmes,
  41 646 variantes, 42 135 témoignages, dérivés automatiquement de
  27 179 attestations d'archive, sans décision humaine par mot.
- **819 communes sur 1 605** ont au moins une forme attestée, et
  **131 prénoms** sont attestés.
- **Sources écrites** listées sur `/sources`, dont le dictionnaire en ligne
  d'André Nisslé (`culture_alsace`, crédité à tort à Raymond Matzen jusqu'au
  18/09/2026).
- **Communauté** : la contribution est neuve. Au 16/09/2026, un seul
  témoignage réel de locuteur portait un village. Il n'existe ni
  témoignages d'utilisateurs, ni chiffres d'usage, ni presse sur l'app : ne
  pas en inventer.

## Product Principles

1. **Aucune forme n'est la bonne, et toutes disent d'où elles viennent.**
   Montrer, jamais trancher ; chaque forme porte ses sources et ses villages.
2. **Le membre construit son parler, il ne remplit pas un formulaire.**
   Ajouter une forme ou y attacher son village doit rester un geste simple,
   au plus près de la carte et du mot.
3. **Rien d'inventé, rien d'effacé.** Pas de forme générée ; pas de forme
   supprimée parce qu'une autre serait meilleure.
4. **Le village est un choix, jamais une détection.**
5. **Autonome et honnête sur ses sources** : pas de dépendance à un service
   tiers, et les licences respectées jusqu'à la mention de paternité.

## Accessibility & Inclusion

Pratique établie par l'audit du 21/09/2026 plutôt qu'un standard exigé par
un utilisateur précis : contraste texte au niveau WCAG AA, cibles tactiles
d'au moins 36 px, champs de saisie à 16 px minimum (sous ce seuil, iOS zoome
au focus), navigation clavier complète des champs à suggestions, et
mouvements réduits sans supprimer le signal de chargement.
