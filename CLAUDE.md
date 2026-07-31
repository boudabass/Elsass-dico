# Elsass Dico

Traducteur français/alsacien, publié sur dico.theelsassisch.fr, adossé à la
marque The Elsassisch. La crédibilité linguistique est critique : du faux
alsacien publié sous cette marque serait un vrai problème.

## Règles non négociables sur les données

1. Aucune traduction générée par un LLM. Jamais. Une entrée inventée est pire
   que pas d'entrée.
2. Aucune copie d'une source unique. La base se construit par recoupement : un
   équivalent attesté dans plusieurs sources indépendantes est retenu, puis
   réécrit en Orthal. Divergence entre sources = entrée marquée pour arbitrage
   manuel.
3. Chaque entrée porte un champ sources et un nombre d'attestations, qui sert
   de score de confiance.
4. Rien ne passe en production sans validation humaine. Statut "à valider" par
   défaut.

## Doctrine éditoriale

- Référence orthographique : ORTHAL 2023 (association AGATE). C'est un système
  de graphie, pas un dictionnaire. Il s'applique en sortie, il ne traduit rien.
- Alsacien unifié : règle "Premier est Roi", la traduction canonique est à
  l'index 0 du tableau JSONB.
- Homonymes séparés en entrées distinctes via le champ contexte.
- Variantes Bas-Rhin / Haut-Rhin conservées quand elles diffèrent.

## État réel (audit du 31/07/2026)

- Le front est un boilerplate Dyad intact, zéro code métier. La landing affiche
  "Template Next.js Boilerplate".
- Aucune table dictionnaire dans supabase/migrations, seulement profiles et
  app_settings. Pas de pg_trgm ni unaccent malgré ce qu'annonce le README.
- Le dossier Dictionnaire contient 7260 entrées (lettres A à D), mais c'est un
  scrape mot pour mot d'une source unique : culture.alsace.pagesperso-orange.fr,
  dont le miroir est commité dans temp_page_af.html. Cela viole la règle 2. À
  traiter comme source 1 sur N, jamais comme base de référence.
- Sur 14377 traductions, les champs variante, niveau, region et note sont
  remplis 0 fois. tags vide à 100%, contexte vide à 99,9%. 227 clés
  français+contexte en doublon, homonymes non arbitrés.
- Les chiffres 46000 (README, doc schéma) et 30000 (doc import) sont des
  objectifs, pas des existants. À corriger dans la doc.
- scripts/import_existing.py insère dans des tables qui n'existent pas et
  n'implémente aucune règle de la doctrine.

## Blocages déploiement identifiés

1. docker-compose.yml pointe vers ghcr.io/boudabass/game-4:latest, l'image d'un
   autre projet.
2. Le Dockerfile fait "corepack prepare pnpm@latest", non déterministe, ce qui
   casse le build (ERR_PNPM_IGNORED_BUILDS sur sharp). Pinner la version.
3. Les variables NEXT_PUBLIC_* doivent être passées en build args, sinon le
   build échoue sur "Missing Supabase environment variables".
4. Une URL et une clé anon Supabase en dur, en fallback silencieux, étaient
   répétées dans src/integrations/supabase/client.ts,
   src/app/actions/auth.ts, src/utils/supabase/middleware.ts et
   src/utils/supabase/server.ts. À supprimer partout.
5. middleware.ts à la racine est du code mort, c'est src/middleware.ts qui est
   actif. Résidus du projet game-4 dans .dockerignore et le Dockerfile.

## Infra

Coolify self-hosted v4.1.2 sur VPS OVH. Supabase self-hosted à déployer dessus.

## Décisions prises

- Modèle de données à deux niveaux retenu : attestations brutes par source,
  puis entrees dérivées par recoupement. Le schéma à 4 tables plates de la
  doc initiale est abandonné.
- Déploiement : GitHub Actions construit l'image et la publie sur
  ghcr.io/boudabass/elsass-dico. Coolify tire l'image, il ne build pas. Les
  NEXT_PUBLIC_* sont gravées dans l'image au build, donc elles vivent dans
  les secrets GitHub. SUPABASE_SERVICE_ROLE_KEY est une variable runtime
  dans Coolify uniquement.
- Domaine : dico.theelsassisch.fr
- Prochaine étape après la migration : ingérer les 7260 entrées du dossier
  Dictionnaire dans attestations avec la source culture_alsace. Elles ne
  doivent jamais alimenter entrees directement.

## Règles de travail

- Ne jamais inventer de traduction alsacienne, même pour un exemple ou un test.
- Ne jamais remplir la base sans recoupement multi-sources.
- Toujours demander avant de supprimer des données existantes.
