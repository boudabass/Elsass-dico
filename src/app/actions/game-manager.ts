'use server';

import fs from 'fs/promises';
import path from 'path';
import { readdir } from 'fs/promises';
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

// Récupérer les jeux depuis la DB (plus fiable que le FS pour les métadonnées)
export async function listGamesFromDb() {
  const db = await getDb();
  await db.read();
  return db.data.games;
}

// Ancien listing FS (toujours utile pour le debug ou fallback)
export interface GameFolder {
  name: string;
  versions: string[];
}

export async function listGamesFolders(): Promise<GameFolder[]> {
  await ensureGamesDir();
  const entries = await readdir(GAMES_DIR, { withFileTypes: true });
  const gameFolders: GameFolder[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const gamePath = path.join(GAMES_DIR, entry.name);
      const versionEntries = await readdir(gamePath, { withFileTypes: true });
      const versions = versionEntries
        .filter(v => v.isDirectory())
        .map(v => v.name);
      
      gameFolders.push({
        name: entry.name,
        versions: versions.sort().reverse()
      });
    }
  }
  return gameFolders;
}

export async function createGameFolder(gameName: string) {
  const safeName = gameName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const dirPath = path.join(GAMES_DIR, safeName, 'v1');
  
  // Création FS
  await fs.mkdir(dirPath, { recursive: true });

  // Enregistrement DB
  const db = await getDb();
  const gameId = `${safeName}-v1`;
  
  // Vérifier si existe déjà
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

  return { success: true, gameName: safeName, version: 'v1' };
}

export async function createGameVersion(gameName: string, versionName: string) {
  const safeVersion = versionName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const dirPath = path.join(GAMES_DIR, gameName, safeVersion);
  
  try {
    await fs.access(dirPath);
    return { success: false, error: "Cette version existe déjà." };
  } catch {
    await fs.mkdir(dirPath, { recursive: true });

    // Enregistrement DB
    const db = await getDb();
    const gameId = `${gameName}-${safeVersion}`;
    
    await db.update(({ games }) => games.push({
      id: gameId,
      name: gameName, // Idéalement on récupérerait le "Joli Nom" du parent
      description: "Nouvelle version",
      path: `${gameName}/${safeVersion}`,
      version: safeVersion,
      createdAt: new Date().toISOString()
    }));

    return { success: true, gameName, version: safeVersion };
  }
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

// Générateur automatique de index.html
export async function generateIndexHtml(gameName: string, version: string, config: any) {
  // On injecte l'ID du jeu pour que le HUD sache quel score charger
  const gameId = `${gameName}-${version}`; 
  const finalConfig = { ...config, gameId };

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
        // CONFIGURATION INJECTÉE PAR LE BACKEND
        window.gameConfig = ${JSON.stringify(finalConfig)};
        
        // Helper pour appeler l'API Next.js depuis l'iframe
        window.GameAPI = {
          saveScore: async (playerName, score) => {
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
            } catch (e) { console.error("Erreur save score", e); return false; }
          },
          getHighScores: async () => {
             try {
              const res = await fetch('/api/scores?gameId=' + window.gameConfig.gameId);
              return await res.json();
             } catch (e) { return []; }
          }
        };
    </script>
    
    <!-- Scripts du jeu -->
    <script src="data.js"></script>
    <script src="hud.js"></script>
    <script src="sketch.js"></script>
</body>
</html>`;

  const safeName = gameName.replace(/[^a-z0-9-]/g, '-');
  const safeVersion = version.replace(/[^a-z0-9-]/g, '-');
  const filePath = path.join(GAMES_DIR, safeName, safeVersion, 'index.html');
  
  await fs.writeFile(filePath, htmlContent);
  return { success: true };
}