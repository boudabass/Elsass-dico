// Génère .design-sync/entry.ts — le point d'entrée du bundle design-sync.
//
// Pourquoi une entrée explicite plutôt que l'entrée synthétisée par le
// convertisseur : celle-ci part de `srcDir` et avale tout ce qui s'y trouve.
// Sur une app Next, ça embarquerait src/app/** et ses imports `next/navigation`,
// `server-only`, Supabase — rien de tout ça ne se bundle pour un rendu isolé.
// Ici on ne réexporte que src/components/ui/.
//
// Les noms sont listés un par un plutôt qu'en `export *` : une collision entre
// deux modules serait sinon exclue en silence par la sémantique ESM, et le
// composant manquerait au bundle sans une seule erreur.
//
//   node .design-sync/gen-entry.mjs
//
// À relancer après tout ajout ou retrait dans src/components/ui/.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const DIR = 'src/components/ui';

function exportsDe(txt) {
  const noms = new Set();
  for (const m of txt.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const t = part.trim();
      if (!t) continue;
      // `export { type ChartConfig }` : un type n'existe pas à l'exécution,
      // le réexporter comme valeur casse le bundle.
      if (/^type\s/.test(t)) continue;
      const alias = /\bas\s+([A-Za-z0-9_$]+)$/.exec(t);
      const nom = alias ? alias[1] : t;
      if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(nom)) noms.add(nom);
    }
  }
  for (const m of txt.matchAll(/export\s+(?:const|function|class)\s+([A-Za-z0-9_$]+)/g)) noms.add(m[1]);
  return [...noms].filter((n) => n !== 'default').sort();
}

const lignes = [];
const vus = new Map();
for (const f of readdirSync(DIR).filter((n) => n.endsWith('.tsx')).sort()) {
  const noms = exportsDe(readFileSync(`${DIR}/${f}`, 'utf8'));
  if (!noms.length) continue;
  for (const n of noms) {
    if (vus.has(n)) {
      console.error(`collision: ${n} exporté par ${vus.get(n)} et ${f} — arbitrer avant de continuer`);
      process.exit(1);
    }
    vus.set(n, f);
  }
  lignes.push(`export { ${noms.join(', ')} } from "../${DIR}/${f.replace(/\.tsx$/, '')}";`);
}

writeFileSync(
  '.design-sync/entry.ts',
  '// GÉNÉRÉ par .design-sync/gen-entry.mjs — ne pas éditer à la main.\n' +
    `// ${vus.size} exports sur ${lignes.length} modules de ${DIR}.\n` +
    lignes.join('\n') +
    '\n',
);
console.log(`entry.ts : ${vus.size} exports, ${lignes.length} modules`);
