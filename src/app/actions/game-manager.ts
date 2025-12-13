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

// --- UTILITAIRE DE LECTURE DES MÉTADONNÉES LOCALES ---
async function readLocalMetadata(dirPath: string) {
  let description = undefined;
  let thumbnail = undefined;

  // 1. Lire description.md
  try {
    description = await fs.readFile(path.join(dirPath, 'description.md'), 'utf-8');
  } catch (e) {
    // Pas de description
  }

  // 2. Vérifier thumbnail.png
  try {
    await fs.access(path.join(dirPath, 'thumbnail.png'));
    thumbnail = 'thumbnail.png';
  } catch (e) {
    // Pas d'image
  }

  return { description, thumbnail };
}

// Récupérer les jeux depuis la DB
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
  
  const db = await getDb();
  await db.read();
  const dbGames = db.data.games;

  const entries = await readdir(GAMES_DIR, { withFileTypes: true });
  
  const gameFoldersPromises = entries
    .filter(entry => entry.isDirectory())
    .map(async (entry) => {
      const gamePath = path.join(GAMES_DIR, entry.name);
      const stats = await stat(gamePath);
      
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

        versions = versionsWithStats.sort((a, b) => b.lastModified - a.lastModified);

      } catch (e) {}

      return {
        name: entry.name,
        versions,
        lastModified: stats.mtimeMs,
        isImported: hasImportedVersion
      };
    });

  const gameFolders = await Promise.all(gameFoldersPromises);
  return gameFolders.sort((a, b) => b.lastModified - a.lastModified);
}

// Lister les fichiers d'une version spécifique
export async function listGameFiles(gameName: string, versionName: string): Promise<string[]> {
  const safeName = gameName.replace(/[^a-z0-9-]/g, '-');
  const safeVersion = versionName.replace(/[^a-z0-9-]/g, '-');
  const dirPath = path.join(GAMES_DIR, safeName, safeVersion);

  try {
    const files = await readdir(dirPath);
    // On cache les fichiers système cachés
    return files.filter(f => !f.startsWith('.')).sort();
  } catch (e) {
    return [];
  }
}

// --- CRÉATION / MISE À JOUR JEU ---
export async function createGameFolder(gameName: string) {
  const safeName = gameName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const dirPath = path.join(GAMES_DIR, safeName, 'v1');
  
  await fs.mkdir(dirPath, { recursive: true });

  const meta = await readLocalMetadata(dirPath);
  const db = await getDb();
  const gameId = `${safeName}-v1`;
  
  const existingIndex = db.data.games.findIndex(g => g.id === gameId);
  
  if (existingIndex >= 0) {
    await db.update(({ games }) => {
      const g = games[existingIndex];
      if (meta.description) g.description = meta.description;
      if (meta.thumbnail) g.thumbnail = meta.thumbnail;
    });
  } else {
    await db.update(({ games }) => games.push({
      id: gameId,
      name: gameName,
      description: meta.description || "Description par défaut",
      path: `${safeName}/v1`,
      version: 'v1',
      thumbnail: meta.thumbnail,
      createdAt: new Date().toISOString()
    }));
  }

  await generateIndexHtml(safeName, 'v1', { bgColor: '#000000' });
  return { 
    success: true, 
    gameName: safeName, 
    version: 'v1', 
    message: existingIndex >= 0 ? "Jeu mis à jour (Métadonnées rechargées)" : "Nouveau jeu créé" 
  };
}

// --- CRÉATION / MISE À JOUR VERSION ---
export async function createGameVersion(gameName: string, versionName: string) {
  const safeVersion = versionName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const dirPath = path.join(GAMES_DIR, gameName, safeVersion);
  
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }

  const meta = await readLocalMetadata(dirPath);
  const db = await getDb();
  const gameId = `${gameName}-${safeVersion}`;
  
  const existingIndex = db.data.games.findIndex(g => g.id === gameId);

  if (existingIndex >= 0) {
    await db.update(({ games }) => {
      const g = games[existingIndex];
      if (meta.description) g.description = meta.description;
      if (meta.thumbnail) g.thumbnail = meta.thumbnail;
    });
  } else {
    await db.update(({ games }) => games.push({
      id: gameId,
      name: gameName,
      description: meta.description || `Version ${safeVersion}`,
      path: `${gameName}/${safeVersion}`,
      version: safeVersion,
      thumbnail: meta.thumbnail,
      createdAt: new Date().toISOString()
    }));
  }

  await generateIndexHtml(gameName, safeVersion, { bgColor: '#000000' });
  return { 
    success: true, 
    gameName, 
    version: safeVersion, 
    message: existingIndex >= 0 ? "Version mise à jour (Métadonnées rechargées)" : "Nouvelle version créée" 
  };
}

// Upload fichier générique
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

// Upload SPÉCIFIQUE pour le thumbnail (Update DB auto)
export async function uploadGameThumbnail(gameName: string, version: string, formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return { success: false, error: "Pas de fichier fourni" };

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeName = gameName.replace(/[^a-z0-9-]/g, '-');
  const safeVersion = version.replace(/[^a-z0-9-]/g, '-');
  
  // On renomme systématiquement en thumbnail.png
  const fileName = 'thumbnail.png'; 
  const filePath = path.join(GAMES_DIR, safeName, safeVersion, fileName);

  await fs.writeFile(filePath, buffer);

  // Mise à jour de la DB
  const gameId = `${gameName}-${safeVersion}`;
  const db = await getDb();
  await db.update(({ games }) => {
    const game = games.find(g => g.id === gameId);
    if (game) {
      game.thumbnail = fileName;
    }
  });

  return { success: true, fileName };
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