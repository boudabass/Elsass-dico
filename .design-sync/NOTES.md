# Design-Sync Notes

## 28/08/2026 — Re-sync avec changements UI pendants

**Statut**: Bundle du 27/08 prêt à uploader. Changements UI du 28/08 non encore syncés (voir ci-dessous).

**Changements du 28/08 impactant les composants UI:**
- `src/components/ui/button.tsx` — modifié
- `src/components/ui/checkbox.tsx` — modifié
- `src/components/ui/input.tsx` — modifié
- `src/components/ui/select.tsx` — modifié
- `src/components/ui/textarea.tsx` — modifié
- `src/app/globals.css` — modifié (styles globaux)

Ces changements ne sont pas inclus dans le bundle `ds-bundle/` du 27/08. Après l'upload actuel, un re-sync supplémentaire sera nécessaire pour refléter ces modifications une fois que l'environnement de build du converter est corrigé.

**Problème technique**:
Le converter `package-build.mjs` du skill design-sync a besoin de dépendances npm (esbuild, ts-morph, etc.) qui ne sont pas disponibles par défaut dans le contexte du skill. Les workarounds avec symlinks/NODE_PATH n'ont pas suffi. Solution: configurer les dépendances du skill ou relancer depuis un environnement avec pnpm v11 complètement isolé.

**Bundle du 27/08 contient:**
- Mise à jour de l'identité visuelle du 25/08 (palette The Elsassisch, fond clair, tokens marque-or/marque-rouge-texte)
- Tous les composants UI jusqu'au 26/08
- 107 composants et sous-composants declarés dans componentSrcMap
