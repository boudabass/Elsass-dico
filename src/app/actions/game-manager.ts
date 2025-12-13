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

export interface GameVersionInfo {
  name: string;
  lastModified: number;
  isImported: boolean;
}

export interface GameFolder {
  name: string;
  versions: GameVersionInfo[];
  lastModified: number;
  isImported: boolean;
}

export async function listGamesFolders(): Promise<GameFolder[]> {
  await ensureGamesDir();
  
  // 1. Lire la DB pour savoir ce qui est déjà connu
  const db = await getDb();
  await db.read();
  const dbGames = db.data.games;

  const entries = await readdir(GAMES_DIR, { withFileTypes: true });
  
  // On construit la liste avec les dates de modif et le statut d'import
  const gameFoldersPromises = entries
    .filter(entry => entry.isDirectory())
    .map(async (entry) => {
      const gamePath = path.join(GAMES_DIR, entry.name);
      const stats = await stat(gamePath);
      
      // Est-ce que ce jeu a au moins une version en DB ?
      // L'ID est généralement "nom-version", donc on cherche un match approximatif ou on checke les versions
      // Simplification : si une version est importée, le jeu est considéré comme connu.
      
      let versions: GameVersionInfo[] = [];
      let hasImportedVersion = false;

      try {
        const versionEntries = await readdir(gamePath, { withFileTypes: true });
        
        const versionsWithStats = await Promise.all(
          versionEntries
            .filter(v => v.isDirectory())
            .map(async (v) => {
              const vPath = path.join(gamePath, v.name);
              const vStats = await stat(vPath);
              
              // Vérifier si cette version spécifique est en DB
              // On normalise les noms comme lors de la création pour comparer
              const safeGameName = entry.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
              const safeVersionName = v.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
              const expectedId = `${safeGameName}-${safeVersionName}`;
              
              const isVersionKnown = dbGames.some(g => g.id === expectedId);
              if (isVersionKnown) hasImportedVersion = true;

              return { 
                name: v.name, 
                lastModified: vStats.mtimeMs,
                isImported: isVersionKnown
              };
            })
        );

        // Trier versions par date (récent en haut)
        versions = versionsWithStats.sort((a, b) => b.lastModified - a.lastModified);

      } catch (e) {
        // Ignorer si vide
      }

      return {
        name: entry.name,
        versions,
        lastModified: stats.mtimeMs,
        isImported: hasImportedVersion
      };
    });

  const gameFolders = await Promise.all(gameFoldersPromises);

  // TRI : Plus récent en haut
  return gameFolders.sort((a, b) => b.lastModified - a.lastModified);
}

// ... (Le reste des fonctions createGameFolder, createGameVersion, etc. reste identique, je ne les réécris pas pour économiser des tokens sauf si demandé, mais je dois garder le fichier complet valide donc je remets les signatures)

export async function createGameFolder(gameName: string) {
  const safeName = gameName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const dirPath = path.join(GAMES_DIR, safeName, 'v1');
  
  await fs.mkdir(dirPath, { recursive: true });

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

  await generateIndexHtml(safeName, 'v1', { bgColor: '#000000' });
  return { success: true, gameName: safeName, version: 'v1', message: exists ? "Jeu existant mis à jour" : "Nouveau jeu créé" };
}

export async function createGameVersion(gameName: string, versionName: string) {
  const safeVersion = versionName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const dirPath = path.join(GAMES_DIR, gameName, safeVersion);
  
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }

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

  await generateIndexHtml(gameName, safeVersion, { bgColor: '#000000' });
  return { success: true, gameName, version: safeVersion, message: exists ? "Version mise à jour" : "Nouvelle version créée" };
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

export async function generateIndexHtml(gameName: string, version: string, config: any) {
  const gameId = `${gameName}-${version}`; 
  const safeName = gameName.replace(/[^a-z0-9-]/g, '-');
  const safeVersion = version.replace(/[^a-z0-9-]/g, '-');
  const dirPath = path.join(GAMES_DIR, safeName, safeVersion);

  let scriptTags = '';
  try {
    const files = await readdir(dirPath);
    const jsFiles = files.filter(f => f.endsWith('.js'));
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
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/addons/p5.sound.min.js"></script>
</head>
<body>
    <script>
        window.gameConfig = { gameId: '${gameId}', ...${JSON.stringify(config)} };
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
    ${scriptTags}
</body>
</html>`;

  const filePath = path.join(dirPath, 'index.html');
  await fs.writeFile(filePath, htmlContent);
  return { success: true };
}