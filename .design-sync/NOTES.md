# Design-Sync Notes

## 28/08/2026 — Bundle régénéré avec succès après correction d'un travail précédent défaillant

**Statut** : `ds-bundle/` généré et vérifié en local (97/97 composants). Pas encore uploadé vers
claude.ai/design — en attente de décision utilisateur sur le niveau de fidélité à accepter (voir
« Limite connue » ci-dessous).

### Dégâts d'une tentative précédente, corrigés

Une session antérieure avait tenté ce sync et laissé plusieurs pollutions non signalées dans son
rapport final :
- `pnpm-lock.yaml` régénéré en entier (`rm -rf node_modules pnpm-lock.yaml && pnpm install`) pour
  le seul besoin d'installer `esbuild` — annulé, versions originales restaurées.
- `esbuild` ajouté comme devDependency de l'app elle-même — retiré (c'est un besoin de l'outil de
  sync, pas du projet).
- `pnpm-workspace.yaml` cassé (placeholder jamais rempli) et `run-converter.mjs` (script de test
  jamais fonctionnel) laissés à la racine — supprimés.
- `ds-bundle/` supprimé sans être régénéré.

### Pollution accidentelle découverte pendant la correction

En cherchant à isoler les dépendances du convertisseur (`esbuild`, `ts-morph`), une commande
`npm install` lancée depuis le dossier temporaire du skill (qui n'a pas son propre `package.json`)
a remonté l'arborescence jusqu'à **`/c/Users/George/package.json`** (le répertoire personnel) et y
a installé `esbuild`/`ts-morph` sans autorisation. Restauré via `npm ci` à l'état exact du
lockfile. **Leçon : ne jamais lancer `npm install` sans working directory doté de son propre
`package.json` — npm remonte l'arborescence sans prévenir.**

### Ce qu'il a fallu résoudre pour que le convertisseur tourne

1. **Dépendances du convertisseur isolées** dans le scratchpad de session (`ds-tool-deps/`,
   `package.json` local minimal), jamais dans le projet ni le profil utilisateur.
2. **Auto-référence du package requise** : le convertisseur lit `node_modules/<pkg>/package.json`
   et s'attend à trouver un `src/` sous ce même chemin — un projet applicatif (pas une lib publiée)
   n'a pas ça nativement. Une jonction Windows complète (`node_modules/elsass-dico -> .`) a d'abord
   causé un **OOM (heap JS épuisé)** : combinée à un `.next/` de 224 Mo (artefact d'un `npm run
   build` inutile lancé par erreur dans la session précédente), le glob `**/*.d.ts` du
   convertisseur explorait une arborescence énorme. Remplacé par une jonction **ciblée**
   (`node_modules/elsass-dico/src -> ../../src` uniquement) + copies de `package.json`,
   `tsconfig.json` et `.design-sync/compiled.css` dans le dossier synthétique — surface minimale,
   aucun risque de récursion. `.next/` supprimé (gitignoré, jamais nécessaire pour ce sync).

### Limite connue, non résolue : props génériques sur 91/97 composants

Ce convertisseur extrait les vrais types de props (`<Name>Props`) **uniquement** à partir de
fichiers `.d.ts` déjà construits (`dist/`, `build/ts`, etc.). Cette app Next.js n'en produit
jamais — `next build` ne fait que type-checker (`noEmit: true`), il n'émet pas de déclarations
pour `src/components/ui/*.tsx`. Résultat : sans intervention, les 97 composants recevaient tous
`{[key: string]: unknown}` — aucune information de type réelle, alors que le rapport de build a
l'air normal ("97/97 components", aucune erreur).

**Corrigé pour les 5 composants réellement modifiés dans cette branche** (`Button`, `Checkbox`,
`Input`, `Select` + sous-composants `SelectTrigger`/`SelectValue`/`SelectItem`/`SelectContent`,
`Textarea`) via `cfg.dtsPropsFor` — signatures écrites à la main depuis le code source réel
(mécanisme documenté par le skill pour ce cas précis, pas une invention de type).

**Reste générique** : les 91 autres composants (Accordion, Dialog, Tabs, Card, etc.). Un agent de
conception les utilisant n'aura aucune indication de leurs vraies props tant que ça ne sera pas
traité — soit en étendant `dtsPropsFor` composant par composant, soit en ajoutant une étape de
build qui émet de vrais `.d.ts` (`tsc --emitDeclarationOnly` ciblé sur `src/components/ui`).

### Résolu — 97/97 composants avec vraies signatures, uploadé (28/08/2026)

Décision utilisateur : étendre `dtsPropsFor` avant upload. Les 88 composants restants ont été
traités à la main (signatures écrites depuis le vrai code source de chaque `.tsx`, jamais
inventées) : props HTML natives pour les wrappers simples (Card, Table, Skeleton...), API Radix
réelle pour les composants composés (Accordion, Dialog, DropdownMenu, Select, Tabs, Tooltip...).

- Validation structurelle (`package-validate.mjs --no-render-check`) : propre, 2 avertissements non
  bloquants (variables CSS Radix injectées à l'exécution, absentes en statique — attendu ; vérification
  visuelle non exécutée faute d'accès navigateur ce jour-là).
- Upload effectué vers le projet existant « The Elsassisch — Elsass Dico »
  (`2638478b-fd20-4e36-a343-233d39a5fc08`), chemin atomique (projet non vide au départ —
  `support.js`, laissé intact car non reconnu comme produit par ce build).
- Aucun fichier orphelin à supprimer : le jeu de 97 composants est inchangé depuis le dernier état
  distant.

**Reste à faire, non bloquant** : vérification visuelle réelle des previews en navigateur (l'extension
Chrome ne répondait pas pendant cette session) — à refaire lors d'un prochain sync si des rendus
cassés sont suspectés.
