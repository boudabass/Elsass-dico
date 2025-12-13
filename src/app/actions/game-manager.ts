'use server';

import fs from 'fs/promises';
import path from 'path';
import { readdir, stat } from 'fs/promises';
import { getDb } from '@/lib/database';

const GAMES_DIR = path.join(process.cwd(), 'public', 'games');

// S'assurer que le dossier games existe
async function ensureGamesDir() {
  try {
    await fs.access(GAMES_DIR);
  } catch {
    await fs.mkdir(GAMES_DIR, { recursive: true });
  }
}

// Récupérer les jeux depuis la DB (Métadonnées uniquement pour l'admin)
export async function listGamesFromDb() {
  const db = await getDb();
  await db.read();
  return db.data.games;
}

export interface GameFolder {
  name: string;
  versions: string[];
  lastModified: number;
}

export async function listGamesFolders(): Promise<GameFolder[]> {
  await ensureGamesDir();
  const entries = await readdir(GAMES_DIR, { withFileTypes: true });
  
  // On construit la liste avec les dates de modif
  const gameFoldersPromises = entries
    .filter(entry => entry.isDirectory())
    .map(async (entry) => {
      const gamePath = path.join(GAMES_DIR, entry.name);
      
      // Récupérer la date de modif du dossier jeu
      const stats = await stat(gamePath);
      
      let versions: string[] = [];
      try {
        const versionEntries = await readdir(gamePath, { withFileTypes: true });
        
        // Récupérer les dates de modif des versions
        const versionsWithStats = await Promise.all(
          versionEntries
            .filter(v => v.isDirectory())
            .map(async (v) => {
              const vPath = path.join(gamePath, v.name);
              const vStats = await stat(vPath);
              return { name: v.name, time: vStats.mtimeMs };
            })
        );

        // Trier versions par date (récent en haut)
        versions = versionsWithStats
          .sort((a, b) => b.time - a.time)
          .map(v => v.name);

      } catch (e) {
        // Ignorer si vide
      }

      return {
        name: entry.name,
        versions,
        lastModified: stats.mtimeMs
      };
    });

  const gameFolders = await Promise.all(gameFoldersPromises);

  // TRI JEUX : Plus récent en haut
  return gameFolders.sort((a, b) => b.lastModified - a.lastModified);
}

export async function createGameFolder(gameName: string) {
  const safeName = gameName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const dirPath = path.join(GAMES_DIR, safeName, 'v1');
  
  await fs.mkdir(dirPath, { recursive: true });

  // Enregistrement DB
  const db = await getDb();
  const gameId = `${safeName}-v1`;
  
  const exists = db.data.games.find(g => g.id === gameId);
  if (!exists) {
    await db.update(({ games }) => games.push({
      id: gameId,
      name: gameName,
      description: "Description par défaut",
      path: `${safeName}/v1`,
      version: 'v1',
      createdAt: new Date().toISOString()
    }));
  }

  // On régénère l'index pour inclure les fichiers potentiellement copiés à la main
  await generateIndexHtml(safeName, 'v1', { bgColor: '#000000' });

  return { success: true, gameName: safeName, version: 'v1', message: exists ? "Jeu existant mis à jour (index.html régénéré)" : "Nouveau jeu créé" };
}

export async function createGameVersion(gameName: string, versionName: string) {
  const safeVersion = versionName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const dirPath = path.join(GAMES_DIR, gameName, safeVersion);
  
  // 1. Création physique
  await fs.mkdir(dirPath, { recursive: true });

  // 2. Enregistrement DB
  const db = await getDb();
  const gameId = `${gameName}-${safeVersion}`;
  
  const exists = db.data.games.find(g => g.id === gameId);
  if (!exists) {
    await db.update(({ games }) => games.push({
      id: gameId,
      name: gameName,
      description: `Version ${safeVersion}`,
      path: `${gameName}/${safeVersion}`,
      version: safeVersion,
      createdAt: new Date().toISOString()
    }));
  }

  // 3. Génération index.html
  await generateIndexHtml(gameName, safeVersion, { bgColor: '#000000' });

  return { success: true, gameName, version: safeVersion, message: exists ? "Version existante mise à jour" : "Nouvelle version créée" };
}

export async function uploadGameFile(gameName: string, version: string, formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return { success: false, error: "Pas de fichier fourni" };

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeName = gameName.replace(/[^a-z0-9-]/g, '-');
  const safeVersion = version.replace(/[^a-z0-9-]/g, '-');
  const filePath = path.join(GAMES_DIR, safeName, safeVersion, file.name);

  await fs.writeFile(filePath, buffer);
  return { success: true, fileName: file.name };
}

// GÉNÉRATEUR INDEX.HTML DYNAMIQUE (SCANNER)
export async function generateIndexHtml(gameName: string, version: string, config: any) {
  const gameId = `${gameName}-${version}`; 
  const safeName = gameName.replace(/[^a-z0-9-]/g, '-');
  const safeVersion = version.replace(/[^a-z0-9-]/g, '-');
  const dirPath = path.join(GAMES_DIR, safeName, safeVersion);

  // 1. SCANNER LE DOSSIER
  let scriptTags = '';
  try {
    const files = await readdir(dirPath);
    const jsFiles = files.filter(f => f.endsWith('.js'));

    // 2. TRIER INTELLIGEMMENT
    jsFiles.sort((a, b) => {
      if (a === 'data.js') return -1;
      if (b === 'data.js') return 1;
      if (a === 'hud.js') return -1;
      if (b === 'hud.js') return 1;
      if (a === 'sketch.js') return 1;
      if (b === 'sketch.js') return -1;
      return a.localeCompare(b);
    });

    scriptTags = jsFiles.map(f => `<script src="${f}"></script>`).join('\n    ');
  } catch (e) {
    console.error("Erreur scan dossier jeu", e);
    scriptTags = `<script src="sketch.js"></script>`;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${gameName}</title>
    <style>
        body { margin: 0; overflow: hidden; background: ${config.bgColor || '#000'}; }
        canvas { display: block; }
    </style>
    <!-- p5.js CDN -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/addons/p5.sound.min.js"></script>
</head>
<body>
    <script>
        // CONFIGURATION ET CONNECTEUR LOWDB
        window.gameConfig = { gameId: '${gameId}', ...${JSON.stringify(config)} };
        
        // API BRIDGE VERS LOWDB
        window.GameAPI = {
          saveScore: async (score, playerName = 'Joueur') => {
            try {
              await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  gameId: window.gameConfig.gameId,
                  playerName,
                  score
                })
              });
              return true;
            } catch (e) { console.error("Erreur Lowdb save", e); return false; }
          },
          getHighScores: async () => {
             try {
              const res = await fetch('/api/scores?gameId=' + window.gameConfig.gameId);
              const data = await res.json();
              return Array.isArray(data) ? data : [];
             } catch (e) { return []; }
          }
        };
    </script>
    
    <!-- Scripts du jeu injectés dynamiquement -->
    ${scriptTags}
</body>
</html>`;

  const filePath = path.join(dirPath, 'index.html');
  await fs.writeFile(filePath, htmlContent);
  return { success: true };
}